import React, { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import { Link } from 'react-router'
import { Mic, Globe, Shield, Zap, ArrowRight, Play } from "lucide-react";
import Footer from '../components/Footer';

/* ── useInView hook ── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.12, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* ── Animated counter ── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 28);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Mic Orb ── */
function MicOrb() {
  return (
    <div className="relative flex items-center justify-center w-52 h-52 mx-auto my-8 sm:my-0">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${i * 52}px`,
            height: `${i * 52}px`,
            border: `1px solid rgba(96,165,250,${0.4 - i * 0.08})`,
            animation: `ping-slow ${1.4 + i * 0.55}s ease-out infinite`,
            animationDelay: `${i * 0.25}s`,
          }}
        />
      ))}
      {/* Glow */}
      <div className="absolute w-24 h-24 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)', filter: 'blur(8px)' }} />
      {/* Core */}
      <div className="relative z-10 w-22 h-22 w-[88px] h-[88px] rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          boxShadow: '0 0 40px rgba(59,130,246,0.5), 0 20px 60px rgba(29,78,216,0.4)',
          animation: 'float 3.5s ease-in-out infinite',
        }}>
        <Mic className="w-10 h-10 text-white" />
      </div>
      {/* Waveform */}
      <div className="absolute bottom-2 flex items-end gap-0.5" style={{ height: 28 }}>
        {[3, 7, 12, 9, 16, 11, 6, 14, 8, 4, 10, 5].map((h, i) => (
          <div key={i} className="w-1 rounded-full"
            style={{
              height: h,
              background: 'rgba(96,165,250,0.7)',
              animation: `wave-bar 0.9s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
      {/* Language pills */}
      {[
        { label: '🇬🇧 EN', top: '-8px', right: '-16px', delay: '0s' },
        { label: '🇵🇰 UR', bottom: '8px', left: '-20px', delay: '1.5s' },
      ].map(({ label, top, right, bottom, left, delay }) => (
        <div key={label}
          className="absolute px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{
            top, right, bottom, left,
            background: 'rgba(30,64,175,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(96,165,250,0.4)',
            animation: `float 4s ease-in-out infinite`,
            animationDelay: delay,
            boxShadow: '0 4px 12px rgba(30,64,175,0.3)',
          }}>
          {label}
        </div>
      ))}
    </div>
  );
}

