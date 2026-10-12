'use client';

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-[#1a2438] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#8795ad]">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={`w-full rounded-[14px] bg-white/60 hover:bg-white/80 focus:bg-white/90 border transition-all text-sm text-[#1a2438] placeholder:text-[#8795ad] py-2.5 ${
            leftIcon ? 'pl-10' : 'pl-4'
          } ${rightIcon ? 'pr-10' : 'pr-4'} ${
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500'
              : 'border-white/85 hover:border-[#8795ad]/40 focus:border-[#3d5a8c] focus:ring-2 focus:ring-[#3d5a8c]/30'
          } disabled:opacity-50 disabled:cursor-not-allowed outline-none shadow-xs backdrop-blur-xs ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center pointer-events-none text-[#8795ad]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-[#6b7a93]">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
