import React from 'react'

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-gray-950 pt-16 pb-8">
      {/* Background mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg
                flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                Speak<span className="text-blue-400">Sync</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Breaking language barriers with AI-powered real-time translation between English and Urdu.
            </p>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg w-fit">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-blue-300 font-medium">Live Translation Active</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest text-blue-400">Product</h4>
            <ul className="space-y-3">
              {['About SpeakSync', 'Features', 'Pricing'].map(item => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200
                    text-sm group flex items-center gap-2">
                    <span className="w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-4 inline-block" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest text-blue-400">Resources</h4>
            <ul className="space-y-3">
              {['Documentation', 'GitHub', 'Contact'].map(item => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200
                    text-sm group flex items-center gap-2">
                    <span className="w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-4 inline-block" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest text-blue-400">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service'].map(item => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200
                    text-sm group flex items-center gap-2">
                    <span className="w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-4 inline-block" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2026 SpeakSync. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Made with</span>
            <span className="text-red-400 animate-pulse text-base">♥</span>
            <span>for language inclusivity</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;