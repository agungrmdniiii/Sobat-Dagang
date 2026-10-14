import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, SidebarClose, SidebarOpen, Sparkles, LayoutGrid, Check, Info, RotateCcw } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';

interface SettingsPanelProps {
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  tableDensity?: 'comfortable' | 'compact';
  onToggleTableDensity?: () => void;
  onResetTutorial?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  reducedMotion,
  onToggleReducedMotion,
  tableDensity = 'comfortable',
  onToggleTableDensity,
  onResetTutorial,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      width="w-72"
      align="right"
      trigger={
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(!isOpen)}
          title="Pengaturan Tampilan"
          className="w-9 h-9 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ink"
          aria-label="Pengaturan Tampilan"
        >
          <Settings size={16} strokeWidth={1.8} />
        </motion.button>
      }
    >
      <div className="p-4 pb-3 border-b border-ink/10 bg-bg/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={15} className="text-ink" />
          <h4 className="text-sm font-semibold text-ink">Preferensi Tampilan</h4>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {/* Sidebar Collapse Toggle */}
        <div className="p-3 bg-bg/40 rounded-[16px] border border-ink/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-ink border border-ink/10">
              {isSidebarCollapsed ? (
                <SidebarOpen size={14} />
              ) : (
                <SidebarClose size={14} />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">Lipat Menu Sidebar</p>
              <p className="text-[11px] text-muted">Mode ramping hanya ikon</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isSidebarCollapsed}
            onClick={onToggleSidebarCollapse}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center ${
              isSidebarCollapsed ? 'bg-ink' : 'bg-ink/20'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`w-5 h-5 rounded-full bg-white shadow-xs ${
                isSidebarCollapsed ? 'ml-auto' : 'ml-0'
              }`}
            />
          </button>
        </div>

        {/* Reduce Motion Toggle */}
        <div className="p-3 bg-bg/40 rounded-[16px] border border-ink/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-ink border border-ink/10">
              <Sparkles size={14} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">Kurangi Animasi</p>
              <p className="text-[11px] text-muted">Transisi lebih ringan</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={reducedMotion}
            onClick={onToggleReducedMotion}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center ${
              reducedMotion ? 'bg-ink' : 'bg-ink/20'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`w-5 h-5 rounded-full bg-white shadow-xs ${
                reducedMotion ? 'ml-auto' : 'ml-0'
              }`}
            />
          </button>
        </div>

        {/* Table Density Toggle */}
        {onToggleTableDensity && (
          <div className="p-3 bg-bg/40 rounded-[16px] border border-ink/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-ink border border-ink/10">
                <LayoutGrid size={14} />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Kepadatan Tabel</p>
                <p className="text-[11px] text-muted capitalize">{tableDensity === 'compact' ? 'Padat (ringkas)' : 'Lega (standar)'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleTableDensity}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                tableDensity === 'compact' ? 'bg-ink text-white border-ink' : 'bg-surface text-ink border-ink/15'
              }`}
            >
              {tableDensity === 'compact' ? 'Padat' : 'Lega'}
            </button>
          </div>
        )}

        {/* Tutorial Reset Option */}
        {onResetTutorial && (
          <div className="p-3 bg-bg/40 rounded-[16px] border border-ink/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-ink border border-ink/10">
                <RotateCcw size={13} />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Tutorial & Tur</p>
                <p className="text-[11px] text-muted">Mulai panduan dari awal</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onResetTutorial();
                setIsOpen(false);
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-ink/15 bg-surface text-ink hover:bg-ink hover:text-white transition-colors cursor-pointer"
            >
              Ulangi
            </button>
          </div>
        )}

        {/* System Info */}
        <div className="p-3 bg-surface rounded-[16px] border border-ink/10 text-[11px] text-muted space-y-1">
          <div className="flex justify-between items-center text-ink font-semibold">
            <span>SobatDagang POS</span>
            <span className="bg-green/40 text-ink px-2 py-0.5 rounded-full text-[10px]">
              v2.1
            </span>
          </div>
          <p>Kombinasi Krem, Pastel, DM Sans & Motion.</p>
        </div>
      </div>
    </Dropdown>
  );
};
