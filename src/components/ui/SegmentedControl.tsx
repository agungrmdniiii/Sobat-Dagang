import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[] | SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId = 'segmentedIndicator',
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 bg-bg border border-ink/15 rounded-full relative select-none',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative rounded-full font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 z-10',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs',
              active ? 'text-white' : 'text-muted hover:text-ink'
            )}
          >
            {active && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-ink rounded-full -z-10 shadow-xs"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            {Icon && <Icon size={size === 'sm' ? 12 : 14} className={active ? 'text-white' : 'text-muted'} />}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none',
                  active ? 'bg-white/20 text-white' : 'bg-surface text-ink'
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
