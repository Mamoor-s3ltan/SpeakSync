import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { io } from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, PhoneOff, Copy, Languages, Check,
  X, Volume2, Radio, Send, Wifi, WifiOff,
} from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────
const SIGNAL_URL     = import.meta.env.VITE_SIGNAL_URL     || "http://localhost:3001";
const PYTHON_WS_URL  = import.meta.env.VITE_PYTHON_WS_URL  || "ws://127.0.0.1:8000";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Chunk audio every 2 seconds and send to Python
const AUDIO_CHUNK_MS = 2000;

// ─── MeetingRoom ──────────────────────────────────────────────────────────────
export default function MeetingRoom() {
  const { meetingId } = useParams();
  const navigate      = useNavigate();

  // ── WebRTC / Signalling refs ─────────────────────────────────────────────────
  const socketRef         = useRef(null);
  const pcRef             = useRef(null);
  const localStreamRef    = useRef(null);
  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const makingOfferRef    = useRef(false);
  const ignoreOfferRef    = useRef(false);
  const isPoliteRef       = useRef(false);
  const pendingCandidates = useRef([]);

  // ── Translation refs ──────────────────────────────────────────────────────────
  const translationWsRef  = useRef(null);   // WebSocket to Python
  const mediaRecorderRef  = useRef(null);   // MediaRecorder capturing mic
  const audioQueueRef     = useRef([]);     // queue of received MP3 blobs to play
  const isPlayingRef      = useRef(false);  // whether audio is currently playing
  const myPeerIdRef       = useRef(null);   // socket id stored stably

  // ── State ────────────────────────────────────────────────────────────────────
  const [micOn,          setMicOn]          = useState(true);
  const [cameraOn,       setCameraOn]       = useState(true);
  const [translationOn,  setTranslationOn]  = useState(false);
  const [chatOpen,       setChatOpen]       = useState(false);
  const [screenSharing,  setScreenSharing]  = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [timer,          setTimer]          = useState(0);
  const [linkCopied,     setLinkCopied]     = useState(false);
  const [chatInput,      setChatInput]      = useState("");
  const [chatMessages,   setChatMessages]   = useState([]);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [peerConnected,  setPeerConnected]  = useState(false);
  const [peerName,       setPeerName]       = useState("");
  const [connStatus,     setConnStatus]     = useState("connecting");
  const [isTranslating,  setIsTranslating]  = useState(false);
  const [latency,        setLatency]        = useState(null);

  // myCaption  = what I said + translation sent to peer
  // peerCaption = what peer said + translation played for me
  const [myCaption,      setMyCaption]      = useState({ original: "", translated: "" });
  const [peerCaption,    setPeerCaption]    = useState({ original: "", translated: "" });

  const userName = sessionStorage.getItem("userName") || "You";

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!peerConnected) return;
    const t = setInterval(() => setTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [peerConnected]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2,"0")}:${String(Math.floor((s % 3600) / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  // ─── Audio queue player ───────────────────────────────────────────────────────
  // Plays received MP3 blobs sequentially so they never overlap
  const playNextInQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    const blob  = audioQueueRef.current.shift();
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      playNextInQueue();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      playNextInQueue();
    };
    audio.play().catch(() => {
      isPlayingRef.current = false;
      playNextInQueue();
    });
  }, []);

  // ─── Start translation WebSocket + MediaRecorder ──────────────────────────────
  const startTranslation = useCallback(() => {
    if (!localStreamRef.current || !myPeerIdRef.current) return;

    // Both peers connect to ws://127.0.0.1:8000/ws/translation/{roomId}/{myPeerId}
    // Python server uses roomId to pair them and route audio to the other peer
    const wsUrl = `${PYTHON_WS_URL}/ws/translation/${meetingId}/${myPeerIdRef.current}`;
    console.log("[Translation] Connecting to", wsUrl);

    const ws = new WebSocket(wsUrl);
    translationWsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("[Translation] WS connected ✓");

      // Capture audio-only stream from mic (separate from video stream)
      const audioStream = new MediaStream(localStreamRef.current.getAudioTracks());
      const recorder    = new MediaRecorder(audioStream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);                      // binary chunk → Python pipeline
          setIsTranslating(true);
          setTimeout(() => setIsTranslating(false), 800);
        }
      };

      recorder.start(AUDIO_CHUNK_MS);           // fires ondataavailable every 2s
      console.log("[Translation] MediaRecorder started");
    };

    ws.onmessage = (event) => {
      // ── Binary = translated MP3 audio → play it ─────────────────────────────
      if (event.data instanceof ArrayBuffer) {
        const blob = new Blob([event.data], { type: "audio/mpeg" });
        audioQueueRef.current.push(blob);
        playNextInQueue();
        return;
      }

      // ── Text = JSON metadata ────────────────────────────────────────────────
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "transcript") {
          // My voice was processed — update my caption
          setMyCaption({ original: msg.original, translated: msg.translated });
          setLatency(msg.latency_ms);
        }

        if (msg.type === "incoming_translation") {
          // Peer's translated text arrived — update peer caption
          setPeerCaption({ original: msg.original, translated: msg.translated });
          setLatency(msg.latency_ms);
        }

        if (msg.type === "error") {
          console.warn("[Translation] Server error:", msg.message);
        }
      } catch (err) {
        console.error("[Translation] JSON parse error:", err);
      }
    };

    ws.onerror = (err) => console.error("[Translation] WS error:", err);
    ws.onclose = () => {
      console.log("[Translation] WS closed");
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
    };

  }, [meetingId, playNextInQueue]);

  // ─── Stop translation ─────────────────────────────────────────────────────────
  const stopTranslation = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    if (translationWsRef.current) {
      translationWsRef.current.close();
      translationWsRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current  = false;
    setMyCaption({ original: "", translated: "" });
    setPeerCaption({ original: "", translated: "" });
    setLatency(null);
  }, []);

  // ─── WebRTC ───────────────────────────────────────────────────────────────────
  const createPeerConnection = useCallback((targetId) => {
    if (pcRef.current) pcRef.current.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));

    const remoteStream = new MediaStream();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    pc.ontrack = (e) => e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socketRef.current?.emit("webrtc:ice-candidate", { targetId, candidate });
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setConnStatus("connected");
      if (["disconnected","failed","closed"].includes(s)) {
        setConnStatus("disconnected");
        setPeerConnected(false);
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        if (pc.signalingState !== "stable") return;
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("webrtc:offer", { targetId, sdp: pc.localDescription });
      } catch (err) {
        console.error("[WebRTC] Offer:", err);
      } finally {
        makingOfferRef.current = false;
      }
    };
    return pc;
  }, []);

  const getLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("[Media]:", err);
      return null;
    }
  }, []);

  // ─── Main setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let targetPeerId = null;
    const socket = io(SIGNAL_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", async () => {
      myPeerIdRef.current = socket.id;
      await getLocalMedia();
      socket.emit("room:join", { roomId: meetingId, userName });
    });

    socket.on("room:joined", ({ isHost, participants }) => {
      isPoliteRef.current = !isHost;
      if (participants.length > 0) {
        targetPeerId = participants[0];
        createPeerConnection(targetPeerId);
      }
    });

    socket.on("peer:joined", ({ peerId, userName: pName }) => {
      targetPeerId = peerId;
      setPeerName(pName);
      setPeerConnected(true);
      createPeerConnection(peerId);
    });

    socket.on("peer:left", () => {
      setPeerConnected(false);
      setPeerName("");
      setConnStatus("disconnected");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      stopTranslation();
      setTranslationOn(false);
    });

    socket.on("webrtc:offer", async ({ fromId, sdp }) => {
      targetPeerId = fromId;
      if (!pcRef.current) createPeerConnection(fromId);
      const pc = pcRef.current;
      const collision = makingOfferRef.current || pc.signalingState !== "stable";
      ignoreOfferRef.current = !isPoliteRef.current && collision;
      if (ignoreOfferRef.current) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const c of pendingCandidates.current) await pc.addIceCandidate(c).catch(() => {});
        pendingCandidates.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { targetId: fromId, sdp: pc.localDescription });
      } catch (err) { console.error("[WebRTC] Handle offer:", err); }
    });

    socket.on("webrtc:answer", async ({ sdp }) => {
      try { await pcRef.current?.setRemoteDescription(new RTCSessionDescription(sdp)); }
      catch (err) { console.error("[WebRTC] Handle answer:", err); }
    });

    socket.on("webrtc:ice-candidate", async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc?.remoteDescription) {
        pendingCandidates.current.push(new RTCIceCandidate(candidate));
        return;
      }
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (err) { if (!ignoreOfferRef.current) console.error("[WebRTC] ICE:", err); }
    });

    socket.on("chat:message", ({ fromId, userName: sender, message, timestamp }) => {
      const isOwn = fromId === socket.id;
      setChatMessages(p => [...p, { id: Date.now(), sender: isOwn ? "You" : sender, message, timestamp, isOwn }]);
      if (!chatOpen && !isOwn) setUnreadCount(c => c + 1);
    });

    socket.on("room:error", ({ message }) => { alert(message); navigate("/app"); });

    return () => {
      socket.emit("room:leave");
      socket.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      stopTranslation();
    };
  }, [meetingId]);

  // ─── Controls ─────────────────────────────────────────────────────────────────
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    socketRef.current?.emit("media:state-change", { type: "mic", enabled: track.enabled });
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
    socketRef.current?.emit("media:state-change", { type: "camera", enabled: track.enabled });
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack  = screenStream.getVideoTracks()[0];
        pcRef.current?.getSenders().find(s => s.track?.kind === "video")?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => toggleScreenShare();
        setScreenSharing(true);
      } catch (err) { console.error("[Screen]:", err); }
    } else {
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      pcRef.current?.getSenders().find(s => s.track?.kind === "video")?.replaceTrack(camTrack || null);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setScreenSharing(false);
    }
  };

  const toggleTranslation = () => {
    if (!translationOn) {
      setTranslationOn(true);
      startTranslation();
      socketRef.current?.emit("translation:toggle", { enabled: true, srcLang: "en", tgtLang: "ur" });
    } else {
      setTranslationOn(false);
      stopTranslation();
      socketRef.current?.emit("translation:toggle", { enabled: false, srcLang: "en", tgtLang: "ur" });
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat:message", { message: chatInput.trim(), timestamp: Date.now() });
    setChatMessages(p => [...p, { id: Date.now(), sender: "You", message: chatInput.trim(), isOwn: true }]);
    setChatInput("");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const openChat = () => { setChatOpen(true); setUnreadCount(0); };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col overflow-hidden">

      {/* Top Bar */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <h1 className="text-white font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">Meeting Room</h1>
            {peerConnected ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">{formatTime(timer)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-yellow-400 text-sm font-medium">
                  {connStatus === "disconnected" ? "Peer left" : "Waiting for peer…"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {peerConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-yellow-400" />}
            <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 text-sm">
              {linkCopied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy Link</>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 p-2 sm:p-4 lg:p-6 relative">
          {screenSharing ? (
            <div className="h-full flex flex-col gap-2 sm:gap-4">
              <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden relative border border-white/10">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                <div className="absolute top-3 left-3 bg-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-medium">You are presenting</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <div className="flex-shrink-0 w-32 sm:w-48 h-24 sm:h-36 bg-black rounded-lg overflow-hidden relative border border-white/20">
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded">
                    <span className="text-white text-xs">{peerName || "Peer"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {/* Remote video tile */}
              <div className="bg-gradient-to-br from-blue-900 to-gray-900 rounded-xl sm:rounded-2xl overflow-hidden relative border border-white/20 shadow-2xl">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {!peerConnected && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 bg-blue-900/60 rounded-full flex items-center justify-center text-2xl text-white font-bold border-2 border-white/20">
                      {peerName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <p className="text-sm text-gray-400">Waiting for peer…</p>
                  </div>
                )}
                {peerConnected && (
                  <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className="text-white text-xs sm:text-sm font-medium">{peerName || "Peer"}</span>
                  </div>
                )}
                {/* Peer caption overlay */}
                {translationOn && peerCaption.translated && (
                  <div className="absolute top-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-gray-300 text-xs">{peerCaption.original}</p>
                    <p className="text-blue-300 text-xs mt-0.5 font-medium">{peerCaption.translated}</p>
                  </div>
                )}
              </div>

              {/* Local video tile */}
              <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-xl sm:rounded-2xl overflow-hidden relative border border-white/20 shadow-2xl">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                {!cameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                    <VideoOff className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <span className="text-white text-xs sm:text-sm font-medium">{userName} (You)</span>
                </div>
                {/* My caption overlay */}
                {translationOn && myCaption.translated && (
                  <div className="absolute top-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-gray-300 text-xs">{myCaption.original}</p>
                    <p className="text-green-300 text-xs mt-0.5 font-medium text-right">{myCaption.translated}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Translation Status Panel */}
          {translationOn && (
            <div className="absolute bottom-20 sm:bottom-24 lg:bottom-28 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl max-w-[calc(100%-2rem)] sm:max-w-2xl w-full border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Radio className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-black text-sm sm:text-base">Real-time Voice Translation</h3>
                  <p className="text-xs text-gray-500">Speech-to-Speech · English ↔ Urdu · Both directions</p>
                </div>
                {isTranslating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                    {[12,16,20,16,12].map((h,i) => (
                      <div key={i} className="w-1 bg-blue-600 rounded-full animate-pulse"
                        style={{ height: h, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500 font-semibold">You said (English)</span>
                  </div>
                  <p className="text-black text-sm">{myCaption.original || "Listening…"}</p>
                  {myCaption.translated && (
                    <p className="text-blue-600 text-sm mt-1 text-right">{myCaption.translated}</p>
                  )}
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs text-blue-600 font-semibold">{peerName || "Peer"} said (Urdu → English)</span>
                  </div>
                  <p className="text-black text-sm text-right">{peerCaption.original || "…"}</p>
                  {peerCaption.translated && (
                    <p className="text-gray-600 text-sm mt-1">{peerCaption.translated}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>Latency: {latency ? `${latency}ms` : "…"}</span>
                <span className="flex items-center gap-1 text-green-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  AI Active
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {chatOpen && (
          <div className="absolute sm:relative right-0 top-0 bottom-0 w-full sm:w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-black">Chat</h2>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-gray-400 text-sm text-center mt-8">No messages yet</p>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
                  <span className="text-xs text-gray-500 mb-1">{msg.sender}</span>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-black"}`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm" />
              <button onClick={sendChat} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="border-t border-gray-200 bg-white shadow-xl">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-black">Leave this meeting?</p>
              <p className="text-xs text-gray-600">You can rejoin anytime with the same link.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLeaveModal(false)} className="px-4 py-2 bg-gray-100 text-black rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={() => navigate("/dashboard")} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="bg-black/40 backdrop-blur-sm border-t border-white/10 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4">
          <button onClick={toggleMic}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${micOn ? "bg-white/10 hover:bg-white/20 border border-white/20" : "bg-red-600 hover:bg-red-700 border border-red-500"}`}>
            {micOn ? <Mic className="w-4 sm:w-5 h-4 sm:h-5 text-white" /> : <MicOff className="w-4 sm:w-5 h-4 sm:h-5 text-white" />}
          </button>

          <button onClick={toggleCamera}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${cameraOn ? "bg-white/10 hover:bg-white/20 border border-white/20" : "bg-red-600 hover:bg-red-700 border border-red-500"}`}>
            {cameraOn ? <Video className="w-4 sm:w-5 h-4 sm:h-5 text-white" /> : <VideoOff className="w-4 sm:w-5 h-4 sm:h-5 text-white" />}
          </button>

          <button onClick={toggleScreenShare}
            className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center transition-all shadow-lg ${screenSharing ? "bg-blue-600 hover:bg-blue-700 border border-blue-500" : "bg-white/10 hover:bg-white/20 border border-white/20"}`}>
            {screenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
          </button>

          <button onClick={openChat}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-lg relative ${chatOpen ? "bg-blue-600 hover:bg-blue-700 border border-blue-500" : "bg-white/10 hover:bg-white/20 border border-white/20"}`}>
            <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center">{unreadCount}</span>
            )}
          </button>

          <button onClick={toggleTranslation}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${translationOn ? "bg-blue-600 hover:bg-blue-700 border border-blue-500" : "bg-white/10 hover:bg-white/20 border border-white/20"}`}>
            <Languages className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
          </button>

          <div className="w-px h-8 sm:h-10 bg-white/20 mx-1 sm:mx-2" />

          <button onClick={() => setShowLeaveModal(true)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-lg border border-red-500">
            <PhoneOff className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}