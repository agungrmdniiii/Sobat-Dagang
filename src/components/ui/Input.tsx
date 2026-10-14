import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full text-left">
      {label && (
        <label className="text-xs font-semibold text-muted block ml-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-4 text-muted pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-bg border border-ink/15 rounded-full text-sm font-medium text-ink placeholder:text-muted/60 outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-colors duration-150',
            leftIcon && 'pl-11',
            rightIcon && 'pr-11',
            error && 'border-pink focus:ring-pink focus:border-pink',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-4 text-muted flex items-center">
            {rightIcon}
          </span>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: [0, -4, 4, -3, 3, 0] }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.3 }}
            className="ml-1 mt-1"
          >
            <span className="inline-block text-xs text-ink bg-pink px-3 py-1 rounded-full font-medium">
              {error}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {!error && helperText && (
        <p className="text-xs text-muted ml-2 font-medium">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
