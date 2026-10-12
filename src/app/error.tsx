'use client';

import React, { useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 relative">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'var(--glow)' }}
        aria-hidden="true"
      />
      <GlassCard className="max-w-md w-full p-8 text-center relative z-10 shadow-[0_20px_50px_rgba(44,66,110,0.12)]">
        <div className="w-16 h-16 rounded-[18px] bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-xs border border-rose-200/60">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--text)] mb-2">Something went wrong</h2>
        <p className="text-sm text-[var(--text-2)] mb-6 leading-relaxed">
          An unexpected error occurred while loading this page. Please try reloading or check back shortly.
        </p>
        {error?.digest && (
          <p className="text-[11px] text-[var(--text-3)] mb-6 font-mono bg-white/50 py-1.5 px-3 rounded-full inline-block">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <a href="/">
            <Button variant="secondary">Go to Home</Button>
          </a>
        </div>
      </GlassCard>
    </div>
  );
}
