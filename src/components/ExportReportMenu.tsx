'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Award, Calendar } from 'lucide-react';

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

  const now = new Date();
  const currentMonth = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        title="Export Monthly HTML Reports"
      >
        <Download className="w-4 h-4" />
        <span>Export Reports</span>
        <ChevronDown className="w-4 h-4 ml-0.5 opacity-80" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white border border-gray-100 rounded-xl shadow-[0_12px_44px_-10px_rgba(0,0,0,0.18)] z-50 p-2 font-sans">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
            Monthly Reports ({currentMonth})
          </div>

          <a
            href={`/api/export?type=activity&month=${currentMonth}`}
            download
            onClick={() => setIsOpen(false)}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-indigo-50/60 transition-colors group mt-1"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-[#3157d5] group-hover:bg-[#3157d5] group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 group-hover:text-[#3157d5]">
                ImpactX Activity Report
              </div>
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                User-grouped ticket narrative with prominent scores next to every ticket
              </div>
            </div>
          </a>

          <a
            href={`/api/export?type=awards&month=${currentMonth}`}
            download
            onClick={() => setIsOpen(false)}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50/60 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-purple-50 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 group-hover:text-[#7c3aed]">
                I2I Awards Dashboard
              </div>
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                🥇 Winner, 🥈 Runner-up, 6-criterion rubric &amp; ranked ticket evaluations
              </div>
            </div>
          </a>

          <div className="pt-1 mt-1 border-t border-gray-100">
            <a
              href="/api/export?type=activity&all=true"
              download
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-gray-50 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Export All-Time Activity Report</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
