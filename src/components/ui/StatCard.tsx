import React from 'react';
import GlassCard from './GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  description,
  className = '',
}) => {
  return (
    <GlassCard className={`p-5 sm:p-6 transition-transform hover:-translate-y-0.5 duration-200 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-[var(--text-2)] uppercase tracking-wider truncate mb-1">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}
              </span>
              {description && (
                <span className="text-xs text-[var(--text-3)]">{description}</span>
              )}
            </div>
          )}
          {!trend && description && (
            <p className="text-xs text-[var(--text-3)] mt-2">{description}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-[14px] bg-[#dfe7f5] text-[var(--primary)] flex items-center justify-center shrink-0 shadow-sm">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default StatCard;
