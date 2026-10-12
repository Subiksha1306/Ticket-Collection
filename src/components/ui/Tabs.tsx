'use client';
import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number | string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-white/50 backdrop-blur-md rounded-full border border-white/75 shadow-[0_2px_8px_rgba(44,66,110,0.04)] ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              isActive
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-white/50'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#dfe7f5] text-[var(--primary)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
