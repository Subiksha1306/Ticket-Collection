import React from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 relative">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'var(--glow)' }}
        aria-hidden="true"
      />
      <GlassCard className="max-w-md w-full p-8 text-center relative z-10 shadow-[0_20px_50px_rgba(44,66,110,0.12)]">
        <div className="w-16 h-16 rounded-[18px] bg-[#dfe7f5] text-[var(--primary)] flex items-center justify-center mx-auto mb-5 shadow-xs">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Page not found</h2>
        <p className="text-sm text-[var(--text-2)] mb-6 leading-relaxed">
          The page or ticket you are looking for does not exist or may have been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Return to Home</Button>
          </Link>
          <Link href="/submissions">
            <Button variant="secondary">View Submissions</Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
