import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatCurrency, formatNumber } from '../../lib/utils';
import { CountUp } from '../motion';

export interface StatCardProps {
  title: string;
  value: number;
  formatter?: (val: number) => string;
  unit?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor?: 'yellow' | 'blue' | 'pink' | 'green';
  comparison?: {
    diffText: string;
    direction?: 'up' | 'down' | 'flat';
    isNew?: boolean;
    periodLabel?: string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  formatter = formatNumber,
  unit,
  icon: Icon,
  accentColor = 'yellow',
  comparison,
  onClick,
  className,
}) => {
  const accentStyles = {
    yellow: {
      card: 'bg-yellow/35 border-yellow/60',
      iconBox: 'bg-yellow/60 border-yellow/70',
    },
    blue: {
      card: 'bg-blue/35 border-blue/60',
      iconBox: 'bg-blue/60 border-blue/70',
    },
    pink: {
      card: 'bg-pink/35 border-pink/60',
      iconBox: 'bg-pink/60 border-pink/70',
    },
    green: {
      card: 'bg-green/35 border-green/60',
      iconBox: 'bg-green/60 border-green/70',
    },
  };

  const style = accentStyles[accentColor];

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        'rounded-[22px] border p-4.5 flex flex-col justify-between transition-all select-none',
        style.card,
        onClick && 'cursor-pointer hover:shadow-xs',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</span>
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-ink border', style.iconBox)}>
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-2xl font-bold text-ink tracking-tight tabular-nums">
            <CountUp value={value} formatter={formatter} />
          </h3>
          {unit && <span className="text-xs font-semibold text-muted">{unit}</span>}
        </div>

        {comparison && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold">
            {comparison.isNew ? (
              <span className="bg-bg text-muted px-2 py-0.5 rounded-full border border-ink/10">
                Baru
              </span>
            ) : comparison.direction === 'up' ? (
              <span className="inline-flex items-center gap-0.5 bg-green text-ink px-2 py-0.5 rounded-full border border-ink/10">
                <TrendingUp size={11} /> {comparison.diffText}
              </span>
            ) : comparison.direction === 'down' ? (
              <span className="inline-flex items-center gap-0.5 bg-pink text-ink px-2 py-0.5 rounded-full border border-ink/10">
                <TrendingDown size={11} /> {comparison.diffText}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 bg-bg text-muted px-2 py-0.5 rounded-full border border-ink/10">
                <Minus size={11} /> {comparison.diffText}
              </span>
            )}
            {comparison.periodLabel && (
              <span className="text-muted font-normal">{comparison.periodLabel}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
