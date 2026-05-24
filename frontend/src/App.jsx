import React from "react";
import { Routes, Route } from "react-router";        // no BrowserRouter import
import { SettingsProvider } from "./context/SettingsContext";
import { ToastContainer} from 'react-toastify';

import Landing from "./Pages/Landing";
import SignIn from "./Pages/Signin";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import DashboardLayout from "./Pages/DashboardLayout";
import ScheduleMeeting from "./Pages/ScheduleMeeting";
import Settings from "./Pages/Settings";
import MeetingHistory from "./Pages/MeetingHistory";
import MeetingRoom from "./Pages/MeetingRoom";

export default function App() {
  return (
    <SettingsProvider>
      <div className="App">
         <ToastContainer position='bottom-right' autoClose={3000} theme="dark" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<Signup />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="schedule" element={<ScheduleMeeting />} />
            <Route path="history" element={<MeetingHistory />} />
          </Route>
          <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
        </Routes>
      </div>
    </SettingsProvider>
  );
}