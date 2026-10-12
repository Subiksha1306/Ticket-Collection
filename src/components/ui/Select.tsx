'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  children?: React.ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  children,
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-[#1a2438] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          id={selectId}
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none rounded-[14px] bg-white/60 hover:bg-white/80 focus:bg-white/90 border transition-all text-sm text-[#1a2438] py-2.5 pl-4 pr-10 ${
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500'
              : 'border-white/85 hover:border-[#8795ad]/40 focus:border-[#3d5a8c] focus:ring-2 focus:ring-[#3d5a8c]/30'
          } disabled:opacity-50 disabled:cursor-not-allowed outline-none shadow-xs backdrop-blur-xs cursor-pointer ${className}`}
          {...props}
        >
          {options
            ? options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3.5 flex items-center pointer-events-none text-[#8795ad]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-[#6b7a93]">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
