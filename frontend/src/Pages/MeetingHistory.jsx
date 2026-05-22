import { useState, useEffect } from "react";
import { Clock, Users, Video, Loader2, AlertCircle, Calendar } from "lucide-react";
import { useSession } from "../context/user_session";
import { supabase } from "../config/db.conn";

function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(joinedAt, leftAt) {
  if (!joinedAt || !leftAt) return "—";
  const ms = new Date(leftAt) - new Date(joinedAt);
  if (ms <= 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

export default function MeetingHistory() {
  const { session } = useSession();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchMeetingHistory(session.user.id);
  }, [session]);

  async function fetchMeetingHistory(userId) {
    setLoading(true);
    setError(null);

    try {
      // Step 1: fetch this user's rows
      const { data, error: sbError } = await supabase
        .from("meeting_participants")
        .select("room_id, user_id, joined_at, left_at, user_name")
        .eq("user_id", userId)
        .order("joined_at", { ascending: false });

      if (sbError) throw sbError;

      // Group by room_id
      const roomMap = {};
      (data || []).forEach((row) => {
        if (!roomMap[row.room_id]) {
          roomMap[row.room_id] = {
            room_id:      row.room_id,
            joined_at:    row.joined_at,
            left_at:      row.left_at,
            participants: [],
          };
        }
      });

      // Step 2: fetch ALL participants for those rooms — using correct column user_name
      const roomIds = Object.keys(roomMap);
      if (roomIds.length > 0) {
        const { data: allParticipants, error: pErr } = await supabase
          .from("meeting_participants")
          .select("room_id, user_name")   // ✅ fixed: was "username"
          .in("room_id", roomIds);

        if (pErr) throw pErr;

        (allParticipants || []).forEach((p) => {
          if (roomMap[p.room_id]) {
            const name = p.user_name || "Unknown";  // ✅ fixed: was p.username
            if (!roomMap[p.room_id].participants.includes(name)) {
              roomMap[p.room_id].participants.push(name);
            }
          }
        });
      }

      setMeetings(Object.values(roomMap));
    } catch (err) {
      console.error("[MeetingHistory] fetch error:", err);
      setError(err.message || "Failed to load meeting history.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">Meeting History</h1>
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            <span className="text-sm">Loading your meetings…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">Meeting History</h1>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">Meeting History</h1>
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Calendar className="w-12 h-12 mb-4 opacity-40" />
            <p className="text-sm">No meetings found for your account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">Meeting History</h1>

        <div className="space-y-3 sm:space-y-4">
          {meetings.map((meeting, index) => (
            <div
              key={meeting.room_id}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-black mb-2 font-mono tracking-tight">
                    Meeting {index + 1}  
                  </h3>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(meeting.joined_at)} at {formatTime(meeting.joined_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {formatDuration(meeting.joined_at, meeting.left_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {meeting.participants.length} participant{meeting.participants.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    Participants: {meeting.participants.join(", ")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}