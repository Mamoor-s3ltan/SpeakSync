import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { io } from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff,
  MessageSquare, PhoneOff, Copy, Languages, Check,
  X, Send, Wifi, WifiOff, Globe, Users,
  Monitor, MonitorOff, RefreshCw,
} from "lucide-react";
import { useSession } from '../context/user_session';
import { useSettings } from "../context/SettingsContext";

// ─── Constants ──────────────────────────────────────────────────────────────
const SIGNAL_URL  = import.meta.env.VITE_SIGNAL_URL  || "http://localhost:3001";
const PYTHON_HTTP = import.meta.env.VITE_PYTHON_HTTP  || "http://127.0.0.1:8000";
const PYTHON_WS_URL = PYTHON_HTTP.replace(/^http/, "ws");


const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const AUDIO_CHUNK_MS = 2500;

const MIME_PRIORITY = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];
const getBestMimeType = () =>
  MIME_PRIORITY.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

const langLabel = (c) => (c === "en" ? "English" : "اردو");
const langFlag  = (c) => (c === "en" ? "🇬🇧" : "🇵🇰");

// ─── Language Dialog ─────────────────────────────────────────────────────────
function LanguageDialog({ userName, defaultLang, onConfirm }) {
  const [myLang, setMyLang] = useState(defaultLang || "en");
  const tgtLang = myLang === "en" ? "ur" : "en";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Language Setup</h2>
            <p className="text-sm text-gray-500">Welcome, {userName}!</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-5">
          Select the language <strong>you speak</strong>. Your speech will be translated for the other participant.
        </p>
        <div className="space-y-3 mb-5">
          {[
            { code: "en", label: "English",       flag: "🇬🇧", desc: "I speak English — translate to Urdu" },
            { code: "ur", label: "اردو (Urdu)",   flag: "🇵🇰", desc: "میں اردو بولتا ہوں — انگریزی میں ترجمہ" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setMyLang(l.code)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                myLang === l.code
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <span className="text-3xl">{l.flag}</span>
              <div className="flex-1">
                <div className={`font-semibold ${myLang === l.code ? "text-blue-700" : "text-gray-800"}`}>
                  {l.label}
                </div>
                <div className={`text-xs mt-0.5 ${myLang === l.code ? "text-blue-500" : "text-gray-400"}`}>
                  {l.desc}
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                myLang === l.code ? "border-blue-600 bg-blue-600" : "border-gray-300"
              }`}>
                {myLang === l.code && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center justify-center gap-3">
          <span className="text-sm font-medium text-gray-700">{langFlag(myLang)} {langLabel(myLang)}</span>
          <Languages className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">{langFlag(tgtLang)} {langLabel(tgtLang)}</span>
        </div>
        <button
          onClick={() => onConfirm(myLang, tgtLang)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          Join Meeting
        </button>
      </div>
    </div>
  );
}

// ─── Translation Bar ──────────────────────────────────────────────────────────
function TranslationBar({ myLang, tgtLang, isTranslating, myCaption, peerCaption, peerName, latency }) {
  return (
    <div className="w-full bg-black/60 backdrop-blur-md border-b border-white/10 px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-blue-600/30 border border-blue-500/40 rounded-full px-3 py-1 flex-shrink-0">
          <span className="text-xs">{langFlag(myLang)}</span>
          <Languages className="w-3 h-3 text-blue-300" />
          <span className="text-xs">{langFlag(tgtLang)}</span>
          {isTranslating && (
            <div className="flex items-center gap-0.5 ml-1">
              {[4, 6, 8, 6, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-blue-400 rounded-full animate-pulse"
                  style={{ height: h, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {myCaption.original ? (
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-white/50 text-xs flex-shrink-0">You:</span>
              <span className="text-white text-xs truncate">{myCaption.original}</span>
              {myCaption.translated && (
                <>
                  <span className="text-white/30 text-xs flex-shrink-0">→</span>
                  <span className="text-blue-300 text-xs truncate">{myCaption.translated}</span>
                </>
              )}
            </div>
          ) : (
            <span className="text-white/30 text-xs">Listening…</span>
          )}
        </div>
        {peerCaption.original && (
          <div className="flex-1 min-w-0 hidden sm:block">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-white/50 text-xs flex-shrink-0">{peerName || "Peer"}:</span>
              <span className="text-white text-xs truncate">{peerCaption.original}</span>
              {peerCaption.translated && (
                <>
                  <span className="text-white/30 text-xs flex-shrink-0">→</span>
                  <span className="text-green-300 text-xs truncate">{peerCaption.translated}</span>
                </>
              )}
            </div>
          </div>
        )}
        {latency && <div className="flex-shrink-0 text-xs text-white/30">{latency}ms</div>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MeetingRoom() {
  const { meetingId } = useParams();
  const navigate      = useNavigate();
  const { settings, update } = useSettings();
  const {session} = useSession();


  // Language state
  const myLangRef  = useRef(settings.primaryLang);
  const tgtLangRef = useRef(settings.secondaryLang);
  const [showLangDialog, setShowLangDialog] = useState(
    !sessionStorage.getItem(`langChosen_${meetingId}`)
  );
  const [langReady, setLangReady] = useState(
    !!sessionStorage.getItem(`langChosen_${meetingId}`)
  );

  // Core refs
  const socketRef          = useRef(null);
  const pcRef              = useRef(null);
  const localStreamRef     = useRef(null);
  const screenStreamRef    = useRef(null);
  const localVideoRef      = useRef(null);
  const remoteVideoRef     = useRef(null);
  const makingOfferRef     = useRef(false);
  const ignoreOfferRef     = useRef(false);
  const isPoliteRef        = useRef(false);
  const pendingCandidates  = useRef([]);

  // Translation refs
  const translationWsRef  = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const myPeerIdRef       = useRef(null);
  const translationOnRef  = useRef(false);

  // ─── FIX: AudioContext-based playback queue ──────────────────────────────
  // Replaces Audio element approach which is blocked by autoplay policy.
  // AudioContext is unlocked once on the first user gesture (any button click),
  // then all subsequent .play() calls succeed without restriction.
  const audioCtxRef       = useRef(null);   // single shared AudioContext
  const audioQueueRef     = useRef([]);     // queue of ArrayBuffer (raw MP3 bytes)
  const isPlayingRef      = useRef(false);  // mutex flag

  useEffect(() => {

    if(!session){
      navigate('/signin')
    }

  }, [session])
  

  /**
   * Lazily create or resume the AudioContext.
   * Must be called inside a user-gesture handler at least once to unlock it.
   * Returns null if AudioContext is not available.
   */



  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    // Resume if suspended (happens after tab loses focus or before first gesture)
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Drain the audio queue sequentially.
   * Each ArrayBuffer is decoded via AudioContext.decodeAudioData (handles MP3)
   * and scheduled to play immediately after the previous clip ends.
   * On error (corrupt frame, etc.) we skip and continue the queue.
   */
  const playNextInQueue = useCallback(() => {
    if (isPlayingRef.current) return;           // already playing
    if (audioQueueRef.current.length === 0) return; // nothing queued

    const ctx = getAudioCtx();
    if (!ctx) return;                           // browser unsupported

    // If still suspended (no user gesture yet) skip — will retry on next chunk
    if (ctx.state === "suspended") return;

    isPlayingRef.current = true;
    // Shift a defensive copy so the original buffer isn't transferred
    const buffer = audioQueueRef.current.shift().slice(0);

    ctx.decodeAudioData(
      buffer,
      (decoded) => {
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        src.onended = () => {
          isPlayingRef.current = false;
          playNextInQueue();          // play next when this one ends
        };
        src.start(0);
      },
      (err) => {
        // Decoding failed (e.g. truncated frame) — skip and continue
        console.warn("[Audio] decode error, skipping chunk:", err?.message ?? err);
        isPlayingRef.current = false;
        playNextInQueue();
      }
    );
  }, [getAudioCtx]);

  // ── Unlock AudioContext on first user gesture ──────────────────────────────
  // We call this in every control-bar button handler so the context is always
  // warm before the first translated audio arrives.
  const unlockAudioCtx = useCallback(() => {
    getAudioCtx(); // creates + resumes
  }, [getAudioCtx]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  // Ref syncing
  const chatAutoTranslateRef = useRef(true);
  const peerNameRef = useRef("");

  // UI state
  const [micOn,           setMicOn]           = useState(true);
  const [cameraOn,        setCameraOn]         = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [translationOn,   setTranslationOn]   = useState(false);
  const [wsOpen,          setWsOpen]          = useState(false);
  const [chatOpen,        setChatOpen]        = useState(false);
  const [showLeaveModal,  setShowLeaveModal]  = useState(false);
  const [timer,           setTimer]           = useState(0);
  const [linkCopied,      setLinkCopied]      = useState(false);
  const [chatInput,       setChatInput]       = useState("");
  const [chatMessages,    setChatMessages]    = useState([]);
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [peerConnected,   setPeerConnected]   = useState(false);
  const [peerName,        setPeerName]        = useState("");
  const [connStatus,      setConnStatus]      = useState("connecting");
  const [isTranslating,   setIsTranslating]  = useState(false);
  const [latency,         setLatency]         = useState(null);
  const [myCaption,       setMyCaption]       = useState({ original: "", translated: "" });
  const [peerCaption,     setPeerCaption]     = useState({ original: "", translated: "" });
  const [participants,    setParticipants]    = useState([]);
  const [mutedByHost,     setMutedByHost]     = useState(false);
  const [toast,           setToast]           = useState(null);
  const [sidebarTab,      setSidebarTab]      = useState("chat");
  const [chatAutoTranslate, setChatAutoTranslate] = useState(true);

  const userName = sessionStorage.getItem("userName") || "You";

  useEffect(() => { translationOnRef.current = translationOn; }, [translationOn]);
  useEffect(() => { chatAutoTranslateRef.current = chatAutoTranslate; }, [chatAutoTranslate]);
  useEffect(() => { peerNameRef.current = peerName; }, [peerName]);

  // Meeting timer
  useEffect(() => {
    if (!peerConnected) return;
    const t = setInterval(() => setTimer((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [peerConnected]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── MediaRecorder ────────────────────────────────────────────────────────
  const startRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") return;
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    if (!audioTracks.length) return;

    const mimeType = getBestMimeType();
    let recorder;
    try {
      recorder = new MediaRecorder(
        new MediaStream(audioTracks),
        { audioBitsPerSecond: 128_000, ...(mimeType ? { mimeType } : {}) }
      );
    } catch {
      recorder = new MediaRecorder(new MediaStream(audioTracks));
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = async (e) => {
      // ── FIX: only send when translation is ON and WS is open ──
      if (
        e.data.size > 500 &&
        translationOnRef.current &&                                // guard: toggle check
        translationWsRef.current?.readyState === WebSocket.OPEN
      ) {
        translationWsRef.current.send(await e.data.arrayBuffer());
        setIsTranslating(true);
        setTimeout(() => setIsTranslating(false), 500);
      }
    };

    recorder.onerror = (e) => {
      console.error("[MediaRecorder] Error:", e);
      mediaRecorderRef.current = null;
    };

    recorder.start(AUDIO_CHUNK_MS);
  }, []);

  const stopRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  // ─── Translation WebSocket ─────────────────────────────────────────────────
  // DESIGN: The WS is opened whenever a peer is present and stays open as long
  // as there is a peer in the room. This allows RECEIVING translated audio from
  // the peer even when our own translation toggle is OFF.
  // The MediaRecorder (sending) is only started/stopped by the toggle.
  const openTranslationWS = useCallback(() => {
    // Already open — just ensure recorder state matches toggle
    if (translationWsRef.current?.readyState === WebSocket.OPEN) {
      if (translationOnRef.current) startRecorder();
      // If toggle is off, recorder is already stopped — nothing to do
      return;
    }
    if (!localStreamRef.current || !myPeerIdRef.current) {
      setToast({ msg: "Microphone not available.", type: "warning" });
      return;
    }

    const ws = new WebSocket(
      `${PYTHON_WS_URL}/ws/translation/${meetingId}/${myPeerIdRef.current}`
    );
    translationWsRef.current = ws;
    ws.binaryType = "arraybuffer";  // receive as ArrayBuffer directly

    ws.onopen = () => {
      setWsOpen(true);
      ws.send(JSON.stringify({
        type: "language-config",
        srcLang: myLangRef.current,
        tgtLang: tgtLangRef.current,
      }));
      // Only start sending audio if translation is currently ON
      if (translationOnRef.current) startRecorder();
    };

    ws.onmessage = (event) => {
      // ── FIX: Binary frames are MP3 audio for THIS peer to play ──────────
      // We receive ArrayBuffer (set via ws.binaryType = "arraybuffer").
      // Push directly — no Blob conversion needed, decodeAudioData handles MP3.
      if (event.data instanceof ArrayBuffer) {
        if (event.data.byteLength < 100) return; // ignore tiny/empty frames
        audioQueueRef.current.push(event.data);  // enqueue
        playNextInQueue();                        // drain if idle
        return;
      }

      // Text frames are JSON metadata
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "transcript") {
          setMyCaption({ original: msg.original, translated: msg.translated });
          setLatency(msg.latency_ms);
        } else if (msg.type === "incoming_translation") {
          setPeerCaption({ original: msg.original, translated: msg.translated });
          setLatency(msg.latency_ms);
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => setToast({ msg: "Translation service error.", type: "error" });

    ws.onclose = () => {
      setWsOpen(false);
      stopRecorder();
      translationWsRef.current = null;
    };
  }, [meetingId, playNextInQueue, startRecorder, stopRecorder]);

  const stopTranslationWS = useCallback(() => {
    stopRecorder();
    translationWsRef.current?.close();
    translationWsRef.current = null;
    setWsOpen(false);
  }, [stopRecorder]);

  // ─── Toggle Translation ────────────────────────────────────────────────────
  // ON  → open WS (if not already open) + start recorder
  // OFF → stop recorder only; WS stays open so we can still RECEIVE peer audio
  const toggleTranslation = useCallback(() => {
    unlockAudioCtx(); // ensure AudioContext is live on this gesture
    if (!translationOn) {
      translationOnRef.current = true;
      setTranslationOn(true);
      openTranslationWS();                       // opens WS + starts recorder
      socketRef.current?.emit("translation:toggle", {
        enabled: true,
        srcLang: myLangRef.current,
        tgtLang: tgtLangRef.current,
      });
    } else {
      translationOnRef.current = false;
      setTranslationOn(false);
      stopRecorder();                            // stop sending; WS stays open
      socketRef.current?.emit("translation:toggle", { enabled: false });
    }
  }, [translationOn, openTranslationWS, stopRecorder, unlockAudioCtx]);

  // ─── Chat Translation ──────────────────────────────────────────────────────
  const translateChatMsg = useCallback(async (msgId, text, srcLang, tgtLang) => {
    if (!text || srcLang === tgtLang) return;
    try {
      const res = await fetch(`${PYTHON_HTTP}/translate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, src_lang: srcLang, tgt_lang: tgtLang }),
      });
      const data = await res.json();
      if (data.translated) {
        setChatMessages((prev) =>
          prev.map((m) => m.id === msgId ? { ...m, translated: data.translated, translating: false } : m)
        );
      }
    } catch {
      setChatMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, translating: false, translateError: true } : m)
      );
    }
  }, []);

  const retranslateMsg = useCallback((msg) => {
    setChatMessages((prev) =>
      prev.map((m) => m.id === msg.id ? { ...m, translating: true, translateError: false, translated: "" } : m)
    );
    translateChatMsg(msg.id, msg.message, msg.senderLang, myLangRef.current);
  }, [translateChatMsg]);

  // ─── WebRTC ────────────────────────────────────────────────────────────────
  const createPeerConnection = useCallback((targetId) => {
    pcRef.current?.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach((t) =>
      pc.addTrack(t, localStreamRef.current)
    );

    const remoteStream = new MediaStream();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    pc.ontrack = (e) => {
      // e.streams[0] is preferred; fall back to e.track if streams is empty
      if (e.streams && e.streams[0]) {
        e.streams[0].getTracks().forEach((t) => {
          if (!remoteStream.getTracks().includes(t)) remoteStream.addTrack(t);
        });
      } else {
        if (!remoteStream.getTracks().includes(e.track)) remoteStream.addTrack(e.track);
      }
      // Re-assign srcObject to force the video element to refresh
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socketRef.current?.emit("webrtc:ice-candidate", { targetId, candidate });
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setConnStatus("connected");
      if (["disconnected", "failed", "closed"].includes(s)) {
        setConnStatus("disconnected");
        setPeerConnected(false);
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== "stable") return; // check BEFORE any await
        makingOfferRef.current = true;
        await pc.setLocalDescription();             // modern implicit-offer form
        socketRef.current?.emit("webrtc:offer", { targetId, sdp: pc.localDescription });
      } catch (err) {
        console.error("[WebRTC] Offer:", err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    return pc;
  }, []);

  const getLocalMedia = useCallback(async (micId, camId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: camId && camId !== "default" ? { deviceId: { exact: camId } } : true,
        audio: micId && micId !== "default" ? { deviceId: { exact: micId } } : true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setToast(null);
      return stream;
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"      ? "Permission denied. Allow camera & mic in site settings." :
        err.name === "NotFoundError"        ? "No camera or microphone found." :
        err.name === "OverconstrainedError" ? "Selected device unavailable. Using default." :
                                             "Camera/mic access needed.";
      setToast({ msg, type: "warning" });
      return null;
    }
  }, []);

  // ─── Screen Sharing ────────────────────────────────────────────────────────
  const stopScreenShare = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(camTrack).catch(console.error);
    }
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    socketRef.current?.emit("screen:share", { enabled: false });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    unlockAudioCtx();
    if (isScreenSharing) { await stopScreenShare(); return; }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always", displaySurface: "monitor" },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack).catch(console.error);

      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

      setIsScreenSharing(true);
      socketRef.current?.emit("screen:share", { enabled: true });
      screenTrack.onended = stopScreenShare;
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        setToast({ msg: "Screen sharing failed.", type: "error" });
      }
    }
  }, [isScreenSharing, stopScreenShare, unlockAudioCtx]);

  // ─── Main socket + WebRTC setup ───────────────────────────────────────────
  useEffect(() => {
    if (!langReady) return;

    const socket = io(SIGNAL_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", async () => {
      myPeerIdRef.current = socket.id;
      await getLocalMedia(settings.micDeviceId, settings.cameraDeviceId);
      socket.emit("room:join", { roomId: meetingId, userName, userId: session.user.id,  });
    });

    socket.on("room:joined", ({ participants: initial }) => {
      isPoliteRef.current = true;
      setParticipants(initial || []);
      const peer = (initial || [])[0];
      if (peer) {
        createPeerConnection(peer.peerId);
        setPeerConnected(true);
        setPeerName(peer.userName || "Peer");
        // Open WS to be ready to receive — recorder starts only if autoTranslate
        openTranslationWS();
        if (settings.autoTranslate) {
          translationOnRef.current = true;
          setTranslationOn(true);
          setTimeout(() => {
            startRecorder();
            socket.emit("translation:toggle", {
              enabled: true,
              srcLang: myLangRef.current,
              tgtLang: tgtLangRef.current,
            });
          }, 800);
        }
      }
    });

    socket.on("peer:joined", async ({ peerId, userName: pName }) => {
      setPeerName(pName);
      setPeerConnected(true);
      isPoliteRef.current = false; // host is always impolite
      const pc = createPeerConnection(peerId);
      // Explicitly kick off the offer — onnegotiationneeded may have fired
      // before tracks were ready, so we send it manually here.
      try {
        await pc.setLocalDescription();
        socket.emit("webrtc:offer", { targetId: peerId, sdp: pc.localDescription });
      } catch (err) {
        console.error("[WebRTC] peer:joined offer:", err);
      }
      setParticipants((prev) => {
        if (prev.find((p) => p.peerId === peerId)) return prev;
        return [...prev, { peerId, userName: pName }];
      });
      // Open WS for receiving — do NOT auto-start recorder here
      openTranslationWS();
      if (settings.autoTranslate) {
        translationOnRef.current = true;
        setTranslationOn(true);
        setTimeout(() => {
          startRecorder();
          socket.emit("translation:toggle", {
            enabled: true,
            srcLang: myLangRef.current,
            tgtLang: tgtLangRef.current,
          });
        }, 500);
      }
    });

    socket.on("peer:left", ({ peerId }) => {
      setPeerConnected(false);
      setPeerName("");
      setConnStatus("disconnected");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setParticipants((prev) => prev.filter((p) => p.peerId !== peerId));
      stopTranslationWS();
      translationOnRef.current = false;
      setTranslationOn(false);
      // Drain and clear audio queue on peer disconnect
      audioQueueRef.current = [];
    });

    socket.on("room:participants", (list) => setParticipants(list));

    socket.on("host:mute", () => {
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
      setMicOn(false);
      setMutedByHost(true);
    });
    socket.on("host:unmute", () => {
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = true));
      setMicOn(true);
      setMutedByHost(false);
    });

    socket.on("screen:share", ({ enabled, fromId }) => {
      if (fromId !== socket.id) {
        setToast({
          msg: enabled
            ? `${peerNameRef.current || "Peer"} started screen sharing`
            : `${peerNameRef.current || "Peer"} stopped screen sharing`,
          type: "info",
        });
        setTimeout(() => setToast(null), 3000);
      }
    });

    // WebRTC signaling
    socket.on("webrtc:offer", async ({ fromId, sdp }) => {
      if (!pcRef.current) createPeerConnection(fromId);
      const pc = pcRef.current;
      const collision = makingOfferRef.current || pc.signalingState !== "stable";
      ignoreOfferRef.current = !isPoliteRef.current && collision;
      if (ignoreOfferRef.current) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const c of pendingCandidates.current) {
          await pc.addIceCandidate(c).catch(() => {});
        }
        pendingCandidates.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { targetId: fromId, sdp: pc.localDescription });
      } catch (err) {
        console.error("[WebRTC] Offer handler:", err);
      }
    });

    socket.on("webrtc:answer", async ({ sdp }) => {
      try { await pcRef.current?.setRemoteDescription(new RTCSessionDescription(sdp)); }
      catch (err) { console.error("[WebRTC] Answer:", err); }
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

    socket.on("chat:message", ({ fromId, userName: sender, message, senderLang, timestamp }) => {
      const isOwn = fromId === socket.id;
      const id = Date.now() + Math.random();
      const needsTranslation =
        !isOwn &&
        senderLang &&
        senderLang !== myLangRef.current &&
        chatAutoTranslateRef.current;

      setChatMessages((prev) => [
        ...prev,
        {
          id,
          sender: isOwn ? "You" : sender,
          message,
          translated: "",
          translating: needsTranslation,
          translateError: false,
          isOwn,
          timestamp,
          senderLang,
        },
      ]);

      if (needsTranslation) {
        translateChatMsg(id, message, senderLang, myLangRef.current);
      }
      if (!chatOpen && !isOwn) setUnreadCount((c) => c + 1);
    });

    socket.on("room:error", ({ message }) => { alert(message); navigate("/app"); });

    return () => {
      socket.emit("room:leave");
      socket.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      stopTranslationWS();
      audioQueueRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langReady, meetingId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleLangConfirm = (myLang, tgtLang) => {
    myLangRef.current  = myLang;
    tgtLangRef.current = tgtLang;
    update({ primaryLang: myLang, secondaryLang: tgtLang });
    sessionStorage.setItem(`langChosen_${meetingId}`, "true");
    setShowLangDialog(false);
    setLangReady(true);
  };

  const toggleMic = () => {
    unlockAudioCtx();
    if (mutedByHost) return;
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCamera = () => {
    unlockAudioCtx();
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    const id = Date.now() + Math.random();
    setChatMessages((prev) => [
      ...prev,
      {
        id,
        sender: "You",
        message: text,
        translated: "",
        translating: false,
        translateError: false,
        isOwn: true,
        timestamp: Date.now(),
        senderLang: myLangRef.current,
      },
    ]);
    socketRef.current?.emit("chat:message", {
      message: text,
      senderLang: myLangRef.current,
      timestamp: Date.now(),
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const openChat = () => { setChatOpen(true); setUnreadCount(0); };
  const muteParticipant = (targetId) => socketRef.current?.emit("host:mute", { targetId });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col overflow-hidden">

      {showLangDialog && (
        <LanguageDialog
          userName={userName}
          defaultLang={settings.primaryLang}
          onConfirm={handleLangConfirm}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border ${
            toast.type === "warning" ? "bg-yellow-50 border-yellow-300 text-yellow-800" :
            toast.type === "error"   ? "bg-red-50 border-red-300 text-red-800" :
            toast.type === "info"    ? "bg-blue-50 border-blue-300 text-blue-800" :
            "bg-white border-gray-200 text-black"
          }`}>
            <p className="text-sm font-medium">{toast.msg}</p>
            {(toast.type === "warning" || toast.type === "error") && (
              <>
                <button
                  onClick={async () => { unlockAudioCtx(); setToast(null); await getLocalMedia(settings.micDeviceId, settings.cameraDeviceId); }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full"
                >
                  Retry
                </button>
                <button
                  onClick={async () => { unlockAudioCtx(); setToast(null); await getLocalMedia("default", "default"); }}
                  className="px-3 py-1 text-xs bg-gray-200 text-black rounded-full"
                >
                  Default
                </button>
              </>
            )}
            <button onClick={() => setToast(null)} className="p-1 hover:bg-black/10 rounded-full">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-medium text-sm">Meeting Room</h1>
          {peerConnected ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">{formatTime(timer)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-yellow-400 text-xs font-medium">
                {connStatus === "disconnected" ? "Peer left" : "Waiting for peer…"}
              </span>
            </div>
          )}
          {isScreenSharing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
              <Monitor className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400 text-xs font-medium">Sharing Screen</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {peerConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-yellow-400" />
          )}
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs border border-white/20"
          >
            {linkCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Link</>}
          </button>
        </div>
      </div>

      {wsOpen && (
        <TranslationBar
          myLang={myLangRef.current}
          tgtLang={tgtLangRef.current}
          isTranslating={isTranslating}
          myCaption={myCaption}
          peerCaption={peerCaption}
          peerName={peerName}
          latency={latency}
        />
      )}

      {/* Main area */}
      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 p-2 sm:p-4">
          <div className="h-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">

            {/* Remote video */}
            <div className="bg-gradient-to-br from-blue-900 to-gray-900 rounded-xl overflow-hidden relative border border-white/20 shadow-2xl">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {!peerConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 bg-blue-900/60 rounded-full flex items-center justify-center text-xl text-white font-bold border-2 border-white/20">
                    {peerName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p className="text-sm text-gray-400">Waiting for peer…</p>
                </div>
              )}
              {peerConnected && (
                <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded-lg">
                  <span className="text-white text-xs">{peerName || "Peer"}</span>
                </div>
              )}
              {translationOn && settings.showCaptions && peerCaption.translated && (
                <div className="absolute top-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-gray-300 text-xs leading-tight">{peerCaption.original}</p>
                  <p className="text-blue-300 text-xs font-medium leading-tight mt-0.5">{peerCaption.translated}</p>
                </div>
              )}
            </div>

            {/* Local video */}
            <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-xl overflow-hidden relative border border-white/20 shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay muted playsInline
                className={`w-full h-full object-cover ${isScreenSharing ? "" : "scale-x-[-1]"}`}
              />
              {!cameraOn && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <VideoOff className="w-12 h-12 text-gray-600" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded-lg">
                <span className="text-white text-xs">
                  {isScreenSharing ? "🖥 Your Screen" : `${userName} (You)`}
                </span>
              </div>
              {translationOn && settings.showCaptions && myCaption.translated && (
                <div className="absolute top-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-gray-300 text-xs leading-tight">{myCaption.original}</p>
                  <p className="text-green-300 text-xs font-medium leading-tight mt-0.5 text-right">{myCaption.translated}</p>
                </div>
              )}
              {mutedByHost && (
                <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded-lg flex items-center gap-1">
                  <MicOff className="w-3 h-3 text-white" />
                  <span className="text-white text-xs">Muted by host</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Chat + People */}
        {chatOpen && (
          <div className="absolute sm:relative right-0 top-0 bottom-0 w-full sm:w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20">
            <div className="flex items-center border-b border-gray-200">
              <button
                onClick={() => setSidebarTab("chat")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  sidebarTab === "chat" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Chat
                {unreadCount > 0 && sidebarTab !== "chat" && (
                  <span className="w-4 h-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSidebarTab("people")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  sidebarTab === "people" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users className="w-4 h-4" /> People ({participants.length + 1})
              </button>
              <button onClick={() => setChatOpen(false)} className="p-3 hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {sidebarTab === "chat" && (
              <>
                <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Auto-translate messages</span>
                  </div>
                  <button
                    onClick={() => setChatAutoTranslate((v) => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      chatAutoTranslate ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      chatAutoTranslate ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <p className="text-gray-400 text-sm text-center mt-8">No messages yet</p>
                  )}
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
                      <span className="text-xs text-gray-500 mb-1">{msg.sender}</span>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                        msg.isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                      }`}>
                        <p>{msg.message}</p>
                        {!msg.isOwn && (
                          <>
                            {msg.translating && (
                              <p className="text-xs text-gray-400 italic mt-1 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Translating…
                              </p>
                            )}
                            {msg.translated && msg.translated !== msg.message && (
                              <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                                <p className="text-xs text-gray-400 mb-0.5">
                                  {langFlag(tgtLangRef.current)} Translation
                                </p>
                                <p className="text-xs text-blue-700 font-medium">{msg.translated}</p>
                              </div>
                            )}
                            {msg.translateError && (
                              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                Translation failed.{" "}
                                <button onClick={() => retranslateMsg(msg)} className="underline hover:no-underline">
                                  Retry
                                </button>
                              </p>
                            )}
                            {!chatAutoTranslate && !msg.translated && !msg.translating && msg.senderLang && msg.senderLang !== myLangRef.current && (
                              <button
                                onClick={() => retranslateMsg(msg)}
                                className="mt-1 text-xs text-blue-500 hover:underline flex items-center gap-1"
                              >
                                <Languages className="w-3 h-3" /> Translate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder={`Type in ${langLabel(myLangRef.current)}…`}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  />
                  <button onClick={sendChat} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {sidebarTab === "people" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                      {userName?.[0]?.toUpperCase() || "Y"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{userName} (You)</p>
                      <p className="text-xs text-gray-400">
                        {langFlag(myLangRef.current)} {langLabel(myLangRef.current)}
                      </p>
                    </div>
                  </div>
                </div>
                {participants
                  .filter((p) => p.peerId !== myPeerIdRef.current)
                  .map((p) => (
                    <div key={p.peerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-700">
                          {p.userName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">{p.userName}</p>
                          <p className="text-xs text-gray-400">Participant</p>
                        </div>
                      </div>
                      <button
                        onClick={() => muteParticipant(p.peerId)}
                        title="Mute participant"
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <MicOff className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leave confirm bar */}
      {showLeaveModal && (
        <div className="border-t border-gray-200 bg-white shadow-xl flex-shrink-0">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-black">Leave this meeting?</p>
              <p className="text-xs text-gray-600">You can rejoin anytime with the same link.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 bg-gray-100 text-black rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => { sessionStorage.removeItem(`langChosen_${meetingId}`); navigate("/dashboard"); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="bg-black/40 backdrop-blur-sm border-t border-white/10 px-3 py-3 flex items-center justify-center gap-2 sm:gap-3 flex-shrink-0">

        <button
          onClick={toggleMic}
          title={micOn ? "Mute" : "Unmute"}
          className={`w-11 h-11 rounded-full flex items-center justify-center ${
            micOn && !mutedByHost
              ? "bg-white/10 hover:bg-white/20 border border-white/20"
              : "bg-red-600 hover:bg-red-700 border border-red-500"
          }`}
        >
          {micOn && !mutedByHost ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={toggleCamera}
          title={cameraOn ? "Stop Camera" : "Start Camera"}
          className={`w-11 h-11 rounded-full flex items-center justify-center ${
            cameraOn
              ? "bg-white/10 hover:bg-white/20 border border-white/20"
              : "bg-red-600 hover:bg-red-700 border border-red-500"
          }`}
        >
          {cameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          className={`w-11 h-11 rounded-full flex items-center justify-center ${
            isScreenSharing
              ? "bg-purple-600 hover:bg-purple-700 border border-purple-500"
              : "bg-white/10 hover:bg-white/20 border border-white/20"
          }`}
        >
          {isScreenSharing
            ? <MonitorOff className="w-5 h-5 text-white" />
            : <Monitor className="w-5 h-5 text-white" />
          }
        </button>

        <button
          onClick={openChat}
          className={`w-11 h-11 rounded-full flex items-center justify-center relative ${
            chatOpen
              ? "bg-blue-600 hover:bg-blue-700 border border-blue-500"
              : "bg-white/10 hover:bg-white/20 border border-white/20"
          }`}
        >
          <MessageSquare className="w-5 h-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={toggleTranslation}
          title={translationOn ? "Stop Translation" : "Start Translation"}
          className={`w-11 h-11 rounded-full flex items-center justify-center ${
            translationOn
              ? "bg-blue-600 hover:bg-blue-700 border border-blue-500"
              : "bg-white/10 hover:bg-white/20 border border-white/20"
          }`}
        >
          <Languages className="w-5 h-5 text-white" />
        </button>

        <div className="w-px h-8 bg-white/20 mx-1" />

        <button
          onClick={() => setShowLeaveModal(true)}
          className="w-11 h-11 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center border border-red-500"
        >
          <PhoneOff className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}