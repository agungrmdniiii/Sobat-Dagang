import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  showTrashOnMin?: boolean;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  min = 0,
  max = Infinity,
  onChange,
  showTrashOnMin = false,
  className,
  disabled = false,
  size = 'md',
}) => {
  const isMin = value <= min;
  const isMax = value >= max;

  const handleDecrement = () => {
    if (!isMin && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (!isMax && !disabled) {
      onChange(value + 1);
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center bg-surface border border-ink/10 rounded-full select-none',
        size === 'sm' ? 'px-1.5 py-0.5 gap-1' : 'px-2 py-1 gap-1.5',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        type="button"
        disabled={isMin || disabled}
        onClick={handleDecrement}
        className={cn(
          'rounded-full flex items-center justify-center text-ink transition-colors cursor-pointer',
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
          isMin ? 'opacity-30 cursor-not-allowed' : 'hover:bg-ink hover:text-white'
        )}
      >
        {isMin && showTrashOnMin ? <Trash2 size={size === 'sm' ? 10 : 12} /> : <Minus size={size === 'sm' ? 10 : 12} />}
      </motion.button>

      <div className={cn('text-center relative overflow-hidden flex items-center justify-center', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs font-semibold text-ink tabular-nums block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.85 }}
        type="button"
        disabled={isMax || disabled}
        onClick={handleIncrement}
        className={cn(
          'rounded-full flex items-center justify-center text-ink transition-colors cursor-pointer',
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
          isMax ? 'opacity-30 cursor-not-allowed' : 'hover:bg-ink hover:text-white'
        )}
      >
        <Plus size={size === 'sm' ? 10 : 12} />
      </motion.button>
    </div>
  );
};
