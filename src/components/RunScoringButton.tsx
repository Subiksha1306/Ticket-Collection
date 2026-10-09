'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RunScoringButton({ monthParam }: { monthParam: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleScore = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/score-month?month=${monthParam}`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        router.refresh();
      } else {
        alert(data.error || 'Failed to run scoring');
      }
    } catch (err) {
      alert('An error occurred while scoring');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleScore} 
      disabled={loading}
      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#5B45FF] border border-indigo-200 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-[#5B45FF] border-t-transparent rounded-full animate-spin"></div>
          Scoring...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
          Run AI Scoring
        </>
      )}
    </button>
  );
}
