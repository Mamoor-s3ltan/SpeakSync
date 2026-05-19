import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "../config/db.conn";

export default function SignIn() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Business logic unchanged ──
  const handleSubmit = async (formData) => {
    const email = formData.get("email");
    const password = formData.get("password");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (data.user) {
      navigate("/dashboard");
      console.log(data.session);
    } else {
      alert("Wrong password or user");
    }
  };

  return (
    <>
      <style>{`
        @keyframes mesh-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px,-15px) scale(1.06); }
        }
        @keyframes slide-up {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes float {
          0%,100% { transform:translateY(0); }
          50% { transform:translateY(-12px); }
        }
        .card-enter { animation: slide-up 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .input-field {
          width: 100%;
          padding: 12px 12px 12px 44px;
          background: rgba(249,250,251,0.8);
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          color: #111827;
          outline: none;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }
        .input-field:focus {
          background: white;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.12);
        }
        .input-field::placeholder { color: #9ca3af; }
      `}</style>

      <div className="min-h-screen flex">
        {/* ── Left Brand Panel ── */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
          style={{ background: 'linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 100%)' }}>
          {/* BG decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, white, transparent)', animation: 'mesh-drift 10s ease-in-out infinite' }} />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #93c5fd, transparent)', animation: 'mesh-drift 14s ease-in-out infinite reverse' }} />
          </div>

          {/* Logo */}
          <div className="relative">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">SpeakSync</span>
            </Link>
          </div>

          {/* Center content */}
          <div className="relative">
            {/* Mic orb */}
            <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20
              flex items-center justify-center mb-8 shadow-2xl" style={{ animation: 'float 4s ease-in-out infinite' }}>
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
              </svg>
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Break Every<br />Language Barrier
            </h2>
            <p className="text-blue-200 text-lg mb-8 leading-relaxed">
              Real-time AI translation between English and Urdu — making every conversation count.
            </p>

            {/* Feature pills */}
            {['⚡ Under 2s latency', '🎯 90% accuracy', '🔒 End-to-end encrypted'].map(f => (
              <div key={f} className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-blue-100 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
          <br />
          <br />
        </div>

        {/* ── Right Form Panel ── */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12 bg-gray-50 relative overflow-hidden">
          {/* Subtle BG */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(219,234,254,0.8), transparent)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(199,210,254,0.6), transparent)' }} />
          </div>

          <div className="w-full max-w-md card-enter relative z-10">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold text-gray-900">SpeakSync</span>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome back</h1>
              <p className="text-gray-500">Sign in to your account to continue</p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl p-7 shadow-xl border border-gray-100">
              <form action={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400
                      transition-colors duration-200 group-focus-within:text-blue-500" />
                    <input type="email" name="email" placeholder="you@example.com"
                      className="input-field" required />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400
                      transition-colors duration-200 group-focus-within:text-blue-500" />
                    <input type={showPass ? "text" : "password"} name="password"
                      placeholder="Enter your password"
                      className="input-field" style={{ paddingRight: '44px' }} required />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                        transition-colors duration-200 p-0.5">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="group w-full py-3.5 rounded-xl font-semibold text-white
                    transition-all duration-300 hover:-translate-y-0.5
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0
                    flex items-center justify-center gap-2"
                  style={{
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(59,130,246,0.35)',
                  }}>
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">OR CONTINUE WITH</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Google */}
                <button type="button"
                  className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl
                    font-medium hover:bg-gray-50 hover:border-gray-300 hover:shadow-md
                    transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-6">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
                  Sign up free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}