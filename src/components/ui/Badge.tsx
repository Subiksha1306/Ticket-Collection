import React from 'react';

export type BadgeVariant = 'neutral' | 'version' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-[#dfe7f5] text-[#3d5a8c] border border-[#3d5a8c]/15',
  version: 'bg-[#dfe7f5] text-[#3d5a8c] border border-[#3d5a8c]/15 font-semibold',
  success: 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/70',
  warning: 'bg-amber-50/90 text-amber-800 border border-amber-200/70',
  danger: 'bg-rose-50/90 text-rose-700 border border-rose-200/70',
  info: 'bg-sky-50/90 text-sky-800 border border-sky-200/70',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2.5 py-0.5',
  md: 'text-xs px-3 py-1',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
