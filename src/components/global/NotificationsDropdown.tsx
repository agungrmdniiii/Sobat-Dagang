import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle, PackageX, ShoppingBag, CheckCheck, ChevronRight, Layers, Receipt } from 'lucide-react';
import { Product, Transaction, User, Role } from '../../types';
import { canAccessView, AppView } from '../../lib/permissions';
import { formatCurrency } from '../../lib/utils';
import { useLocalStorage } from '../../hooks';
import { Dropdown } from '../ui/Dropdown';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'stock_empty' | 'stock_low' | 'transaction';
  targetView: AppView;
  time: string;
  isRead: boolean;
}

interface NotificationsDropdownProps {
  products: Product[];
  transactions: Transaction[];
  currentUser?: User | null;
  onNavigate: (view: AppView) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  products,
  transactions,
  currentUser,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stock' | 'transaction'>('all');
  const [readIds, setReadIds] = useLocalStorage<string[]>('sobatdagang_read_notifications', []);

  // Filter notifikasi berdasarkan role pengguna:
  // - Admin: melihat peringatan stok habis/menipis dan transaksi toko.
  // - Kasir: HANYA melihat transaksi yang ia buat sendiri hari ini (tanpa melihat stok toko di luar kebutuhan atau omzet toko).
  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    const isAdmin = currentUser?.role === Role.ADMIN;
    const isKasir = currentUser?.role === Role.KASIR;

    // 1. Notifikasi Stok: Khusus Admin
    if (isAdmin) {
      // Stok Habis
      products
        .filter((p) => p.stock <= 0)
        .forEach((p) => {
          list.push({
            id: `stock-empty-${p.id}`,
            title: `Stok Habis: ${p.name}`,
            description: `Persediaan 0 ${p.unit}. Segera lakukan restok produk ini.`,
            type: 'stock_empty',
            targetView: 'inventory',
            time: 'Prioritas',
            isRead: readIds.includes(`stock-empty-${p.id}`),
          });
        });

      // Stok Menipis
      products
        .filter((p) => p.stock > 0 && p.stock <= p.minStock)
        .forEach((p) => {
          list.push({
            id: `stock-low-${p.id}`,
            title: `Stok Menipis: ${p.name}`,
            description: `Sisa ${p.stock} ${p.unit} (Batas minimum: ${p.minStock}).`,
            type: 'stock_low',
            targetView: 'inventory',
            time: 'Perhatian',
            isRead: readIds.includes(`stock-low-${p.id}`),
          });
        });
    }

