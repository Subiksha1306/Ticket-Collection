'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Award, Calendar, Layers } from 'lucide-react';

interface ExportReportMenuProps {
  monthParam?: string;
}

export default function ExportReportMenu({ monthParam }: ExportReportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  let monthLabel = 'All Time';
  if (monthParam && monthParam.includes('-')) {
    const [y, m] = monthParam.split('-');
    monthLabel = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        title="Export Monthly or All-Time HTML Reports"
      >
        <Download className="w-4 h-4" />
        <span>Export Reports</span>
        <ChevronDown className="w-4 h-4 ml-0.5 opacity-80" />
      </button>

      {isOpen && (
        <div className="export-menu-popup absolute right-0 top-[calc(100%+8px)] w-88 bg-white dark:bg-[#0c1524] border border-gray-100 dark:border-white/15 rounded-xl shadow-[0_14px_45px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.7)] z-50 p-2.5 font-sans">
          {monthParam ? (
            <>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/60 rounded-md mb-1.5">
                Selected: {monthLabel}
              </div>

              <a
                href={`/api/export?type=activity&month=${monthParam}`}
                download
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-indigo-50/60 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-blue-50 text-[#3157d5] group-hover:bg-[#3157d5] group-hover:text-white transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 group-hover:text-[#3157d5]">
                    {monthLabel} Activity Report
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    Tickets grouped by user with prominent scores
                  </div>
                </div>
              </a>

              <a
                href={`/api/export?type=awards&month=${monthParam}`}
                download
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-purple-50/60 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-purple-50 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 group-hover:text-[#7c3aed]">
                    {monthLabel} Awards Dashboard
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    🥇 Winner, 🥈 Runner-up, rubric &amp; ranked scores
                  </div>
                </div>
              </a>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  All Time
                </div>
                <a
                  href="/api/export?type=activity&all=true"
                  download
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-gray-500" />
                  <span>All-Time Activity Report (All Submissions)</span>
                </a>
                <a
                  href="/api/export?type=awards&all=true"
                  download
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-purple-500" />
                  <span>All-Time Awards Dashboard (All Ranked)</span>
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-50 rounded-md mb-1.5">
                All-Time Reports (All Submissions)
              </div>

              <a
                href="/api/export?type=activity&all=true"
                download
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-indigo-50/60 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-blue-50 text-[#3157d5] group-hover:bg-[#3157d5] group-hover:text-white transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 group-hover:text-[#3157d5]">
                    All-Time ImpactX Activity Report
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    Complete collection of all 65 tickets across all months
                  </div>
                </div>
              </a>

              <a
                href="/api/export?type=awards&all=true"
                download
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-purple-50/60 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-purple-50 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 group-hover:text-[#7c3aed]">
                    All-Time I2I Awards Dashboard
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    Overall ranked evaluations with score rings &amp; rubric bars
                  </div>
                </div>
              </a>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Export by Specific Month
                </div>
                <div className="grid grid-cols-3 gap-1 px-1 py-1">
                  <a
                    href="/api/export?type=activity&month=2026-08"
                    download
                    onClick={() => setIsOpen(false)}
                    className="text-center py-1.5 px-2 rounded bg-gray-50 hover:bg-indigo-50 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    August
                  </a>
                  <a
                    href="/api/export?type=activity&month=2026-09"
                    download
                    onClick={() => setIsOpen(false)}
                    className="text-center py-1.5 px-2 rounded bg-gray-50 hover:bg-indigo-50 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    September
                  </a>
                  <a
                    href="/api/export?type=activity&month=2026-10"
                    download
                    onClick={() => setIsOpen(false)}
                    className="text-center py-1.5 px-2 rounded bg-gray-50 hover:bg-indigo-50 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    October
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
