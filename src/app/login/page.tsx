import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginFormCard from '@/components/LoginFormCard';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden bg-[#c9d4e2] dark:bg-[#070b14] transition-colors duration-500">
      {/* Layer 1: Atmospheric Misty Landscape Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#b8c8dc] via-[#c5d3e4] to-[#a8b9cd] dark:from-[#0b1220] dark:via-[#080d17] dark:to-[#04070d]"
        aria-hidden="true"
      />

      {/* Layer 2: Misty Morning Fog Radial Gradients */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-70 dark:opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.7), transparent 60%),
            radial-gradient(circle at 10% 40%, rgba(180, 200, 225, 0.6), transparent 50%),
            radial-gradient(circle at 85% 60%, rgba(190, 210, 235, 0.5), transparent 55%),
            radial-gradient(circle at 50% 90%, rgba(140, 165, 195, 0.5), transparent 60%)
          `
        }}
        aria-hidden="true"
      />

      {/* Layer 3: Subtle Distant Mountain & Pine Silhouettes matching the moody misty forest landscape */}
      <div className="absolute inset-x-0 bottom-0 h-[45vh] pointer-events-none z-0 opacity-25 dark:opacity-20 select-none overflow-hidden" aria-hidden="true">
        <svg 
          viewBox="0 0 1440 320" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover text-slate-600 dark:text-slate-400"
          preserveAspectRatio="none"
        >
          {/* Far Ridge */}
          <path 
            d="M0 160L80 145C160 130 320 100 480 120C640 140 800 210 960 215C1120 220 1280 160 1360 130L1440 100V320H1360C1280 320 1120 320 960 320C800 320 640 320 480 320C320 320 160 320 80 320H0V160Z" 
            fill="currentColor" 
            opacity="0.35"
          />
          {/* Mid Ridge */}
          <path 
            d="M0 220L60 205C120 190 240 160 360 175C480 190 600 250 720 255C840 260 960 210 1080 190C1200 170 1320 180 1380 185L1440 190V320H0V220Z" 
            fill="currentColor" 
            opacity="0.5"
          />
          {/* Near Pine Silhouette Wave */}
          <path 
            d="M0 270C120 260 240 240 360 250C480 260 600 290 720 295C840 300 960 270 1080 265C1200 260 1320 270 1440 275V320H0V270Z" 
            fill="currentColor" 
            opacity="0.75"
          />
        </svg>
      </div>

      {/* Layer 4: Floating Atmospheric Mist Sheet */}
      <div 
        className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#a8b9cd]/80 via-[#c5d3e4]/40 to-transparent dark:from-[#04070d]/90 dark:via-[#080d17]/50 dark:to-transparent pointer-events-none z-0 backdrop-blur-[2px]" 
        aria-hidden="true"
      />

      {/* Layer 5: The Center Floating Acrylic Login Card */}
      <div className="relative z-10 w-full max-w-5xl my-auto">
        <LoginFormCard />
      </div>
    </div>
  );
}
