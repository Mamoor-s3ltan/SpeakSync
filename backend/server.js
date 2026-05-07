import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ─── In-memory room store ─────────────────────────────────────────────────────
// rooms: { [roomId]: { participants: Set<socketId>, hostId: string } }
const rooms = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoomInfo(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return {
    roomId,
    participantCount: room.participants.size,
    hostId: room.hostId,
    participants: [...room.participants],
  };
}

function leaveRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.participants.delete(socket.id);

  // Notify others in room
  socket.to(roomId).emit("peer:left", {
    peerId: socket.id,
    participantCount: room.participants.size,
  });

  // If room is empty, delete it
  if (room.participants.size === 0) {
    rooms.delete(roomId);
    console.log(`[Room] ${roomId} deleted (empty)`);
  } else if (room.hostId === socket.id) {
    // Transfer host to next participant
    const [nextHost] = room.participants;
    room.hostId = nextHost;
    io.to(roomId).emit("room:host-changed", { newHostId: nextHost });
    console.log(`[Room] ${roomId} host transferred to ${nextHost}`);
  }

  socket.leave(roomId);
  socket.data.roomId = null;
  console.log(`[Socket] ${socket.id} left room ${roomId}`);
}

// ─── Socket.io connection handler ────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── JOIN ROOM ──────────────────────────────────────────────────────────────
  // Client emits: { roomId, userName }
  // Server emits back: room:joined | room:error
  socket.on("room:join", ({ roomId, userName }) => {
    if (!roomId || !userName) {
      socket.emit("room:error", { message: "roomId and userName are required" });
      return;
    }

    // Leave any previous room
    leaveRoom(socket);

    let room = rooms.get(roomId);
    const isNewRoom = !room;

    if (isNewRoom) {
      room = { participants: new Set(), hostId: socket.id };
      rooms.set(roomId, room);
      console.log(`[Room] ${roomId} created by ${socket.id}`);
    }

    // Max 2 participants for 1-on-1 calls (adjust for group calls)
    if (room.participants.size >= 2) {
      socket.emit("room:error", { message: "Room is full" });
      return;
    }

    room.participants.add(socket.id);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = userName;

    // Tell the joiner about the room
    socket.emit("room:joined", {
      roomId,
      peerId: socket.id,
      isHost: isNewRoom,
      participantCount: room.participants.size,
      participants: [...room.participants].filter((id) => id !== socket.id),
    });

    // Tell existing participants someone joined
    socket.to(roomId).emit("peer:joined", {
      peerId: socket.id,
      userName,
      participantCount: room.participants.size,
    });

    console.log(`[Room] ${socket.id} (${userName}) joined ${roomId} | total: ${room.participants.size}`);
  });

  // ── WEBRTC OFFER ───────────────────────────────────────────────────────────
  // Caller sends offer SDP to a specific peer
  // Client emits: { targetId, sdp }
  socket.on("webrtc:offer", ({ targetId, sdp }) => {
    console.log(`[WebRTC] Offer: ${socket.id} → ${targetId}`);
    io.to(targetId).emit("webrtc:offer", {
      fromId: socket.id,
      userName: socket.data.userName,
      sdp,
    });
  });

  // ── WEBRTC ANSWER ──────────────────────────────────────────────────────────
  // Callee sends answer SDP back to caller
  // Client emits: { targetId, sdp }
  socket.on("webrtc:answer", ({ targetId, sdp }) => {
    console.log(`[WebRTC] Answer: ${socket.id} → ${targetId}`);
    io.to(targetId).emit("webrtc:answer", {
      fromId: socket.id,
      sdp,
    });
  });

  // ── ICE CANDIDATE ──────────────────────────────────────────────────────────
  // Relay ICE candidates between peers
  // Client emits: { targetId, candidate }
  socket.on("webrtc:ice-candidate", ({ targetId, candidate }) => {
    io.to(targetId).emit("webrtc:ice-candidate", {
      fromId: socket.id,
      candidate,
    });
  });

  // ── MEDIA STATE CHANGES ────────────────────────────────────────────────────
  // Notify peers when mic/camera/screen share state changes
  // Client emits: { type: 'mic'|'camera'|'screen', enabled: bool }
  socket.on("media:state-change", ({ type, enabled }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("peer:media-state-change", {
      peerId: socket.id,
      type,
      enabled,
    });
  });

  // ── TRANSLATION STATE ──────────────────────────────────────────────────────
  // Notify peers when translation is toggled
  // Client emits: { enabled: bool, srcLang: string, tgtLang: string }
  socket.on("translation:toggle", ({ enabled, srcLang, tgtLang }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("peer:translation-state", {
      peerId: socket.id,
      enabled,
      srcLang,
      tgtLang,
    });
    console.log(`[Translation] ${socket.id} ${enabled ? "enabled" : "disabled"} (${srcLang}→${tgtLang})`);
  });

  // ── CHAT MESSAGE ───────────────────────────────────────────────────────────
  // Broadcast chat message to room
  // Client emits: { message, timestamp }
  socket.on("chat:message", ({ message, timestamp }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit("chat:message", {
      fromId: socket.id,
      userName: socket.data.userName,
      message,
      timestamp: timestamp || Date.now(),
    });
  });

  // ── LEAVE ROOM ─────────────────────────────────────────────────────────────
  socket.on("room:leave", () => {
    leaveRoom(socket);
  });

  // ── DISCONNECT ─────────────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} | reason: ${reason}`);
    leaveRoom(socket);
  });
});

// ─── REST endpoints ───────────────────────────────────────────────────────────

// Check if room exists and how many participants
app.get("/room/:roomId", (req, res) => {
  const info = getRoomInfo(req.params.roomId);
  if (!info) return res.json({ exists: false });
  res.json({ exists: true, ...info });
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    rooms: rooms.size,
    uptime: process.uptime(),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Signalling server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});