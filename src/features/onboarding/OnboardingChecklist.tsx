import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, X, ArrowUpRight, Award } from 'lucide-react';
import { User } from '../../types';
import { ChecklistItem } from './types';
import { ONBOARDING_CHECKLIST_ITEMS } from './helpContent';

export interface OnboardingChecklistProps {
  user: User;
  completedIds: string[];
  isDismissed?: boolean;
  onDismiss: () => void;
  onNavigateView?: (view: any) => void;
  items?: ChecklistItem[];
  onOpenHelp?: () => void;
  onStartTour?: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  user,
  completedIds,
  isDismissed = false,
  onDismiss,
  onNavigateView,
  items: propsItems,
  onOpenHelp,
  onStartTour,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Filter tasks by user role if not explicitly provided
  const items = useMemo(() => {
    if (propsItems && propsItems.length > 0) return propsItems;
    return ONBOARDING_CHECKLIST_ITEMS.filter((item) => item.roles.includes(user.role));
  }, [propsItems, user.role]);

  const total = items.length;
  const completedCount = items.filter((item) => completedIds.includes(item.id)).length;
  const progressPercent = Math.round((completedCount / total) * 100);
  const isAllCompleted = total > 0 && completedCount === total;

  if (isDismissed) return null;

  // Minimized Floating Circle Indicator
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 select-none">
        <motion.button
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMinimized(false)}
          className="relative bg-ink text-white p-3 rounded-full shadow-xl flex items-center justify-center border-2 border-white/20 cursor-pointer group"
          title="Buka Checklist Tugas Mulai"
          aria-label="Buka Checklist Tugas Mulai"
        >
          {/* Progress Ring */}
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="#F4B6D2"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={100}
              strokeDashoffset={100 - progressPercent}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold">
            {isAllCompleted ? (
              <Sparkles size={14} className="text-yellow" />
            ) : (
              <span>{completedCount}/{total}</span>
            )}
          </div>

          <span className="sr-only">Checklist Mulai di Sini ({completedCount} dari {total} selesai)</span>
        </motion.button>
      </div>
    );
  }

  // Expanded Floating Card Widget
  return (
    <div className="fixed bottom-4 right-4 z-40 w-[320px] sm:w-[350px] select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="bg-bg rounded-[24px] border border-ink/20 shadow-xl p-4 overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-pink text-ink flex items-center justify-center text-xs font-bold shrink-0">
                <Sparkles size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink">Mulai di Sini</h4>
                <p className="text-[11px] text-muted">
                  {completedCount} dari {total} tugas awal selesai
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                title="Minimalkan widget"
                aria-label="Minimalkan widget"
              >
                <ChevronDown size={15} />
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                title="Sembunyikan checklist"
                aria-label="Sembunyikan checklist"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="my-3 space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-ink">
              <span>Kemajuan Anda</span>
              <span className="tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-ink/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
                className="h-full bg-ink rounded-full"
              />
            </div>
          </div>

          {/* All Completed Celebration View */}
          {isAllCompleted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 text-center space-y-2 bg-surface rounded-[20px] p-3 border border-ink/10"
            >
              <div className="w-10 h-10 rounded-full bg-yellow text-ink flex items-center justify-center mx-auto shadow-xs">
                <Award size={22} />
              </div>
              <h5 className="text-sm font-bold text-ink">Anda siap! 🎉</h5>
              <p className="text-xs text-muted max-w-xs mx-auto">
                Semua tugas awal berhasil diselesaikan. Anda sekarang siap menjalankan operasional SobatDagang dengan percaya diri.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-ink text-white hover:bg-black transition-colors cursor-pointer"
                >
                  Tutup Checklist
                </button>
              </div>
            </motion.div>
          ) : (
            /* Task list with animated checkmarks */
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
              {items.map((item) => {
                const isDone = completedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.targetView && typeof onNavigateView === 'function') {
                        onNavigateView(item.targetView);
                      }
                    }}
                    className={`p-2.5 rounded-[16px] border transition-all flex items-start gap-2.5 cursor-pointer group ${
                      isDone
                        ? 'bg-surface/50 border-ink/5 opacity-75'
                        : 'bg-surface border-ink/10 hover:border-ink/30 hover:bg-surface/80'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-ink">
                      {isDone ? (
                        <motion.div
                          initial={{ scale: 0.5, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <CheckCircle2 size={16} className="text-green-700" />
                        </motion.div>
                      ) : (
                        <Circle size={16} className="text-muted group-hover:text-ink transition-colors" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs font-semibold leading-snug ${
                            isDone ? 'line-through text-muted' : 'text-ink'
                          }`}
                        >
                          {item.title}
                        </p>
                        {item.targetView && !isDone && (
                          <ArrowUpRight
                            size={12}
                            className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-muted leading-tight mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-ink/10 text-[11px] text-muted">
            <span>Tugas otomatis tercentang</span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-ink font-semibold hover:underline cursor-pointer"
            >
              Sembunyikan
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
