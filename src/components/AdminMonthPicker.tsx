'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function AdminMonthPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonthParam = searchParams.get('month');
  
  const now = new Date();
  
  let initialYear = now.getFullYear();
  let initialMonth = now.getMonth(); // 0-11
  
  if (currentMonthParam && currentMonthParam.includes('-')) {
    const [y, m] = currentMonthParam.split('-');
    initialYear = parseInt(y, 10);
    initialMonth = parseInt(m, 10) - 1;
  }
  
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialYear);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentMonthParam && currentMonthParam.includes('-')) {
      const [y, m] = currentMonthParam.split('-');
      setViewYear(parseInt(y, 10));
    } else {
      setViewYear(now.getFullYear());
    }
  }, [currentMonthParam]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMonth = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    router.push(`/admin?month=${viewYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    router.push(`/admin`);
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    const currentY = now.getFullYear();
    const currentM = String(now.getMonth() + 1).padStart(2, '0');
    router.push(`/admin?month=${currentY}-${currentM}`);
    setIsOpen(false);
  };

  const displayString = currentMonthParam 
    ? new Date(initialYear, initialMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="month-picker-trigger flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0c1524] border border-[#5B45FF] rounded-lg shadow-sm hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-colors"
      >
        <Calendar className="w-[18px] h-[18px] text-[#5B45FF]" />
        <span className="trigger-text text-[15px] font-medium text-slate-700 dark:text-[#f0f4fc]">{displayString}</span>
        <ChevronDown className="w-[18px] h-[18px] text-gray-400 dark:text-gray-300 ml-1" />
      </button>

      {isOpen && (
        <div className="month-picker-popup absolute top-[calc(100%+8px)] right-0 w-[300px] bg-white dark:bg-[#0c1524] border border-gray-100 dark:border-white/15 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.7)] z-50 p-5 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => setViewYear(v => v - 1)}
              className="year-nav-btn p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors text-slate-800 dark:text-[#f0f4fc]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="year-title font-bold text-slate-800 dark:text-[#f0f4fc] text-[17px]">{viewYear}</span>
            <button 
              onClick={() => setViewYear(v => v + 1)}
              className="year-nav-btn p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors text-slate-800 dark:text-[#f0f4fc]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 gap-y-5 gap-x-2 mb-6">
            {MONTHS.map((m, index) => {
              const isSelected = initialYear === viewYear && initialMonth === index;
              return (
                <button
                  key={m}
                  onClick={() => handleSelectMonth(index)}
                  className={`text-[15px] py-2 rounded-lg transition-colors font-medium
                    ${isSelected 
                      ? 'bg-[#5B45FF] text-white shadow-sm' 
                      : 'month-btn-unselected text-slate-700 dark:text-[#d2def2] hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:text-white'
                    }
                  `}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
            <button 
              onClick={handleClear}
              className="text-[15px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
            >
              Clear
            </button>
            <button 
              onClick={handleThisMonth}
              className="text-[15px] text-[#5B45FF] hover:text-[#4a36d9] dark:text-[#8b7cf8] dark:hover:text-[#a79cfc] font-medium transition-colors"
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
