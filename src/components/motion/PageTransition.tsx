import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';

export interface PageTransitionProps extends HTMLMotionProps<'div'> {
  pageKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  pageKey,
  className,
  ...props
}) => {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.25,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn('w-full', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
