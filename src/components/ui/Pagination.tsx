'use client';
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  return (
    <nav
      className={`inline-flex items-center gap-1.5 p-1 bg-white/50 backdrop-blur-md rounded-full border border-white/75 shadow-[0_2px_8px_rgba(44,66,110,0.04)] ${className}`}
      aria-label="Pagination Navigation"
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[var(--text)] disabled:text-[var(--text-3)] disabled:pointer-events-none hover:bg-white/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        aria-label="Previous page"
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[var(--text-3)]">
                …
              </span>
            );
          }

          const isCurrent = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                isCurrent
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--text)] hover:bg-white/60'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[var(--text)] disabled:text-[var(--text-3)] disabled:pointer-events-none hover:bg-white/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
