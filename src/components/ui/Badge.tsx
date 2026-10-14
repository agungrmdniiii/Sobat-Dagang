import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'green' | 'blue' | 'yellow' | 'pink' | 'neutral' | 'ink';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = false,
  size = 'md',
  className,
  ...props
}) => {
  const variants: Record<BadgeVariant, string> = {
    green: 'bg-green text-ink border border-ink/10',
    blue: 'bg-blue text-ink border border-ink/10',
    yellow: 'bg-yellow text-ink border border-ink/10',
    pink: 'bg-pink text-ink border border-ink/10',
    neutral: 'bg-bg text-ink border border-ink/10',
    ink: 'bg-ink text-white border border-ink',
  };

  const dotColors: Record<BadgeVariant, string> = {
    green: 'bg-[#5b7338]',
    blue: 'bg-[#5b6fbd]',
    yellow: 'bg-[#9c8227]',
    pink: 'bg-[#b85b88]',
    neutral: 'bg-muted',
    ink: 'bg-white',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold',
    md: 'px-3 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full tracking-tight select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
