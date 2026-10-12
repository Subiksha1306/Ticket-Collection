import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export default function GlassCard({
  children,
  className = '',
  as: Component = 'div',
  ...props
}: GlassCardProps) {
  return (
    <Component
      className={`glass-panel ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export { GlassCard };
