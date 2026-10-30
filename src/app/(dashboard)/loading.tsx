import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse w-full max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="pt-2 pb-1 space-y-2">
        <div className="h-8 w-56 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl" />
        <div className="h-4 w-80 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg" />
      </div>

      {/* Glass Panel Skeleton */}
      <div className="glass-panel p-6 sm:p-8 min-h-[360px] flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3 opacity-60" />
        <span className="text-xs font-medium text-[var(--text-3)] tracking-wide">Loading...</span>
      </div>
    </div>
  );
}
