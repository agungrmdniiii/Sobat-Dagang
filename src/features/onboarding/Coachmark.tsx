import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface CoachmarkProps {
  id: string;
  hasSeen: boolean;
  onDismiss: (id: string) => void;
  title: string;
  message: string;
  className?: string;
  position?: 'top' | 'bottom' | 'inline';
}

export const Coachmark: React.FC<CoachmarkProps> = ({
  id,
  hasSeen,
  onDismiss,
  title,
  message,
  className = '',
  position = 'bottom',
}) => {
  if (hasSeen) return null;

  const posClasses = {
    top: 'absolute bottom-full left-0 mb-2',
    bottom: 'absolute top-full left-0 mt-2',
    inline: 'relative my-2',
  }[position];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={`z-30 p-2.5 sm:p-3 bg-pink/95 text-ink border border-ink/20 rounded-[18px] shadow-lg flex items-start gap-2.5 max-w-xs ${posClasses} ${className}`}
      >
        <div className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={11} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-ink leading-tight">{title}</p>
          <p className="text-[11px] text-ink/80 mt-0.5 leading-snug">{message}</p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(id);
          }}
          className="w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center text-ink shrink-0 cursor-pointer transition-colors"
          title="Tutup petunjuk"
          aria-label="Tutup petunjuk"
        >
          <X size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
