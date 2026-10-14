import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleApplyPreset = (preset: 'yesterday' | 'this_week' | 'this_month') => {
    const now = new Date();
    let s = new Date();
    let e = new Date();

    if (preset === 'yesterday') {
      s.setDate(now.getDate() - 1);
      e.setDate(now.getDate() - 1);
    } else if (preset === 'this_week') {
      const day = now.getDay() || 7;
      s.setDate(now.getDate() - day + 1);
      e = now;
    } else if (preset === 'this_month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = now;
    }

    const startStr = s.toISOString().split('T')[0];
    const endStr = e.toISOString().split('T')[0];
    setTempStart(startStr);
    setTempEnd(endStr);
    onChange(startStr, endStr);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    onChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-1.5 rounded-full bg-surface border border-ink/15 hover:border-ink/40 text-ink text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
      >
        <Calendar size={13} className="text-muted" />
        <span>{startDate} s/d {endDate}</span>
        <ChevronDown size={13} className="text-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-50 bg-surface border border-ink/20 rounded-[22px] p-4 shadow-lg w-72 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-ink/10">
              <span className="text-xs font-bold text-ink">Pilih Rentang Tanggal</span>
              <span className="text-[10px] text-muted font-medium">Kalender</span>
            </div>

            {/* Presets Cepat */}
            <div className="flex gap-1.5">
              {[
                { id: 'yesterday', label: 'Kemarin' },
                { id: 'this_week', label: 'Minggu Ini' },
                { id: 'this_month', label: 'Bulan Ini' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p.id as any)}
                  className="flex-1 py-1 px-2 rounded-full bg-bg hover:bg-ink hover:text-white text-[11px] font-semibold text-ink border border-ink/10 transition-colors text-center cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Manual */}
            <div className="space-y-2 pt-1 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Mulai</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full bg-bg border border-ink/15 rounded-full px-3 py-1 text-xs text-ink focus:outline-hidden focus:border-ink"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Sampai</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full bg-bg border border-ink/15 rounded-full px-3 py-1 text-xs text-ink focus:outline-hidden focus:border-ink"
                />
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleApplyCustom}
              className="w-full rounded-full text-xs font-semibold mt-1"
            >
              Terapkan Rentang
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
