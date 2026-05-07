import React from "react";
import { Link } from "react-router";


const Header = () => {
  return (
        <>
             <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="text-xl sm:text-2xl font-bold text-black">SpeakSync</div>
          <div className="flex gap-2 sm:gap-4">
            <Link
              to="/signin"
              className="px-3 sm:px-6 py-2 text-sm sm:text-base text-black hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-3 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
        
        </>
  );
};

export default Header;