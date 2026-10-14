import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Check, Compass } from 'lucide-react';
import { TourStep } from './types';
import { Button } from '../../components/ui';

interface GuidedTourProps {
  isOpen: boolean;
  steps: TourStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onComplete: () => void;
  onSkip: () => void;
  currentView: string;
  onNavigateView?: (view: any) => void;
}

interface SpotlightRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PopoverPos {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  steps,
  currentStepIndex,
  onStepChange,
  onComplete,
  onSkip,
  currentView,
  onNavigateView,
}) => {
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPos>({
    top: 100,
    left: 100,
    placement: 'center',
  });
  const [isMeasuring, setIsMeasuring] = useState(true);

  const popoverRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const step = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Store active element when tour opens to restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus?.();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Recalculate target position
  const updatePosition = useCallback(() => {
    if (!step) return;

    const el = document.querySelector(`[data-tour="${step.targetId}"]`);
    if (!el) {
      // Element not in DOM yet or hidden -> fallback center popover
      setSpotlight(null);
      setPopoverPos({
        top: Math.max(20, Math.floor(window.innerHeight / 2 - 120)),
        left: Math.max(20, Math.floor(window.innerWidth / 2 - 170)),
        placement: 'center',
      });
      setIsMeasuring(false);
      return;
    }

    // Scroll gently into view if needed
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } catch {
      // ignore
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;
    const spotX = Math.max(0, rect.left - pad);
    const spotY = Math.max(0, rect.top - pad);
    const spotW = rect.width + pad * 2;
    const spotH = rect.height + pad * 2;

    setSpotlight({
      x: spotX,
      y: spotY,
      w: spotW,
      h: spotH,
    });

    // Calculate smart popover position
    const popW = 340;
    const popH = 210;
    const spacing = 14;
    const vW = window.innerWidth;
    const vH = window.innerHeight;

    let placement = step.placement || 'bottom';
    let top = 0;
    let left = 0;

    // Check preferred placement and fallback if overflowing
    if (placement === 'bottom') {
      if (spotY + spotH + popH + spacing < vH) {
        top = spotY + spotH + spacing;
        left = spotX + spotW / 2 - popW / 2;
      } else if (spotY - popH - spacing > 0) {
        placement = 'top';
        top = spotY - popH - spacing;
        left = spotX + spotW / 2 - popW / 2;
      } else {
        placement = 'right';
        top = spotY + spotH / 2 - popH / 2;
        left = spotX + spotW + spacing;
      }
    } else if (placement === 'top') {
      if (spotY - popH - spacing > 0) {
        top = spotY - popH - spacing;
        left = spotX + spotW / 2 - popW / 2;
      } else if (spotY + spotH + popH + spacing < vH) {
        placement = 'bottom';
        top = spotY + spotH + spacing;
        left = spotX + spotW / 2 - popW / 2;
      } else {
        placement = 'right';
        top = spotY + spotH / 2 - popH / 2;
        left = spotX + spotW + spacing;
      }
    } else if (placement === 'left') {
      if (spotX - popW - spacing > 0) {
        top = spotY + spotH / 2 - popH / 2;
        left = spotX - popW - spacing;
      } else if (spotX + spotW + popW + spacing < vW) {
        placement = 'right';
        top = spotY + spotH / 2 - popH / 2;
        left = spotX + spotW + spacing;
      } else {
        placement = 'bottom';
        top = spotY + spotH + spacing;
        left = spotX + spotW / 2 - popW / 2;
      }
    } else if (placement === 'right') {
      if (spotX + spotW + popW + spacing < vW) {
        top = spotY + spotH / 2 - popH / 2;
        left = spotX + spotW + spacing;
      } else if (spotX - popW - spacing > 0) {
        placement = 'left';
        top = spotY + spotH / 2 - popH / 2;
        left = spotX - popW - spacing;
      } else {
        placement = 'bottom';
        top = spotY + spotH + spacing;
        left = spotX + spotW / 2 - popW / 2;
      }
    }

    // Clamp inside viewport
    left = Math.max(16, Math.min(left, vW - popW - 16));
    top = Math.max(16, Math.min(top, vH - popH - 16));

    setPopoverPos({ top, left, placement });
    setIsMeasuring(false);
  }, [step]);

  // Handle multi-page switching when step belongs to different view
  useEffect(() => {
    if (!isOpen || !step) return;

    setIsMeasuring(true);
    if (step.targetView && step.targetView !== currentView && onNavigateView) {
      onNavigateView(step.targetView);
    }

    const timer = setTimeout(() => {
      updatePosition();
    }, 220);

    return () => clearTimeout(timer);
  }, [isOpen, currentStepIndex, step, currentView, onNavigateView, updatePosition]);

  // Resize & scroll listener
  useEffect(() => {
    if (!isOpen) return;
    const handleRecalc = () => updatePosition();
    window.addEventListener('resize', handleRecalc);
    window.addEventListener('scroll', handleRecalc, true);
    return () => {
      window.removeEventListener('resize', handleRecalc);
      window.removeEventListener('scroll', handleRecalc, true);
    };
  }, [isOpen, updatePosition]);

  // Keyboard navigation & Focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        // Only trigger if activeElement is not a secondary button like "Kembali" or "Lewati"
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'BUTTON' || document.activeElement === nextBtnRef.current) {
          e.preventDefault();
          if (isLastStep) {
            onComplete();
          } else {
            onStepChange(currentStepIndex + 1);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (!isFirstStep) {
          e.preventDefault();
          onStepChange(currentStepIndex - 1);
        }
      } else if (e.key === 'Tab') {
        // Focus trap inside popover
        if (!popoverRef.current) return;
        const focusable = popoverRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, isFirstStep, isLastStep, onStepChange, onComplete, onSkip]);

  // Autofocus the "Lanjut" button when step updates
  useEffect(() => {
    if (isOpen && nextBtnRef.current) {
      nextBtnRef.current.focus();
    }
  }, [isOpen, currentStepIndex]);

  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-auto">
      {/* 1. Dark Overlay with SVG cutout spotlight */}
      {spotlight ? (
        <svg
          className="fixed inset-0 w-full h-full pointer-events-auto select-none"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.w}
                height={spotlight.h}
                rx="18"
                ry="18"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(17, 17, 17, 0.65)"
            mask="url(#tour-spotlight-mask)"
            onClick={onSkip}
            className="cursor-pointer"
          />
        </svg>
      ) : (
        <div
          onClick={onSkip}
          className="fixed inset-0 bg-ink/65 backdrop-blur-[1px] cursor-pointer"
        />
      )}

      {/* 2. Highlight Ring with pulsing glow around spotlighted element */}
      {spotlight && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            left: spotlight.x,
            top: spotlight.y,
            width: spotlight.w,
            height: spotlight.h,
          }}
          className="pointer-events-none z-[82] rounded-[18px] border-2 border-pink ring-4 ring-pink/25 shadow-lg"
        />
      )}

      {/* 3. Popover Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-step-title"
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            width: 340,
          }}
          className="z-[85] bg-bg rounded-[24px] border border-ink/20 shadow-2xl p-5 select-none"
        >
          {/* Header row: Step Counter & Close Button */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pink text-ink flex items-center justify-center font-bold text-[10px] shrink-0">
                <Compass size={12} />
              </span>
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                Langkah {currentStepIndex + 1} dari {steps.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              title="Lewati Tur (Esc)"
              aria-label="Lewati tur"
            >
              <X size={14} />
            </button>
          </div>

          {/* Title & Description with live announcement */}
          <div className="space-y-1.5 my-2.5">
            <h4
              id="tour-step-title"
              aria-live="polite"
              className="text-base font-bold text-ink tracking-tight"
            >
              {step.title}
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              {step.description}
            </p>
            {step.actionHint && (
              <span className="inline-block mt-1 text-[10px] font-bold text-ink bg-surface border border-ink/10 px-2 py-0.5 rounded-full">
                {step.actionHint}
              </span>
            )}
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center gap-1.5 py-2 my-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentStepIndex
                    ? 'w-6 bg-ink'
                    : idx < currentStepIndex
                    ? 'w-2 bg-ink/40'
                    : 'w-2 bg-ink/15'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons: Kembali, Lanjut/Selesai, Lewati */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-ink/10">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-muted hover:text-ink font-medium px-2 py-1 cursor-pointer transition-colors"
            >
              Lewati
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isFirstStep}
                onClick={() => onStepChange(currentStepIndex - 1)}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  isFirstStep ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Langkah Sebelumnya (Panah Kiri)"
              >
                <ChevronLeft size={13} />
                <span>Kembali</span>
              </Button>

              <Button
                ref={nextBtnRef}
                size="sm"
                onClick={() => {
                  if (isLastStep) {
                    onComplete();
                  } else {
                    onStepChange(currentStepIndex + 1);
                  }
                }}
                className="py-1.5 px-4 rounded-full text-xs font-semibold bg-ink text-white hover:bg-black flex items-center gap-1 cursor-pointer shadow-xs"
                title={isLastStep ? 'Selesaikan Tur (Enter)' : 'Langkah Berikutnya (Enter)'}
              >
                <span>{isLastStep ? 'Selesai' : 'Lanjut'}</span>
                {isLastStep ? <Check size={13} /> : <ChevronRight size={13} />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
