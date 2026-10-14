import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, LogOut } from 'lucide-react';

interface PracticeModeBannerProps {
  isActive: boolean;
  onExit: () => void;
}

export const PracticeModeBanner: React.FC<PracticeModeBannerProps> = ({
  isActive,
  onExit,
}) => {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#F5D76E] border-b border-ink/20 px-4 py-2 text-ink text-xs font-semibold flex items-center justify-between gap-3 shadow-xs shrink-0 select-none z-40"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-ink text-yellow flex items-center justify-center shrink-0">
            <AlertTriangle size={12} strokeWidth={2.4} />
          </div>
          <span className="truncate">
            <strong className="font-bold">Mode Latihan Aktif</strong> — Transaksi dan perubahan stok bersifat simulasi & tidak akan disimpan ke database toko.
          </span>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="shrink-0 px-3 py-1 rounded-full bg-ink text-white hover:bg-black text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <LogOut size={12} />
          <span>Keluar dari Latihan</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
