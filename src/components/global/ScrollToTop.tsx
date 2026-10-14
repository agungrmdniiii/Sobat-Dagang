import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ containerRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsVisible(container.scrollTop > 260);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={scrollToTop}
          title="Kembali ke atas"
          aria-label="Kembali ke atas halaman"
          className="fixed bottom-6 left-6 z-40 bg-surface text-ink border border-ink/20 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-bg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ink"
        >
          <ArrowUp size={16} strokeWidth={2.2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
