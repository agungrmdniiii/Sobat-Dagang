import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Download, 
  Search, 
  History, 
  Printer, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  PieChart as PieIcon, 
  BarChart3, 
  Layers, 
  ArrowUpDown, 
  ShoppingBag, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  Store,
  ExternalLink,
  Users,
  Clock,
  Info,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  ReferenceLine
} from 'recharts';
import { Transaction, Product, PaymentMethod } from '../../types';
import { CATEGORIES } from '../../constants';
import { cn, formatCurrency, formatNumber } from '../../lib/utils';
import { Card, Button, Badge, Modal, Drawer, Skeleton } from '../ui';
import { CountUp } from '../motion';
import { ContextHelp } from '../../features/onboarding';

export interface SalesReportsProps {
  transactions: Transaction[];
  products: Product[];
  initialPeriod?: PeriodFilter;
  onViewReceipt?: (tx: Transaction) => void;
  onNavigateToPos: () => void;
  showToast: (message: string, type?: 'success' | 'error', action?: { label: string; onClick: () => void }) => void;
}

export type PeriodFilter = 'today' | '7days' | '30days' | 'custom';

// Palette token yang konsisten
const PASTEL_PALETTE = ['#F5D76E', '#B7C7F2', '#F4B6D2', '#8FA866', '#E5A93C', '#9BB4E8', '#E697B7', '#7C9953'];

