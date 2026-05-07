import React,{useState} from 'react'
import { useSession } from '../context/user_session';
import { useNavigate } from "react-router";
import { Video, Link as LinkIcon, Copy, Check, Calendar, Clock,LogOut } from "lucide-react";
import { supabase } from '../config/db.conn';


const Dashboard = () => {
  const navigate = useNavigate();
  const { session} = useSession();
  const [meetingLink, setMeetingLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isStartingMeeting, setIsStartingMeeting] = useState(false);
  const [linkError, setLinkError] = useState("");

  const generateMeetingLink = () => {
    setIsGeneratingLink(true);
    setLinkError("");

    setTimeout(() => {
      try {
        const meetingId = Math.random().toString(36).substring(2, 12);
        const link = `${window.location.origin}/meeting/${meetingId}`;
        setMeetingLink(link);
        setIsGeneratingLink(false);
      } catch (error) {
        setLinkError("Failed to generate link. Please try again.");
        setIsGeneratingLink(false);
      }
    }, 800);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

const startInstantMeeting = () => {
  setIsStartingMeeting(true);
  setTimeout(() => {
    const meetingId = Math.random().toString(36).substring(2, 12);
    sessionStorage.setItem("userName", session?.user?.user_metadata?.full_name || session?.user?.email);
    navigate(`/meeting/${meetingId}`);
  }, 500);
};

  const handleJoinMeeting = () => {
 
    if (joinLink) {
      const meetingId = joinLink.split("/").pop();
      navigate(`/meeting/${meetingId}`);
    }
  };

  const HandleLogout = async ()=>{
     await supabase.auth.signOut();
     navigate("/")
  }

  const upcomingMeetings = [
    {
      id: 1,
      title: "Team Standup",
      time: "Today, 2:00 PM",
      participants: 5,
    },
    {
      id: 2,
      title: "Client Call",
      time: "Tomorrow, 10:00 AM",
      participants: 3,
    },
  ];

  const recentMeetings = [
    {
      id: 1,
      title: "Project Review",
      date: "May 1, 2026",
      duration: "45 min",
    },
    {
      id: 2,
      title: "Weekly Sync",
      date: "Apr 30, 2026",
      duration: "30 min",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className='flex justify-around my-2'>
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">Dashboard</h1>
        {session  && <button className='px-7 h-[45px] py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 ' onClick={HandleLogout}><LogOut/> Signout</button>}
        </div>

        {/* Start Instant Meeting Card */}
        <div className="bg-gray-50 rounded-xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-sm border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
            Start Instant Meeting
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={startInstantMeeting}
              disabled={isStartingMeeting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isStartingMeeting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Start Meeting
                </>
              )}
            </button>
            <button
              onClick={generateMeetingLink}
              disabled={isGeneratingLink}
              className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
            >
              {isGeneratingLink ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5" />
                  Generate Meeting Link
                </>
              )}
            </button>
          </div>

          {linkError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{linkError}</p>
            </div>
          )}

          {meetingLink && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-black mb-2">
                Your Meeting Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={meetingLink}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {copied ? (
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
          )}
        </div>

        {/* Join Meeting */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-black mb-3 sm:mb-4">Join Meeting</h2>
          <form onSubmit={handleJoinMeeting} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              placeholder="Enter meeting link or code"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Join
            </button>
          </form>
        </div>

        {/* Quick Navigation Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-black mb-1 sm:mb-2">
                Schedule Future Meetings
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Plan ahead with date and time selection
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/schedule")}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Calendar className="w-5 h-5" />
              Schedule Meeting
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Upcoming Meetings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-black">Upcoming Meetings</h2>
            </div>
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <h3 className="font-bold text-black">{meeting.title}</h3>
                  <p className="text-sm text-gray-600">{meeting.time}</p>
                  <p className="text-sm text-gray-600">
                    {meeting.participants} participants
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Meetings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-black">Recent Meetings</h2>
            </div>
            <div className="space-y-4">
              {recentMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <h3 className="font-bold text-black">{meeting.title}</h3>
                  <p className="text-sm text-gray-600">{meeting.date}</p>
                  <p className="text-sm text-gray-600">{meeting.duration}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard