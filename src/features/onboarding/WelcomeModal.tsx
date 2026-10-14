import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShoppingCart, CreditCard, Receipt, Package, BarChart3, Users, X, ArrowRight } from 'lucide-react';
import { User, Role } from '../../types';
import { Button } from '../../components/ui';

export interface WelcomeModalProps {
  isOpen: boolean;
  user: User;
  onStartTour: () => void;
  onLater: () => void;
  onDismissForever?: () => void;
  onNeverAgain?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  user,
  onStartTour,
  onLater,
  onDismissForever,
  onNeverAgain,
}) => {
  const handleDismissForever = onDismissForever || onNeverAgain || onLater;
  if (!isOpen) return null;

  const displayName = user.name || user.username;
  const isAdmin = user.role === Role.ADMIN;

  const points = isAdmin
    ? [
        {
          icon: Package,
          title: 'Kelola Katalog & Stok',
          desc: 'Atur harga modal, harga jual, serta batas stok minimum untuk peringatan otomatis.',
          color: 'bg-yellow/50 text-ink',
        },
        {
          icon: BarChart3,
          title: 'Pantau Omzet & Kinerja',
          desc: 'Analisis grafik penjualan harian, tren produk terlaris, dan ekspor laporan ke CSV.',
          color: 'bg-blue/50 text-ink',
        },
        {
          icon: Users,
          title: 'Akses Tim & Akun Kasir',
          desc: 'Buat akun staf kasir, audit aktivitas shift, dan kelola peran dengan kontrol hak akses.',
          color: 'bg-pink/50 text-ink',
        },
      ]
    : [
        {
          icon: ShoppingCart,
          title: 'Jual Cepat & Scan Barcode',
          desc: 'Cari produk dalam hitungan detik dengan tombol "/", scan barcode fisik, atau klik katalog.',
          color: 'bg-yellow/50 text-ink',
        },
        {
          icon: CreditCard,
          title: 'Bayar Fleksibel & Uang Cepat',
          desc: 'Terima pembayaran Tunai dengan hitungan kembalian instan atau metode non-tunai QRIS.',
          color: 'bg-blue/50 text-ink',
        },
        {
          icon: Receipt,
          title: 'Cetak Struk & Riwayat Shift',
          desc: 'Cetak bukti transaksi dan pantau ringkasan performa shift kasir harian Anda.',
          color: 'bg-pink/50 text-ink',
        },
      ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Soft dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onLater}
          className="fixed inset-0 bg-ink/50 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal dialog with scale 0.96 -> 1 + fade */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg bg-bg rounded-[28px] border border-ink/20 shadow-2xl p-6 sm:p-7 z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[18px] bg-pink border border-ink/15 flex items-center justify-center text-ink shrink-0 shadow-xs">
                <Sparkles size={20} strokeWidth={2.2} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted bg-surface px-2.5 py-0.5 rounded-full border border-ink/10">
                  {isAdmin ? 'Panduan Administrator' : 'Panduan Kasir'}
                </span>
                <h3
                  id="welcome-title"
                  className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-1 capitalize"
                >
                  Selamat Datang di SobatDagang, {displayName}!
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onLater}
              className="w-8 h-8 rounded-full border border-ink/15 flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              aria-label="Tutup sambutan"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs sm:text-[13px] text-muted leading-relaxed mb-5">
            SobatDagang siap membantu operasional kasir dan toko Anda lebih cepat, rapi, dan efisien.
            Berikut 3 poin penting untuk memulai peran Anda:
          </p>

          {/* 3 Role Highlights */}
          <div className="space-y-3 mb-6">
            {points.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-surface rounded-[20px] border border-ink/10 flex items-start gap-3.5"
                >
                  <div
                    className={`w-9 h-9 rounded-[14px] ${p.color} border border-ink/15 flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon size={17} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-ink">{p.title}</h4>
                    <p className="text-[12px] text-muted leading-normal mt-0.5">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons: 3 Options */}
          <div className="space-y-3 pt-2 border-t border-ink/10">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button
                onClick={onStartTour}
                className="flex-1 py-3 text-xs sm:text-sm font-semibold rounded-full bg-ink text-white hover:bg-black flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Mulai Tur Interaktif</span>
                <ArrowRight size={15} />
              </Button>

              <Button
                variant="secondary"
                onClick={onLater}
                className="py-3 px-5 text-xs sm:text-sm font-semibold rounded-full border-ink/20 hover:border-ink cursor-pointer"
              >
                Lihat Nanti
              </Button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleDismissForever}
                className="text-[11px] text-muted hover:text-ink underline transition-colors cursor-pointer"
              >
                Jangan tampilkan lagi (bisa dibuka ulang dari menu Bantuan)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
