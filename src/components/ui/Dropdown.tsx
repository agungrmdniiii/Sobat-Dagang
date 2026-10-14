import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  width?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'right',
  className = '',
  width = 'w-72',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const alignmentClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top',
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {trigger}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute top-full mt-2 z-50 bg-surface border border-ink/15 rounded-[22px] shadow-sm overflow-hidden select-none',
              alignmentClasses[align],
              width,
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
