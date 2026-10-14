import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContextHelpProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  ariaLabel?: string;
}

export const ContextHelp: React.FC<ContextHelpProps> = ({
  content,
  placement = 'top',
  className = '',
  ariaLabel = 'Bantuan fitur',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    if (isVisible) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isVisible]);

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[placement];

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="w-4 h-4 rounded-full bg-surface border border-ink/15 hover:border-ink/50 text-muted hover:text-ink flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ink"
        aria-label={ariaLabel}
        aria-expanded={isVisible}
      >
        <span className="leading-none text-[10px]">?</span>
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${placementClasses} w-52 p-2.5 bg-ink text-white text-[11px] font-medium rounded-[14px] shadow-xl z-50 pointer-events-none leading-relaxed text-left`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
