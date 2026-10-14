import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Package, 
  AlertTriangle, 
  History, 
  ShoppingCart, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Receipt, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Product, Transaction, Role, User } from '../../types';
import { formatCurrency, formatNumber, cn } from '../../lib/utils';
import { Card, Button, Badge, Skeleton } from '../ui';
import { CountUp, StaggerList, StaggerItem } from '../motion';

export interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  user: User;
  onNavigate: (view: 'dashboard' | 'pos' | 'inventory' | 'reports') => void;
  onNavigateToInventoryWithFilter: (stockTab: 'all' | 'low' | 'out') => void;
  onNavigateToReportsWithPeriod: (period: 'today' | '7days' | '30days' | 'custom') => void;
  onRestockProduct: (productId: string) => void;
  onViewReceipt: (tx: Transaction) => void;
  onQuickAction: (actionKey: string, payload?: any) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  transactions,
  user,
  onNavigate,
  onNavigateToInventoryWithFilter,
  onNavigateToReportsWithPeriod,
  onRestockProduct,
  onViewReceipt,
  onQuickAction,
  showToast,
}) => {
  // 1. Shimmer Skeleton Loading State (simulated on entrance, fast and smooth)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 260);
    return () => clearTimeout(timer);
  }, []);

  // 2. Chart Controls
  const [chartMetric, setChartMetric] = useState<'omzet' | 'count'>('omzet');
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);

  // 3. Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  }, []);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // 4. Perhitungan Statistik Hari Ini & Kemarin (untuk badge perbandingan)
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let salesToday = 0;
    let txToday = 0;
    let salesYesterday = 0;
    let txYesterday = 0;

    transactions.forEach((tx) => {
      const txDateStr = new Date(tx.date).toISOString().split('T')[0];
      if (txDateStr === todayStr) {
        salesToday += tx.total;
        txToday += 1;
      } else if (txDateStr === yesterdayStr) {
        salesYesterday += tx.total;
        txYesterday += 1;
      }
    });

    // Low stock count (stock <= minStock)
    const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
    const lowStockCount = lowStockProducts.length;

    // Helper calculate diff badge
    const calcDiff = (curr: number, prev: number) => {
      if (prev === 0) {
        return { isNew: true, text: 'Baru', trend: 'up' as const };
      }
      const pct = Math.round(((curr - prev) / prev) * 100);
      if (pct > 0) return { isNew: false, text: `+${pct}% vs kmarin`, trend: 'up' as const };
      if (pct < 0) return { isNew: false, text: `${pct}% vs kmarin`, trend: 'down' as const };
      return { isNew: false, text: `0% vs kmarin`, trend: 'neutral' as const };
    };

    return {
      salesToday,
      txToday,
      salesDiff: calcDiff(salesToday, salesYesterday),
      txDiff: calcDiff(txToday, txYesterday),
      totalProducts: products.length,
      lowStockCount,
      lowStockProducts,
    };
  }, [transactions, products]);

  // 5. Tren Penjualan 7 atau 30 Hari Terakhir
  const trendData = useMemo(() => {
    const days = chartPeriod;
    const result: { dateStr: string; label: string; omzet: number; count: number; isToday: boolean }[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const map = new Map<string, { omzet: number; count: number }>();
    transactions.forEach((tx) => {
      const dStr = new Date(tx.date).toISOString().split('T')[0];
      const prev = map.get(dStr) || { omzet: 0, count: 0 };
      map.set(dStr, { omzet: prev.omzet + tx.total, count: prev.count + 1 });
    });

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const entry = map.get(dStr) || { omzet: 0, count: 0 };
      
      const label = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: days === 7 ? 'short' : 'numeric',
      });

      result.push({
        dateStr: dStr,
        label,
        omzet: entry.omzet,
        count: entry.count,
        isToday: dStr === todayStr,
      });
    }

    // Hitung berapa hari yang memiliki data transaksi riil (>0)
    const activeDaysCount = result.filter((r) => r.count > 0).length;

    return {
      chartData: result,
      activeDaysCount,
      hasFewDaysData: activeDaysCount < 3,
    };
  }, [transactions, chartPeriod]);

  // 6. Produk Terlaris (Top 5)
  const topProducts = useMemo(() => {
    const salesMap = new Map<string, { name: string; quantity: number; revenue: number; category: string }>();

    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const existing = salesMap.get(item.id) || {
          name: item.name,
          quantity: 0,
          revenue: 0,
          category: item.category,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.quantity * item.sellPrice;
        salesMap.set(item.id, existing);
      });
    });

    const sorted = Array.from(salesMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const maxQty = sorted.length > 0 ? sorted[0].quantity : 1;

    return {
      list: sorted,
      maxQty,
    };
  }, [transactions]);

  // 7. Transaksi Terakhir (Top 5)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Helper Initials for product badge
  const getProductInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // 8. SKELETON SHIMMER DISPLAY
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Greeting Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface/50 border border-ink/10 rounded-[24px] p-5">
          <div className="space-y-2">
            <Skeleton variant="rounded" className="h-6 w-48" />
            <Skeleton variant="rounded" className="h-4 w-36" />
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rounded" className="h-10 w-32 rounded-full" />
            <Skeleton variant="rounded" className="h-10 w-32 rounded-full" />
          </div>
        </div>

        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="card" className="h-[148px]" />
          ))}
        </div>

        {/* Row 2: Trend & Top Products Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <Skeleton variant="card" className="h-[360px]" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton variant="card" className="h-[360px]" />
          </div>
        </div>

        {/* Row 3: Low stock & Recent Tx Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <Skeleton variant="card" className="h-[330px]" />
          </div>
          <div className="lg:col-span-6">
            <Skeleton variant="card" className="h-[330px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================== */}
      {/* 0. HEADER SAPAAN & TOMBOL PINTASAN                         */}
      {/* ========================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-surface border border-ink/15 rounded-[24px] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              {greeting}, {user.username}!
            </h2>
          </div>
          <p className="text-[13px] text-muted font-medium flex items-center gap-1.5">
            <Calendar size={13} className="text-ink/60" />
            {formattedDate} • Ringkasan aktivitas dan performa toko Anda hari ini
          </p>
        </div>

        {/* Action Buttons: Transaksi Baru & Tambah Produk */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button
            onClick={() => onQuickAction('new_transaction')}
            className="flex-1 md:flex-none py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ShoppingCart size={15} />
            <span>Transaksi Baru</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => onQuickAction('add_product')}
            className="flex-1 md:flex-none py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 border-ink/20 hover:border-ink"
          >
            <Plus size={15} />
            <span>Tambah Produk</span>
          </Button>
        </div>
      </motion.div>

      {/* ========================================================== */}
      {/* 1. BARIS RINGKASAN: 4 KARTU STATISTIK PASTEL               */}
      {/* ========================================================== */}
      <StaggerList data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Penjualan Hari Ini (#F5D76E Kuning Pastel) -> Klik: Laporan Periode "Hari Ini" */}
        <StaggerItem>
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigateToReportsWithPeriod('today')}
            className="bg-[#F5D76E] rounded-[24px] border border-ink/15 p-5 flex flex-col justify-between min-h-[148px] cursor-pointer hover:border-ink transition-all group relative overflow-hidden select-none"
            role="button"
            tabIndex={0}
            title="Klik untuk membuka Laporan Penjualan Hari Ini"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigateToReportsWithPeriod('today');
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                Penjualan Hari Ini
              </span>
              <div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center text-ink transition-colors">
                <TrendingUp size={16} />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-3xl md:text-[34px] font-bold text-ink tabular-nums leading-none tracking-tight">
                <CountUp value={stats.salesToday} formatter={formatCurrency} />
              </p>
              
              <div className="mt-2.5 flex items-center justify-between">
                <span className="bg-white/90 text-ink rounded-full text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1 border border-ink/10">
                  {stats.salesDiff.isNew ? (
                    'Baru'
                  ) : (
                    <>
                      {stats.salesDiff.trend === 'up' && <TrendingUp size={11} className="text-green" />}
                      {stats.salesDiff.trend === 'down' && <TrendingDown size={11} className="text-pink" />}
                      {stats.salesDiff.text}
                    </>
                  )}
                </span>
                <span className="text-[11px] font-semibold text-ink/75 group-hover:text-ink flex items-center gap-0.5 transition-colors">
                  Detail <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </motion.div>
        </StaggerItem>

        {/* Card 2: Katalog Produk (#B7C7F2 Biru Pastel) -> Klik: Inventori */}
        <StaggerItem>
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigate('inventory')}
            className="bg-[#B7C7F2] rounded-[24px] border border-ink/15 p-5 flex flex-col justify-between min-h-[148px] cursor-pointer hover:border-ink transition-all group relative overflow-hidden select-none"
            role="button"
            tabIndex={0}
            title="Klik untuk membuka Katalog Inventori"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigate('inventory');
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                Katalog Produk
              </span>
              <div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center text-ink transition-colors">
                <Package size={16} />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-3xl md:text-[34px] font-bold text-ink tabular-nums leading-none tracking-tight">
                <CountUp value={stats.totalProducts} />
                <span className="text-base font-semibold text-ink/75 ml-1.5">item</span>
              </p>

              <div className="mt-2.5 flex items-center justify-between">
                <span className="bg-white/90 text-ink rounded-full text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1 border border-ink/10">
                  Semua Kategori
                </span>
                <span className="text-[11px] font-semibold text-ink/75 group-hover:text-ink flex items-center gap-0.5 transition-colors">
                  Katalog <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </motion.div>
        </StaggerItem>

        {/* Card 3: Perlu Restok (#F4B6D2 Pink Pastel) -> Klik: Inventori terfilter stok rendah */}
        <StaggerItem>
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigateToInventoryWithFilter('low')}
            className="bg-[#F4B6D2] rounded-[24px] border border-ink/15 p-5 flex flex-col justify-between min-h-[148px] cursor-pointer hover:border-ink transition-all group relative overflow-hidden select-none"
            role="button"
            tabIndex={0}
            title="Klik untuk melihat produk yang perlu restok di Inventori"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigateToInventoryWithFilter('low');
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                Perlu Restok
              </span>
              <div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center text-ink transition-colors">
                <AlertTriangle size={16} />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-3xl md:text-[34px] font-bold text-ink tabular-nums leading-none tracking-tight">
                <CountUp value={stats.lowStockCount} />
                <span className="text-base font-semibold text-ink/75 ml-1.5">produk</span>
              </p>

              <div className="mt-2.5 flex items-center justify-between">
                <span className={cn(
                  "rounded-full text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1 border border-ink/10",
                  stats.lowStockCount > 0 ? "bg-ink text-white" : "bg-white/90 text-ink"
                )}>
                  {stats.lowStockCount > 0 ? 'Perlu Tindakan' : 'Stok Aman'}
                </span>
                <span className="text-[11px] font-semibold text-ink/75 group-hover:text-ink flex items-center gap-0.5 transition-colors">
                  Filter <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </motion.div>
        </StaggerItem>

        {/* Card 4: Total Transaksi (#8FA866 Hijau Pastel) -> Klik: Laporan Penjualan */}
        <StaggerItem>
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigate('reports')}
            className="bg-[#8FA866] rounded-[24px] border border-ink/15 p-5 flex flex-col justify-between min-h-[148px] cursor-pointer hover:border-ink transition-all group relative overflow-hidden select-none"
            role="button"
            tabIndex={0}
            title="Klik untuk membuka Riwayat Laporan Penjualan"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigate('reports');
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Total Transaksi
              </span>
              <div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center text-ink transition-colors">
                <History size={16} />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-3xl md:text-[34px] font-bold text-white tabular-nums leading-none tracking-tight">
                <CountUp value={stats.txToday} />
                <span className="text-base font-medium text-white/80 ml-1.5">hari ini</span>
              </p>

              <div className="mt-2.5 flex items-center justify-between">
                <span className="bg-white/95 text-ink rounded-full text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1 border border-ink/10">
                  {stats.txDiff.isNew ? (
                    'Baru'
                  ) : (
                    <>
                      {stats.txDiff.trend === 'up' && <TrendingUp size={11} className="text-green" />}
                      {stats.txDiff.trend === 'down' && <TrendingDown size={11} className="text-pink" />}
                      {stats.txDiff.text}
                    </>
                  )}
                </span>
                <span className="text-[11px] font-semibold text-white/90 group-hover:text-white flex items-center gap-0.5 transition-colors">
                  Laporan <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </motion.div>
        </StaggerItem>

      </StaggerList>

      {/* ========================================================== */}
      {/* 2. BARIS 2: TREN PENJUALAN (8 KOLOM) + PRODUK TERLARIS (4)  */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Kolom Kiri: Tren Penjualan (8 Kolom) */}
        <div className="lg:col-span-8 flex flex-col">
          <Card
            title="Tren Penjualan"
            subtitle={`Analisis ${chartMetric === 'omzet' ? 'omzet pendapatan' : 'frekuensi transaksi'} ${chartPeriod} hari terakhir`}
            className="flex-1 flex flex-col justify-between"
            extra={
              <div className="flex flex-wrap items-center gap-2">
                {/* Segmented Control 7 / 30 Hari */}
                <div className="bg-bg border border-ink/15 rounded-full p-0.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setChartPeriod(7)}
                    className={cn(
                      "relative px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                      chartPeriod === 7 ? "text-white" : "text-muted hover:text-ink"
                    )}
                  >
                    {chartPeriod === 7 && (
                      <motion.div
                        layoutId="dashboardPeriodPill"
                        className="absolute inset-0 bg-ink rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    7 Hari
                  </button>

                  <button
                    type="button"
                    onClick={() => setChartPeriod(30)}
                    className={cn(
                      "relative px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                      chartPeriod === 30 ? "text-white" : "text-muted hover:text-ink"
                    )}
                  >
                    {chartPeriod === 30 && (
                      <motion.div
                        layoutId="dashboardPeriodPill"
                        className="absolute inset-0 bg-ink rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    30 Hari
                  </button>
                </div>

                {/* Segmented Control Omzet / Transaksi */}
                <div className="bg-bg border border-ink/15 rounded-full p-0.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setChartMetric('omzet')}
                    className={cn(
                      "relative px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                      chartMetric === 'omzet' ? "text-white" : "text-muted hover:text-ink"
                    )}
                  >
                    {chartMetric === 'omzet' && (
                      <motion.div
                        layoutId="dashboardMetricPill"
                        className="absolute inset-0 bg-ink rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    Omzet
                  </button>

                  <button
                    type="button"
                    onClick={() => setChartMetric('count')}
                    className={cn(
                      "relative px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                      chartMetric === 'count' ? "text-white" : "text-muted hover:text-ink"
                    )}
                  >
                    {chartMetric === 'count' && (
                      <motion.div
                        layoutId="dashboardMetricPill"
                        className="absolute inset-0 bg-ink rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    Transaksi
                  </button>
                </div>
              </div>
            }
          >
            {/* Callout bila data kurang dari 3 hari */}
            {trendData.hasFewDaysData && (
              <div className="mb-4 bg-bg border border-ink/15 rounded-[18px] p-3.5 flex items-center justify-between gap-3 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-yellow/40 border border-yellow/60 flex items-center justify-center text-ink shrink-0">
                    <Info size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">Data transaksi masih sedikit ({trendData.activeDaysCount} hari aktif)</p>
                    <p className="text-[11px] text-muted">Mulai transaksi di Kasir POS untuk memperkaya grafik tren.</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onQuickAction('new_transaction')}
                  className="shrink-0 text-xs py-1.5 px-3 rounded-full"
                >
                  Buka Kasir
                </Button>
              </div>
            )}

            {/* Recharts Bar Chart */}
            <div className="h-[270px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dcd5c2" opacity={0.7} />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#545454', fontSize: 11, fontWeight: 500 }} 
                    dy={6}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#545454', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(v) => {
                      if (chartMetric === 'omzet') {
                        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
                        if (v >= 1000) return `${Math.round(v / 1000)}k`;
                        return `${v}`;
                      }
                      return `${v}`;
                    }}
                    dx={-4}
                  />
                  <Tooltip
                    cursor={{ fill: '#F6F1E3', opacity: 0.6 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-surface rounded-[16px] border border-ink/20 p-3 shadow-md text-xs select-none min-w-[140px]">
                            <p className="font-semibold text-ink text-[13px] border-b border-ink/10 pb-1.5 mb-1.5 flex items-center justify-between">
                              <span>{d.label}</span>
                              {d.isToday && (
                                <span className="text-[10px] bg-ink text-white px-1.5 py-0.5 rounded-full font-bold">
                                  Hari Ini
                                </span>
                              )}
                            </p>
                            <div className="space-y-1 font-medium">
                              <p className="text-muted flex justify-between">
                                <span>Omzet:</span>
                                <strong className="text-ink">{formatCurrency(d.omzet)}</strong>
                              </p>
                              <p className="text-muted flex justify-between">
                                <span>Transaksi:</span>
                                <strong className="text-ink">{d.count} kali</strong>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey={chartMetric} 
                    radius={[8, 8, 0, 0]} 
                    barSize={chartPeriod === 7 ? 36 : 14}
                    isAnimationActive={true}
                  >
                    {trendData.chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isToday ? '#111111' : '#B7C7F2'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 mt-2 border-t border-ink/10 flex items-center justify-between text-xs text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ink inline-block" /> Hari ini
                <span className="w-2.5 h-2.5 rounded-full bg-[#B7C7F2] inline-block ml-2" /> Hari sebelumnya
              </span>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="text-ink font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Lihat Laporan Lengkap <ArrowRight size={12} />
              </button>
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Produk Terlaris (4 Kolom) */}
        <div className="lg:col-span-4 flex flex-col">
          <Card
            title="Produk Terlaris"
            subtitle="5 produk dengan volume terjual tertinggi"
            className="flex-1 flex flex-col justify-between"
            extra={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigate('reports')}
                className="text-xs px-2.5 py-1 rounded-full"
              >
                Detail
              </Button>
            }
          >
            {topProducts.list.length === 0 ? (
              <div className="py-12 text-center bg-bg rounded-[20px] border border-ink/10 text-xs text-muted font-medium">
                <Package size={28} className="mx-auto text-ink/30 mb-2" />
                <p className="font-semibold text-ink text-sm">Belum Ada Penjualan</p>
                <p className="mt-1">Transaksi pertama di Kasir POS akan memunculkan data di sini.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {topProducts.list.map((item, idx) => {
                  const pct = Math.round((item.quantity / topProducts.maxQty) * 100);
                  const rankColors = [
                    'bg-[#F5D76E] border-yellow/60 text-ink',
                    'bg-[#B7C7F2] border-blue/60 text-ink',
                    'bg-[#F4B6D2] border-pink/60 text-ink',
                    'bg-bg border-ink/15 text-muted',
                    'bg-bg border-ink/15 text-muted',
                  ];

                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank Circle Badge */}
                          <div className={cn(
                            "w-6 h-6 rounded-full border flex items-center justify-center font-bold text-[11px] shrink-0",
                            rankColors[idx]
                          )}>
                            {idx + 1}
                          </div>

                          {/* Product Initials & Name */}
                          <div className="min-w-0">
                            <p className="font-semibold text-ink truncate text-[13px]">{item.name}</p>
                            <span className="text-[11px] text-muted">{item.category}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <p className="font-bold text-ink tabular-nums">{item.quantity} terjual</p>
                          <p className="text-[11px] text-muted tabular-nums">{formatCurrency(item.revenue)}</p>
                        </div>
                      </div>

                      {/* Bar tipis proporsional */}
                      <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.08 }}
                          className={cn(
                            "h-full rounded-full",
                            idx === 0 ? "bg-ink" : idx === 1 ? "bg-blue-600" : "bg-pink-600"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 mt-3 border-t border-ink/10 text-center">
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-xs text-muted hover:text-ink font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                Cek stok seluruh produk <ChevronRight size={13} />
              </button>
            </div>
          </Card>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 3. BARIS 3: PERINGATAN STOK RENDAH (6) + TRANSAKSI TERAKHIR (6) */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Kolom Kiri: Peringatan Stok Rendah (6 Kolom) */}
        <div data-tour="dashboard-low-stock" className="lg:col-span-6 flex flex-col">
          <Card
            title="Peringatan Stok Rendah"
            subtitle="Produk yang berada di bawah atau sama dengan stok minimum"
            className="flex-1 flex flex-col justify-between"
            extra={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigateToInventoryWithFilter('low')}
                className="text-xs px-2.5 py-1 rounded-full"
              >
                Kelola Inventori
              </Button>
            }
          >
            {stats.lowStockProducts.length === 0 ? (
              <div className="py-12 px-4 text-center bg-bg rounded-[22px] border border-ink/10 select-none">
                <div className="w-12 h-12 rounded-full bg-[#8FA866]/30 border border-[#8FA866]/50 flex items-center justify-center text-ink mx-auto mb-3">
                  <CheckCircle2 size={24} className="text-green-700" />
                </div>
                <h4 className="font-semibold text-ink text-sm">Persediaan Stok Aman</h4>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  Semua {products.length} produk Anda saat ini berada di atas batas stok minimum toko.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.slice(0, 5).map((p) => {
                  const isOut = p.stock === 0;
                  const ratio = p.minStock > 0 ? Math.min(100, Math.round((p.stock / p.minStock) * 100)) : 0;

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "p-3.5 rounded-[18px] border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors",
                        isOut ? "bg-pink/30 border-pink/60" : "bg-yellow/20 border-yellow/40"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                            isOut ? "bg-pink-700 text-white" : "bg-yellow-700 text-white"
                          )}>
                            {isOut ? 'Habis' : 'Menipis'}
                          </span>
                          <h5 className="font-semibold text-ink text-[13px] truncate">{p.name}</h5>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                          <span>Sisa: <strong className="text-ink">{p.stock} {p.unit}</strong> (Min: {p.minStock})</span>
                          <span className="tabular-nums font-semibold">{ratio}%</span>
                        </div>

                        {/* Progress Bar Tipis */}
                        <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${ratio}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              isOut ? "bg-pink-700" : "bg-yellow-600"
                            )}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-end">
                        <Button
                          size="sm"
                          onClick={() => onRestockProduct(p.id)}
                          className="text-xs py-1.5 px-3 rounded-full flex items-center gap-1.5"
                        >
                          <Plus size={13} />
                          <span>Restok</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {stats.lowStockProducts.length > 5 && (
              <div className="pt-3 mt-3 border-t border-ink/10 text-center">
                <button
                  type="button"
                  onClick={() => onNavigateToInventoryWithFilter('low')}
                  className="text-xs font-semibold text-ink hover:underline cursor-pointer"
                >
                  +{stats.lowStockProducts.length - 5} produk lainnya membutuhkan perhatian
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Kolom Kanan: Transaksi Terakhir (6 Kolom) */}
        <div className="lg:col-span-6 flex flex-col">
          <Card
            title="Transaksi Terakhir"
            subtitle="5 transaksi penjualan kasir terbaru"
            className="flex-1 flex flex-col justify-between"
            extra={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigate('reports')}
                className="text-xs px-2.5 py-1 rounded-full"
              >
                Lihat Semua
              </Button>
            }
          >
            {recentTransactions.length === 0 ? (
              <div className="py-12 px-4 text-center bg-bg rounded-[22px] border border-ink/10 select-none">
                <div className="w-12 h-12 rounded-full bg-bg border border-ink/15 flex items-center justify-center text-muted mx-auto mb-3">
                  <Receipt size={24} />
                </div>
                <h4 className="font-semibold text-ink text-sm">Belum Ada Transaksi</h4>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  Belum ada struk pembayaran yang tercatat dalam sistem. Buka kasir untuk melayani pesanan.
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    onClick={() => onQuickAction('new_transaction')}
                    className="text-xs px-4 py-2 rounded-full"
                  >
                    Buka Kasir POS
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-ink/10">
                {recentTransactions.map((tx) => {
                  const txTime = new Date(tx.date).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const txDate = new Date(tx.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  });

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onViewReceipt(tx)}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-bg/50 px-2 rounded-[14px] transition-colors cursor-pointer group"
                      role="button"
                      tabIndex={0}
                      title="Klik untuk membuka rincian struk"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onViewReceipt(tx);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-surface border border-ink/15 flex items-center justify-center text-ink shrink-0 group-hover:border-ink transition-colors">
                          <Receipt size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-ink text-[13px] truncate">
                              #{tx.id.split('-')[1] || tx.id}
                            </p>
                            <span className="text-[10px] font-semibold bg-bg text-ink border border-ink/15 px-1.5 py-0.2 rounded-md">
                              {tx.paymentMethod}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted truncate mt-0.5">
                            {txDate}, {txTime} • {tx.userName} • {tx.items.length} item
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-ink text-[13px] tabular-nums">
                          {formatCurrency(tx.total)}
                        </p>
                        <span className="text-[10px] text-muted group-hover:text-ink font-semibold flex items-center justify-end gap-0.5 transition-colors">
                          Lihat struk <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 mt-3 border-t border-ink/10 flex items-center justify-between text-xs text-muted font-medium">
              <span>Menampilkan 5 aktivitas kasir terkini</span>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="text-ink font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Seluruh Transaksi <ArrowRight size={12} />
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
