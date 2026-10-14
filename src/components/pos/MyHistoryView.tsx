import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  Search, 
  Printer, 
  Clock, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  ShoppingBag, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Store, 
  ChevronRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { Transaction, User, Role, PaymentMethod } from '../../types';
import { formatCurrency, formatNumber, cn } from '../../lib/utils';
import { Card, Button, Badge, Modal, Skeleton } from '../ui';
import { CountUp } from '../motion';

export interface MyHistoryViewProps {
  currentUser: User;
  transactions: Transaction[];
  onViewReceipt: (tx: Transaction) => void;
  onNavigateToPos: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const MyHistoryView: React.FC<MyHistoryViewProps> = ({
  currentUser,
  transactions,
  onViewReceipt,
  onNavigateToPos,
  showToast,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [shiftModalOpen, setShiftModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Filter transaksi HARI INI yang dibuat oleh pengguna saat ini SAJA
  const todayTransactions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.filter(t => {
      const isMine = t.userId === currentUser.id || t.userName.toLowerCase() === currentUser.username.toLowerCase();
      const isToday = t.date.startsWith(today);
      return isMine && isToday;
    });
  }, [transactions, currentUser]);

  // Statistik Shift Saya Hari Ini
  const shiftStats = useMemo(() => {
    const totalSales = todayTransactions.reduce((acc, t) => acc + t.total, 0);
    const totalCount = todayTransactions.length;
    
    const cashTotal = todayTransactions
      .filter(t => t.paymentMethod === PaymentMethod.CASH)
      .reduce((acc, t) => acc + t.total, 0);

    const qrisTotal = todayTransactions
      .filter(t => t.paymentMethod === PaymentMethod.QRIS)
      .reduce((acc, t) => acc + t.total, 0);

    const sortedByDate = [...todayTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstTxTime = sortedByDate[0] ? new Date(sortedByDate[0].date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
    const lastTxTime = sortedByDate[sortedByDate.length - 1] ? new Date(sortedByDate[sortedByDate.length - 1].date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

    return {
      totalSales,
      totalCount,
      cashTotal,
      qrisTotal,
      firstTxTime,
      lastTxTime,
    };
  }, [todayTransactions]);

  // Filter pencarian dan metode bayar
  const filteredList = useMemo(() => {
    let result = [...todayTransactions];

    if (filterPayment !== 'all') {
      result = result.filter(t => t.paymentMethod === filterPayment);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.id.toLowerCase().includes(q) ||
        t.items.some(it => it.name.toLowerCase().includes(q))
      );
    }

    // Urutkan transaksi terbaru di atas
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [todayTransactions, filterPayment, searchQuery]);

  const handlePrintShiftReport = () => {
    window.print();
    showToast('Mencetak rekapitulasi shift...', 'success');
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header Halaman */}
      <div className="bg-surface border border-ink/15 rounded-[24px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg border border-ink/10 text-xs font-semibold text-ink mb-2">
            <Clock size={13} />
            <span>Shift Kasir Hari Ini</span>
            <span className="text-muted">•</span>
            <span className="text-muted">{todayFormatted}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Riwayat Saya: {currentUser.username}
          </h2>
          <p className="text-[13px] text-muted font-normal mt-1">
            Pantau transaksi yang Anda tangani selama shift hari ini dan cetak ringkasan tutup shift.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setShiftModalOpen(true)}
            variant="secondary"
            className="rounded-full py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <FileText size={15} />
            Tutup Shift & Rekap
          </Button>

          <Button
            onClick={onNavigateToPos}
            className="rounded-full py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <ShoppingBag size={15} />
            Buka Kasir POS
          </Button>
        </div>
      </div>

      {/* 2. Kartu Metrik Shift (4 Kolom Pastel) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Penjualan Saya */}
        <div className="bg-yellow/35 border border-yellow/60 rounded-[22px] p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Penjualan Saya</span>
            <div className="w-8 h-8 rounded-full bg-yellow/60 flex items-center justify-center text-ink border border-yellow/70">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-28 rounded-lg" />
            ) : (
              <h3 className="text-2xl font-bold text-ink tracking-tight tabular-nums">
                <CountUp value={shiftStats.totalSales} formatter={formatCurrency} />
              </h3>
            )}
            <p className="text-[11px] text-muted font-medium mt-0.5">Total transaksi masuk hari ini</p>
          </div>
        </div>

        {/* Jumlah Transaksi */}
        <div className="bg-blue/35 border border-blue/60 rounded-[22px] p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Total Transaksi</span>
            <div className="w-8 h-8 rounded-full bg-blue/60 flex items-center justify-center text-ink border border-blue/70">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <h3 className="text-2xl font-bold text-ink tracking-tight tabular-nums">
                <CountUp value={shiftStats.totalCount} /> <span className="text-sm font-semibold text-muted">struk</span>
              </h3>
            )}
            <p className="text-[11px] text-muted font-medium mt-0.5">Selesai dilayani</p>
          </div>
        </div>

        {/* Pembayaran Tunai */}
        <div className="bg-green/35 border border-green/60 rounded-[22px] p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Kas Tunai (Drawer)</span>
            <div className="w-8 h-8 rounded-full bg-green/60 flex items-center justify-center text-ink border border-green/70">
              <Banknote size={16} />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <h3 className="text-2xl font-bold text-ink tracking-tight tabular-nums">
                <CountUp value={shiftStats.cashTotal} formatter={formatCurrency} />
              </h3>
            )}
            <p className="text-[11px] text-muted font-medium mt-0.5">Uang fisik di kasir</p>
          </div>
        </div>

        {/* Pembayaran Non-Tunai / QRIS */}
        <div className="bg-pink/35 border border-pink/60 rounded-[22px] p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Non-Tunai (QRIS)</span>
            <div className="w-8 h-8 rounded-full bg-pink/60 flex items-center justify-center text-ink border border-pink/70">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <h3 className="text-2xl font-bold text-ink tracking-tight tabular-nums">
                <CountUp value={shiftStats.qrisTotal} formatter={formatCurrency} />
              </h3>
            )}
            <p className="text-[11px] text-muted font-medium mt-0.5">Transfer rekening / QRIS</p>
          </div>
        </div>
      </div>

      {/* 3. Daftar Transaksi Saya */}
      <div className="bg-surface border border-ink/15 rounded-[24px] p-5 sm:p-6 space-y-4">
        {/* Toolbar Pencarian & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-ink/10">
          <div>
            <h3 className="text-base font-bold text-ink">Daftar Struk Shift Hari Ini</h3>
            <p className="text-xs text-muted">
              {filteredList.length} transaksi tercatat atas nama {currentUser.username}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex items-center min-w-[200px]">
              <Search size={14} className="absolute left-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Cari ID struk / produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg border border-ink/15 rounded-full pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors"
              />
            </div>

            {/* Filter Payment Method */}
            <div className="flex bg-bg p-0.5 rounded-full border border-ink/15">
              {[
                { id: 'all', label: 'Semua' },
                { id: PaymentMethod.CASH, label: 'Tunai' },
                { id: PaymentMethod.QRIS, label: 'QRIS' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterPayment(f.id)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer",
                    filterPayment === f.id ? "bg-ink text-white" : "text-muted hover:text-ink"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / List */}
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-bg/60 rounded-[18px] animate-pulse border border-ink/10" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 px-4 bg-bg rounded-[22px] border border-ink/10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-surface border border-ink/15 flex items-center justify-center text-muted">
              <Receipt size={26} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-ink">Belum Ada Transaksi Hari Ini</h4>
              <p className="text-xs text-muted max-w-sm">
                {searchQuery || filterPayment !== 'all' 
                  ? 'Tidak ada transaksi yang cocok dengan filter pencarian.' 
                  : 'Anda belum melayani transaksi di kasir pada shift ini. Mulai melayani pelanggan sekarang.'}
              </p>
            </div>
            {searchQuery || filterPayment !== 'all' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setSearchQuery(''); setFilterPayment('all'); }}
                className="mt-2"
              >
                Reset Filter
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onNavigateToPos}
                className="mt-2 rounded-full"
              >
                Mulai Transaksi di Kasir
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-ink/10">
            {filteredList.map((tx) => {
              const d = new Date(tx.date);
              const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              const totalItems = tx.items.reduce((s, it) => s + it.quantity, 0);

              return (
                <div
                  key={tx.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-bg/50 rounded-[16px] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-bg border border-ink/15 flex items-center justify-center text-ink shrink-0">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px] text-ink">
                          INV-#{tx.id.split('-')[1] || tx.id}
                        </span>
                        <span className="text-[11px] font-medium text-muted bg-bg px-2 py-0.5 rounded-full border border-ink/10">
                          {timeStr}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          tx.paymentMethod === PaymentMethod.CASH
                            ? "bg-green/40 border-green/60 text-ink"
                            : "bg-pink/40 border-pink/60 text-ink"
                        )}>
                          {tx.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-muted truncate max-w-md mt-0.5">
                        {totalItems} barang: {tx.items.map(it => `${it.name} (${it.quantity})`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-muted block">Total Tagihan</span>
                      <span className="font-bold text-sm text-ink tabular-nums">
                        {formatCurrency(tx.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewReceipt(tx)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Receipt size={13} />
                        Lihat Struk
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          onViewReceipt(tx);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="rounded-full px-2.5 py-1.5 text-xs font-semibold"
                        title="Cetak Ulang Struk"
                      >
                        <Printer size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Modal Ringkasan Tutup Shift */}
      <Modal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        title="Ringkasan Tutup Shift"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div id="shift-summary-print" className="bg-bg p-5 rounded-[22px] border border-ink/15 space-y-3.5 text-xs text-ink">
            <div className="text-center pb-3 border-b border-ink/15">
              <h4 className="font-bold text-base tracking-tight text-ink">SobatDagang POS</h4>
              <p className="text-xs text-muted font-medium mt-0.5">Laporan Rekapitulasi Kasir Shift</p>
              <p className="text-[11px] text-muted mt-1">{todayFormatted}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Nama Kasir</span>
                <span className="font-bold text-ink">{currentUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">User ID</span>
                <span className="font-mono text-muted text-[11px]">#{currentUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Jam Transaksi Pertama</span>
                <span className="font-medium text-ink">{shiftStats.firstTxTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Jam Transaksi Terakhir</span>
                <span className="font-medium text-ink">{shiftStats.lastTxTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total Jumlah Struk</span>
                <span className="font-bold text-ink">{shiftStats.totalCount} transaksi</span>
              </div>
            </div>

            <div className="pt-3 border-t border-ink/15 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted">Kas Tunai di Laci (Drawer)</span>
                <span className="font-bold text-ink text-sm tabular-nums">
                  {formatCurrency(shiftStats.cashTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted">Total QRIS / Non-Tunai</span>
                <span className="font-bold text-ink text-sm tabular-nums">
                  {formatCurrency(shiftStats.qrisTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-ink/20 text-sm">
                <span className="font-bold text-ink">TOTAL AKUMULASI SHIFT</span>
                <span className="font-extrabold text-ink text-base tabular-nums">
                  {formatCurrency(shiftStats.totalSales)}
                </span>
              </div>
            </div>

            {/* Kolom Tanda Tangan Kasir & Supervisor */}
            <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[11px]">
              <div>
                <p className="text-muted mb-8">Kasir Bertugas</p>
                <p className="font-bold text-ink border-t border-ink/30 pt-1">({currentUser.username})</p>
              </div>
              <div>
                <p className="text-muted mb-8">Supervisor / Admin</p>
                <p className="font-bold text-ink border-t border-ink/30 pt-1">( .................... )</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              className="flex-1 py-2.5 text-xs font-semibold rounded-full"
              onClick={() => setShiftModalOpen(false)}
            >
              Tutup
            </Button>
            <Button
              className="flex-1 py-2.5 text-xs font-semibold rounded-full flex items-center justify-center gap-2"
              onClick={handlePrintShiftReport}
            >
              <Printer size={15} />
              Cetak Ringkasan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
