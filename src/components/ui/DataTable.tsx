import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowKey?: (item: T, index: number) => string | number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  error = null,
  emptyMessage = 'No records found',
  onRowClick,
  rowKey,
  className = '',
}: DataTableProps<T>) {
  if (error) {
    return (
      <div className="w-full py-12 px-4 rounded-[18px] bg-rose-50/70 border border-rose-200/60 text-center">
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-rose-900 mb-1">Failed to load data</p>
        <p className="text-xs text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-separate border-spacing-y-2 min-w-[600px] text-left">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)] px-4 py-2 select-none ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                {columns.map((_, cIdx) => (
                  <td
                    key={`skeleton-cell-${cIdx}`}
                    className={`px-4 py-4 bg-white/40 border-y border-white/60 ${
                      cIdx === 0 ? 'rounded-l-[14px] border-l' : ''
                    } ${cIdx === columns.length - 1 ? 'rounded-r-[14px] border-r' : ''}`}
                  >
                    <div className="h-4 bg-[#dfe7f5]/60 rounded-full w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 rounded-[14px] bg-white/40 border border-white/60 text-center text-sm text-[var(--text-2)]"
              >
                <div className="w-10 h-10 rounded-full bg-[#dfe7f5]/80 text-[var(--primary)] flex items-center justify-center mx-auto mb-2.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rIdx) => {
              const key = rowKey ? rowKey(item, rIdx) : (item as any)?.id || rIdx;
              const isClickable = !!onRowClick;

              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`bg-white/55 hover:bg-white/85 transition-all shadow-[0_2px_8px_rgba(44,66,110,0.02)] ${
                    isClickable ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(44,66,110,0.06)]' : ''
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      className={`px-4 py-3.5 border-y border-white/60 text-sm text-[var(--text)] transition-colors ${
                        cIdx === 0 ? 'rounded-l-[14px] border-l' : ''
                      } ${cIdx === columns.length - 1 ? 'rounded-r-[14px] border-r' : ''} ${
                        col.className || ''
                      }`}
                    >
                      {col.render ? col.render(item, rIdx) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
