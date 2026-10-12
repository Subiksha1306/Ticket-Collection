import React from 'react';
import GlassCard from './GlassCard';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <GlassCard className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-16 h-16 rounded-[18px] bg-[#dfe7f5] text-[var(--primary)] flex items-center justify-center mb-4 shadow-sm">
        {icon || (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-[var(--text)] mb-1.5">{title}</h3>
      <p className="text-sm text-[var(--text-2)] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        action.href ? (
          <a href={action.href}>
            <Button variant="primary">{action.label}</Button>
          </a>
        ) : (
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </GlassCard>
  );
};

export default EmptyState;