export const SalesReports: React.FC<SalesReportsProps> = ({
  transactions,
  products,
  initialPeriod = '7days',
  onViewReceipt,
  onNavigateToPos,
  showToast,
}) => {
  // Period states
  const [period, setPeriod] = useState<PeriodFilter>(initialPeriod);
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [datePickerPopoverOpen, setDatePickerPopoverOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Sync initialPeriod if prop changes
  useEffect(() => {
    if (initialPeriod) {
      setPeriod(initialPeriod);
    }
  }, [initialPeriod]);

  // Loading Skeleton State for smooth transitions when period changes
  const [isTransitioning, setIsTransitioning] = useState(false);
  const handlePeriodChange = (newPeriod: PeriodFilter) => {
    setIsTransitioning(true);
    setPeriod(newPeriod);
    setCurrentPage(1);
    setTimeout(() => setIsTransitioning(false), 200);
  };

  // Close Date Picker Popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerPopoverOpen(false);
      }
    };
    if (datePickerPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [datePickerPopoverOpen]);

  // Chart Metric state (omzet vs transaksi)
  const [chartMetric, setChartMetric] = useState<'omzet' | 'count'>('omzet');

  // Donut Tab state: 'sales' vs 'stock'
  const [donutTab, setDonutTab] = useState<'sales' | 'stock'>('sales');
  const [donutMetric, setDonutMetric] = useState<'revenue' | 'quantity'>('revenue');
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Table states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCashier, setFilterCashier] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Detail Drawer / Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // 1. Hitung Rentang Waktu Periode Aktif & Periode Sebelumnya
  const dateRanges = useMemo(() => {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (period === 'today') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (period === '7days') {
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      currentEnd = now;

      prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30days') {
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      currentEnd = now;

      prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // Custom
      const [sy, sm, sd] = customStart.split('-').map(Number);
      const [ey, em, ed] = customEnd.split('-').map(Number);
      currentStart = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      currentEnd = new Date(ey, em - 1, ed, 23, 59, 59, 999);

      const durationMs = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - durationMs);
    }

    return { currentStart, currentEnd, prevStart, prevEnd };
  }, [period, customStart, customEnd]);

  // Map produk untuk lookup kategori
  const productCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => {
      map.set(p.name, p.category);
      map.set(p.id, p.category);
    });
    return map;
  }, [products]);

  // Transaksi dalam periode aktif
  const currentPeriodTransactions = useMemo(() => {
    const { currentStart, currentEnd } = dateRanges;
    return transactions.filter(t => {
      const tTime = new Date(t.date).getTime();
      return tTime >= currentStart.getTime() && tTime <= currentEnd.getTime();
    });
  }, [transactions, dateRanges]);

  // Transaksi dalam periode sebelumnya
  const prevPeriodTransactions = useMemo(() => {
    const { prevStart, prevEnd } = dateRanges;
    return transactions.filter(t => {
      const tTime = new Date(t.date).getTime();
      return tTime >= prevStart.getTime() && tTime <= prevEnd.getTime();
    });
  }, [transactions, dateRanges]);

  // Daftar nama kasir unik
  const cashierList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.userName) set.add(t.userName);
    });
    return Array.from(set);
  }, [transactions]);

  // 2. Metrik Summary & Komparasi Periode Sebelumnya
  const summaryMetrics = useMemo(() => {
    const currentTotalOmzet = currentPeriodTransactions.reduce((acc, t) => acc + t.total, 0);
    const currentTxCount = currentPeriodTransactions.length;
    const currentAvgBasket = currentTxCount > 0 ? Math.round(currentTotalOmzet / currentTxCount) : 0;

    const prevTotalOmzet = prevPeriodTransactions.reduce((acc, t) => acc + t.total, 0);
    const prevTxCount = prevPeriodTransactions.length;
    const prevAvgBasket = prevTxCount > 0 ? Math.round(prevTotalOmzet / prevTxCount) : 0;

    // Helper calculate diff percentage
    const calcDiff = (curr: number, prev: number) => {
      if (prev === 0) {
        return { isNew: true, text: 'Baru', direction: 'flat' as const };
      }
      const pct = Math.round(((curr - prev) / prev) * 100);
      if (pct > 0) return { isNew: false, text: `+${pct}%`, direction: 'up' as const };
      if (pct < 0) return { isNew: false, text: `${pct}%`, direction: 'down' as const };
      return { isNew: false, text: '0%', direction: 'flat' as const };
    };

    // Best Selling Product in current period
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    currentPeriodTransactions.forEach(tx => {
      tx.items.forEach(item => {
        const existing = productSalesMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.sellPrice * item.quantity;
        productSalesMap.set(item.name, existing);
      });
    });

    const sortedProducts = Array.from(productSalesMap.values()).sort((a, b) => b.quantity - a.quantity);
    const topProduct = sortedProducts[0] || null;

    return {
      totalOmzet: currentTotalOmzet,
      omzetDiff: calcDiff(currentTotalOmzet, prevTotalOmzet),
      txCount: currentTxCount,
      txCountDiff: calcDiff(currentTxCount, prevTxCount),
      avgBasket: currentAvgBasket,
      avgBasketDiff: calcDiff(currentAvgBasket, prevAvgBasket),
      topProduct,
    };
  }, [currentPeriodTransactions, prevPeriodTransactions]);

  // 3. Data Chart Penjualan Harian (Full Axis - Hari tanpa data = 0)
  const dailyChartData = useMemo(() => {
    const { currentStart, currentEnd } = dateRanges;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Jika 'today', bucket jam per jam (08:00 - 22:00)
    if (period === 'today') {
      const hoursMap = new Map<number, { hourLabel: string; omzet: number; count: number }>();
      for (let h = 8; h <= 21; h++) {
        hoursMap.set(h, { hourLabel: `${h.toString().padStart(2, '0')}:00`, omzet: 0, count: 0 });
      }

      currentPeriodTransactions.forEach(t => {
        const d = new Date(t.date);
        const h = d.getHours();
        if (hoursMap.has(h)) {
          const item = hoursMap.get(h)!;
          item.omzet += t.total;
          item.count += 1;
        }
      });

      const list = Array.from(hoursMap.values()).map(d => ({
        label: d.hourLabel,
        omzet: d.omzet,
        count: d.count,
        isToday: true,
      }));

      const totalVal = list.reduce((acc, it) => acc + (chartMetric === 'omzet' ? it.omzet : it.count), 0);
      const avgVal = list.length > 0 ? Math.round(totalVal / list.length) : 0;
      const activePoints = list.filter(it => it.count > 0).length;

      return {
        list,
        avgVal,
        activePoints,
        hasFewDaysData: activePoints < 3,
      };
    }

    // Untuk 7days, 30days, custom: Generate sumbu penuh kalender dari currentStart sampai currentEnd
    const dayBuckets = new Map<string, { label: string; dateKey: string; omzet: number; count: number; isToday: boolean }>();
    const startCopy = new Date(currentStart);
    startCopy.setHours(0, 0, 0, 0);
    const endCopy = new Date(currentEnd);
    endCopy.setHours(23, 59, 59, 999);

    const cur = new Date(startCopy);
    while (cur.getTime() <= endCopy.getTime()) {
      const dKey = cur.toISOString().split('T')[0];
      const label = cur.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: period === '30days' ? 'numeric' : 'short',
      });
      dayBuckets.set(dKey, {
        label,
        dateKey: dKey,
        omzet: 0,
        count: 0,
        isToday: dKey === todayStr,
      });
      cur.setDate(cur.getDate() + 1);
    }

    // Isi transaksi riil
    currentPeriodTransactions.forEach(t => {
      const tKey = new Date(t.date).toISOString().split('T')[0];
      if (dayBuckets.has(tKey)) {
        const b = dayBuckets.get(tKey)!;
        b.omzet += t.total;
        b.count += 1;
      }
    });

    const list = Array.from(dayBuckets.values());
    const totalVal = list.reduce((acc, it) => acc + (chartMetric === 'omzet' ? it.omzet : it.count), 0);
    const avgVal = list.length > 0 ? Math.round(totalVal / list.length) : 0;
    const activePoints = list.filter(it => it.count > 0).length;

    return {
      list,
      avgVal,
      activePoints,
      hasFewDaysData: activePoints < 3,
    };
  }, [dateRanges, period, currentPeriodTransactions, chartMetric]);

  // 4. Data Donut: "Penjualan per Kategori" vs "Distribusi Stok"
  const donutData = useMemo(() => {
    if (donutTab === 'sales') {
      const categorySalesMap = new Map<string, { revenue: number; quantity: number }>();
      currentPeriodTransactions.forEach(tx => {
        tx.items.forEach(item => {
          const cat = productCategoryMap.get(item.name) || productCategoryMap.get(item.id) || item.category || 'Lainnya';
          const existing = categorySalesMap.get(cat) || { revenue: 0, quantity: 0 };
          existing.revenue += item.sellPrice * item.quantity;
          existing.quantity += item.quantity;
          categorySalesMap.set(cat, existing);
        });
      });

      const totalRevenue = Array.from(categorySalesMap.values()).reduce((acc, c) => acc + c.revenue, 0);
      const totalQuantity = Array.from(categorySalesMap.values()).reduce((acc, c) => acc + c.quantity, 0);

      const items = Array.from(categorySalesMap.entries())
        .map(([name, data]) => ({
          name,
          value: donutMetric === 'revenue' ? data.revenue : data.quantity,
          revenue: data.revenue,
          quantity: data.quantity,
          sharePct: donutMetric === 'revenue' 
            ? (totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0)
            : (totalQuantity > 0 ? Math.round((data.quantity / totalQuantity) * 100) : 0),
        }))
        .filter(it => it.value > 0)
        .sort((a, b) => b.value - a.value);

      return {
        items,
        totalVal: donutMetric === 'revenue' ? totalRevenue : totalQuantity,
        formattedTotal: donutMetric === 'revenue' ? formatCurrency(totalRevenue) : `${totalQuantity} pcs`,
        unitLabel: donutMetric === 'revenue' ? 'Total Nilai' : 'Total Item',
      };
    } else {
      // Distribusi Stok
      const categoryStockMap = new Map<string, number>();
      products.forEach(p => {
        const cat = p.category || 'Lainnya';
        categoryStockMap.set(cat, (categoryStockMap.get(cat) || 0) + p.stock);
      });

      const totalStock = Array.from(categoryStockMap.values()).reduce((acc, s) => acc + s, 0);

      const items = Array.from(categoryStockMap.entries())
        .map(([name, stock]) => ({
          name,
          value: stock,
          revenue: 0,
          quantity: stock,
          sharePct: totalStock > 0 ? Math.round((stock / totalStock) * 100) : 0,
        }))
        .filter(it => it.value > 0)
        .sort((a, b) => b.value - a.value);

      return {
        items,
        totalVal: totalStock,
        formattedTotal: `${totalStock} unit`,
        unitLabel: 'Total Stok Fisik',
      };
    }
  }, [donutTab, donutMetric, currentPeriodTransactions, productCategoryMap, products]);

  const visibleDonutItems = useMemo(() => {
    return donutData.items.filter(item => !hiddenCategories.includes(item.name));
  }, [donutData.items, hiddenCategories]);

  const handleToggleCategoryVisibility = (cat: string) => {
    setHiddenCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSelectCategoryFilter = (cat: string) => {
    if (selectedCategoryFilter === cat) {
      setSelectedCategoryFilter(null);
    } else {
      setSelectedCategoryFilter(cat);
      setCurrentPage(1);
    }
  };

  // 5. Analitik Tambahan: Per Kasir & Jam Tersibuk
  const cashierAnalytics = useMemo(() => {
    const map = new Map<string, { omzet: number; count: number }>();
    currentPeriodTransactions.forEach(t => {
      const name = t.userName || 'Kasir';
      const existing = map.get(name) || { omzet: 0, count: 0 };
      existing.omzet += t.total;
      existing.count += 1;
      map.set(name, existing);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.omzet - a.omzet);
  }, [currentPeriodTransactions]);

  const hourlyDistribution = useMemo(() => {
    const hourBuckets = new Map<number, number>();
    for (let h = 8; h <= 21; h++) hourBuckets.set(h, 0);

    currentPeriodTransactions.forEach(t => {
      const h = new Date(t.date).getHours();
      if (hourBuckets.has(h)) {
        hourBuckets.set(h, hourBuckets.get(h)! + 1);
      }
    });

    const list = Array.from(hourBuckets.entries()).map(([hour, count]) => ({
      hourLabel: `${hour}:00`,
      count,
    }));

    const busiestHour = [...list].sort((a, b) => b.count - a.count)[0];

    return { list, busiestHour };
  }, [currentPeriodTransactions]);

  // 6. Filter Riwayat Transaksi Tabel
  const filteredTransactions = useMemo(() => {
    let result = [...currentPeriodTransactions];

    // Filter Kategori
    if (selectedCategoryFilter) {
      result = result.filter(tx => 
        tx.items.some(item => {
          const c = productCategoryMap.get(item.name) || productCategoryMap.get(item.id) || item.category;
          return c === selectedCategoryFilter;
        })
      );
    }

    // Filter Kasir
    if (filterCashier !== 'all') {
      result = result.filter(tx => tx.userName === filterCashier);
    }

    // Filter Metode Bayar
    if (filterPayment !== 'all') {
      result = result.filter(tx => tx.paymentMethod === filterPayment);
    }

    // Filter Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(tx => 
        tx.id.toLowerCase().includes(q) ||
        tx.userName.toLowerCase().includes(q) ||
        tx.paymentMethod.toLowerCase().includes(q) ||
        tx.items.some(item => item.name.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'total_desc') return b.total - a.total;
      if (sortBy === 'total_asc') return a.total - b.total;
      return 0;
    });

    return result;
  }, [currentPeriodTransactions, selectedCategoryFilter, filterCashier, filterPayment, searchQuery, sortBy, productCategoryMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // 7. Ekspor CSV dengan Tanggal dalam Nama File
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('Tidak ada transaksi untuk diekspor', 'error');
      return;
    }

    const headers = [
      'No Invoice',
      'Tanggal',
      'Waktu',
      'Kasir',
      'Metode Bayar',
      'Jumlah Jenis Item',
      'Total Qty Terjual',
      'Total Pembayaran (Rp)',
      'Nominal Diterima (Rp)',
      'Kembalian (Rp)',
      'Rincian Barang'
    ];

    const rows = filteredTransactions.map(tx => {
      const d = new Date(tx.date);
      const dateStr = d.toLocaleDateString('id-ID');
      const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const totalQty = tx.items.reduce((s, it) => s + it.quantity, 0);
      const itemsDetail = tx.items.map(it => `${it.name} (${it.quantity}x)`).join('; ');

      return [
        `"INV-#${tx.id.split('-')[1] || tx.id}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${tx.userName.replace(/"/g, '""')}"`,
        `"${tx.paymentMethod}"`,
        tx.items.length,
        totalQty,
        tx.total,
        tx.received,
        tx.change,
        `"${itemsDetail.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const rangeLabel = period === 'custom' 
      ? `${customStart}_sampai_${customEnd}` 
      : period === 'today'
      ? `hari_ini_${new Date().toISOString().split('T')[0]}`
      : `${period}_${new Date().toISOString().split('T')[0]}`;

    link.setAttribute('download', `laporan-penjualan-sobatdagang-${rangeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Laporan berhasil diekspor (${filteredTransactions.length} transaksi)`, 'success');
  };

  const handleCopyInvoice = (invoiceId: string) => {
    const formatted = `INV-#${invoiceId.split('-')[1] || invoiceId}`;
    navigator.clipboard.writeText(formatted).then(() => {
      setCopiedInvoice(true);
      showToast(`Nomor invoice ${formatted} tersalin`, 'success');
      setTimeout(() => setCopiedInvoice(false), 2000);
    });
  };

  // Presets cepat untuk Date Range Picker
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

    setCustomStart(s.toISOString().split('T')[0]);
    setCustomEnd(e.toISOString().split('T')[0]);
    setPeriod('custom');
    setDatePickerPopoverOpen(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 select-none">
      {/* ========================================================== */}
      {/* 0. HEADER & TOOLBAR FILTER PERIODE                         */}
      {/* ========================================================== */}
      <div className="bg-surface border border-ink/15 rounded-[24px] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <BarChart3 className="text-ink" size={24} />
            Laporan & Analitik Penjualan
          </h2>
          <p className="text-[13px] text-muted font-normal mt-0.5">
            Analisis omzet, tren harian, performa kasir, dan distribusi barang terperinci.
          </p>
        </div>

        {/* Toolbar: Segmented Control Periode + Popover Kustom & Ekspor CSV */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Control Periode */}
          <div className="p-1 bg-bg border border-ink/15 rounded-full flex items-center relative">
            {(
              [
                { id: 'today', label: 'Hari Ini' },
                { id: '7days', label: '7 Hari' },
                { id: '30days', label: '30 Hari' },
                { id: 'custom', label: 'Kustom' },
              ] as const
            ).map(opt => {
              const active = period === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (opt.id === 'custom') {
                      setPeriod('custom');
                      setDatePickerPopoverOpen(true);
                    } else {
                      handlePeriodChange(opt.id);
                      setDatePickerPopoverOpen(false);
                    }
                  }}
                  className={cn(
                    "relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer z-10",
                    active ? "text-white" : "text-muted hover:text-ink"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="reportPeriodPill"
                      className="absolute inset-0 bg-ink rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>

            {/* Date Range Picker Popover Button jika Kustom aktif */}
            <div className="relative flex items-center gap-1.5" ref={datePickerRef}>
              <button
                type="button"
                onClick={() => setDatePickerPopoverOpen(!datePickerPopoverOpen)}
                className={cn(
                  "py-2 px-3.5 text-xs font-semibold rounded-full border flex items-center gap-2 cursor-pointer transition-colors",
                  period === 'custom' 
                    ? "bg-ink text-white border-ink" 
                    : "bg-surface text-ink border-ink/15 hover:border-ink"
                )}
                title="Pilih tanggal kustom"
              >
                <Calendar size={13} />
                <span>
                  {period === 'custom' 
                    ? `${customStart} s/d ${customEnd}` 
                    : 'Pilih Rentang'}
                </span>
                <ChevronDown size={13} className={cn("transition-transform", datePickerPopoverOpen && "rotate-180")} />
              </button>
              <ContextHelp
                content="Pilih rentang tanggal spesifik untuk memfilter data transaksi, laba kotor, dan omzet toko."
                placement="bottom"
              />

              {/* Popover Kalender Kustom */}
              <AnimatePresence>
                {datePickerPopoverOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-surface border border-ink/20 rounded-[22px] shadow-2xl p-4 z-40 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                      <span className="text-xs font-bold text-ink">Rentang Tanggal</span>
                      <button
                        type="button"
                        onClick={() => setDatePickerPopoverOpen(false)}
                        className="p-1 rounded-full text-muted hover:text-ink cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Preset Cepat */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted block">Preset Cepat:</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('yesterday')}
                          className="py-1 px-2 rounded-full text-[11px] font-semibold bg-bg hover:bg-ink hover:text-white transition-colors cursor-pointer text-center"
                        >
                          Kemarin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('this_week')}
                          className="py-1 px-2 rounded-full text-[11px] font-semibold bg-bg hover:bg-ink hover:text-white transition-colors cursor-pointer text-center"
                        >
                          Minggu Ini
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('this_month')}
                          className="py-1 px-2 rounded-full text-[11px] font-semibold bg-bg hover:bg-ink hover:text-white transition-colors cursor-pointer text-center"
                        >
                          Bulan Ini
                        </button>
                      </div>
                    </div>

                    {/* Input Tanggal Mulai & Selesai */}
                    <div className="space-y-2 pt-2 border-t border-ink/10">
                      <div>
                        <label className="text-[11px] font-semibold text-muted block mb-1">Dari Tanggal</label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={e => {
                            setCustomStart(e.target.value);
                            setPeriod('custom');
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded-full bg-bg border border-ink/15 text-ink focus:outline-none focus:border-ink cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted block mb-1">Sampai Tanggal</label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={e => {
                            setCustomEnd(e.target.value);
                            setPeriod('custom');
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded-full bg-bg border border-ink/15 text-ink focus:outline-none focus:border-ink cursor-pointer"
                        />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full py-2 text-xs font-bold rounded-full mt-1"
                      onClick={() => {
                        setPeriod('custom');
                        setDatePickerPopoverOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      Terapkan Rentang
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tombol Ekspor CSV */}
            <div className="flex items-center gap-1.5">
              <Button
                data-tour="reports-export-button"
                variant="secondary"
                className="py-2 px-3.5 text-xs font-semibold rounded-full border-ink/20 flex items-center gap-1.5 hover:bg-ink hover:text-white transition-colors"
                onClick={handleExportCSV}
                title="Unduh data terfilter ke format CSV"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Ekspor CSV</span>
              </Button>
              <ContextHelp
                content="Unduh data riwayat transaksi periode yang dipilih ke format file .csv spreadsheet."
                placement="bottom"
              />
            </div>
          </div>
        </div>

      {/* ========================================================== */}
      {/* 1. BARIS 1: 4 KARTU PASTEL SUMMARY (KPI) DENGAN BADGE BARU */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Kartu 1: Total Omzet (#F5D76E Kuning Pastel) */}
        <div className="p-5 rounded-[24px] bg-[#F5D76E] border border-ink/15 flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between text-ink mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Omzet</span>
              <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-ink">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink tabular-nums leading-tight tracking-tight">
              <CountUp value={summaryMetrics.totalOmzet} formatter={formatCurrency} />
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-ink/10 flex items-center justify-between text-xs">
            <span className="text-ink/75 font-medium">vs Periode Lalu</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full font-bold text-[11px] border border-ink/10",
              summaryMetrics.omzetDiff.isNew ? "bg-white/90 text-muted" : "bg-white text-ink"
            )}>
              {summaryMetrics.omzetDiff.isNew ? 'Baru' : summaryMetrics.omzetDiff.text}
            </span>
          </div>
        </div>

        {/* Kartu 2: Jumlah Transaksi (#B7C7F2 Biru Pastel) */}
        <div className="p-5 rounded-[24px] bg-[#B7C7F2] border border-ink/15 flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between text-ink mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Jumlah Transaksi</span>
              <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-ink">
                <Receipt size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink tabular-nums leading-tight tracking-tight">
              <CountUp value={summaryMetrics.txCount} />
              <span className="text-base font-semibold text-ink/75 ml-1.5">kali</span>
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-ink/10 flex items-center justify-between text-xs">
            <span className="text-ink/75 font-medium">vs Periode Lalu</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full font-bold text-[11px] border border-ink/10",
              summaryMetrics.txCountDiff.isNew ? "bg-white/90 text-muted" : "bg-white text-ink"
            )}>
              {summaryMetrics.txCountDiff.isNew ? 'Baru' : summaryMetrics.txCountDiff.text}
            </span>
          </div>
        </div>

        {/* Kartu 3: Rata-rata per Transaksi (#F4B6D2 Pink Pastel) */}
        <div className="p-5 rounded-[24px] bg-[#F4B6D2] border border-ink/15 flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between text-ink mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Rata-rata Transaksi</span>
              <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-ink">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink tabular-nums leading-tight tracking-tight">
              <CountUp value={summaryMetrics.avgBasket} formatter={formatCurrency} />
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-ink/10 flex items-center justify-between text-xs">
            <span className="text-ink/75 font-medium">vs Periode Lalu</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full font-bold text-[11px] border border-ink/10",
              summaryMetrics.avgBasketDiff.isNew ? "bg-white/90 text-muted" : "bg-white text-ink"
            )}>
              {summaryMetrics.avgBasketDiff.isNew ? 'Baru' : summaryMetrics.avgBasketDiff.text}
            </span>
          </div>
        </div>

        {/* Kartu 4: Produk Terlaris (#8FA866 Hijau Pastel) */}
        <div className="p-5 rounded-[24px] bg-[#8FA866] border border-ink/15 flex flex-col justify-between min-h-[148px] text-white">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Produk Terlaris</span>
              <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-ink">
                <ShoppingBag size={16} />
              </div>
            </div>
            {summaryMetrics.topProduct ? (
              <div>
                <p className="text-lg font-bold truncate text-white" title={summaryMetrics.topProduct.name}>
                  {summaryMetrics.topProduct.name}
                </p>
                <p className="text-xs text-white/90 font-medium mt-1">
                  Terjual <strong className="text-white">{summaryMetrics.topProduct.quantity} unit</strong> ({formatCurrency(summaryMetrics.topProduct.revenue)})
                </p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-white/80 py-1">Belum ada produk terjual</p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-white/80 font-medium">Status</span>
            <span className="px-2 py-0.5 rounded-full bg-white/95 text-ink font-bold text-[11px]">
              {summaryMetrics.topProduct ? 'Top Performer' : 'Nihil'}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 2. BARIS 2: TREN PENJUALAN HARIAN & KARTU KATEGORI         */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Kolom Kiri: Tren Penjualan Harian (Bar Chart dengan sumbu penuh & garis rata-rata) */}
        <div className="lg:col-span-7 flex flex-col">
          <Card 
            title="Tren Penjualan Harian" 
            subtitle={period === 'today' ? 'Distribusi transaksi per jam hari ini' : 'Grafik pergerakan omzet & transaksi dengan sumbu penuh'}
            extra={
              <div className="flex items-center gap-1 bg-bg p-1 rounded-full border border-ink/10">
                <button
                  type="button"
                  onClick={() => setChartMetric('omzet')}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer",
                    chartMetric === 'omzet' ? "bg-ink text-white" : "text-muted hover:text-ink"
                  )}
                >
                  Omzet (Rp)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('count')}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer",
                    chartMetric === 'count' ? "bg-ink text-white" : "text-muted hover:text-ink"
                  )}
                >
                  Transaksi
                </button>
              </div>
            }
            className="flex-1 flex flex-col justify-between"
          >
            {/* Peringatan bila data aktif kurang dari 3 hari */}
            {dailyChartData.hasFewDaysData && (
              <div className="mb-3 p-3 bg-bg border border-ink/15 rounded-[18px] flex items-center justify-between text-xs select-none">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow/40 border border-yellow/60 flex items-center justify-center text-ink shrink-0">
                    <Info size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-ink">Data masih sedikit ({dailyChartData.activePoints} titik aktif)</span>
                    <p className="text-[11px] text-muted">Mulai transaksi di Kasir POS untuk memperkaya grafik tren.</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={onNavigateToPos} className="text-xs py-1 px-3 rounded-full shrink-0">
                  Buka Kasir
                </Button>
              </div>
            )}

            {/* Recharts Bar Chart dengan Garis Rata-rata Putus-Putus */}
            <div className="h-[280px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData.list} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.08)" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: '#545454', fontSize: 11, fontWeight: 500 }} 
                    axisLine={{ stroke: 'rgba(17,17,17,0.15)' }}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis 
                    tick={{ fill: '#545454', fontSize: 11, fontWeight: 500 }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={val => chartMetric === 'omzet' ? (val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : `${Math.round(val / 1000)}k`) : val}
                    dx={-4}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-surface p-3 rounded-[16px] border border-ink/20 shadow-md text-xs space-y-1.5 min-w-[140px]">
                          <p className="font-bold text-ink border-b border-ink/10 pb-1 flex items-center justify-between">
                            <span>{label}</span>
                            {data.isToday && <span className="text-[10px] bg-ink text-white px-1.5 py-0.2 rounded-full">Hari Ini</span>}
                          </p>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted">Omzet:</span>
                            <span className="font-bold text-ink tabular-nums">{formatCurrency(data.omzet)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted">Transaksi:</span>
                            <span className="font-bold text-ink tabular-nums">{data.count} kali</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  
                  {/* Garis Rata-rata Putus-Putus */}
                  {dailyChartData.avgVal > 0 && (
                    <ReferenceLine 
                      y={dailyChartData.avgVal} 
                      stroke="#111111" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ 
                        value: `Rata-rata: ${chartMetric === 'omzet' ? formatCurrency(dailyChartData.avgVal) : `${dailyChartData.avgVal} tx`}`, 
                        position: 'insideTopRight', 
                        fill: '#545454', 
                        fontSize: 10,
                        fontWeight: 600
                      }} 
                    />
                  )}

                  <Bar 
                    dataKey={chartMetric} 
                    radius={[6, 6, 0, 0]} 
                    barSize={period === '30days' ? 12 : 28}
                    isAnimationActive={true}
                  >
                    {dailyChartData.list.map((entry, idx) => (
                      <Cell 
                        key={`bar-${idx}`} 
                        fill={entry.isToday ? '#111111' : '#B7C7F2'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-ink/10 flex items-center justify-between text-xs text-muted font-medium">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ink inline-block" /> Hari ini
                <span className="w-2.5 h-2.5 rounded-full bg-[#B7C7F2] inline-block ml-1" /> Hari lain
              </span>
              <span>Total Periode: <strong className="text-ink tabular-nums">{formatCurrency(summaryMetrics.totalOmzet)}</strong></span>
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Donut Tab ("Penjualan per Kategori" vs "Distribusi Stok") */}
        <div className="lg:col-span-5 flex flex-col">
          <Card
            title={donutTab === 'sales' ? 'Penjualan per Kategori' : 'Distribusi Unit Stok'}
            subtitle={
              donutTab === 'sales'
                ? 'Dihitung dari item transaksi (Rp atau Qty terjual)'
                : 'Data stok fisik yang tersedia di inventori toko'
            }
            extra={
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Segmented Control Responsif (min-w-fit, tidak pecah dua baris) */}
                <div className="p-0.5 bg-bg border border-ink/15 rounded-full flex items-center whitespace-nowrap min-w-max">
                  <button
                    type="button"
                    onClick={() => setDonutTab('sales')}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer",
                      donutTab === 'sales' ? "bg-ink text-white" : "text-muted hover:text-ink"
                    )}
                  >
                    Penjualan
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonutTab('stock')}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer",
                      donutTab === 'stock' ? "bg-ink text-white" : "text-muted hover:text-ink"
                    )}
                  >
                    Stok
                  </button>
                </div>

                {/* Sub-toggle untuk Penjualan (Nilai Rp vs Qty) */}
                {donutTab === 'sales' && (
                  <button
                    type="button"
                    onClick={() => setDonutMetric(m => m === 'revenue' ? 'quantity' : 'revenue')}
                    className="px-2 py-1 text-[11px] font-bold rounded-full bg-bg border border-ink/15 text-ink hover:bg-ink hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Ganti metrik antara Nominal Rp dan Jumlah Qty"
                  >
                    {donutMetric === 'revenue' ? 'Rp' : 'Qty'}
                  </button>
                )}
              </div>
            }
            className="flex-1 flex flex-col justify-between"
          >
            <div className="h-[240px] relative flex items-center justify-center">
              {visibleDonutItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-bg/50 rounded-[18px]">
                  <PieIcon size={28} className="text-muted/60 mb-2" />
                  <p className="text-xs font-semibold text-ink">Tidak ada data untuk ditampilkan</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {donutTab === 'sales' ? 'Belum ada produk terjual pada periode ini' : 'Semua kategori stok disembunyikan'}
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visibleDonutItems}
                        innerRadius={68}
                        outerRadius={96}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={true}
                        onClick={(entry) => handleSelectCategoryFilter(String(entry.name))}
                        className="cursor-pointer"
                      >
                        {visibleDonutItems.map((entry, i) => {
                          const isFiltered = selectedCategoryFilter === entry.name;
                          return (
                            <Cell 
                              key={`cell-${entry.name}`} 
                              fill={PASTEL_PALETTE[i % PASTEL_PALETTE.length]}
                              opacity={selectedCategoryFilter ? (isFiltered ? 1 : 0.35) : 1}
                              stroke={isFiltered ? "#111111" : "none"}
                              strokeWidth={isFiltered ? 2.5 : 0}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-surface p-2.5 rounded-[16px] border border-ink/20 shadow-md text-xs space-y-1">
                              <p className="font-bold text-ink">{data.name}</p>
                              {donutTab === 'sales' ? (
                                <>
                                  <p className="text-muted">Omzet: <strong className="text-ink">{formatCurrency(data.revenue)}</strong></p>
                                  <p className="text-muted">Terjual: <strong className="text-ink">{data.quantity} pcs</strong></p>
                                </>
                              ) : (
                                <p className="text-muted">Stok: <strong className="text-ink">{data.value} unit</strong></p>
                              )}
                              <p className="text-[10px] text-ink font-semibold mt-0.5">👉 Klik untuk filter tabel</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Angka Total di Tengah Donut Bersih Tanpa Artefak Ikon */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                      {donutData.unitLabel}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-ink tabular-nums text-center px-4 leading-tight mt-0.5">
                      {donutData.formattedTotal}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Legend Interaktif: Klik untuk Filter / Sembunyikan Kategori */}
            <div className="mt-2 pt-3 border-t border-ink/10">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-semibold text-muted">Kategori ({donutData.items.length}):</span>
                {selectedCategoryFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-[11px] font-bold text-ink hover:underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {donutData.items.map((item, i) => {
                  const isHidden = hiddenCategories.includes(item.name);
                  const isFiltered = selectedCategoryFilter === item.name;

                  return (
                    <div
                      key={item.name}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                        isFiltered
                          ? "bg-ink text-white border-ink"
                          : isHidden
                          ? "opacity-40 bg-bg border-ink/10 text-muted line-through"
                          : "bg-surface border-ink/15 text-ink hover:border-ink/50"
                      )}
                      onClick={() => handleSelectCategoryFilter(item.name)}
                      title={`Klik untuk filter tabel; klik ikon mata untuk sembunyikan`}
                    >
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: PASTEL_PALETTE[i % PASTEL_PALETTE.length] }} 
                      />
                      <span className="truncate max-w-[90px]">{item.name}</span>
                      <span className="text-[10px] opacity-75 tabular-nums">({item.sharePct}%)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCategoryVisibility(item.name);
                        }}
                        className="p-0.5 rounded-full hover:bg-black/10 cursor-pointer ml-0.5"
                        title={isHidden ? "Tampilkan kembali" : "Sembunyikan dari donut"}
                      >
                        {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 3. BARIS TAMBAHAN: PER KASIR (KARTU KECIL) & JAM TERSIBUK   */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Per Kasir (Kartu Kecil Omzet & Frekuensi Tiap Kasir) */}
        <div className="lg:col-span-6 flex flex-col">
          <Card
            title="Performa per Kasir"
            subtitle="Ringkasan omzet dan jumlah struk yang ditangani staf toko"
            className="flex-1"
          >
            {cashierAnalytics.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted font-medium bg-bg rounded-[18px] border border-ink/10">
                Belum ada transaksi kasir pada periode ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cashierAnalytics.map(c => (
                  <div 
                    key={c.name}
                    className="p-3.5 rounded-[18px] bg-bg border border-ink/15 flex flex-col justify-between space-y-2 hover:border-ink transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-surface border border-ink/15 flex items-center justify-center font-bold text-xs text-ink">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-ink text-xs truncate">{c.name}</span>
                      </div>
                      <span className="text-[11px] font-bold bg-surface text-ink px-2 py-0.5 rounded-full border border-ink/10">
                        {c.count} struk
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted block">Omzet Transaksi:</span>
                      <p className="text-base font-bold text-ink tabular-nums">
                        {formatCurrency(c.omzet)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Jam Tersibuk (Bar Chart per Jam) */}
        <div className="lg:col-span-6 flex flex-col">
          <Card
            title="Jam Tersibuk Toko"
            subtitle={
              hourlyDistribution.busiestHour && hourlyDistribution.busiestHour.count > 0
                ? `Puncak kunjungan pelanggan: pukul ${hourlyDistribution.busiestHour.hourLabel} (${hourlyDistribution.busiestHour.count} transaksi)`
                : 'Pola frekuensi kunjungan pelanggan berdasarkan jam buka kasir'
            }
            className="flex-1 flex flex-col justify-between"
          >
            <div className="h-[160px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution.list} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.06)" vertical={false} />
                  <XAxis 
                    dataKey="hourLabel" 
                    tick={{ fill: '#545454', fontSize: 10, fontWeight: 500 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#545454', fontSize: 10, fontWeight: 500 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-surface p-2 rounded-[14px] border border-ink/20 text-xs">
                          <p className="font-bold text-ink">Pukul {d.hourLabel}</p>
                          <p className="text-muted">{d.count} transaksi</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#8FA866" radius={[4, 4, 0, 0]} barSize={16}>
                    {hourlyDistribution.list.map((entry, idx) => (
                      <Cell 
                        key={`hourly-${idx}`}
                        fill={entry.count === hourlyDistribution.busiestHour?.count && entry.count > 0 ? '#111111' : '#8FA866'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-ink/10 flex items-center justify-between text-xs text-muted font-medium">
              <span>Jam Buka Pantauan: 08:00 - 21:00</span>
              <span className="font-semibold text-ink">Bar Hitam = Jam Paling Ramai</span>
            </div>
          </Card>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 4. TABEL RIWAYAT TRANSAKSI PENJUALAN LENGKAP               */}
      {/* ========================================================== */}
      <Card
        title="Riwayat Transaksi Penjualan"
        subtitle={`Daftar seluruh struk pembayaran yang tercatat dalam periode (${filteredTransactions.length} transaksi)`}
        extra={
          selectedCategoryFilter && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink text-white text-xs font-semibold">
              <span>Kategori: {selectedCategoryFilter}</span>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter(null)}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          )
        }
      >
        {/* Toolbar Pencarian, Filter Kasir, Filter Metode, & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          
          {/* Pencarian */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Cari nomor invoice, kasir, atau nama item..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-full bg-bg border border-ink/15 text-ink focus:outline-none focus:border-ink placeholder:text-muted"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Kasir, Metode Bayar, & Sortir */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kasir */}
            <select
              value={filterCashier}
              onChange={e => {
                setFilterCashier(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-bg border border-ink/15 text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              <option value="all">Semua Kasir</option>
              {cashierList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filter Metode Bayar */}
            <select
              value={filterPayment}
              onChange={e => {
                setFilterPayment(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-bg border border-ink/15 text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              <option value="all">Semua Metode</option>
              <option value={PaymentMethod.CASH}>Tunai (CASH)</option>
              <option value={PaymentMethod.QRIS}>QRIS</option>
            </select>

            {/* Sortir */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-bg border border-ink/15 text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              <option value="date_desc">Waktu Terbaru</option>
              <option value="date_asc">Waktu Terlama</option>
              <option value="total_desc">Total Tertinggi</option>
              <option value="total_asc">Total Terendah</option>
            </select>
          </div>

        </div>

        {/* Tabel Transaksi */}
        {filteredTransactions.length === 0 ? (
          <div className="py-14 text-center bg-bg rounded-[20px] border border-dashed border-ink/15 p-6">
            <Receipt size={36} className="mx-auto text-muted/50 mb-2" />
            <p className="text-sm font-semibold text-ink">Tidak Ada Transaksi yang Cocok</p>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1">
              Tidak ditemukan transaksi yang cocok dengan kriteria filter aktif saat ini.
            </p>
            <Button
              variant="secondary"
              className="mt-3 py-1.5 px-4 text-xs rounded-full"
              onClick={() => {
                setSearchQuery('');
                setFilterCashier('all');
                setFilterPayment('all');
                setSelectedCategoryFilter(null);
              }}
            >
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-[20px] border border-ink/10 bg-surface">
              <table className="w-full text-left text-[13px] text-ink">
                <thead className="bg-[#EAE4D3] border-b border-ink/15 text-muted uppercase text-[11px] font-bold tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-4">No Invoice</th>
                    <th className="py-3 px-4">Waktu & Tanggal</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4">Jumlah Item</th>
                    <th className="py-3 px-4 text-right">Total Transaksi</th>
                    <th className="py-3 px-4 text-center">Struk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {paginatedTransactions.map(tx => {
                    const d = new Date(tx.date);
                    const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    const timeFormatted = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const totalItemsQty = tx.items.reduce((s, it) => s + it.quantity, 0);

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedReceipt(tx)}
                        className="hover:bg-bg/70 transition-colors duration-150 cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-bold text-ink">
                          <span className="group-hover:underline">INV-#{tx.id.split('-')[1] || tx.id}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted">
                          <span className="font-semibold text-ink block">{dateFormatted}</span>
                          <span className="text-[11px]">{timeFormatted}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-xs text-ink">
                          {tx.userName}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge 
                            variant={tx.paymentMethod === PaymentMethod.CASH ? "yellow" : "blue"}
                            size="sm"
                          >
                            {tx.paymentMethod}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted font-medium">
                          <span className="text-ink font-semibold">{tx.items.length} jenis</span> ({totalItemsQty} unit)
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-ink tabular-nums text-sm">
                          {formatCurrency(tx.total)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReceipt(tx);
                            }}
                            className="p-1.5 rounded-full bg-bg border border-ink/10 text-muted group-hover:text-ink group-hover:border-ink transition-colors cursor-pointer"
                            title="Buka struk transaksi"
                          >
                            <Receipt size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted font-medium px-1 pt-1">
              <span>
                Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="rounded-full px-3 py-1 text-xs"
                >
                  <ChevronLeft size={13} /> Sebelumnya
                </Button>
                <span className="font-bold text-ink px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="rounded-full px-3 py-1 text-xs"
                >
                  Selanjutnya <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================== */}
      {/* 5. DRAWER RINCIAN STRUK TRANSAKSI (CETAK ULANG & SALIN NO) */}
      {/* ========================================================== */}
      <Drawer
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Rincian Struk Transaksi"
        subtitle={selectedReceipt ? `INV-#${selectedReceipt.id.split('-')[1] || selectedReceipt.id}` : ''}
        width="max-w-md"
      >
        {selectedReceipt && (
          <div className="space-y-4 select-none">
            {/* Header Struk */}
            <div className="p-4 bg-bg rounded-[22px] border border-ink/10 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-ink text-xs font-bold uppercase tracking-wider mb-1">
                <Store size={14} /> SobatDagang POS
              </div>
              <h4 className="font-mono text-sm font-bold text-ink">
                INV-#{selectedReceipt.id.split('-')[1] || selectedReceipt.id}
              </h4>
              <p className="text-xs text-muted">
                {new Date(selectedReceipt.date).toLocaleDateString('id-ID', { dateStyle: 'full' })} • {new Date(selectedReceipt.date).toLocaleTimeString('id-ID')}
              </p>
              <p className="text-xs text-muted font-medium">Kasir Bertugas: <strong className="text-ink">{selectedReceipt.userName}</strong></p>
            </div>

            {/* Daftar Item Struk */}
            <div className="p-3 bg-bg rounded-[22px] border border-ink/10 space-y-2 max-h-56 overflow-y-auto">
              <span className="text-xs font-semibold text-muted block ml-1">Daftar Barang Belanja</span>
              {selectedReceipt.items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded-[14px] bg-surface">
                  <div className="truncate max-w-[200px]">
                    <span className="font-semibold text-ink block truncate">{item.name}</span>
                    <span className="text-muted font-medium">
                      {item.quantity} x {formatCurrency(item.sellPrice)}
                    </span>
                  </div>
                  <span className="font-bold text-ink tabular-nums">
                    {formatCurrency(item.sellPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Ringkasan Finansial */}
            <div className="p-4 bg-surface rounded-[22px] border border-ink/10 space-y-2 text-xs">
              <div className="flex justify-between items-center text-sm font-bold text-ink">
                <span>Total Pembayaran</span>
                <span className="tabular-nums">{formatCurrency(selectedReceipt.total)}</span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>Metode Bayar</span>
                <Badge variant={selectedReceipt.paymentMethod === PaymentMethod.CASH ? "yellow" : "blue"} size="sm">
                  {selectedReceipt.paymentMethod}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>Nominal Diterima</span>
                <span className="tabular-nums font-semibold text-ink">{formatCurrency(selectedReceipt.received)}</span>
              </div>
              <div className="flex justify-between items-center text-muted pt-1.5 border-t border-ink/10">
                <span className="font-semibold text-ink">Kembalian</span>
                <span className="tabular-nums font-bold text-ink">{formatCurrency(selectedReceipt.change)}</span>
              </div>
            </div>

            {/* Tombol Aksi: Cetak Ulang & Salin Nomor (Feedback "Tersalin") */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1 py-2.5 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5"
                onClick={() => handleCopyInvoice(selectedReceipt.id)}
              >
                {copiedInvoice ? (
                  <>
                    <Check size={14} className="text-[#8FA866]" />
                    <span className="text-ink font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Salin Nomor</span>
                  </>
                )}
              </Button>
              <Button
                className="flex-1 py-2.5 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5"
                onClick={() => {
                  if (onViewReceipt) {
                    onViewReceipt(selectedReceipt);
                  }
                  window.print();
                }}
              >
                <Printer size={14} />
                <span>Cetak Ulang</span>
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
