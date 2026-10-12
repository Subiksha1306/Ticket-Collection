'use client';
import React from 'react';

export default function WinnersBanner({ text }: { text: string }) {
  if (!text) return null;

  // Strip emojis from the raw text
  const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\u{2B50}|\u{1F3C6}|\u{1F947}|\u{1F948}|\u{1F389}/gu, '').trim();
  
  // Parse out the structure assuming the common pattern used by the admin
  const regex = /^(?:(.*?(?:!|:))\s*)?(.*?)\s*Winner:\s*([\s\S]*?)(?:,?\s*Runner-up:\s*(.*)|$)/i;
  const match = cleanText.match(regex);

  let leadIn = "Congratulations to our ImpactX winners";
  let monthLabel = "Winner";
  let winner = "";
  let runnerUp = "";
  let isParsed = false;

  if (match && match[3]) {
    isParsed = true;
    leadIn = match[1] ? match[1].replace(/[:!]/g, '').trim() : leadIn;
    monthLabel = match[2] ? `${match[2].trim()} winner` : 'Winner';
    winner = match[3].trim();
    runnerUp = match[4] ? match[4].trim() : '';
  } else {
    winner = cleanText;
  }

  const Dot = () => <span className="text-white/40 mx-2.5 font-bold select-none">·</span>;

  const ItemContent = () => (
    <div className="flex items-center whitespace-nowrap text-xs sm:text-sm">
      {isParsed ? (
        <>
          {leadIn && <span className="font-normal text-white/85">{leadIn}</span>}
          {leadIn && <Dot />}
          <span className="font-normal text-white/85">{monthLabel}</span>
          <span className="font-bold text-white ml-1.5">{winner}</span>
          {runnerUp && (
            <>
              <Dot />
              <span className="font-normal text-white/85">Runner-up</span>
              <span className="font-bold text-white ml-1.5">{runnerUp}</span>
            </>
          )}
        </>
      ) : (
        <span className="font-medium text-white tracking-wide">{winner}</span>
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
        className="w-full rounded-full py-2.5 sm:py-3 px-6 overflow-hidden flex items-center relative group backdrop-blur-[16px]"
        style={{
          background: 'rgba(36, 54, 94, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 6px 20px rgba(36, 54, 94, 0.25)',
        }}
        role="region"
        aria-label="ImpactX winners announcement"
      >
        <div 
          className="w-full flex items-center overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)',
            maskImage: 'linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)',
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
