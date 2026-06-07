import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { io } from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, MessageSquare, PhoneOff,
  Copy, Languages, Check, X, Send, Wifi, WifiOff, Globe,
  Users, Monitor, MonitorOff, RefreshCw, Volume2, VolumeX,
  Shield, Clock, ChevronDown, LogOut,
} from "lucide-react";
import { useSession } from "../context/user_session";
import { useSettings } from "../context/SettingsContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const SIGNAL_URL    = import.meta.env.VITE_SIGNAL_URL    || "http://localhost:3001";
const PYTHON_HTTP   = import.meta.env.VITE_PYTHON_HTTP   || "https://convene-chowtime-dripping.ngrok-free.dev";
const PYTHON_WS_URL = PYTHON_HTTP.replace(/^http/, "ws");

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// ✅ FIX 1: 500ms chunks instead of 250ms — halves the number of WS sends,
//    reducing network overhead without noticeably increasing buffering delay.
const AUDIO_CHUNK_MS = 500;

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

// ─── Auth Guard ───────────────────────────────────────────────────────────────
function AuthGuard({ session, children }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!session?.user) {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);
  if (!session?.user) return null;
  return children;
}

// ─── Language Dialog ──────────────────────────────────────────────────────────
function LanguageDialog({ userName, defaultLang, onConfirm }) {
  const [myLang, setMyLang] = useState(defaultLang || "en");
  const tgtLang = myLang === "en" ? "ur" : "en";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Language Setup</h2>
              <p className="text-sm text-white/50">Welcome, {userName}!</p>
            </div>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            Select your speaking language. Your voice will be translated in real-time for the other participant.
          </p>
        </div>

        {/* Options */}
        <div className="px-8 py-6 space-y-3">
          {[
            { code: "en", label: "English", flag: "🇬🇧", desc: "I speak English → translate to Urdu" },
            { code: "ur", label: "اردو (Urdu)", flag: "🇵🇰", desc: "میں اردو بولتا ہوں → انگریزی میں ترجمہ" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setMyLang(l.code)}
              className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
              style={{
                background: myLang === l.code ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                border: myLang === l.code ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-3xl">{l.flag}</span>
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{l.label}</div>
                <div className="text-xs mt-0.5" style={{ color: myLang === l.code ? "rgba(147,197,253,0.8)" : "rgba(255,255,255,0.35)" }}>
                  {l.desc}
                </div>
              </div>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  border: myLang === l.code ? "2px solid #3b82f6" : "2px solid rgba(255,255,255,0.2)",
                  background: myLang === l.code ? "#3b82f6" : "transparent",
                }}
              >
                {myLang === l.code && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>

        {/* Flow preview */}
        <div className="mx-8 mb-6 px-4 py-3 rounded-xl flex items-center justify-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-sm text-white/70">{langFlag(myLang)} {langLabel(myLang)}</span>
          <Languages className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-white/70">{langFlag(tgtLang)} {langLabel(tgtLang)}</span>
        </div>

        {/* Confirm */}
        <div className="px-8 pb-8">
          <button
            onClick={() => onConfirm(myLang, tgtLang)}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
          >
            Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast, onRetry, onDefault, onDismiss }) {
  if (!toast) return null;
  const colors = {
    warning: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e" },
    error:   { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" },
    info:    { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" },
    success: { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  };
  const c = colors[toast.type] || colors.info;
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
        <p className="flex-1">{toast.msg}</p>
        {(toast.type === "warning" || toast.type === "error") && (
          <>
            <button onClick={onRetry} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full font-medium">Retry</button>
            <button onClick={onDefault} className="px-3 py-1 text-xs rounded-full font-medium" style={{ background: "rgba(0,0,0,0.1)" }}>Default</button>
          </>
        )}
        <button onClick={onDismiss} className="p-1 rounded-full opacity-60 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Connection Status Badge ──────────────────────────────────────────────────
function StatusBadge({ peerConnected, connStatus, timer }) {
  const fmt = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (peerConnected) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <Clock className="w-3 h-3" />
      {fmt(timer)}
    </div>
  );
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      {connStatus === "disconnected" ? "Peer left" : "Waiting for peer…"}
    </div>
  );
}

// ─── Video Tile ───────────────────────────────────────────────────────────────
function VideoTile({ videoRef, muted, label, isLocal, isScreenSharing, isConnected, caption, accentColor, isSpeaking, isHost }) {
  return (
    <div className="relative rounded-2xl overflow-hidden h-full transition-all duration-150"
      style={{
        background: isLocal ? "linear-gradient(135deg, #1e1b4b, #0f0a2e)" : "linear-gradient(135deg, #0c1a2e, #061020)",
        border: isSpeaking
          ? "2px solid rgba(34,197,94,0.85)"
          : `1px solid rgba(${isLocal ? "139,92,246" : "59,130,246"},0.2)`,
        boxShadow: isSpeaking ? "0 0 16px rgba(34,197,94,0.35)" : "none",
      }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
        style={{ transform: isLocal && !isScreenSharing ? "scaleX(-1)" : "none" }}
      />

      {/* No video fallback */}
      {!isConnected && !isLocal && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{ background: "rgba(59,130,246,0.2)", border: "2px solid rgba(59,130,246,0.4)" }}>
            ?
          </div>
          <p className="text-white/40 text-sm">Waiting for peer…</p>
        </div>
      )}

      {/* Caption overlay */}
      {caption?.original && (
        <div className="absolute top-3 left-3 right-3 px-3 py-2 rounded-xl backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-white/70 text-xs leading-snug">{caption.original}</p>
          {caption.translated && (
            <p className="text-xs font-medium leading-snug mt-0.5" style={{ color: accentColor }}>{caption.translated}</p>
          )}
        </div>
      )}

      {/* Name tag + host badge + speaking indicator */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <div className="px-2.5 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-1.5"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
          {label}
          {isHost && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-white font-bold"
              style={{ background: "rgba(59,130,246,0.8)", fontSize: "9px" }}>
              HOST
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Control Button ───────────────────────────────────────────────────────────
function CtrlBtn({ onClick, active, danger, icon: Icon, badge, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105"
      style={{
        background: danger
          ? "rgba(239,68,68,0.9)"
          : active
          ? "rgba(59,130,246,0.9)"
          : "rgba(255,255,255,0.1)",
        border: danger
          ? "1px solid rgba(239,68,68,0.5)"
          : active
          ? "1px solid rgba(59,130,246,0.5)"
          : "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Icon className="w-5 h-5 text-white" />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MeetingRoom() {
  const { meetingId } = useParams();
  const navigate      = useNavigate();
  const { settings, update } = useSettings();
  const { session }   = useSession();

  // ── Auth check ──
  const userName = session?.user?.user_metadata?.full_name
    || session?.user?.email?.split("@")[0]
    || sessionStorage.getItem("userName")
    || "You";

  // ── Language state ──
  const myLangRef  = useRef(settings.primaryLang || "en");
  const tgtLangRef = useRef(settings.secondaryLang || "ur");
  const [showLangDialog, setShowLangDialog] = useState(
    !sessionStorage.getItem(`langChosen_${meetingId}`)
  );
  const [langReady, setLangReady] = useState(
    !!sessionStorage.getItem(`langChosen_${meetingId}`)
  );

  // ── Core refs ──
  const socketRef         = useRef(null);
  const pcRef             = useRef(null);
  const localStreamRef    = useRef(null);
  const screenStreamRef   = useRef(null);
  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const makingOfferRef    = useRef(false);
  const ignoreOfferRef    = useRef(false);
  const isPoliteRef       = useRef(false);
  const pendingCandidates = useRef([]);

  // ── Translation refs ──
  const translationWsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const myPeerIdRef      = useRef(null);
  const translationOnRef = useRef(false);

  // ── AudioContext queue ──
  const audioCtxRef    = useRef(null);
  const audioQueueRef  = useRef([]);
  const isPlayingRef   = useRef(false);

  // ── Remote audio mute state ──
  const remoteVideoMutedRef = useRef(false);

  // ── Chat translation ref ──
  const chatAutoTranslateRef = useRef(true);
  const peerNameRef          = useRef("");

  // ── UI state ──
  const [micOn,            setMicOn]           = useState(true);
  const [cameraOn,         setCameraOn]        = useState(true);
  const [isScreenSharing,  setIsScreenSharing] = useState(false);
  const [translationOn,    setTranslationOn]   = useState(false);
  const [wsOpen,           setWsOpen]          = useState(false);
  const [chatOpen,         setChatOpen]        = useState(false);
  const [showLeaveModal,   setShowLeaveModal]  = useState(false);
  const [timer,            setTimer]           = useState(0);
  const [linkCopied,       setLinkCopied]      = useState(false);
  const [chatInput,        setChatInput]       = useState("");
  const [chatMessages,     setChatMessages]    = useState([]);
  const [unreadCount,      setUnreadCount]     = useState(0);
  const [peerConnected,    setPeerConnected]   = useState(false);
  const [peerName,         setPeerName]        = useState("");
  const [connStatus,       setConnStatus]      = useState("connecting");
  const [isTranslating,    setIsTranslating]  = useState(false);
  const [latency,          setLatency]         = useState(null);
  const [myCaption,        setMyCaption]       = useState({ original: "", translated: "" });
  const [peerCaption,      setPeerCaption]     = useState({ original: "", translated: "" });
  const [participants,     setParticipants]    = useState([]);
  const [mutedByHost,      setMutedByHost]     = useState(false);
  const [toast,            setToast]           = useState(null);
  const [sidebarTab,       setSidebarTab]      = useState("chat");
  const [chatAutoTranslate, setChatAutoTranslate] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isPttRecording,   setIsPttRecording]  = useState(false);
  // ── New state ──
  const [isHost,           setIsHost]          = useState(false);
  const [isSpeaking,       setIsSpeaking]      = useState(false);
  const [peerSpeaking,     setPeerSpeaking]    = useState(false);
  const [knockQueue,       setKnockQueue]      = useState([]);
  const [isWaiting,        setIsWaiting]       = useState(false); // user is in waiting room
  const speakingTimerRef   = useRef(null);
  const peerSpeakingTimerRef = useRef(null);
  const localAnalyserRef   = useRef(null);
  const localAnalyserCtxRef = useRef(null);
  const analyserAnimRef    = useRef(null);

  // ── Broadcast local speaking state to peer ────────────────────────────────
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("speaking:state", { speaking: isSpeaking });
  }, [isSpeaking]);
  useEffect(() => { chatAutoTranslateRef.current = chatAutoTranslate; }, [chatAutoTranslate]);
  useEffect(() => { peerNameRef.current = peerName; }, [peerName]);

  // Meeting timer
  useEffect(() => {
    if (!peerConnected) return;
    const t = setInterval(() => setTimer((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [peerConnected]);

  // ── AudioContext helpers ──────────────────────────────────────────────────
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playNextInQueue = useCallback(() => {
    if (isPlayingRef.current) return;
    if (audioQueueRef.current.length === 0) return;
    const ctx = getAudioCtx();
    if (!ctx || ctx.state === "suspended") return;

    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift().slice(0);

    ctx.decodeAudioData(
      buffer,
      (decoded) => {
        const src  = ctx.createBufferSource();
        // Apply TTS volume from settings via a GainNode
        const gain = ctx.createGain();
        gain.gain.value = settings.ttsVolume ?? 1.0;
        src.buffer = decoded;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.onended = () => { isPlayingRef.current = false; playNextInQueue(); };
        src.start(0);
      },
      (err) => {
        console.warn("[Audio] decode error:", err?.message ?? err);
        isPlayingRef.current = false;
        playNextInQueue();
      }
    );
  }, [getAudioCtx, settings.ttsVolume]);

  // ✅ FIX 2: Unlock AudioContext eagerly on component mount (not deferred to first click).
  //    This eliminates the ~100ms resume latency on the very first TTS playback.
  useEffect(() => {
    getAudioCtx();
    return () => { audioCtxRef.current?.close().catch(() => {}); audioCtxRef.current = null; };
  }, [getAudioCtx]);

  // ── Local speaking detection via AnalyserNode ─────────────────────────────
  // Uses a SEPARATE AudioContext — never touches audioCtxRef (TTS context).
  // Starts only after getLocalMedia resolves (localStreamRef is set).
  // Poll interval: 100ms — lightweight, does not affect STT pipeline.
  const startSpeakingDetection = useCallback(() => {
    // Clean up any existing detector first
    clearTimeout(analyserAnimRef.current);
    localAnalyserCtxRef.current?.close().catch(() => {});
    localAnalyserCtxRef.current = null;

    const stream = localStreamRef.current;
    if (!stream) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    localAnalyserCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    // ⚠️ IMPORTANT: analyser is NOT connected to ctx.destination
    // so mic audio is only analysed, never played back or mixed into TTS output
    const micSrc = ctx.createMediaStreamSource(stream);
    micSrc.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const poll = () => {
      if (!localAnalyserCtxRef.current) return; // stopped
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      if (avg > 14) {
        setIsSpeaking(true);
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 900);
      }
      analyserAnimRef.current = setTimeout(poll, 100);
    };
    poll();
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(analyserAnimRef.current);
      clearTimeout(speakingTimerRef.current);
      localAnalyserCtxRef.current?.close().catch(() => {});
      localAnalyserCtxRef.current = null;
    };
  }, []);

  // ── Mute/unmute remote video ──────────────────────────────────────────────
  const applyRemoteVideoMute = useCallback((shouldMute) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = shouldMute;
      remoteVideoMutedRef.current = shouldMute;
    }
  }, []);

  // ── Waveform analyser refs ────────────────────────────────────────────────
  const waveAudioCtxRef = useRef(null);
  const waveAnalyserRef = useRef(null);
  const waveAnimRef     = useRef(null);
  const waveRecordStreamRef = useRef(null);

  const stopWaveform = useCallback(() => {
    cancelAnimationFrame(waveAnimRef.current);
    waveAudioCtxRef.current?.close().catch(() => {});
    waveAudioCtxRef.current = null;
    waveAnalyserRef.current = null;
    waveRecordStreamRef.current?.getTracks().forEach((t) => t.stop());
    waveRecordStreamRef.current = null;
  }, []);

  // ── MediaRecorder ─────────────────────────────────────────────────────────
  const startRecorder = useCallback(async () => {
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

    recorder.ondataavailable = (e) => {
      if (
        e.data &&
        e.data.size > 0 &&
        translationOnRef.current &&
        translationWsRef.current?.readyState === WebSocket.OPEN
      ) {
        translationWsRef.current.send(e.data);
        setIsTranslating(true);
        setTimeout(() => setIsTranslating(false), 500);
      }
    };
    recorder.onerror = () => { mediaRecorderRef.current = null; };
    // ✅ FIX 1 applied: 500ms slices
    recorder.start(AUDIO_CHUNK_MS);
  }, []);

  const stopRecorder = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
      // ✅ FIX 3: Reduced delay from 100ms → 0ms.
      //    The final ondataavailable fires synchronously before stop() returns,
      //    so there is no race condition — the last chunk is already in-flight.
      if (translationWsRef.current?.readyState === WebSocket.OPEN) {
        translationWsRef.current.send(JSON.stringify({ type: "end_of_speech" }));
      }
    }
    mediaRecorderRef.current = null;
    stopWaveform();
  }, [stopWaveform]);

  // ── Translation WebSocket ─────────────────────────────────────────────────
  const openTranslationWS = useCallback(() => {
    if (translationWsRef.current?.readyState === WebSocket.OPEN) {
      if (translationOnRef.current) startRecorder();
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
    ws.binaryType = "blob";

    ws.onopen = () => {
      setWsOpen(true);
      ws.send(JSON.stringify({
        type: "language-config",
        srcLang: myLangRef.current,
        tgtLang: tgtLangRef.current,
      }));
      if (translationOnRef.current) startRecorder();
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        if (event.data.size < 100) return;
        const arrayBuf = await event.data.arrayBuffer();
        audioQueueRef.current.push(arrayBuf);
        playNextInQueue();
        return;
      }
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "transcript") {
          setMyCaption({ original: msg.original, translated: msg.translated });
          setLatency(msg.latency_ms);
        } else if (msg.type === "incoming_translation") {
          setPeerCaption({ original: msg.original, translated: msg.translated });
          setLatency(msg.latency_ms);
        }
      } catch { /* ignore */ }
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

  // ── Toggle Translation ────────────────────────────────────────────────────
  // ✅ FIX 4: No explicit unlockAudioCtx() needed here anymore — AudioContext
  //    is already unlocked on mount. Kept for safety but it's a no-op.
  const toggleTranslation = useCallback(() => {
    getAudioCtx(); // ensure resumed (no-op if already running)
    if (!translationOn) {
      translationOnRef.current = true;
      setTranslationOn(true);
      applyRemoteVideoMute(true);
      openTranslationWS();
      socketRef.current?.emit("translation:toggle", {
        enabled: true,
        srcLang: myLangRef.current,
        tgtLang: tgtLangRef.current,
      });
    } else {
      translationOnRef.current = false;
      setTranslationOn(false);
      setIsPttRecording(false);
      applyRemoteVideoMute(false);
      audioQueueRef.current = [];
      stopRecorder();
      socketRef.current?.emit("translation:toggle", { enabled: false });
    }
  }, [translationOn, openTranslationWS, stopRecorder, getAudioCtx, applyRemoteVideoMute]);

  // ── Push-to-Talk ──────────────────────────────────────────────────────────
  const togglePtt = useCallback(() => {
    if (!translationOn) return;
    getAudioCtx();
    if (!isPttRecording) {
      setIsPttRecording(true);
      startRecorder();
    } else {
      setIsPttRecording(false);
      stopRecorder(); // fires end_of_speech immediately (0ms delay)
    }
  }, [translationOn, isPttRecording, startRecorder, stopRecorder, getAudioCtx]);

  // ── Chat Translation ──────────────────────────────────────────────────────
  const translateChatMsg = useCallback(async (msgId, text, srcLang, tgtLang) => {
    if (!text || srcLang === tgtLang) return;
    try {
      const res = await fetch(`${PYTHON_HTTP}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, src_lang: srcLang, tgt_lang: tgtLang }),
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

  // ── WebRTC ────────────────────────────────────────────────────────────────
  const createPeerConnection = useCallback((targetId) => {
    pcRef.current?.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach((t) =>
      pc.addTrack(t, localStreamRef.current)
    );

    const remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.muted = remoteVideoMutedRef.current;
    }

    pc.ontrack = (e) => {
      const stream = e.streams?.[0] ?? new MediaStream([e.track]);
      stream.getTracks().forEach((t) => {
        if (!remoteStream.getTracks().includes(t)) remoteStream.addTrack(t);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = remoteVideoMutedRef.current;
      }
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
        if (pc.signalingState !== "stable") return;
        makingOfferRef.current = true;
        await pc.setLocalDescription();
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
      // Start speaking detection NOW — stream is ready
      startSpeakingDetection();
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
  }, [startSpeakingDetection]);

  // ── Screen Share ──────────────────────────────────────────────────────────
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
    getAudioCtx();
    if (isScreenSharing) { await stopScreenShare(); return; }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" }, audio: false,
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
      if (err.name !== "NotAllowedError") setToast({ msg: "Screen sharing failed.", type: "error" });
    }
  }, [isScreenSharing, stopScreenShare, getAudioCtx]);

  // ── Main socket + WebRTC setup ────────────────────────────────────────────
  useEffect(() => {
    if (!langReady) return;

    const socket = io(SIGNAL_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", async () => {
      myPeerIdRef.current = socket.id;
      await getLocalMedia(settings.micDeviceId, settings.cameraDeviceId);
      socket.emit("room:join", { roomId: meetingId, userName, userId: session?.user?.id });
    });

    socket.on("room:joined", ({ participants: initial, isHost: iAmHost }) => {
      isPoliteRef.current = true;
      setIsHost(!!iAmHost);
      setIsWaiting(false); // admitted — clear waiting screen
      setParticipants(initial || []);
      const peer = (initial || [])[0];
      if (peer) {
        createPeerConnection(peer.peerId);
        setPeerConnected(true);
        setPeerName(peer.userName || "Peer");
        openTranslationWS();
        if (settings.autoTranslate) {
          translationOnRef.current = true;
          setTranslationOn(true);
          applyRemoteVideoMute(true);
          setTimeout(() => {
            startRecorder();
            socket.emit("translation:toggle", { enabled: true, srcLang: myLangRef.current, tgtLang: tgtLangRef.current });
          }, 800);
        }
      }
    });

    socket.on("peer:joined", async ({ peerId, userName: pName }) => {
      setPeerName(pName);
      setPeerConnected(true);
      isPoliteRef.current = false;
      const pc = createPeerConnection(peerId);
      try {
        await pc.setLocalDescription();
        socket.emit("webrtc:offer", { targetId: peerId, sdp: pc.localDescription });
      } catch (err) { console.error("[WebRTC] peer:joined offer:", err); }
      setParticipants((prev) =>
        prev.find((p) => p.peerId === peerId) ? prev : [...prev, { peerId, userName: pName }]
      );
      openTranslationWS();
      if (settings.autoTranslate) {
        translationOnRef.current = true;
        setTranslationOn(true);
        applyRemoteVideoMute(true);
        setTimeout(() => {
          startRecorder();
          socket.emit("translation:toggle", { enabled: true, srcLang: myLangRef.current, tgtLang: tgtLangRef.current });
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
      applyRemoteVideoMute(false);
      audioQueueRef.current = [];
      setMyCaption({ original: "", translated: "" });
      setPeerCaption({ original: "", translated: "" });
    });

    socket.on("room:participants", (list) => setParticipants(list));

    socket.on("host:mute", () => {
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
      setMicOn(false);
      setMutedByHost(true);
      setToast({ msg: "You have been muted by the host.", type: "info" });
      setTimeout(() => setToast(null), 3000);
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

    // Host changed (when original host leaves)
    socket.on("room:host-changed", ({ newHostId }) => {
      setIsHost(newHostId === socket.id);
    });

    // Waiting room — someone is knocking
    socket.on("room:knock", ({ peerId, userName: knockName }) => {
      setKnockQueue((prev) => {
        if (prev.find((k) => k.peerId === peerId)) return prev;
        return [...prev, { peerId, userName: knockName }];
      });
    });

    // Waiting room — user is waiting to be admitted
    socket.on("room:waiting", () => setIsWaiting(true));
    socket.on("room:rejected", () => {
      setIsWaiting(false);
      setToast({ msg: "Host did not admit you to this meeting.", type: "error" });
      setTimeout(() => navigate("/dashboard"), 3000);
    });

    // Peer speaking — for border highlight
    socket.on("peer:speaking", ({ peerId, speaking }) => {
      if (peerId !== socket.id) {
        setPeerSpeaking(speaking);
        if (speaking) {
          clearTimeout(peerSpeakingTimerRef.current);
          peerSpeakingTimerRef.current = setTimeout(() => setPeerSpeaking(false), 1200);
        }
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
      } catch (err) { console.error("[WebRTC] Offer handler:", err); }
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
      // senderLang comes from server — if missing, assume peer's opposite language
      const resolvedSenderLang = senderLang || (isOwn ? myLangRef.current : (myLangRef.current === "en" ? "ur" : "en"));
      const needsTranslation =
        !isOwn && resolvedSenderLang !== myLangRef.current && chatAutoTranslateRef.current;

      setChatMessages((prev) => [
        ...prev,
        { id, sender: isOwn ? "You" : sender, message, translated: "", translating: needsTranslation,
          translateError: false, isOwn, timestamp, senderLang: resolvedSenderLang },
      ]);

      if (needsTranslation) translateChatMsg(id, message, resolvedSenderLang, myLangRef.current);
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLangConfirm = (myLang, tgtLang) => {
    myLangRef.current  = myLang;
    tgtLangRef.current = tgtLang;
    update({ primaryLang: myLang, secondaryLang: tgtLang });
    sessionStorage.setItem(`langChosen_${meetingId}`, "true");
    setShowLangDialog(false);
    setLangReady(true);
  };

  const toggleMic = () => {
    getAudioCtx();
    if (mutedByHost) return;
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCamera = () => {
    getAudioCtx();
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
      { id, sender: "You", message: text, translated: "", translating: false,
        translateError: false, isOwn: true, timestamp: Date.now(), senderLang: myLangRef.current },
    ]);
    socketRef.current?.emit("chat:message", { message: text, senderLang: myLangRef.current, timestamp: Date.now() });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const leaveMeeting = () => {
    sessionStorage.removeItem(`langChosen_${meetingId}`);
    navigate("/dashboard");
  };

  const muteParticipant = (targetId) => {
    if (!isHost) return; // sirf host mute kar sakta hai
    socketRef.current?.emit("host:mute", { targetId });
  };

  const admitKnock = (peerId) => {
    socketRef.current?.emit("room:admit", { peerId });
    setKnockQueue((prev) => prev.filter((k) => k.peerId !== peerId));
  };

  const rejectKnock = (peerId) => {
    socketRef.current?.emit("room:reject", { peerId });
    setKnockQueue((prev) => prev.filter((k) => k.peerId !== peerId));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!session?.user) return null;

  // Waiting room — user knocked, waiting for host to admit
  if (isWaiting) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: "#080c14" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
        <Clock className="w-8 h-8 text-white animate-pulse" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Waiting to be admitted</h2>
        <p className="text-white/50 text-sm">The host will let you in shortly…</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <button onClick={() => navigate("/dashboard")}
        className="mt-4 px-6 py-2 rounded-xl text-sm transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
        Cancel
      </button>
    </div>
  );

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background: "#080c14" }}
    >
      <style>{`
        @keyframes ptt-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(200,75,47,0.5); }
          50%      { box-shadow: 0 0 0 10px rgba(200,75,47,0); }
        }
      `}</style>

      {showLangDialog && (
        <LanguageDialog userName={userName} defaultLang={settings.primaryLang} onConfirm={handleLangConfirm} />
      )}

      <Toast
        toast={toast}
        onRetry={async () => { getAudioCtx(); setToast(null); await getLocalMedia(settings.micDeviceId, settings.cameraDeviceId); }}
        onDefault={async () => { getAudioCtx(); setToast(null); await getLocalMedia("default", "default"); }}
        onDismiss={() => setToast(null)}
      />

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: "rgba(8,12,20,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
              <Languages className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm hidden sm:block">SpeakSync</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <StatusBadge peerConnected={peerConnected} connStatus={connStatus} timer={timer} />
          {isScreenSharing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
              <Monitor className="w-3 h-3" />
              Sharing Screen
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {wsOpen && latency && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {latency}ms
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
              {userName?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="text-white/70 text-xs hidden sm:block">{userName}</span>
          </div>

          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            {linkCopied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Link</>}
          </button>
        </div>
      </div>

      {/* ── Knock / Waiting Room Notification (host only) ── */}
      {isHost && knockQueue.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 space-y-2"
          style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.2)" }}>
          {knockQueue.map((k) => (
            <div key={k.peerId} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                  {k.userName?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-sm text-white/80 font-medium">{k.userName}</span>
                <span className="text-xs text-white/40">wants to join</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => admitKnock(k.peerId)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                  style={{ background: "#16a34a" }}>
                  Admit
                </button>
                <button onClick={() => rejectKnock(k.peerId)}
                  className="px-3 py-1 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Translation Bar ── */}
      {wsOpen && (
        <div
          className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
          style={{ background: "rgba(17,24,39,0.8)", borderBottom: "1px solid rgba(59,130,246,0.15)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: translationOn ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${translationOn ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)"}` }}>
            <span className="text-xs">{langFlag(myLangRef.current)}</span>
            <Languages className={`w-3 h-3 ${translationOn ? "text-blue-400" : "text-white/30"}`} />
            <span className="text-xs">{langFlag(tgtLangRef.current)}</span>
            {isTranslating && (
              <div className="flex items-center gap-px ml-1">
                {[3, 5, 7, 5, 3].map((h, i) => (
                  <div key={i} className="w-px bg-blue-400 rounded-full animate-pulse"
                    style={{ height: h, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {myCaption.original ? (
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>You:</span>
                <span className="text-xs text-white/80 truncate">{myCaption.original}</span>
                {myCaption.translated && (
                  <>
                    <span className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                    <span className="text-xs text-blue-300 truncate">{myCaption.translated}</span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                {translationOn ? "Listening…" : "Translation paused — peer voice playing"}
              </span>
            )}
          </div>

          <div className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: translationOn ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)", color: translationOn ? "#93c5fd" : "rgba(255,255,255,0.3)" }}>
            {translationOn ? "TTS on" : "Original voice"}
          </div>

          {peerCaption.original && (
            <div className="flex-1 min-w-0 hidden sm:block">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{peerName || "Peer"}:</span>
                <span className="text-xs text-white/80 truncate">{peerCaption.original}</span>
                {peerCaption.translated && (
                  <>
                    <span className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                    <span className="text-xs text-emerald-300 truncate">{peerCaption.translated}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 overflow-hidden">
          <VideoTile
            videoRef={remoteVideoRef}
            muted={false}
            label={peerConnected ? (peerName || "Peer") : "Waiting…"}
            isLocal={false}
            isScreenSharing={false}
            isConnected={peerConnected}
            caption={translationOn && settings.showCaptions ? peerCaption : null}
            accentColor="#93c5fd"
            isSpeaking={peerSpeaking}
            isHost={!isHost && peerConnected}
          />

          <VideoTile
            videoRef={localVideoRef}
            muted={true}
            label={isScreenSharing ? "🖥 Your Screen" : `${userName} (You)`}
            isLocal={true}
            isScreenSharing={isScreenSharing}
            isConnected={true}
            caption={translationOn && settings.showCaptions ? myCaption : null}
            accentColor="#6ee7b7"
            isSpeaking={isSpeaking}
            isHost={isHost}
          />
        </div>

        {/* ── Chat Sidebar ── */}
        {chatOpen && (
          <div
            className="absolute sm:relative right-0 top-0 bottom-0 w-full sm:w-80 lg:w-96 flex flex-col z-20"
            style={{ background: "#0d1117", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["chat", "people"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className="flex-1 py-3.5 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  style={{
                    color: sidebarTab === tab ? "#60a5fa" : "rgba(255,255,255,0.4)",
                    borderBottom: sidebarTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
                    background: "transparent",
                  }}
                >
                  {tab === "chat" ? <MessageSquare className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                  {tab === "chat" ? "Chat" : `People (${participants.length + 1})`}
                  {tab === "chat" && unreadCount > 0 && sidebarTab !== "chat" && (
                    <span className="w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
              ))}
              <button onClick={() => setChatOpen(false)} className="px-4 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {sidebarTab === "chat" && (
              <>
                <div className="px-4 py-2.5 flex items-center justify-between flex-shrink-0"
                  style={{ background: "rgba(59,130,246,0.06)", borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
                  <div className="flex items-center gap-2">
                    <Languages className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs text-blue-300/80">Auto-translate messages</span>
                  </div>
                  <button
                    onClick={() => setChatAutoTranslate((v) => !v)}
                    className="relative w-9 h-5 rounded-full transition-colors duration-200"
                    style={{ background: chatAutoTranslate ? "#3b82f6" : "rgba(255,255,255,0.15)" }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                      style={{ transform: chatAutoTranslate ? "translateX(16px)" : "translateX(2px)" }}
                    />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-16 gap-3">
                      <MessageSquare className="w-8 h-8" style={{ color: "rgba(255,255,255,0.1)" }} />
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>No messages yet</p>
                    </div>
                  )}
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
                      <span className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{msg.sender}</span>
                      <div
                        className="max-w-[80%] px-3 py-2.5 rounded-xl text-sm"
                        style={{
                          background: msg.isOwn ? "#2563eb" : "rgba(255,255,255,0.08)",
                          border: msg.isOwn ? "none" : "1px solid rgba(255,255,255,0.07)",
                          color: msg.isOwn ? "white" : "rgba(255,255,255,0.85)",
                        }}
                      >
                        <p>{msg.message}</p>
                        {!msg.isOwn && (
                          <>
                            {msg.translating && (
                              <p className="text-xs italic mt-1.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                                <RefreshCw className="w-3 h-3 animate-spin" /> Translating…
                              </p>
                            )}
                            {msg.translated && msg.translated !== msg.message && (
                              <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                                <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                                  {langFlag(myLangRef.current)} Translation
                                </p>
                                <p className="text-xs text-blue-300 font-medium">{msg.translated}</p>
                              </div>
                            )}
                            {msg.translateError && (
                              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                Translation failed.{" "}
                                <button onClick={() => retranslateMsg(msg)} className="underline">Retry</button>
                              </p>
                            )}
                            {!chatAutoTranslate && !msg.translated && !msg.translating && msg.senderLang && msg.senderLang !== myLangRef.current && (
                              <button onClick={() => retranslateMsg(msg)}
                                className="mt-1.5 text-xs text-blue-400 flex items-center gap-1 hover:underline">
                                <Languages className="w-3 h-3" /> Translate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      placeholder={`Type in ${langLabel(myLangRef.current)}…`}
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <button onClick={sendChat} className="p-2.5 rounded-xl transition-colors" style={{ background: "#2563eb" }}>
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {sidebarTab === "people" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "white" }}>
                    {userName?.[0]?.toUpperCase() || "Y"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{userName} <span className="text-xs text-white/30">(You)</span></p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {langFlag(myLangRef.current)} {langLabel(myLangRef.current)}
                    </p>
                  </div>
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                </div>

                {participants.filter((p) => p.peerId !== myPeerIdRef.current).map((p) => (
                  <div key={p.peerId} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
                      {p.userName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{p.userName}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Participant</p>
                    </div>
                    <button onClick={() => muteParticipant(p.peerId)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                      title={isHost ? "Mute participant" : "Only host can mute"}
                      style={{ opacity: isHost ? 1 : 0.3, cursor: isHost ? "pointer" : "not-allowed" }}>
                      <MicOff className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Leave Confirm Bar ── */}
      {showLeaveModal && (
        <div
          className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-4"
          style={{ background: "#0d1117", borderTop: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div>
            <p className="text-sm font-medium text-white">Leave this meeting?</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>You can rejoin anytime with the same link.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Cancel
            </button>
            <button
              onClick={leaveMeeting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2"
              style={{ background: "#dc2626" }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave
            </button>
          </div>
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div
        className="flex items-center justify-center gap-3 sm:gap-4 px-4 py-4 flex-shrink-0"
        style={{ background: "rgba(8,12,20,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
      >
        <CtrlBtn
          onClick={toggleMic}
          active={false}
          danger={!micOn || mutedByHost}
          icon={micOn && !mutedByHost ? Mic : MicOff}
          title={micOn ? "Mute" : "Unmute"}
        />

        <CtrlBtn
          onClick={toggleCamera}
          active={false}
          danger={!cameraOn}
          icon={cameraOn ? Video : VideoOff}
          title={cameraOn ? "Stop Camera" : "Start Camera"}
        />

        <CtrlBtn
          onClick={toggleScreenShare}
          active={isScreenSharing}
          danger={false}
          icon={isScreenSharing ? MonitorOff : Monitor}
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
        />

        <button
          onClick={toggleTranslation}
          title={translationOn ? "Stop Translation (restore original voice)" : "Start Translation (TTS voice)"}
          className="relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-200 active:scale-95"
          style={{
            background: translationOn ? "rgba(59,130,246,0.9)" : "rgba(255,255,255,0.08)",
            border: translationOn ? "1px solid rgba(59,130,246,0.6)" : "1px solid rgba(255,255,255,0.12)",
            minWidth: 56,
          }}
        >
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-white" />
            {translationOn
              ? <Volume2 className="w-3 h-3 text-blue-200" />
              : <VolumeX className="w-3 h-3 text-white/50" />
            }
          </div>
          <span className="text-white/60 text-xs leading-none">{translationOn ? "TTS" : "Original"}</span>
        </button>

        {translationOn && (
          <button
            onClick={togglePtt}
            title={isPttRecording ? "Click to stop & send" : "Click to start speaking"}
            className="relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-200 active:scale-95"
            style={{
              background: isPttRecording ? "rgba(200,75,47,0.9)" : "rgba(255,255,255,0.08)",
              border: isPttRecording ? "1px solid rgba(200,75,47,0.6)" : "1px solid rgba(255,255,255,0.12)",
              minWidth: 56,
              boxShadow: isPttRecording ? "0 0 0 4px rgba(200,75,47,0.25)" : "none",
              animation: isPttRecording ? "ptt-pulse 1.4s ease-in-out infinite" : "none",
            }}
          >
            <Mic className={`w-4 h-4 ${isPttRecording ? "text-white" : "text-white/60"}`} />
            <span className="text-white/60 text-xs leading-none">
              {isPttRecording ? "● REC" : "Speak"}
            </span>
          </button>
        )}

        <CtrlBtn
          onClick={() => { setChatOpen((v) => !v); setUnreadCount(0); }}
          active={chatOpen}
          danger={false}
          icon={MessageSquare}
          badge={unreadCount}
          title="Chat"
        />

        <div className="w-px h-8 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />

        <button
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-medium transition-all duration-200 active:scale-95 hover:opacity-90"
          style={{ background: "#dc2626", border: "1px solid rgba(220,38,38,0.5)" }}
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:block">End</span>
        </button>
      </div>
    </div>
  );
}