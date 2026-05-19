import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Settings as SettingsIcon,
  Menu,
  X,
  Mic,
} from "lucide-react";

export default function DashboardLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard",          label: "Dashboard",        icon: LayoutDashboard, color: "from-blue-500 to-blue-700" },
    { path: "/dashboard/schedule", label: "Schedule Meeting",  icon: Calendar,        color: "from-violet-500 to-violet-700" },
    { path: "/dashboard/history",  label: "Meeting History",   icon: Clock,           color: "from-emerald-500 to-emerald-700" },
    { path: "/dashboard/settings", label: "Settings",          icon: SettingsIcon,    color: "from-amber-500 to-amber-700" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      <style>{`
        @keyframes sidebar-slide {
          from { opacity:0; transform:translateX(-12px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .nav-item { animation: sidebar-slide 0.4s ease-out both; }
        @keyframes mobile-fade { from{opacity:0} to{opacity:1} }
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); }
          50%     { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
        }
        .active-indicator { animation: pulse-ring 2s ease-in-out infinite; }
      `}</style>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 text-white rounded-xl shadow-lg
          transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: 'white', borderRight: '1px solid #f1f5f9', boxShadow: '4px 0 24px rgba(0,0,0,0.04)' }}>

        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center
              transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <svg viewBox="0 0 24 24" className="w-4.5 w-[18px] h-[18px] text-white" fill="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                SpeakSync
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-4">
            Main Menu
          </p>
          <ul className="space-y-1.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

              return (
                <li key={item.path} className="nav-item" style={{ animationDelay: `${idx * 60}ms` }}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'text-white shadow-lg'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${item.color.includes('blue') ? '#3b82f6, #1d4ed8' : item.color.includes('violet') ? '#8b5cf6, #7c3aed' : item.color.includes('emerald') ? '#10b981, #059669' : '#f59e0b, #d97706'})`,
                      boxShadow: `0 4px 14px ${item.color.includes('blue') ? 'rgba(59,130,246,0.35)' : item.color.includes('violet') ? 'rgba(139,92,246,0.35)' : item.color.includes('emerald') ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`,
                    } : {}}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    </div>
                    <span className="font-semibold text-sm flex-1">{item.label}</span>
                    {isActive && (
                      <div className="active-indicator w-1.5 h-1.5 rounded-full bg-white/70" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom info card */}
        <div className="p-4 border-t border-gray-100">
          <div className="relative overflow-hidden rounded-xl p-4"
            style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-blue-700">AI Active</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-blue-700 mb-0.5">English ↔ Urdu</p>
            <p className="text-[11px] text-blue-500">Real-time translation ready</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          style={{ animation: 'mobile-fade 0.2s ease-out' }}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}