    // 2. Notifikasi Transaksi
    if (isAdmin) {
      // Admin melihat transaksi toko terbaru
      const recentTx = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      recentTx.forEach((tx) => {
        list.push({
          id: `tx-${tx.id}`,
          title: `Transaksi Selesai: ${tx.id.split('-')[1] || tx.id}`,
          description: `${tx.items.length} item • ${formatCurrency(tx.total)} (${tx.userName || 'Kasir'})`,
          type: 'transaction',
          targetView: 'reports',
          time: new Date(tx.date).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isRead: readIds.includes(`tx-${tx.id}`),
        });
      });
    } else if (isKasir && currentUser) {
      // Kasir HANYA melihat transaksi yang dibuat dirinya sendiri
      const myRecentTx = transactions
        .filter(
          (t) =>
            t.userId === currentUser.id ||
            t.userName.toLowerCase() === currentUser.username.toLowerCase()
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      myRecentTx.forEach((tx) => {
        list.push({
          id: `tx-my-${tx.id}`,
          title: `Transaksi Anda: ${tx.id.split('-')[1] || tx.id}`,
          description: `${tx.items.length} item • ${formatCurrency(tx.total)} (${tx.paymentMethod})`,
          type: 'transaction',
          targetView: 'my-history',
          time: new Date(tx.date).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isRead: readIds.includes(`tx-my-${tx.id}`),
        });
      });
    }

    return list;
  }, [products, transactions, currentUser, readIds]);

  // Tab Filtering
  const displayedNotifications = useMemo(() => {
    if (activeTab === 'stock') {
      return notifications.filter((n) => n.type === 'stock_empty' || n.type === 'stock_low');
    }
    if (activeTab === 'transaction') {
      return notifications.filter((n) => n.type === 'transaction');
    }
    return notifications;
  }, [notifications, activeTab]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(Array.from(new Set([...readIds, ...allIds])));
  };

  const handleClickItem = (item: NotificationItem) => {
    if (!item.isRead) {
      setReadIds((prev) => Array.from(new Set([...prev, item.id])));
    }
    setIsOpen(false);
    // Enforce role permissions: only navigate if permitted
    if (canAccessView(currentUser?.role, item.targetView)) {
      onNavigate(item.targetView);
    } else {
      onNavigate('pos');
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      width="w-80 sm:w-96"
      align="right"
      trigger={
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(!isOpen)}
          title="Notifikasi Sistem"
          className="w-9 h-9 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer relative focus-visible:ring-2 focus-visible:ring-ink"
          aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
        >
          <Bell size={16} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 bg-pink text-ink text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-bg leading-none shadow-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>
      }
    >
      {/* Header Notifikasi */}
      <div className="p-4 pb-2.5 border-b border-ink/10 bg-bg/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-ink">Notifikasi</h4>
            {unreadCount > 0 ? (
              <span className="bg-pink text-ink text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {unreadCount} Baru
              </span>
            ) : (
              <span className="bg-surface text-muted text-[11px] font-medium px-2 py-0.5 rounded-full border border-ink/10">
                Semua dibaca
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold text-ink hover:text-black flex items-center gap-1 cursor-pointer hover:underline"
            >
              <CheckCheck size={13} />
              <span>Tandai dibaca</span>
            </button>
          )}
        </div>

        {/* Tab Filter Notifikasi (Semua, Stok, Transaksi) */}
        <div className="flex gap-1.5 mt-3 pt-2 border-t border-ink/10">
          {[
            { id: 'all', label: 'Semua' },
            ...(currentUser?.role === Role.ADMIN ? [{ id: 'stock', label: 'Stok' }] : []),
            { id: 'transaction', label: 'Transaksi' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-ink text-white'
                  : 'bg-surface text-muted hover:text-ink border border-ink/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Notifikasi */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-ink/5">
        {displayedNotifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-bg border border-ink/10 flex items-center justify-center mx-auto mb-2 text-muted">
              <Bell size={18} />
            </div>
            <p className="text-[13px] font-semibold text-ink">Tidak ada notifikasi</p>
            <p className="text-xs text-muted mt-0.5">
              {activeTab === 'stock'
                ? 'Tidak ada peringatan stok saat ini.'
                : activeTab === 'transaction'
                ? 'Belum ada transaksi pada daftar.'
                : 'Semua aktivitas dalam keadaan aman.'}
            </p>
          </div>
        ) : (
          displayedNotifications.map((item) => {
            const isRead = item.isRead;
            return (
              <div
                key={item.id}
                onClick={() => handleClickItem(item)}
                className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 select-none hover:bg-bg ${
                  isRead ? 'opacity-70 bg-transparent' : 'bg-surface'
                }`}
              >
                {/* Icon category */}
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'stock_empty'
                      ? 'bg-pink border-pink/60 text-ink'
                      : item.type === 'stock_low'
                      ? 'bg-yellow border-yellow/60 text-ink'
                      : 'bg-blue border-blue/60 text-ink'
                  }`}
                >
                  {item.type === 'stock_empty' ? (
                    <PackageX size={15} />
                  ) : item.type === 'stock_low' ? (
                    <AlertTriangle size={15} />
                  ) : (
                    <ShoppingBag size={15} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-xs truncate ${
                        isRead ? 'font-medium text-ink' : 'font-semibold text-ink'
                      }`}
                    >
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <ChevronRight size={14} className="text-muted/60 shrink-0 self-center" />
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 bg-bg/50 border-t border-ink/10 text-center">
        <span className="text-[11px] text-muted font-medium">
          Klik notifikasi untuk membuka halaman terkait
        </span>
      </div>
    </Dropdown>
  );
};
