import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-ink text-white hover:bg-[#262626] border border-ink shadow-none',
    secondary: 'bg-surface text-ink hover:bg-[#dfd8c5] border border-ink/15 shadow-none',
    outline: 'border border-ink bg-transparent text-ink hover:bg-ink hover:text-white shadow-none',
    danger: 'bg-pink text-ink hover:bg-[#e89dbd] border border-ink/15 shadow-none',
    ghost: 'bg-transparent hover:bg-surface text-muted hover:text-ink shadow-none border border-transparent',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs font-medium rounded-full gap-1.5',
    md: 'px-5 py-2.5 text-sm font-medium rounded-full gap-2',
    lg: 'px-7 py-3 text-base font-semibold rounded-full gap-2.5',
  };

  return (
    <motion.button
      ref={ref}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-sans cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';
