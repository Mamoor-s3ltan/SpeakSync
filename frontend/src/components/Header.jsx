import React, { useEffect, useState } from "react";
import { Link } from "react-router";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @keyframes logo-glow {
          0%,100% { box-shadow: 0 0 12px rgba(59,130,246,0.4); }
          50%      { box-shadow: 0 0 24px rgba(59,130,246,0.7); }
        }
        .logo-icon { animation: logo-glow 3s ease-in-out infinite; }
        .nav-link-underline {
          position: relative;
        }
        .nav-link-underline::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 2px;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        .nav-link-underline:hover::after { width: 80%; }
        .header-enter {
          animation: header-slide 0.5s ease-out both;
        }
        @keyframes header-slide {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav
        className="sticky top-0 z-50 transition-all duration-500 header-enter"
        style={{
          background: scrolled
            ? 'rgba(255,255,255,0.85)'
            : 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(229,231,235,0.8)' : '1px solid rgba(229,231,235,0.3)',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="logo-icon w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl
              flex items-center justify-center transition-transform duration-300
              group-hover:rotate-6 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 transition-colors duration-200 group-hover:text-blue-600">
              Speak<span className="text-blue-600 group-hover:text-gray-900 transition-colors duration-200">Sync</span>
            </span>
          </Link>

          {/* Nav */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/signin"
              className="nav-link-underline px-3 sm:px-5 py-2 text-sm sm:text-base text-gray-600 font-medium
                hover:text-blue-600 transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="group relative px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold
                text-white rounded-xl overflow-hidden transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-400/40"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
              <span className="relative z-10">Sign Up</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0
                group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;