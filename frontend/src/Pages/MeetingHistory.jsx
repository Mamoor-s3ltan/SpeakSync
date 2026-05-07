import { Clock, Users, Video } from "lucide-react";

export default function MeetingHistory() {
  const meetings = [
    {
      id: 1,
      title: "Project Review Meeting",
      date: "May 1, 2026",
      time: "2:00 PM",
      duration: "45 min",
      participants: ["Ahmed", "Sara", "John"],
      language: "English ↔ Urdu",
    },
    {
      id: 2,
      title: "Weekly Team Standup",
      date: "Apr 30, 2026",
      time: "10:00 AM",
      duration: "30 min",
      participants: ["Ahmed", "Sara"],
      language: "English ↔ Urdu",
    },
    {
      id: 3,
      title: "Client Presentation",
      date: "Apr 28, 2026",
      time: "3:00 PM",
      duration: "60 min",
      participants: ["Ahmed", "Client Team"],
      language: "English ↔ Urdu",
    },
    {
      id: 4,
      title: "Design Review",
      date: "Apr 27, 2026",
      time: "11:00 AM",
      duration: "40 min",
      participants: ["Sara", "Design Team"],
      language: "English ↔ Urdu",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">Meeting History</h1>

        <div className="space-y-3 sm:space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-black mb-2">
                    {meeting.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {meeting.date} at {meeting.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {meeting.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {meeting.participants.length} participants
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                      {meeting.language}
                    </span>
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
