import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  isLoading = false,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Initial focus to Cancel button for safety on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const icons = {
    danger: <AlertTriangle size={20} className="text-ink" />,
    warning: <AlertCircle size={20} className="text-ink" />,
    info: <Info size={20} className="text-ink" />,
  };

  const badgeBgs = {
    danger: 'bg-pink border-ink/20',
    warning: 'bg-yellow border-ink/20',
    info: 'bg-blue border-ink/20',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-surface border border-ink/20 rounded-[26px] p-6 max-w-md w-full z-10 shadow-xl overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-11 h-11 rounded-full border flex items-center justify-center shrink-0',
                  badgeBgs[variant]
                )}
              >
                {icons[variant]}
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-base font-semibold text-ink leading-snug">
                  {title}
                </h3>
                <div className="text-[13px] text-muted font-medium mt-1 leading-relaxed">
                  {description}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
                aria-label="Tutup dialog"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-full border border-ink/20 text-xs font-semibold text-ink hover:bg-bg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ink"
              >
                {cancelLabel}
              </button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                disabled={isLoading}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
