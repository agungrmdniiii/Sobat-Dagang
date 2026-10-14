import React from 'react';
import { motion } from 'motion/react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'surface' | 'bg';
  accentColor?: 'yellow' | 'pink' | 'blue' | 'green' | 'default';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  variant = 'surface',
  accentColor = 'default',
}) => {
  const accentBgs = {
    yellow: 'bg-yellow/40 border-yellow/60 text-ink',
    pink: 'bg-pink/40 border-pink/60 text-ink',
    blue: 'bg-blue/40 border-blue/60 text-ink',
    green: 'bg-green/40 border-green/60 text-ink',
    default: 'bg-bg border-ink/10 text-muted',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'py-12 px-6 rounded-[24px] border border-ink/15 flex flex-col items-center justify-center text-center select-none',
        variant === 'surface' ? 'bg-surface' : 'bg-bg',
        className
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full border flex items-center justify-center mb-3.5',
          accentBgs[accentColor]
        )}
      >
        <Icon size={24} strokeWidth={1.8} />
      </div>

      <h4 className="text-base font-semibold text-ink leading-tight">{title}</h4>

      {description && (
        <p className="text-[13px] text-muted max-w-sm mt-1.5 leading-relaxed font-medium">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
