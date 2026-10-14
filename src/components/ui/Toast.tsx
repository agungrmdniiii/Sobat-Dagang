import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible?: boolean;
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  isVisible = true,
  onClose,
  duration = 3500,
  action,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, onClose, duration]);

  const icons = {
    success: <Check size={13} className="text-ink stroke-[2.5]" />,
    error: <AlertCircle size={13} className="text-ink stroke-[2.5]" />,
    info: <Info size={13} className="text-ink stroke-[2.5]" />,
  };

  const badgeBgs = {
    success: 'bg-green border-green/60',
    error: 'bg-pink border-pink/60',
    info: 'bg-blue border-blue/60',
  };

  const progressBgs = {
    success: 'bg-green',
    error: 'bg-pink',
    info: 'bg-blue',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden px-4 py-2.5 rounded-[20px] border border-ink/20 flex items-center gap-2.5 bg-surface text-ink shadow-md select-none max-w-sm sm:max-w-md w-auto"
        >
          {/* Pastel badge icon */}
          <div
            className={cn(
              'w-6 h-6 rounded-full border flex items-center justify-center shrink-0',
              badgeBgs[type]
            )}
          >
            {icons[type]}
          </div>

          <span className="text-[13px] font-semibold tracking-tight text-ink mr-1 break-words">
            {message}
          </span>

          {action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="px-3 py-1 rounded-full bg-ink text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer shrink-0 ml-1 focus-visible:ring-2 focus-visible:ring-ink"
            >
              {action.label}
            </motion.button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer ml-auto shrink-0 focus-visible:ring-1 focus-visible:ring-ink"
            aria-label="Tutup notifikasi"
          >
            <X size={12} />
          </button>

          {/* Thin progress bar running out at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-ink/10 overflow-hidden">
            <div
              className={cn('h-full transition-all duration-75', progressBgs[type])}
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export interface ToastItemData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const ToastContainer: React.FC<{
  toasts: ToastItemData[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[130] flex flex-col gap-2 pointer-events-none items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              action={toast.action}
              isVisible={true}
              onClose={() => onDismiss(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
