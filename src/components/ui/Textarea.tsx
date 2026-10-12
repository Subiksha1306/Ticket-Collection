'use client';

import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  className = '',
  disabled,
  id,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-semibold text-[#1a2438] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-[14px] bg-white/60 hover:bg-white/80 focus:bg-white/90 border transition-all text-sm text-[#1a2438] placeholder:text-[#8795ad] p-3.5 ${
          error
            ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500'
            : 'border-white/85 hover:border-[#8795ad]/40 focus:border-[#3d5a8c] focus:ring-2 focus:ring-[#3d5a8c]/30'
        } disabled:opacity-50 disabled:cursor-not-allowed outline-none shadow-xs backdrop-blur-xs resize-y ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-[#6b7a93]">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
