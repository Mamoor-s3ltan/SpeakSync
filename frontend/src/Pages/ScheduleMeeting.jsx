import { useState, useEffect } from "react";
import { supabase } from '../config/db.conn';
import { Calendar, Clock, Copy, Check, Trash2, Edit } from "lucide-react";
import { useSession } from "../context/user_session";

export default function ScheduleMeeting() {
  const [showForm, setShowForm] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null); // single meeting object or null
  const [linkCopied, setLinkCopied] = useState(false);

  const current_user = useSession();
  const current_user_id = current_user?.session?.user?.id;

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
  });

  const [scheduledMeetings, setScheduledMeetings] = useState([]);

  // Fetch all scheduled meetings for the current user
  useEffect(() => {
    if (!current_user_id) return;
    fetchScheduledMeetings();
  }, [current_user_id]);

  async function fetchScheduledMeetings() {
    const { data, error } = await supabase
      .from("schedule_meeting")
      .select("*")
      .eq("user_id", current_user_id);

    if (error) {
      console.error("Error fetching scheduled meetings:", error);
      return;
    }

    setScheduledMeetings(data ?? []);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsCreating(true);

    setTimeout(async () => {
      const meetingId = Math.random().toString(36).substring(2, 12);
      const link = `${window.location.origin}/meeting/${meetingId}`;
      const { title, date, time, description } = formData;

      const { data, error } = await supabase
        .from("schedule_meeting")
        .insert({
          user_id: current_user_id,
          meeting_title: title,
          date: date,
          time: time,// fixed: now actually saved
          meeting_link: link,
        })
        .select()
        .single(); // return the inserted row

      if (error) {
        alert("Meeting could not be created. Please try again.");
        console.error("Error inserting meeting:", error);
        setIsCreating(false);
        return;
      }

      setCreatedMeeting(data);           // single object, not array
      setIsCreating(false);
      setShowForm(false);
      setFormData({ title: "", date: "", time: "", description: "" });
      fetchScheduledMeetings();          // refresh the list
    }, 1000);
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Delete from Supabase and update local state
  const deleteMeeting = async (id) => {
    const { error } = await supabase
      .from("schedule_meeting")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting meeting:", error);
      return;
    }

    setScheduledMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  const resetToForm = () => {
    setShowForm(true);
    setCreatedMeeting(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">
          Schedule Meeting
        </h1>

        {/* Create Meeting Form */}
        {showForm && !createdMeeting && (
          <div className="bg-gray-50 rounded-xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-sm border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
              Create New Meeting
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Team Standup"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Add meeting details..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black">
                    Language Mode
                  </span>
                  <span className="text-sm text-gray-600">
                    English ↔ Urdu (Fixed)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Meeting...
                  </>
                ) : (
                  "Create Meeting"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Success UI — shown after a meeting is created */}
        {createdMeeting && (
          <div className="bg-green-50 rounded-xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-sm border border-green-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">
                Meeting Created Successfully!
              </h2>
              <p className="text-gray-600">Your meeting has been scheduled</p>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="font-bold text-black mb-4">Meeting Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  {/* fixed: was meeting_title but object now consistently uses DB column names */}
                  <span className="text-black font-medium">
                    {createdMeeting.meeting_title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-black font-medium">
                    {new Date(createdMeeting.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="text-black font-medium">
                    {createdMeeting.time}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Meeting Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={createdMeeting.meeting_link} // fixed: was .link
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                />
                <button
                  onClick={() => copyLink(createdMeeting.meeting_link)} // fixed: was .link
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Add to Calendar
              </button>
              <button
                onClick={resetToForm}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-300 text-black rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Schedule Another
              </button>
            </div>
          </div>
        )}

        {/* Scheduled Meetings List */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-black mb-4 sm:mb-6">
            Scheduled Meetings
          </h2>

          {scheduledMeetings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No scheduled meetings yet</p>
              <button
                onClick={resetToForm}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Your First Meeting
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-black mb-1 text-sm sm:text-base">
                      {meeting.meeting_title} {/* fixed: was meeting.title */}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 text-xs sm:text-sm text-gray-600">
                      <span>
                        {new Date(meeting.date).toLocaleDateString()} at{" "}
                        {meeting.time}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium w-fit">
                        {meeting.status ?? "Upcoming"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyLink(meeting.meeting_link)} // fixed: was meeting.link
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Copy Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMeeting(meeting.id)} // fixed: now deletes from Supabase too
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}