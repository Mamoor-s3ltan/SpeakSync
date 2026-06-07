import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
const httpServer = createServer(app);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ─── In-memory stores ─────────────────────────────────────────────────────────
// rooms: { [roomId]: { participants: Set<socketId>, hostId: string } }
const rooms = new Map();
// knockers: { [roomId]: Map<socketId, { userName, socket }> } — waiting room queue
const knockers = new Map();
const participantRows = new Map();

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

async function leaveRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.participants.delete(socket.id);

  socket.to(roomId).emit("peer:left", {
    peerId: socket.id,
    participantCount: room.participants.size,
  });

  if (room.participants.size === 0) {
    rooms.delete(roomId);
    knockers.delete(roomId);
    console.log(`[Room] ${roomId} deleted (empty)`);
  } else if (room.hostId === socket.id) {
    const [nextHost] = room.participants;
    room.hostId = nextHost;
    io.to(roomId).emit("room:host-changed", { newHostId: nextHost });
    console.log(`[Room] ${roomId} host transferred to ${nextHost}`);
  }

  socket.leave(roomId);
  socket.data.roomId = null;
  console.log(`[Socket] ${socket.id} left room ${roomId}`);

  const rowId = participantRows.get(socket.id);
  if (rowId) {
    const { error } = await supabase
      .from("meeting_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("id", rowId);
    if (error) console.error(`[Supabase] left_at update failed:`, error.message);
    participantRows.delete(socket.id);
  }
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── JOIN ROOM ──────────────────────────────────────────────────────────────
  socket.on("room:join", async ({ roomId, userName, userId }) => {
    if (!roomId || !userName) {
      socket.emit("room:error", { message: "roomId and userName are required" });
      return;
    }

    await leaveRoom(socket);

    let room = rooms.get(roomId);
    const isNewRoom = !room;

    if (isNewRoom) {
      // First person creates the room and becomes host — no waiting room needed
      room = { participants: new Set(), hostId: socket.id };
      rooms.set(roomId, room);
      console.log(`[Room] ${roomId} created by ${socket.id} (${userName})`);
    } else {
      // Room exists — if full, send to waiting room (knock)
      if (room.participants.size >= 2) {
        socket.emit("room:error", { message: "Room is full" });
        return;
      }

      // Room has space but already has a host — send knock to host, wait for admit
      if (room.participants.size === 1) {
        // Store knocker
        if (!knockers.has(roomId)) knockers.set(roomId, new Map());
        knockers.get(roomId).set(socket.id, { userName, socket });
        socket.data.knockingRoom = roomId;
        socket.data.userName = userName;
        socket.data.userId = userId ?? null;

        // Notify host
        io.to(room.hostId).emit("room:knock", { peerId: socket.id, userName });
        // Tell knocker they are waiting
        socket.emit("room:waiting", { message: "Waiting for host to admit you…" });
        console.log(`[Room] ${socket.id} (${userName}) is knocking on ${roomId}`);
        return;
      }
    }

    // Admit directly (either host or empty room)
    await admitToRoom(socket, roomId, userName, userId, room, isNewRoom);
  });

  // ── ADMIT helper ───────────────────────────────────────────────────────────
  async function admitToRoom(socket, roomId, userName, userId, room, isNewRoom) {
    room.participants.add(socket.id);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = userName;
    socket.data.userId = userId ?? null;

    if (userId) {
      const { data, error } = await supabase
        .from("meeting_participants")
        .insert({
          room_id: roomId,
          user_id: userId,
          user_name: userName,
          joined_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) console.error(`[Supabase] insert failed:`, error.message);
      else participantRows.set(socket.id, data.id);
    }

    // Build participants list with userNames for the joining peer
    const existingParticipants = [...room.participants]
      .filter((id) => id !== socket.id)
      .map((id) => {
        const s = io.sockets.sockets.get(id);
        return { peerId: id, userName: s?.data?.userName || "Peer" };
      });

    socket.emit("room:joined", {
      roomId,
      peerId: socket.id,
      isHost: room.hostId === socket.id,
      participantCount: room.participants.size,
      participants: existingParticipants,
    });

    socket.to(roomId).emit("peer:joined", {
      peerId: socket.id,
      userName,
      participantCount: room.participants.size,
    });

    console.log(`[Room] ${socket.id} (${userName}) joined ${roomId} | total: ${room.participants.size}`);
  }

  // ── HOST ADMITS KNOCKER ────────────────────────────────────────────────────
  socket.on("room:admit", async ({ peerId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return; // only host can admit

    const knockerMap = knockers.get(roomId);
    if (!knockerMap) return;

    const knocker = knockerMap.get(peerId);
    if (!knocker) return;

    knockerMap.delete(peerId);
    knocker.socket.data.knockingRoom = null;

    await admitToRoom(
      knocker.socket,
      roomId,
      knocker.userName,
      knocker.socket.data.userId,
      room,
      false
    );
    console.log(`[Room] Host ${socket.id} admitted ${peerId} to ${roomId}`);
  });

  // ── HOST REJECTS KNOCKER ───────────────────────────────────────────────────
  socket.on("room:reject", ({ peerId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;

    const knockerMap = knockers.get(roomId);
    const knocker = knockerMap?.get(peerId);
    if (!knocker) return;

    knockerMap.delete(peerId);
    knocker.socket.emit("room:rejected", { message: "Host did not admit you." });
    console.log(`[Room] Host ${socket.id} rejected ${peerId} from ${roomId}`);
  });

  // ── WEBRTC ─────────────────────────────────────────────────────────────────
  socket.on("webrtc:offer", ({ targetId, sdp }) => {
    console.log(`[WebRTC] Offer: ${socket.id} → ${targetId}`);
    io.to(targetId).emit("webrtc:offer", { fromId: socket.id, userName: socket.data.userName, sdp });
  });

  socket.on("webrtc:answer", ({ targetId, sdp }) => {
    console.log(`[WebRTC] Answer: ${socket.id} → ${targetId}`);
    io.to(targetId).emit("webrtc:answer", { fromId: socket.id, sdp });
  });

  // ICE candidate — relay only, no host restriction needed (WebRTC internal)
  socket.on("webrtc:ice-candidate", ({ targetId, candidate }) => {
    io.to(targetId).emit("webrtc:ice-candidate", { fromId: socket.id, candidate });
  });

  // ── MEDIA STATE ────────────────────────────────────────────────────────────
  socket.on("media:state-change", ({ type, enabled }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("peer:media-state-change", { peerId: socket.id, type, enabled });
  });

  // ── SPEAKING STATE (for border highlight) ──────────────────────────────────
  socket.on("speaking:state", ({ speaking }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("peer:speaking", { peerId: socket.id, speaking });
  });

  // ── TRANSLATION STATE ──────────────────────────────────────────────────────
  socket.on("translation:toggle", ({ enabled, srcLang, tgtLang }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("peer:translation-state", { peerId: socket.id, enabled, srcLang, tgtLang });
    console.log(`[Translation] ${socket.id} ${enabled ? "ON" : "OFF"} (${srcLang}→${tgtLang})`);
  });

  // ── CHAT MESSAGE — include senderLang ──────────────────────────────────────
  socket.on("chat:message", ({ message, senderLang, timestamp }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit("chat:message", {
      fromId: socket.id,
      userName: socket.data.userName,
      message,
      senderLang: senderLang || "en",   // ✅ pass senderLang to all clients
      timestamp: timestamp || Date.now(),
    });
  });

  // ── HOST MUTE — only host can trigger ─────────────────────────────────────
  socket.on("host:mute", ({ targetId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return; // ✅ server-side host check
    io.to(targetId).emit("host:mute");
    console.log(`[Host] ${socket.id} muted ${targetId}`);
  });

  socket.on("host:unmute", ({ targetId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    io.to(targetId).emit("host:unmute");
  });

  // ── SCREEN SHARE ───────────────────────────────────────────────────────────
  socket.on("screen:share", ({ enabled }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("screen:share", { enabled, fromId: socket.id });
  });

  // ── LEAVE / DISCONNECT ─────────────────────────────────────────────────────
  socket.on("room:leave", () => leaveRoom(socket));
  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} | reason: ${reason}`);
    leaveRoom(socket);
    // If they were knocking, clean up
    if (socket.data.knockingRoom) {
      knockers.get(socket.data.knockingRoom)?.delete(socket.id);
    }
  });
});

// ─── REST ─────────────────────────────────────────────────────────────────────
app.get("/room/:roomId", (req, res) => {
  const info = getRoomInfo(req.params.roomId);
  if (!info) return res.json({ exists: false });
  res.json({ exists: true, ...info });
});

app.get("/history/:userId", async (req, res) => {
  const { data, error } = await supabase
    .from("meeting_participants")
    .select("room_id, joined_at, left_at")
    .eq("user_id", req.params.userId)
    .order("joined_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", rooms: rooms.size, uptime: process.uptime() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Signalling server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});