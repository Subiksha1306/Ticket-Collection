'use client';
import React from 'react';
import { Trophy, Medal } from 'lucide-react';

export default function WinnersBanner({ text }: { text: string }) {
  if (!text) return null;

  // Strip emojis from the raw text
  const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\u{2B50}|\u{1F3C6}|\u{1F947}|\u{1F948}|\u{1F389}/gu, '').trim();
  
  // Parse out the structure assuming the common pattern used by the admin
  const regex = /^(?:(.*?(?:!|:))\s*)?(.*?)\s*Winner:\s*([\s\S]*?)(?:,?\s*Runner-up:\s*(.*)|$)/i;
  const match = cleanText.match(regex);

  let leadIn = "Congratulations to our ImpactX winners!";
  let monthLabel = "Winner";
  let winner = "";
  let runnerUp = "";
  let isParsed = false;

  if (match && match[3]) {
    isParsed = true;
    leadIn = match[1] ? match[1].trim() : leadIn;
    monthLabel = match[2] ? `${match[2].trim()} Winner` : 'Winner';
    winner = match[3].trim();
    runnerUp = match[4] ? match[4].trim() : '';
  } else {
    // If it doesn't match the standard format, just use the clean string
    winner = cleanText;
  }

  const Dot = () => <div className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.35)] shrink-0" />;

  const ItemContent = () => (
    <div className="flex items-center gap-3 sm:gap-4 whitespace-nowrap text-[13px] sm:text-[14px]">
      {isParsed ? (
        <>
          {leadIn && <span className="font-normal text-[rgba(255,255,255,0.65)]">{leadIn}</span>}
          {leadIn && <Dot />}
          <span className="font-normal text-[rgba(255,255,255,0.65)]">{monthLabel}</span>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-[16px] h-[16px] text-[#F5C451] shrink-0" />
            <span className="font-semibold text-white tracking-[0.01em]">{winner}</span>
          </div>
          {runnerUp && (
            <>
              <Dot />
              <span className="font-normal text-[rgba(255,255,255,0.65)]">Runner-up</span>
              <div className="flex items-center gap-1.5">
                <Medal className="w-[16px] h-[16px] text-[#C9D1DB] shrink-0" />
                <span className="font-semibold text-white tracking-[0.01em]">{runnerUp}</span>
              </div>
            </>
          )}
        </>
      ) : (
        <span className="font-semibold text-white tracking-[0.01em]">{winner}</span>
      )}
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes custom-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-custom-marquee {
          animation: custom-marquee 40s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-custom-marquee {
            animation: none !important;
            transform: translateX(0) !important;
          }
        }
      `}} />
      <div 
        className="w-full rounded-[12px] py-[10px] sm:py-[12px] overflow-hidden flex items-center relative group"
        style={{
          background: 'linear-gradient(90deg, #1b1f4b 0%, #2d2a7a 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 6px 20px rgba(30,27,90,0.25)',
        }}
        role="region"
        aria-label="ImpactX winners announcement"
      >
        <div 
          className="w-full flex items-center overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
            maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
          }}
        >
          <div className="flex w-max animate-custom-marquee group-hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:w-full motion-reduce:justify-center motion-reduce:overflow-hidden motion-reduce:text-ellipsis">
            <div className="pr-[48px] motion-reduce:pr-0 motion-reduce:truncate">
              <ItemContent />
            </div>
            <div className="pr-[48px] motion-reduce:hidden" aria-hidden="true">
              <ItemContent />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
