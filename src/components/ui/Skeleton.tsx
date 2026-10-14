import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rounded' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-[14px]',
    card: 'rounded-[22px]',
  };

  const style: React.CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      style={style}
      className={cn(
        'animate-pulse bg-ink/10 border border-ink/5 select-none',
        variantClasses[variant],
        className
      )}
    />
  );
};

export const SkeletonRow: React.FC<{ cols?: number; className?: string }> = ({
  cols = 5,
  className = '',
}) => {
  return (
    <div className={cn('flex items-center gap-4 py-3 px-4', className)}>
      {Array.from({ length: cols }).map((_, idx) => (
        <Skeleton
          key={idx}
          variant="rounded"
          className={cn(
            'h-6',
            idx === 0 ? 'w-24' : idx === 1 ? 'w-48' : 'w-20 flex-1'
          )}
        />
      ))}
    </div>
  );
};
