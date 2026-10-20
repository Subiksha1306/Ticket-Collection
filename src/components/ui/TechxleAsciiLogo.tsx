'use client';
import React, { useId } from 'react';
import logoData from './techxle-ascii-data.json';

export interface TechxleAsciiLogoProps {
  variant?: 'emblem' | 'full';
  className?: string;
  opacity?: number;
  color?: string;
  fadeDirection?: 'left' | 'right' | 'both' | 'radial' | 'none';
  showAsciiText?: boolean;
  showAsciiValues?: boolean;
  renderMode?: 'hybrid' | 'halftone' | 'ascii';
}

export default function TechxleAsciiLogo({
  variant = 'emblem',
  className = '',
  opacity = 1,
  color = 'currentColor',
  fadeDirection = 'left',
  showAsciiText = true,
  showAsciiValues = true,
  renderMode = 'hybrid',
}: TechxleAsciiLogoProps) {
  const rawId = useId();
  const maskId = `techxle_mask_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const isEmblem = variant === 'emblem';
  const viewBox = isEmblem ? logoData.emblem.viewBox : logoData.full.viewBox;

  // Mask CSS for HTML elements (pre tag)
  const getHtmlMaskStyle = (): React.CSSProperties => {
    if (fadeDirection === 'left') {
      const grad = 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.15) 88%, rgba(0,0,0,0) 100%)';
      return {
        maskImage: grad,
        WebkitMaskImage: grad,
      };
    }
    if (fadeDirection === 'right') {
      const grad = 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.15) 88%, rgba(0,0,0,0) 100%)';
      return {
        maskImage: grad,
        WebkitMaskImage: grad,
      };
    }
    return {};
  };

  const asciiString = isEmblem ? logoData.asciiArt : logoData.asciiFullArt;

  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* 1. Vector Diamond Halftone SVG */}
      {(renderMode === 'hybrid' || renderMode === 'halftone') && (
        <svg
          viewBox={viewBox}
          fill={color}
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {fadeDirection === 'left' && (
              <linearGradient id={`${maskId}_grad`} x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="40%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#ffffff" stopOpacity="0.65" />
                <stop offset="85%" stopColor="#ffffff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            )}

            {fadeDirection === 'right' && (
              <linearGradient id={`${maskId}_grad`} x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="40%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#ffffff" stopOpacity="0.65" />
                <stop offset="85%" stopColor="#ffffff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            )}

            {fadeDirection === 'both' && (
              <linearGradient id={`${maskId}_grad`} x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="18%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="82%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            )}

            {fadeDirection === 'radial' && (
              <radialGradient id={`${maskId}_grad`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="60%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="85%" stopColor="#ffffff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            )}

            {fadeDirection !== 'none' && (
              <mask id={`${maskId}_mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                <rect width="100%" height="100%" fill={`url(#${maskId}_grad)`} />
              </mask>
            )}
          </defs>

          <g mask={fadeDirection !== 'none' ? `url(#${maskId}_mask)` : undefined}>
            {isEmblem ? (
              logoData.emblem.tiers.map((tier, idx) => (
                <path key={idx} d={tier.path} opacity={tier.op} />
              ))
            ) : (
              <path d={logoData.full.path} opacity={0.9} />
            )}
          </g>
        </svg>
      )}

      {/* 2. Authentic Monospace ASCII Text Layer */}
      {(renderMode === 'hybrid' || renderMode === 'ascii') && (
        <div
          className={`absolute inset-0 flex items-center justify-center font-mono leading-[1.05] tracking-[0.1em] text-[8px] sm:text-[10px] md:text-[11px] font-bold overflow-hidden select-none ${
            renderMode === 'hybrid' ? 'opacity-35 mix-blend-multiply dark:mix-blend-screen' : 'opacity-90'
          }`}
          style={getHtmlMaskStyle()}
        >
          <pre className="whitespace-pre font-mono m-0 p-0 text-current scale-[0.9] sm:scale-100 origin-center">
            {asciiString}
          </pre>
        </div>
      )}

      {/* 3. Real ASCII Character Values & Metadata Badge */}
      {showAsciiValues && (
        <div className="absolute -bottom-6 right-2 sm:right-6 font-mono text-[9px] sm:text-[10px] tracking-wider uppercase opacity-75 select-none text-right flex flex-col gap-0.5">
          <div className="flex items-center gap-2 justify-end">
            <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-bold">
              ASCII_VAL
            </span>
            <span className="font-semibold text-current opacity-90">
              [84, 101, 99, 104, 120, 108, 101]
            </span>
            <span className="opacity-60 font-mono">// "Techxle"</span>
          </div>
          <div className="text-[8px] sm:text-[9px] opacity-65 flex items-center gap-2 justify-end">
            <span>HEX: 0x54 0x65 0x63 0x68 0x78 0x6C 0x65</span>
            <span className="hidden md:inline">• MERGE_DITHER: 85%</span>
          </div>
        </div>
      )}

      {/* Optional Tag */}
      {showAsciiText && !showAsciiValues && (
        <div className="absolute bottom-2 right-4 text-[10px] font-mono tracking-widest uppercase opacity-40 select-none text-right">
          <div>TECHXLE ASCII MATRIX</div>
          <div className="text-[9px] opacity-70">VAL: [84, 101, 99, 104, 120, 108, 101]</div>
        </div>
      )}
    </div>
  );
}
