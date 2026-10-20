'use client';
import React from 'react';

export default function FrsionCanvasDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0" aria-hidden="true">
      {/* 1. Top-Left Glitter/Chrome Orb & Scatter Beads */}
      <div className="absolute -top-4 left-6 sm:left-12 flex items-center gap-3 opacity-90">
        <div className="orb-chrome-glitter w-11 h-11 sm:w-14 sm:h-14 shadow-xl" />
        <div className="hidden sm:grid grid-cols-4 gap-1.5 pt-4">
          <div className="orb-bead-silver w-2 h-2 opacity-80" />
          <div className="orb-bead-silver w-1.5 h-1.5 opacity-60 mt-1" />
          <div className="orb-bead-silver w-2 h-2 opacity-90" />
          <div className="orb-bead-silver w-1 h-1 opacity-50" />
          <div className="orb-bead-silver w-1.5 h-1.5 opacity-70" />
          <div className="orb-bead-silver w-2 h-2 opacity-85 mt-0.5" />
          <div className="orb-bead-silver w-1 h-1 opacity-40" />
          <div className="orb-bead-silver w-1.5 h-1.5 opacity-75" />
        </div>
      </div>

      {/* 2. Top-Right Glittering Disco Ball */}
      <div className="absolute top-4 right-8 sm:right-16 opacity-95">
        <div className="orb-chrome-glitter w-14 h-14 sm:w-18 sm:h-18 relative shadow-2xl">
          {/* Sparkle highlights */}
          <div className="absolute top-2 left-3 w-3 h-3 bg-white rounded-full blur-[1px] opacity-90" />
          <div className="absolute bottom-3 right-4 w-1.5 h-1.5 bg-white rounded-full blur-[0.5px] opacity-75" />
        </div>
      </div>

      {/* 3. Bottom-Left Translucent Twisted Purple Glass Squiggle / Ribbon */}
      <div className="absolute bottom-14 left-6 sm:left-12 flex items-center gap-2">
        <svg className="w-16 h-12 text-purple-400/80 drop-shadow-[0_8px_16px_rgba(168,85,247,0.35)]" viewBox="0 0 70 50" fill="none">
          <path
            d="M 10 25 C 10 10, 35 10, 35 25 C 35 40, 60 40, 60 25"
            stroke="url(#purpleGlassGrad)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="purpleGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
        <div className="orb-pearl-purple w-4 h-4 shadow-md" />
      </div>

      {/* 4. Bottom-Center Large Ultra-Realistic Liquid Glass Refractive Marble */}
      <div className="absolute bottom-6 left-1/3 -translate-x-1/2 opacity-95">
        <div className="orb-liquid-glass w-16 h-16 sm:w-20 sm:h-20 shadow-2xl relative">
          <div className="absolute top-3 left-4 w-4 h-2.5 bg-white/90 rounded-full rotate-[-25deg] blur-[0.5px]" />
          <div className="absolute bottom-3 right-4 w-2 h-2 bg-white/50 rounded-full blur-[1px]" />
        </div>
      </div>

      {/* 5. Right Dock Indicator Pill (Tactile 4-Dot Dock) */}
      <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-2 p-3 rounded-full bg-white/40 dark:bg-white/5 border border-white/70 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400/70" />
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400/70" />
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400/70" />
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
      </div>

      {/* 6. Floating Ambient Scatter Pearls near bottom right */}
      <div className="hidden sm:flex absolute bottom-8 right-24 items-center gap-2">
        <div className="orb-bead-silver w-2.5 h-2.5" />
        <div className="orb-bead-silver w-1.5 h-1.5 opacity-60" />
        <div className="orb-bead-silver w-2 h-2 opacity-80" />
      </div>
    </div>
  );
}
