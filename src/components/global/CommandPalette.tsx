import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Receipt, 
  Tag, 
  X, 
  ArrowRight,
  CornerDownLeft,
  History,
  Users
} from 'lucide-react';
import { Product, Transaction, Role, User } from '../../types';
import { ROUTE_PERMISSIONS, canAccessView } from '../../lib/permissions';
import { formatCurrency, cn } from '../../lib/utils';
import { useHotkeys } from '../../hooks';

export type CommandScope = 'all' | 'products' | 'pages' | 'transactions';

interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Halaman' | 'Aksi Cepat' | 'Produk' | 'Transaksi';
  icon: React.ElementType;
  badge?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  transactions: Transaction[];
  currentUser: User | null;
  onNavigate: (view: 'dashboard' | 'pos' | 'inventory' | 'reports') => void;
  onQuickAction: (action: string, payload?: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  products,
  transactions,
  currentUser,
  onNavigate,
  onQuickAction,
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<CommandScope>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Hotkey Esc to close
  useHotkeys('Escape', () => {
    if (isOpen) onClose();
  }, { enableOnFormTags: true });

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Generate selectable items
  const items = useMemo<CommandPaletteItem[]>(() => {
    const list: CommandPaletteItem[] = [];
    const q = query.toLowerCase().trim();

    // 1. Pages (Filtered by permissions map)
    if (scope === 'all' || scope === 'pages') {
      if (canAccessView(currentUser?.role, 'dashboard')) {
        list.push({
          id: 'page-dashboard',
          title: ROUTE_PERMISSIONS.dashboard.label,
          subtitle: ROUTE_PERMISSIONS.dashboard.description,
          category: 'Halaman',
          icon: LayoutDashboard,
          badge: 'Admin',
          onSelect: () => {
            onNavigate('dashboard');
            onClose();
          },
        });
      }

      if (canAccessView(currentUser?.role, 'pos')) {
        list.push({
          id: 'page-pos',
          title: ROUTE_PERMISSIONS.pos.label,
          subtitle: ROUTE_PERMISSIONS.pos.description,
          category: 'Halaman',
          icon: ShoppingCart,
          badge: currentUser?.role === Role.ADMIN ? 'Semua' : 'Kasir',
          onSelect: () => {
            onNavigate('pos');
            onClose();
          },
        });
      }

      if (canAccessView(currentUser?.role, 'my-history')) {
        list.push({
          id: 'page-my-history',
          title: ROUTE_PERMISSIONS['my-history'].label,
          subtitle: ROUTE_PERMISSIONS['my-history'].description,
          category: 'Halaman',
          icon: History,
          badge: 'Kasir',
          onSelect: () => {
            onNavigate('my-history');
            onClose();
          },
        });
      }

      if (canAccessView(currentUser?.role, 'inventory')) {
        list.push({
          id: 'page-inventory',
          title: ROUTE_PERMISSIONS.inventory.label,
          subtitle: ROUTE_PERMISSIONS.inventory.description,
          category: 'Halaman',
          icon: Package,
          badge: 'Admin',
          onSelect: () => {
            onNavigate('inventory');
            onClose();
          },
        });
      }

      if (canAccessView(currentUser?.role, 'reports')) {
        list.push({
          id: 'page-reports',
          title: ROUTE_PERMISSIONS.reports.label,
          subtitle: ROUTE_PERMISSIONS.reports.description,
          category: 'Halaman',
          icon: BarChart3,
          badge: 'Admin',
          onSelect: () => {
            onNavigate('reports');
            onClose();
          },
        });
      }

      if (canAccessView(currentUser?.role, 'users')) {
        list.push({
          id: 'page-users',
          title: ROUTE_PERMISSIONS.users.label,
          subtitle: ROUTE_PERMISSIONS.users.description,
          category: 'Halaman',
          icon: Users,
          badge: 'Admin',
          onSelect: () => {
            onNavigate('users');
            onClose();
          },
        });
      }
    }

    // 2. Aksi Cepat
    if (scope === 'all' || scope === 'pages') {
      list.push({
        id: 'action-pos-new',
        title: 'Transaksi Kasir Baru',
        subtitle: 'Mulai input pesanan pelanggan baru di kasir',
        category: 'Aksi Cepat',
        icon: ShoppingCart,
        onSelect: () => {
          onQuickAction('new_transaction');
          onClose();
        },
      });

      if (currentUser?.role === Role.ADMIN) {
        list.push({
          id: 'action-add-product',
          title: 'Tambah Produk Baru',
          subtitle: 'Buka form penambahan barang ke inventori',
          category: 'Aksi Cepat',
          icon: Plus,
          onSelect: () => {
            onQuickAction('add_product');
            onClose();
          },
        });

        list.push({
          id: 'action-export-report',
          title: 'Ekspor Laporan Penjualan',
          subtitle: 'Unduh riwayat transaksi dalam format CSV',
          category: 'Aksi Cepat',
          icon: FileSpreadsheet,
          onSelect: () => {
            onQuickAction('export_report');
            onClose();
          },
        });
      }
    }

    // 3. Produk
    if (scope === 'all' || scope === 'products') {
      products.forEach((p) => {
        list.push({
          id: `product-${p.id}`,
          title: p.name,
          subtitle: `${p.code} • ${p.category} • Stok: ${p.stock} ${p.unit}`,
          category: 'Produk',
          icon: Tag,
          badge: formatCurrency(p.sellPrice),
          onSelect: () => {
            onQuickAction('select_product', p);
            onClose();
          },
        });
      });
    }

    // 4. Transaksi
    if (scope === 'all' || scope === 'transactions') {
      transactions.slice(0, 15).forEach((tx) => {
        list.push({
          id: `tx-${tx.id}`,
          title: `Invoice #${tx.id.split('-')[1] || tx.id}`,
          subtitle: `${tx.items.length} item • Kasir: ${tx.cashierName || 'Kasir'} • ${new Date(tx.date).toLocaleDateString('id-ID')}`,
          category: 'Transaksi',
          icon: Receipt,
          badge: formatCurrency(tx.total),
          onSelect: () => {
            onQuickAction('view_receipt', tx);
            onClose();
          },
        });
      });
    }

    // Filter by query
    if (!q) return list;

    return list.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
      const matchCat = item.category.toLowerCase().includes(q);
      return matchTitle || matchSubtitle || matchCat;
    });
  }, [query, scope, products, transactions, currentUser, onNavigate, onQuickAction, onClose]);

  // Keep selected index bounded
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, scope]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside input
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
      }
    }
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, idx) =>
      part.toLowerCase() === q.toLowerCase().trim() ? (
        <mark key={idx} className="bg-yellow/90 text-ink rounded-xs px-0.5 font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center pt-12 sm:pt-20 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl bg-surface border border-ink/20 rounded-[28px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
          >
            {/* Search Input Bar */}
            <div className="p-4 pb-3 border-b border-ink/10 flex items-center gap-3 bg-bg">
              <Search size={18} className="text-muted shrink-0" strokeWidth={2} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ketik nama produk, menu halaman, aksi cepat, atau nomor transaksi..."
                className="w-full bg-transparent text-[13px] sm:text-sm font-medium text-ink placeholder:text-muted outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-ink/5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-muted bg-surface border border-ink/15 rounded-md select-none">
                  ESC
                </kbd>
              )}
            </div>

            {/* Scope Filter Chips */}
            <div className="px-4 py-2 border-b border-ink/10 flex items-center gap-1.5 overflow-x-auto bg-surface/70 shrink-0">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider mr-1 shrink-0">
                Filter:
              </span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'products', label: 'Produk' },
                { id: 'pages', label: 'Halaman' },
                { id: 'transactions', label: 'Transaksi' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setScope(chip.id as CommandScope)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer',
                    scope === chip.id
                      ? 'bg-ink text-white'
                      : 'bg-bg text-muted hover:text-ink border border-ink/10'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* List Results */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-ink/5"
            >
              {items.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <div className="w-12 h-12 rounded-full bg-bg border border-ink/10 flex items-center justify-center mx-auto mb-2.5">
                    <Search size={20} />
                  </div>
                  <p className="text-[13px] font-semibold text-ink">
                    Tidak ada hasil ditemukan
                  </p>
                  <p className="text-xs text-muted max-w-xs mx-auto mt-0.5">
                    Coba kata kunci lain atau pilih filter &quot;Semua&quot;.
                  </p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      data-selected={isSelected}
                      onClick={item.onSelect}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'p-2.5 rounded-[18px] flex items-center gap-3 transition-colors cursor-pointer select-none',
                        isSelected ? 'bg-bg border border-ink/20 shadow-xs' : 'hover:bg-bg/60 border border-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-ink/10',
                          item.category === 'Halaman'
                            ? 'bg-blue/50 text-ink'
                            : item.category === 'Aksi Cepat'
                            ? 'bg-yellow/50 text-ink'
                            : item.category === 'Produk'
                            ? 'bg-pink/50 text-ink'
                            : 'bg-green/50 text-ink'
                        )}
                      >
                        <Icon size={16} strokeWidth={1.8} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-ink truncate">
                            {highlightMatch(item.title, query)}
                          </p>
                          <span className="text-[10px] text-muted font-medium bg-surface px-1.5 py-0.2 rounded border border-ink/10 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted truncate mt-0.5 font-medium">
                            {highlightMatch(item.subtitle, query)}
                          </p>
                        )}
                      </div>

                      {item.badge && (
                        <span className="text-xs font-semibold bg-surface border border-ink/15 text-ink px-2.5 py-0.5 rounded-full shrink-0">
                          {item.badge}
                        </span>
                      )}

                      {isSelected && (
                        <div className="hidden sm:flex items-center text-muted shrink-0 text-xs gap-1 pl-1">
                          <CornerDownLeft size={13} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Keyboard Hints */}
            <div className="p-3 bg-bg border-t border-ink/10 flex items-center justify-between text-[11px] text-muted font-medium px-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface border border-ink/15 rounded text-[10px] font-bold">↑↓</kbd> Navigasi
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface border border-ink/15 rounded text-[10px] font-bold">↵</kbd> Pilih
                </span>
              </div>
              <span className="hidden sm:inline-block">
                Tekan <kbd className="px-1.5 py-0.5 bg-surface border border-ink/15 rounded text-[10px] font-bold">Ctrl+K</kbd> kapan saja
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
