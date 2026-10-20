'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import TechxleAsciiLogo from '@/components/ui/TechxleAsciiLogo';

export default function LoginFormCard() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('impactx_theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (_) {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('impactx_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (_) {}
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    await signIn('azure-ad', { callbackUrl: '/' });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Corporate policy enforces Microsoft Azure AD SSO
    await signIn('azure-ad', { callbackUrl: '/' });
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Top Bar with Theme Toggle */}
      <div className="flex justify-between items-center mb-6 px-3">
        <div className="inline-flex items-center gap-2">
          <span className="font-papillon text-[28px] tracking-[0.04em] text-slate-800 dark:text-slate-100 select-none">
            Impact<span className="text-[#3d5a8c] dark:text-sky-400">X</span>
          </span>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 ml-2 py-0.5 px-2 rounded-full bg-slate-900/10 dark:bg-white/10 backdrop-blur-md">
            v2.4
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/80 backdrop-blur-md border border-white/80 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all active:scale-95"
          title="Toggle Day / Night mode"
        >
          {theme === 'dark' ? (
            <>
              <svg className="w-3.5 h-3.5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Day</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>Night</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Acrylic Glass Card matching reference */}
      <div className="relative rounded-[32px] overflow-hidden bg-white/92 dark:bg-[#0c1322]/90 backdrop-blur-3xl border border-white/90 dark:border-white/10 shadow-[0_30px_90px_rgba(15,23,42,0.25),0_1px_2px_rgba(255,255,255,0.9)_inset] transition-all duration-300 flex flex-col lg:flex-row min-h-[580px]">
        {/* Specular Edge Highlights */}
        <div className="absolute inset-0 pointer-events-none rounded-[32px] ring-1 ring-inset ring-white/60 dark:ring-white/10 z-30" />

        {/* LEFT COLUMN: Clean Sign-In Form */}
        <div className="w-full lg:w-[48%] p-8 sm:p-12 flex flex-col justify-between relative z-20">
          <div>
            {/* Sparkle / Asterisk Badge */}
            <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mb-6 shadow-md shadow-slate-900/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>

            {/* Typography */}
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Sign In
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Welcome back to ImpactX. Please enter your credentials or authenticate via Microsoft SSO.
            </p>

            {/* Microsoft SSO Primary Button */}
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="w-full group flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-white font-semibold text-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Microsoft Official Quad Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <rect x="1" y="1" width="10" height="10" fill="#f25022" />
                <rect x="13" y="1" width="10" height="10" fill="#7fba00" />
                <rect x="1" y="13" width="10" height="10" fill="#00a4ef" />
                <rect x="13" y="13" width="10" height="10" fill="#ffb900" />
              </svg>
              <span>{loading ? 'Connecting to Microsoft...' : 'Continue with Microsoft'}</span>
            </button>

            {/* Subtle Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                or sign in with email
              </span>
              <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
            </div>

            {/* Form Fields */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@techxle.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3d5a8c]/30 focus:border-[#3d5a8c] transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3d5a8c]/30 focus:border-[#3d5a8c] transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#3d5a8c] focus:ring-[#3d5a8c]/30 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <span>Remember for 30 days</span>
                </label>
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  className="font-medium text-[#3d5a8c] dark:text-sky-400 hover:underline"
                >
                  Need help?
                </button>
              </div>

              {/* Submit Pill Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Security badge at bottom */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
              Authorized Techxle personnel only
            </span>
            <span className="font-mono text-[10px] opacity-75">TX-AZURE-SSO</span>
          </div>
        </div>

        {/* RIGHT COLUMN: The Techxle Halftone / ASCII Dissolve Canvas */}
        <div className="w-full lg:w-[52%] relative min-h-[360px] lg:min-h-full overflow-hidden bg-gradient-to-br from-slate-100/50 via-slate-50/20 to-white/10 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-transparent flex items-center justify-center p-6 lg:p-10 border-t lg:border-t-0 lg:border-l border-slate-100/80 dark:border-slate-800/50">
          {/* Subtle Ambient Radial Glow on the Halftone Side */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-[#3d5a8c]/10 to-purple-500/10 blur-3xl pointer-events-none" />

          {/* Techxle ASCII / Halftone Logo */}
          <div className="relative w-full h-full flex items-center justify-center">
            <TechxleAsciiLogo
              variant="emblem"
              fadeDirection="left"
              className="w-[125%] max-w-[540px] -right-8 translate-x-4 text-slate-800 dark:text-sky-200 drop-shadow-sm transition-all duration-500"
              opacity={0.88}
              showAsciiText={true}
            />
          </div>

          {/* Decorative Corner Technical ASCII Tags matching high-tech aesthetic */}
          <div className="absolute top-6 right-6 font-mono text-[10px] text-slate-400 dark:text-slate-500 tracking-wider text-right select-none pointer-events-none">
            <div className="font-bold text-slate-600 dark:text-slate-300">TECHXLE // ID: TX-8042</div>
            <div className="text-[9px] opacity-60">ASCII DITHER MERGE • 90×80 MATRIX</div>
          </div>

          <div className="absolute bottom-6 left-6 font-mono text-[9px] text-slate-400 dark:text-slate-500 tracking-widest select-none pointer-events-none">
            <span>[ SYSTEM ONLINE ]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