/* ── Pipeline step ── */
function PipelineStep({ label, delay }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref}
      className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base
        text-blue-700 border border-blue-200 transition-all duration-700 ease-out"
      style={{
        background: 'rgba(239,246,255,0.8)',
        backdropFilter: 'blur(8px)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: `${delay}ms`,
        boxShadow: inView ? '0 4px 20px rgba(59,130,246,0.12)' : 'none',
      }}>
      {label}
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({ icon: Icon, gradient, title, desc, delay, accentColor }) {
  const [ref, inView] = useInView();
  const [hovered, setHovered] = useState(false);
  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden bg-white rounded-2xl p-8 cursor-default
        transition-all duration-700 ease-out border border-gray-100"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView
          ? hovered ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)'
          : 'translateY(40px)',
        transitionDelay: `${delay}ms`,
        boxShadow: hovered
          ? `0 24px 60px ${accentColor}22, 0 0 0 1px ${accentColor}15`
          : '0 2px 20px rgba(0,0,0,0.06)',
      }}>
      {/* Top gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl transition-all duration-500"
        style={{ background: gradient, opacity: hovered ? 1 : 0.4 }} />
      {/* Icon bg glow */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-0 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${accentColor}20, transparent)`, opacity: hovered ? 1 : 0 }} />

      <div className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-5
        transition-transform duration-300"
        style={{
          background: gradient,
          transform: hovered ? 'rotate(8deg) scale(1.1)' : 'none',
          boxShadow: hovered ? `0 8px 20px ${accentColor}40` : 'none',
        }}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Step Card ── */
function StepCard({ num, title, desc, delay, color }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className="text-center transition-all duration-700 ease-out"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
      }}>
      <div className="relative w-16 h-16 mx-auto mb-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white
          transition-all duration-300 hover:scale-110 hover:-rotate-3"
          style={{
            background: color,
            boxShadow: `0 8px 24px ${color}50`,
          }}>
          {num}
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400
          flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

const Landing = () => {
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);

  const [featRef, featInView] = useInView();
  const [howRef, howInView] = useInView();
  const [statsRef, statsInView] = useInView();
  const [pipeRef, pipeInView] = useInView();

  return (
    <>
      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes ping-slow {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); }
        }
        @keyframes wave-bar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1.5); }
        }
        @keyframes slide-up {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fade-in {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes mesh-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(30px,-20px) scale(1.05); }
          66%     { transform: translate(-20px,15px) scale(0.97); }
        }
        @keyframes pill-drift {
          0%,100% { transform: translateX(0) translateY(0); }
          33% { transform: translateX(8px) translateY(-6px); }
          66% { transform: translateX(-5px) translateY(4px); }
        }
        @keyframes arrow-pulse {
          0%,100% { transform: translateX(0); opacity:0.5; }
          50%      { transform: translateX(5px); opacity:1; }
        }
        .arrow-animated { animation: arrow-pulse 1.4s ease-in-out infinite; }
        .hero-tag  { animation: slide-up 0.6s ease-out 0.05s both; }
        .hero-h1   { animation: slide-up 0.7s ease-out 0.15s both; }
        .hero-sub  { animation: slide-up 0.7s ease-out 0.25s both; }
        .hero-btns { animation: slide-up 0.7s ease-out 0.35s both; }
        .hero-orb  { animation: fade-in  0.9s ease-out 0.2s  both; }
      `}</style>

      <div className="min-h-screen w-full overflow-x-hidden bg-white">
        <Header />

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Gradient mesh background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)',
                animation: 'mesh-drift 10s ease-in-out infinite',
              }} />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)',
                animation: 'mesh-drift 13s ease-in-out infinite reverse',
              }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px]"
              style={{
                background: 'radial-gradient(ellipse, rgba(219,234,254,0.5) 0%, transparent 60%)',
              }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-28">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Text side */}
              <div className="flex-1 text-center lg:text-left">
                <div className="hero-tag inline-flex items-center gap-2 bg-blue-50/80 border border-blue-200
                  text-blue-600 px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  AI-Powered Real-time Translation
                  <span className="text-blue-300">•</span>
                  <span className="text-blue-500">Live</span>
                </div>

                <h1 className="hero-h1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900
                  mb-5 leading-[1.1] tracking-tight">
                  Speak Without<br />
                  <span className="relative">
                    <span style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Language Barriers
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
                      <path d="M0 6 Q75 0 150 5 Q225 10 300 4" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
                    </svg>
                  </span>
                </h1>

                <p className="hero-sub text-lg sm:text-xl text-gray-500 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Real-time AI voice translation between{' '}
                  <span className="font-semibold text-gray-700">English</span> and{' '}
                  <span className="font-semibold text-gray-700">Urdu</span> — for seamless multilingual meetings.
                </p>

                <div className="hero-btns flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Link
                    to="/signup"
                    className="group px-7 sm:px-8 py-3.5 sm:py-4 text-white rounded-xl text-base sm:text-lg
                      font-semibold transition-all duration-300 hover:-translate-y-1
                      flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 16px 40px rgba(59,130,246,0.5)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.35)'}
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/signin"
                    className="group px-7 sm:px-8 py-3.5 sm:py-4 bg-white text-gray-700 rounded-xl text-base sm:text-lg
                      font-semibold border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600
                      transition-all duration-300 hover:-translate-y-1 hover:shadow-md
                      flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Join Meeting
                  </Link>
                </div>
              </div>

              {/* Orb side */}
              <div className="hero-orb flex-shrink-0">
                <MicOrb />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section ref={statsRef} className="relative py-10"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)' }}>
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 40%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 40%)'
          }} />
          <div className="relative max-w-4xl mx-auto px-4 grid grid-cols-3 gap-6 text-center text-white">
            {[
              { target: 2, suffix: 's', label: 'Translation Latency', icon: '⚡' },
              { target: 90, suffix: '%', label: 'Accuracy Rate', icon: '🎯' },
              { target: '-', suffix: '', label: 'Meetings Powered', icon: '🚀' },
            ].map(({ target, suffix, label, icon }) => (
              <div key={label}
                className="transition-all duration-700"
                style={{ opacity: statsInView ? 1 : 0, transform: statsInView ? 'none' : 'translateY(20px)' }}>
                <div className="text-3xl mb-1">{icon}</div>
                <div className="text-3xl sm:text-4xl font-extrabold mb-1">
                  <Counter target={target} suffix={suffix} />
                </div>
                <div className="text-blue-200 text-xs sm:text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-16 sm:py-28 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div ref={featRef} className="text-center mb-12 sm:mb-20 transition-all duration-700"
              style={{ opacity: featInView ? 1 : 0, transform: featInView ? 'none' : 'translateY(24px)' }}>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600
                px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                ✦ Core Features
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">Built for Seamless</h2>
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-4"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Communication
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Everything you need for barrier-free conversations</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <FeatureCard icon={Globe} delay={0} accentColor="#3b82f6"
                gradient="linear-gradient(135deg, #3b82f6, #1d4ed8)"
                title="Real-time Translation" desc="Instant translation between English and Urdu with natural voice output" />
              <FeatureCard icon={Mic} delay={100} accentColor="#10b981"
                gradient="linear-gradient(135deg, #10b981, #059669)"
                title="Live Captions" desc="Dual language captions displayed in real-time during conversations" />
              <FeatureCard icon={Zap} delay={200} accentColor="#8b5cf6"
                gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                title="Low Latency" desc="Less than 2 second delay for seamless, natural conversations" />
              <FeatureCard icon={Shield} delay={300} accentColor="#ef4444"
                gradient="linear-gradient(135deg, #ef4444, #dc2626)"
                title="Secure Meetings" desc="End-to-end encrypted meetings with privacy-first design" />
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-16 sm:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div ref={howRef} className="text-center mb-12 sm:mb-20 transition-all duration-700"
              style={{ opacity: howInView ? 1 : 0, transform: howInView ? 'none' : 'translateY(24px)' }}>
              <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-600
                px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                ✦ How It Works
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">Four Simple Steps</h2>
              <p className="text-gray-500 text-lg">To seamless multilingual conversations</p>
            </div>

            {/* Steps with connector line */}
            <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
              {/* Connector line (desktop) */}
              <div className="hidden lg:block absolute top-8 left-[calc(12.5%+8px)] right-[calc(12.5%+8px)] h-0.5"
                style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981, #f59e0b)' }} />

              <StepCard num="1" delay={0} color="linear-gradient(135deg, #3b82f6, #1d4ed8)"
                title="Join or Create" desc="Start instantly or schedule ahead with a shareable link" />
              <StepCard num="2" delay={120} color="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                title="Speak Naturally" desc="Talk in your preferred language — no setup required" />
              <StepCard num="3" delay={240} color="linear-gradient(135deg, #10b981, #059669)"
                title="AI Translates" desc="Our AI processes and converts speech in under 2 seconds" />
              <StepCard num="4" delay={360} color="linear-gradient(135deg, #f59e0b, #d97706)"
                title="They Understand" desc="Other users hear translated audio in their language" />
            </div>
          </div>
        </section>

        {/* ── Translation Pipeline ── */}
        <section className="py-16 sm:py-24 bg-gray-950">
          <div ref={pipeRef} className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 transition-all duration-700"
              style={{ opacity: pipeInView ? 1 : 0, transform: pipeInView ? 'none' : 'translateY(20px)' }}>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400
                px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                ✦ Under the Hood
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-3">Translation Pipeline</h2>
              <p className="text-gray-400">Real-time processing in milliseconds</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {['🎤 Speech', '⚙️ AI Processing', '🔍 Language Detection', '🌐 Translation', '🔊 Voice Output'].map((label, i) => (
                <React.Fragment key={label}>
                  <PipelineStep label={label} delay={i * 120} />
                  {i < 4 && (
                    <ArrowRight className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5 arrow-animated flex-shrink-0"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 sm:py-32 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="relative rounded-3xl overflow-hidden p-12 sm:p-16"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
                boxShadow: '0 40px 100px rgba(37,99,235,0.4)',
              }}>
              {/* Internal glow */}
              <div className="absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
              <div className="relative">
                <div className="text-5xl mb-6">🌐</div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
                  Ready to break language barriers?
                </h2>
                <p className="text-blue-200 mb-10 text-lg max-w-xl mx-auto">
                  Join thousands of users communicating without limits, every day.
                </p>
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white
                    text-blue-700 rounded-xl text-lg font-bold hover:bg-blue-50
                    transition-all duration-300 hover:-translate-y-1
                    shadow-xl hover:shadow-2xl"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
                </Link>
                <p className="text-blue-300 text-sm mt-5">No credit card required · Free to start</p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Landing;