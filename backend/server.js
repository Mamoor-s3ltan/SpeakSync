import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";


const app = express();
const httpServer = createServer(app);

// ─── Supabase admin client (service role key — never expose to frontend) ──────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // use service role, not anon key
);

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

// ─── Track participantRowId per socket for updating left_at later ─────────────
// participantRows: { [socketId]: uuid (row id in meeting_participants) }
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

  // ✅ Stamp left_at in Supabase
  const rowId = participantRows.get(socket.id);
  if (rowId) {
    const { error } = await supabase
      .from("meeting_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("id", rowId);

    if (error) {
      console.error(`[Supabase] Failed to update left_at for row ${rowId}:`, error.message);
    } else {
      console.log(`[Supabase] left_at stamped for socket ${socket.id}`);
    }

    participantRows.delete(socket.id);
  }
}

// ─── Socket.io connection handler ────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── JOIN ROOM ──────────────────────────────────────────────────────────────
  // Client now emits: { roomId, userName, userId }  ← userId added
  socket.on("room:join", async ({ roomId, userName, userId }) => {
    if (!roomId || !userName) {
      socket.emit("room:error", { message: "roomId and userName are required" });
      return;
    }

    leaveRoom(socket);

    let room = rooms.get(roomId);
    const isNewRoom = !room;

    if (isNewRoom) {
      room = { participants: new Set(), hostId: socket.id };
      rooms.set(roomId, room);
      console.log(`[Room] ${roomId} created by ${socket.id}`);
    }

    if (room.participants.size >= 2) {
      socket.emit("room:error", { message: "Room is full" });
      return;
    }

    room.participants.add(socket.id);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = userName;
    socket.data.userId = userId ?? null;

    // ✅ Insert participant row into Supabase
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

      if (error) {
        console.error(`[Supabase] Failed to insert participant:`, error.message);
      } else {
        // Save the row id so we can stamp left_at on disconnect
        participantRows.set(socket.id, data.id);
        console.log(`[Supabase] Participant row created: ${data.id}`);
      }
    }

    socket.emit("room:joined", {
      roomId,
      peerId: socket.id,
      isHost: isNewRoom,
      participantCount: room.participants.size,
      participants: [...room.participants].filter((id) => id !== socket.id),
    });

    socket.to(roomId).emit("peer:joined", {
      peerId: socket.id,
      userName,
      participantCount: room.participants.size,
    });

    console.log(`[Room] ${socket.id} (${userName}) joined ${roomId} | total: ${room.participants.size}`);
  });

  // ── WEBRTC OFFER ───────────────────────────────────────────────────────────
  socket.on("webrtc:offer", ({ targetId, sdp }) => {
    console.log(`[WebRTC] Offer: ${socket.id} → ${targetId}`);
    io.to(targetId).emit("webrtc:offer", { fromId: socket.id, userName: socket.data.userName, sdp });
  });

  // ── WEBRTC ANSWER ──────────────────────────────────────────────────────────
  socket.on("webrtc:answer", ({ targetId, sdp }) => {
    console.log(`[WebRTC] Answer: ${socket.id} → ${targetId}`);
    io.to(targetId).emit("webrtc:answer", { fromId: socket.id, sdp });
  });

  // ── ICE CANDIDATE ──────────────────────────────────────────────────────────
  socket.on("webrtc:ice-candidate", ({ targetId, candidate }) => {
    io.to(targetId).emit("webrtc:ice-candidate", { fromId: socket.id, candidate });
  });

  // ── MEDIA STATE CHANGES ────────────────────────────────────────────────────
  socket.on("media:state-change", ({ type, enabled }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("peer:media-state-change", { peerId: socket.id, type, enabled });
  });

  // ── TRANSLATION STATE ──────────────────────────────────────────────────────
  socket.on("translation:toggle", ({ enabled, srcLang, tgtLang }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("peer:translation-state", { peerId: socket.id, enabled, srcLang, tgtLang });
    console.log(`[Translation] ${socket.id} ${enabled ? "enabled" : "disabled"} (${srcLang}→${tgtLang})`);
  });

  // ── CHAT MESSAGE ───────────────────────────────────────────────────────────
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
  socket.on("room:leave", () => leaveRoom(socket));

  // ── DISCONNECT ─────────────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} | reason: ${reason}`);
    leaveRoom(socket);
  });
});

// ─── REST endpoints ───────────────────────────────────────────────────────────
app.get("/room/:roomId", (req, res) => {
  const info = getRoomInfo(req.params.roomId);
  if (!info) return res.json({ exists: false });
  res.json({ exists: true, ...info });
});

// ✅ New: fetch meeting history for a user
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

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Signalling server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});