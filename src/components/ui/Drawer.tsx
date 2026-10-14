import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: string;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  position = 'right',
  width = 'max-w-md',
  className = '',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const slideVariants = {
    closed: {
      x: position === 'right' ? '100%' : '-100%',
      opacity: 0.9,
    },
    open: {
      x: 0,
      opacity: 1,
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          <div
            className={cn(
              'fixed inset-y-0 flex z-50 w-full',
              position === 'right' ? 'right-0 justify-end' : 'left-0 justify-start'
            )}
          >
            <motion.div
              ref={drawerRef}
              variants={slideVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn(
                'w-full bg-surface text-ink border-ink/15 flex flex-col shadow-2xl relative h-full',
                position === 'right'
                  ? 'border-l rounded-l-[28px]'
                  : 'border-r rounded-r-[28px]',
                width,
                className
              )}
            >
              {/* Header */}
              {(title || subtitle) && (
                <div className="p-5 pb-4 border-b border-ink/10 flex items-center justify-between shrink-0">
                  <div>
                    {title && (
                      <h3 className="text-base font-semibold text-ink leading-tight">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-xs text-muted font-medium mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full border border-ink/15 flex items-center justify-center text-muted hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ink"
                    aria-label="Tutup panel"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
