import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  initialFocusRef,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const initialFocusRefRef = React.useRef(initialFocusRef);
  initialFocusRefRef.current = initialFocusRef;

  React.useEffect(() => {
    if (!isOpen) return;

    // Record the element that had focus before the modal opened
    triggerRef.current = document.activeElement as HTMLElement | null;

    // Handle initial focus once when modal opens
    const focusTimer = setTimeout(() => {
      // If an element inside the modal is already focused by the user, DO NOT steal focus!
      if (modalRef.current && modalRef.current.contains(document.activeElement)) {
        return;
      }

      if (initialFocusRefRef.current?.current) {
        initialFocusRefRef.current.current.focus();
      } else if (modalRef.current) {
        // Prioritize inputs/textareas, then general focusables
        const inputs = modalRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
        );
        if (inputs.length > 0) {
          inputs[0].focus();
        } else {
          const focusables = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length > 0) {
            focusables[0].focus();
          }
        }
      }
    }, 50);

    // Handle Esc and focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ) as HTMLElement[];

        if (focusables.length === 0) return;

        const first = focusables[0] as HTMLElement;
        const last = focusables[focusables.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to trigger element only when modal closes
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with fade motion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
          />

          {/* Modal Panel with scale 0.96 to 1 motion */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative w-full bg-surface rounded-[24px] overflow-hidden border border-ink/15 shadow-none z-10 my-8',
              maxWidth
            )}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-ink/10 flex items-center justify-between bg-surface">
              <div>
                <h3 className="text-xl font-semibold text-ink tracking-tight">{title}</h3>
                {subtitle && <p className="text-[13px] text-muted font-normal mt-0.5">{subtitle}</p>}
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-colors duration-150 cursor-pointer"
                aria-label="Tutup modal"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto scroll-smooth">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
