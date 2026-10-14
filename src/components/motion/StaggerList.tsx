import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';

export interface StaggerListProps extends HTMLMotionProps<'div'> {
  staggerDelay?: number;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  className,
  staggerDelay = 0.05,
  ...props
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerItemProps extends HTMLMotionProps<'div'> {
  distance?: number;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  distance = 8,
  ...props
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: distance },
        show: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.25,
            ease: [0.22, 1, 0.36, 1],
          }
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
