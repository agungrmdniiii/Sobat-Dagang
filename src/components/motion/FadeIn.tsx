import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';

export interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  duration?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className,
  delay = 0,
  direction = 'up',
  distance = 10,
  duration = 0.25,
  ...props
}) => {
  const getOffset = () => {
    switch (direction) {
      case 'up': return { y: distance, x: 0 };
      case 'down': return { y: -distance, x: 0 };
      case 'left': return { x: distance, y: 0 };
      case 'right': return { x: -distance, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
