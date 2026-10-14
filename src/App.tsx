/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  LogOut, 
  User as UserIcon,
  Search,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Printer,
  History,
  Store,
  Filter,
  Download,
  Box,
  Droplets,
  Soup,
  Coffee,
  CupSoda,
  Milk,
  Wind,
  Sparkles,
  Zap,
  Egg,
  UtensilsCrossed,
  ChefHat,
  ImagePlus,
  ImageIcon,
  UploadCloud,
  Bell,
  Settings,
  Calendar,
  Clock,
  PauseCircle,
  PlayCircle,
  FileText,
  Edit3,
  MessageSquare,
  Check,
  RotateCcw,
  KeyRound,
  Eye,
  EyeOff,
  Users,
  HelpCircle
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
  Pie
} from 'recharts';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Role, User, AppUser, Product, Transaction, CartItem, PaymentMethod, DashboardStats, HeldCart } from './types.ts';
import { INITIAL_PRODUCTS, CATEGORIES, USERS, INITIAL_APP_USERS } from './constants.ts';
import { cn, formatCurrency, formatNumber, playScanBeep } from './lib/utils.ts';
import { hashPassword, calculatePasswordStrength } from './lib/crypto.ts';
import { 
  Button, 
  Card, 
  Badge, 
  Input, 
  Modal, 
  Toast, 
  ToastContainer,
  ConfirmDialog, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  TableContainer,
  RoleGuard
} from './components/ui';
import { ROUTE_PERMISSIONS, canAccessView, getDefaultViewForRole, AppView } from './lib/permissions';
import { 
  FadeIn, 
  StaggerList, 
  StaggerItem, 
  CountUp, 
  PageTransition 
} from './components/motion';
import { SalesReports } from './components/reports/SalesReports';
import { InventoryView } from './components/inventory/InventoryView';
import { DashboardView } from './components/dashboard/DashboardView';
import { MyHistoryView } from './components/pos/MyHistoryView';
import { UsersView } from './components/users/UsersView';
import { 
  Sidebar, 
  NotificationsDropdown, 
  ProfileDropdown, 
  SettingsPanel, 
  CommandPalette, 
  ScrollToTop 
} from './components/global';
import { 
  useHotkeys, 
  useDebounce, 
  useLocalStorage, 
  useUndoToast 
} from './hooks';
import { LoginPage } from './components/auth/LoginPage';
import {
  useOnboarding,
  WelcomeModal,
  GuidedTour,
  OnboardingChecklist,
  HelpCenterDrawer,
  ContextHelp,
  Coachmark,
  PracticeModeBanner,
  trackOnboardingEvent,
} from './features/onboarding';

// --- Design Tokens Constants ---
const COLORS = {
  bg: '#F6F1E3',
  surface: '#EAE4D3',
  ink: '#111111',
  muted: '#545454',
  pink: '#F4B6D2',
  blue: '#B7C7F2',
  yellow: '#F5D76E',
  green: '#8FA866',
  // Backward compatibility aliases
  bgPage: '#F6F1E3',
  bgSurface: '#EAE4D3',
  dark: '#111111',
};

// --- Utils & Helpers ---

const generateBarcode = () => {
  const prefix = "SKU";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 899);
  return `${prefix}-${timestamp}${random}`;
};

const CATEGORY_ICONS: Record<string, any> = {
  'Beras': Box,
  'Minyak': Droplets,
  'Gula': Sparkles,
  'Mie Instan': Soup,
  'Kopi': Coffee,
  'Minuman': CupSoda,
  'Susu': Milk,
  'Sabun': Zap,
  'Deterjen': Wind,
  'Pasta Gigi': Sparkles,
  'Sembako': Egg,
  'Tepung': ChefHat,
  'Bumbu': UtensilsCrossed,
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; pill: string }> = {
  'Beras': { bg: 'bg-[#F5D76E]/25', border: 'border-[#F5D76E]/50', pill: 'bg-[#F5D76E]' },
  'Minyak': { bg: 'bg-[#F5D76E]/20', border: 'border-[#F5D76E]/40', pill: 'bg-[#F5D76E]' },
  'Gula': { bg: 'bg-[#F4B6D2]/30', border: 'border-[#F4B6D2]/60', pill: 'bg-[#F4B6D2]' },
  'Mie Instan': { bg: 'bg-[#F4B6D2]/25', border: 'border-[#F4B6D2]/50', pill: 'bg-[#F4B6D2]' },
  'Kopi': { bg: 'bg-[#B7C7F2]/25', border: 'border-[#B7C7F2]/50', pill: 'bg-[#B7C7F2]' },
  'Minuman': { bg: 'bg-[#B7C7F2]/30', border: 'border-[#B7C7F2]/60', pill: 'bg-[#B7C7F2]' },
  'Susu': { bg: 'bg-[#B7C7F2]/20', border: 'border-[#B7C7F2]/40', pill: 'bg-[#B7C7F2]' },
  'Sabun': { bg: 'bg-[#8FA866]/25', border: 'border-[#8FA866]/50', pill: 'bg-[#8FA866]' },
  'Deterjen': { bg: 'bg-[#8FA866]/20', border: 'border-[#8FA866]/40', pill: 'bg-[#8FA866]' },
  'Pasta Gigi': { bg: 'bg-[#B7C7F2]/25', border: 'border-[#B7C7F2]/50', pill: 'bg-[#B7C7F2]' },
  'Sembako': { bg: 'bg-[#F5D76E]/30', border: 'border-[#F5D76E]/60', pill: 'bg-[#F5D76E]' },
  'Tepung': { bg: 'bg-[#F4B6D2]/20', border: 'border-[#F4B6D2]/40', pill: 'bg-[#F4B6D2]' },
  'Bumbu': { bg: 'bg-[#8FA866]/25', border: 'border-[#8FA866]/50', pill: 'bg-[#8FA866]' },
};

const getCategoryStyle = (cat: string) => {
  return CATEGORY_COLORS[cat] || { bg: 'bg-surface', border: 'border-ink/15', pill: 'bg-surface' };
};

const getProductInitials = (name: string) => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const highlightMatch = (text: string, query: string) => {
  if (!query || !query.trim()) return text;
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow/80 text-ink rounded-xs px-0.5 font-bold">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// Reusable UI components (Button, Card, Badge, Input, Table, Modal, Toast) are modularized in ./components/ui

// --- Main App Logic ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appUsers, setAppUsers] = useLocalStorage<AppUser[]>('sobatdagang_users', INITIAL_APP_USERS);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast, clearAllToasts } = useUndoToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage<boolean>('sobatdagang_sidebar_collapsed', false);
  const [reducedMotionSetting, setReducedMotionSetting] = useLocalStorage<boolean>('sobatdagang_reduced_motion', false);
  const [tableDensity, setTableDensity] = useLocalStorage<'comfortable' | 'compact'>('sobatdagang_table_density', 'comfortable');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Mandatory force password change states
  const [forceNewPass, setForceNewPass] = useState('');
  const [forceConfirmPass, setForceConfirmPass] = useState('');
  const [forceShowPass, setForceShowPass] = useState(false);
  const [forcePassLoading, setForcePassLoading] = useState(false);
  const [forcePassError, setForcePassError] = useState('');

  // Storage Quota & Auto-Save Flash Feedback
  const [saveIndicatorFlash, setSaveIndicatorFlash] = useState(false);

  // Main scroll viewport ref & scroll restoration per page
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});

  // Onboarding & Tutorial Engine
  const onboarding = useOnboarding(user);

  // Practice Mode state backup
  const [practiceBackup, setPracticeBackup] = useState<{ products: Product[]; transactions: Transaction[] } | null>(null);

  const handleTogglePracticeMode = () => {
    if (!onboarding.isPracticeMode) {
      setPracticeBackup({ products: [...products], transactions: [...transactions] });
      onboarding.setIsPracticeMode(true);
      showToast('Mode Latihan Aktif — Transaksi & stok tidak akan disimpan permanen', 'success');
    } else {
      if (practiceBackup) {
        setProducts(practiceBackup.products);
        setTransactions(practiceBackup.transactions);
        setPracticeBackup(null);
      }
      onboarding.setIsPracticeMode(false);
      showToast('Keluar dari Mode Latihan — Data asli toko dipulihkan', 'success');
    }
  };

  // Keyboard shortcut Shift+/ (?) to toggle Help Center
  useEffect(() => {
    const handleHelpKey = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        const activeTag = (document.activeElement?.tagName || '').toUpperCase();
        if (!['INPUT', 'TEXTAREA'].includes(activeTag)) {
          e.preventDefault();
          onboarding.setIsHelpDrawerOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleHelpKey);
    return () => window.removeEventListener('keydown', handleHelpKey);
  }, [onboarding]);

  const handleViewChange = (newView: AppView) => {
    // Clear toasts on page switch so they don't cover content
    clearAllToasts();

    // Enforce role-based access check
    if (!canAccessView(user?.role, newView)) {
      showToast('Akses dibatasi. Anda tidak memiliki izin untuk halaman ini.', 'error');
      const safeFallback = getDefaultViewForRole(user?.role);
      setView(safeFallback);
      return;
    }

    if (mainScrollRef.current) {
      scrollPositions.current[view] = mainScrollRef.current.scrollTop;
    }
    setView(newView);

    // Track view events for onboarding checklist
    if (newView === 'reports') {
      trackOnboardingEvent('view_reports');
    } else if (newView === 'my-history') {
      trackOnboardingEvent('view_receipt');
    }
  };

  useEffect(() => {
    const container = mainScrollRef.current;
    if (!container) return;
    const targetPos = scrollPositions.current[view] || 0;
    requestAnimationFrame(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = targetPos;
      }
    });
  }, [view]);

  // Global Hotkeys for Command Palette
  useHotkeys('ctrl+k', () => setCommandPaletteOpen(true));
  useHotkeys('meta+k', () => setCommandPaletteOpen(true));


  // POS States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posSearchInput, setPosSearchInput] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [lastReceipt, setLastReceipt] = useState<Transaction | null>(null);

  // Held Carts (Tahan Transaksi) & Item Notes
  const [heldCarts, setHeldCarts] = useLocalStorage<HeldCart[]>('sobatdagang_held_carts', []);
  const [heldCartsModalOpen, setHeldCartsModalOpen] = useState(false);
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  const [itemNoteInput, setItemNoteInput] = useState('');

  // POS Feedback & Modals States
  const [flashingCardId, setFlashingCardId] = useState<string | null>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [cartBadgeKey, setCartBadgeKey] = useState<number>(0);
  const [clearCartModalOpen, setClearCartModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [stockLimitAlertId, setStockLimitAlertId] = useState<string | null>(null);

  // Cross-Navigation Filter States (from Dashboard / notifications)
  const [inventoryInitialTab, setInventoryInitialTab] = useState<'all' | 'low' | 'out'>('all');
  const [inventoryInitialEditProductId, setInventoryInitialEditProductId] = useState<string | null>(null);
  const [reportsInitialPeriod, setReportsInitialPeriod] = useState<'today' | '7days' | '30days' | 'custom'>('7days');

  // POS Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);
  const cancelClearCartRef = useRef<HTMLButtonElement>(null);
  const deletedItemRef = useRef<{ item: CartItem; index: number } | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inventory States
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'low' | 'instock'>('all');
  const [productModal, setProductModal] = useState<{ isOpen: boolean, product: Product | null }>({ isOpen: false, product: null });
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Data
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedProducts = localStorage.getItem('products');
    const savedTransactions = localStorage.getItem('transactions');

    if (savedUser) setUser(JSON.parse(savedUser));
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('products', JSON.stringify(INITIAL_PRODUCTS));
    }

    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    
    if (savedUser && JSON.parse(savedUser).role === Role.KASIR) setView('pos');
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    action?: { label: string; onClick: () => void },
    duration = 3500
  ) => {
    addToast(message, type, action, duration);
  };

  // Debounce POS Search Input (150ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPosSearch(posSearchInput);
      if (posSearchInput.trim()) {
        trackOnboardingEvent('search_product');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [posSearchInput]);

  // Hitung penggunaan penyimpanan lokal (localStorage)
  const storageInfo = useMemo(() => {
    try {
      let totalChars = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalChars += (localStorage.getItem(key) || '').length;
        }
      }
      const bytes = totalChars * 2;
      const maxEstimatedBytes = 5 * 1024 * 1024; // 5 MB
      const pct = Math.min(100, Math.round((bytes / maxEstimatedBytes) * 100));
      return { bytes, pct, isNearFull: pct >= 80 };
    } catch {
      return { bytes: 0, pct: 0, isNearFull: false };
    }
  }, [products, transactions, heldCarts, appUsers]);

  // Indikator "Tersimpan" saat data diperbarui
  useEffect(() => {
    setSaveIndicatorFlash(true);
    const t = setTimeout(() => setSaveIndicatorFlash(false), 2200);
    return () => clearTimeout(t);
  }, [products, transactions, heldCarts, appUsers]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCart([]);
    setView('dashboard');
  };

  // User Management Handlers
  const handleSaveUser = (newUser: AppUser, isEdit: boolean) => {
    let updated: AppUser[];
    if (isEdit) {
      updated = appUsers.map(u => u.id === newUser.id ? newUser : u);
    } else {
      updated = [newUser, ...appUsers];
      trackOnboardingEvent('create_user', newUser);
    }
    setAppUsers(updated);
    localStorage.setItem('sobatdagang_users', JSON.stringify(updated));
  };

  const handleUpdateRole = (userId: string, newRole: Role) => {
    const updated = appUsers.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setAppUsers(updated);
    localStorage.setItem('sobatdagang_users', JSON.stringify(updated));
    if (user?.id === userId) {
      const updatedSelf: User = { ...user, role: newRole };
      setUser(updatedSelf);
      localStorage.setItem('user', JSON.stringify(updatedSelf));
    }
  };

  const handleToggleStatus = (userId: string) => {
    const updated = appUsers.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u);
    setAppUsers(updated);
    localStorage.setItem('sobatdagang_users', JSON.stringify(updated));
  };

  const handleResetPassword = (userId: string, newPasswordHash: string, _plainTemp: string) => {
    const updated = appUsers.map(u =>
      u.id === userId ? { ...u, passwordHash: newPasswordHash, mustChangePassword: true } : u
    );
    setAppUsers(updated);
    localStorage.setItem('sobatdagang_users', JSON.stringify(updated));
  };

  const handleDeleteUser = (userId: string) => {
    const updated = appUsers.filter(u => u.id !== userId);
    setAppUsers(updated);
    localStorage.setItem('sobatdagang_users', JSON.stringify(updated));
  };

  const handleForceChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForcePassError('');
    if (!user) return;
    if (forceNewPass.length < 6) {
      setForcePassError('Password minimal 6 karakter.');
      return;
    }
    if (forceNewPass !== forceConfirmPass) {
      setForcePassError('Konfirmasi password tidak cocok.');
      return;
    }

    setForcePassLoading(true);
    try {
      const newHash = await hashPassword(forceNewPass);
      const updatedUsers = appUsers.map(u =>
        u.id === user.id ? { ...u, passwordHash: newHash, mustChangePassword: false } : u
      );
      setAppUsers(updatedUsers);
      localStorage.setItem('sobatdagang_users', JSON.stringify(updatedUsers));

      const updatedSelf: User = { ...user, mustChangePassword: false };
      setUser(updatedSelf);
      localStorage.setItem('user', JSON.stringify(updatedSelf));

      setForceNewPass('');
      setForceConfirmPass('');
      showToast('Password baru Anda berhasil disimpan!', 'success');
    } catch {
      setForcePassError('Gagal memproses dan mengenkripsi password baru.');
    } finally {
      setForcePassLoading(false);
    }
  };

  // POS Hold-to-Repeat Functions
  const stopHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
  };

  const startHold = (action: () => void) => {
    action();
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        action();
      }, 80);
    }, 320);
  };

  // POS Logic
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return showToast('Stok produk habis!', 'error');
    
    const existing = cart.find(item => item.id === product.id);
    if (existing && existing.quantity >= product.stock) {
      setStockLimitAlertId(product.id);
      setTimeout(() => setStockLimitAlertId(null), 1200);
      showToast(`Batas stok tercapai (${product.stock} ${product.unit})`, 'error');
      return;
    }

    // Interactive feedback
    setFlashingCardId(product.id);
    setTimeout(() => setFlashingCardId(null), 300);

    setLastAddedItemId(product.id);
    setTimeout(() => setLastAddedItemId(null), 600);

    setCartBadgeKey(k => k + 1);

    // Track onboarding checklist event
    trackOnboardingEvent('add_to_cart', product);

    setCart(prev => {
      const ex = prev.find(item => item.id === product.id);
      if (ex) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (id: string, notify = true) => {
    const itemIndex = cart.findIndex(i => i.id === id);
    if (itemIndex === -1) return;
    const item = cart[itemIndex];
    deletedItemRef.current = { item, index: itemIndex };

    setCart(prev => prev.filter(i => i.id !== id));
    setCartBadgeKey(k => k + 1);

    if (notify) {
      showToast(
        `"${item.name}" dihapus dari keranjang`,
        'success',
        {
          label: 'Undo',
          onClick: () => {
            if (deletedItemRef.current) {
              const { item: restored, index } = deletedItemRef.current;
              setCart(prev => {
                const next = [...prev];
                next.splice(index, 0, restored);
                return next;
              });
              setLastAddedItemId(restored.id);
              setTimeout(() => setLastAddedItemId(null), 600);
              showToast(`"${restored.name}" dikembalikan`, 'success');
              deletedItemRef.current = null;
            }
          }
        },
        5000
      );
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    const currentItem = cart.find(item => item.id === id);

    if (delta > 0 && currentItem && product && currentItem.quantity >= product.stock) {
      setStockLimitAlertId(id);
      setTimeout(() => setStockLimitAlertId(null), 1200);
      showToast(`Stok tidak mencukupi (Tersisa ${product.stock} ${product.unit})`, 'error');
      return;
    }

    if (delta > 0) {
      setCartBadgeKey(k => k + 1);
    }

    setCart(prev => {
      let shouldDelete = false;
      const updated = prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) {
            shouldDelete = true;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });

      if (shouldDelete) {
        handleRemoveFromCart(id, true);
        return prev.filter(item => item.id !== id);
      }

      return updated.filter(item => item.quantity > 0);
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  }, [cart]);

  const processPayment = () => {
    if (selectedPayment === PaymentMethod.CASH && cashReceived < cartTotal) {
      return showToast('Uang tunai masih kurang!', 'error');
    }

    setLoading(true);
    setTimeout(() => {
      const newTransaction: Transaction = {
        id: `TRX-${Date.now()}`,
        date: new Date().toISOString(),
        items: [...cart],
        total: cartTotal,
        received: selectedPayment === PaymentMethod.CASH ? cashReceived : cartTotal,
        change: selectedPayment === PaymentMethod.CASH ? cashReceived - cartTotal : 0,
        paymentMethod: selectedPayment,
        userId: user?.id || '',
        userName: user?.username || '',
      };

      const updatedProducts = products.map(p => {
        const cartItem = cart.find(item => item.id === p.id);
        if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
        return p;
      });

      setProducts(updatedProducts);
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);

      if (!onboarding.isPracticeMode) {
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      }

      trackOnboardingEvent('transaction_completed', newTransaction);

      setCompletedTransaction(newTransaction);
      setSuccessModalOpen(true);
      setCart([]);
      setPaymentModal(false);
      setCashReceived(0);
      setLoading(false);

      showToast('Transaksi Berhasil!', 'success', {
        label: 'Lihat Struk',
        onClick: () => setLastReceipt(newTransaction),
      });
    }, 600);
  };

  // Keyboard Shortcuts: "/" for search, Ctrl+Enter for payment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isEditing = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      // Ctrl+Enter or Cmd+Enter: Process Payment
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (view === 'pos') {
          if (!paymentModal && cart.length > 0) {
            setPaymentModal(true);
            setCashReceived(0);
          } else if (paymentModal) {
            if (selectedPayment === PaymentMethod.QRIS || cashReceived >= cartTotal) {
              processPayment();
            }
          }
        }
        return;
      }

      // F2: Tahan Transaksi saat di POS dan keranjang ada isi
      if (e.key === 'F2') {
        e.preventDefault();
        if (view === 'pos' && cart.length > 0) {
          handleHoldCart();
        }
        return;
      }

      // Esc: Tutup modal aktif jika ada
      if (e.key === 'Escape') {
        if (paymentModal) setPaymentModal(false);
        if (heldCartsModalOpen) setHeldCartsModalOpen(false);
        if (clearCartModalOpen) setClearCartModalOpen(false);
        if (activeNoteItemId) setActiveNoteItemId(null);
      }

      // "/" key: focus POS search input (when not already typing in input)
      if (e.key === '/' && !isEditing && view === 'pos') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, paymentModal, heldCartsModalOpen, clearCartModalOpen, activeNoteItemId, cart, selectedPayment, cashReceived, cartTotal, heldCarts]);

  // Handlers untuk Tahan Transaksi & Catatan Item
  const handleHoldCart = (customNote?: string) => {
    if (cart.length === 0) return;
    const newHeld: HeldCart = {
      id: `HOLD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      customerNote: customNote || `Antrean #${heldCarts.length + 1}`,
    };
    setHeldCarts([newHeld, ...heldCarts]);
    setCart([]);
    showToast(`Transaksi ditahan (${newHeld.items.reduce((s, i) => s + i.quantity, 0)} item)`, 'success');
  };

  const handleResumeHeldCart = (held: HeldCart) => {
    if (cart.length > 0) {
      const autoHold: HeldCart = {
        id: `HOLD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        items: [...cart],
        total: cartTotal,
        customerNote: 'Ditahan otomatis saat beralih transaksi',
      };
      setHeldCarts([autoHold, ...heldCarts.filter(h => h.id !== held.id)]);
    } else {
      setHeldCarts(heldCarts.filter(h => h.id !== held.id));
    }
    setCart(held.items);
    setHeldCartsModalOpen(false);
    showToast('Transaksi tertahan dilanjutkan', 'success');
  };

  const handleDeleteHeldCart = (id: string) => {
    setHeldCarts(heldCarts.filter(h => h.id !== id));
    showToast('Transaksi tertahan dihapus', 'success');
  };

  const handleSaveItemNote = (itemId: string, note: string) => {
    setCart(prev => prev.map(item => item.id === itemId ? { ...item, notes: note.trim() || undefined } : item));
    setActiveNoteItemId(null);
    setItemNoteInput('');
    showToast('Catatan item diperbarui', 'success');
  };

  // Inventory Logic
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      let updatedProducts: Product[];
      if (productModal.product) {
        updatedProducts = products.map(p => p.id === productModal.product?.id ? { ...p, ...productForm } as Product : p);
        showToast('Produk berhasil diperbarui');
      } else {
        const newProduct: Product = {
          ...productForm as Product,
          id: Date.now().toString(),
          stock: Number(productForm.stock || 0),
          buyPrice: Number(productForm.buyPrice || 0),
          sellPrice: Number(productForm.sellPrice || 0),
          minStock: Number(productForm.minStock || 0),
        };
        updatedProducts = [...products, newProduct];
        trackOnboardingEvent('add_product', newProduct);
        showToast('Produk baru ditambahkan');
      }
      if (Number(productForm.minStock) > 0) {
        trackOnboardingEvent('set_min_stock');
      }
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      setProductModal({ isOpen: false, product: null });
      setLoading(false);
    }, 300);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Hapus produk ini dari katalog?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem('products', JSON.stringify(updated));
      showToast('Produk dihapus');
    }
  };

  const topProducts = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const productMap: { [key: string]: { name: string, quantity: number } } = {};

    transactions
      .filter(t => new Date(t.date) >= oneMonthAgo)
      .forEach(t => {
        t.items.forEach(item => {
          if (!productMap[item.id]) {
            productMap[item.id] = { name: item.name, quantity: 0 };
          }
          productMap[item.id].quantity += item.quantity;
        });
      });

    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [transactions]);

  const stats: DashboardStats = {
    totalSalesToday: transactions
      .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.total, 0),
    totalProducts: products.length,
    lowStockCount: products.filter(p => p.stock <= p.minStock).length,
    transactionsToday: transactions
      .filter(t => new Date(t.date).toDateString() === new Date().toDateString()).length,
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showToast('Ukuran gambar maksimal 1MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm({ ...productForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LOGIN PAGE (Executive Two-Column Layout & Design Tokens) ---
  if (!user) {
    return (
      <MotionConfig reducedMotion={reducedMotionSetting ? 'always' : 'user'}>
        <LoginPage
          onSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            localStorage.setItem('user', JSON.stringify(loggedInUser));
            setView(loggedInUser.role === Role.ADMIN ? 'dashboard' : 'pos');
            showToast(`Selamat datang, ${loggedInUser.username}!`);
          }}
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </MotionConfig>
    );
  }

  const handleQuickAction = (actionKey: string, payload?: any) => {
    switch (actionKey) {
      case 'new_transaction':
        handleViewChange('pos');
        setPosSearchInput('');
        setPosSearch('');
        setPosCategory('');
        searchInputRef.current?.focus();
        showToast('Mode Kasir POS siap');
        break;
      case 'add_product':
        handleViewChange('inventory');
        showToast('Membuka inventori produk');
        break;
      case 'export_report':
        handleViewChange('reports');
        showToast('Membuka halaman laporan penjualan');
        break;
      case 'select_product':
        if (payload) {
          handleViewChange('pos');
          addToCart(payload);
        }
        break;
      case 'view_receipt':
        if (payload) {
          setLastReceipt(payload);
          trackOnboardingEvent('view_receipt');
        }
        break;
      default:
        break;
    }
  };

  return (
    <MotionConfig reducedMotion={reducedMotionSetting ? 'always' : 'user'}>
      <div className="min-h-screen bg-bg text-ink font-sans p-2 sm:p-3 md:p-4">
        {/* Outer Frame Halaman: border tipis gelap dengan radius besar */}
        <div className="min-h-[calc(100vh-16px)] sm:min-h-[calc(100vh-24px)] md:min-h-[calc(100vh-32px)] border border-ink/15 rounded-[24px] md:rounded-[32px] overflow-hidden flex flex-col lg:flex-row bg-bg relative">
          
          {/* SIDEBAR: Responsive & Collapsible with tooltips & mobile drawer */}
          <Sidebar
            view={view}
            setView={handleViewChange}
            user={user}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            mobileOpen={mobileMenuOpen}
            setMobileOpen={setMobileMenuOpen}
            onLogout={handleLogout}
            onOpenHelp={() => onboarding.setIsHelpDrawerOpen(true)}
          />

          {/* MAIN VIEWPORT */}
          <main ref={mainScrollRef} className="flex-1 overflow-y-auto flex flex-col no-print min-w-0 relative">
            
            {/* TOPBAR: Title with transition, Command Palette trigger, & Dropdowns */}
            <header className="px-4 md:px-8 py-4 border-b border-ink/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sticky top-0 bg-bg z-30">
              <div className="flex items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-surface cursor-pointer focus-visible:ring-2 focus-visible:ring-ink"
                  aria-label="Buka navigasi menu"
                >
                  <LayoutDashboard size={16} />
                </motion.button>
                <div>
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={view}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="text-2xl md:text-3xl lg:text-[34px] font-semibold text-ink tracking-tight capitalize leading-tight"
                    >
                      {view === 'pos'
                        ? 'Kasir POS'
                        : view === 'inventory'
                        ? 'Inventori Produk'
                        : view === 'reports'
                        ? 'Laporan Penjualan'
                        : view === 'my-history'
                        ? 'Riwayat Saya'
                        : view === 'users'
                        ? 'Manajemen Pengguna'
                        : 'Dashboard Bisnis'}
                    </motion.h2>
                  </AnimatePresence>
                  <p className="text-[13px] text-muted font-medium hidden sm:block">
                    SobatDagang • {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Search bar pill with shortcut badge & Four header dropdowns/actions */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button 
                    type="button"
                    data-tour="topbar-search"
                    onClick={() => setCommandPaletteOpen(true)}
                    className="relative flex items-center bg-surface border border-ink/15 hover:border-ink/40 rounded-full px-3.5 py-1.5 w-full sm:w-64 text-left transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-ink"
                    title="Buka Pencarian Global (Ctrl+K)"
                  >
                    <Search size={14} strokeWidth={1.8} className="text-muted mr-2 shrink-0 group-hover:text-ink transition-colors" />
                    <span className="text-[13px] text-muted font-medium w-full truncate">
                      Cari produk, menu...
                    </span>
                    <span className="shrink-0 bg-bg text-ink text-xs font-semibold px-2 py-0.5 rounded-full border border-ink/10 ml-1">
                      Semua
                    </span>
                    <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-muted bg-bg border border-ink/15 rounded-md ml-1 select-none">
                      ⌘K
                    </kbd>
                  </button>
                  <Coachmark
                    id="cmd_k_shortcut"
                    hasSeen={onboarding.state.coachmarksSeen.includes('cmd_k_shortcut')}
                    onDismiss={onboarding.markCoachmarkSeen}
                    title="Pintasan ⌘K / Ctrl+K"
                    message="Tekan ⌘K / Ctrl+K untuk membuka Command Palette cepat."
                    position="bottom"
                  />
                </div>

                {/* Dropdowns di kanan (profil, notifikasi, pengaturan, bantuan) */}
                <div className="flex items-center gap-2 shrink-0">
                  <ProfileDropdown user={user} onLogout={handleLogout} />
                  
                  <div data-tour="topbar-notifications">
                    <NotificationsDropdown
                      products={products}
                      transactions={transactions}
                      currentUser={user}
                      onNavigate={handleViewChange}
                    />
                  </div>

                  <div data-tour="topbar-settings">
                    <SettingsPanel
                      isSidebarCollapsed={isSidebarCollapsed}
                      onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      reducedMotion={reducedMotionSetting}
                      onToggleReducedMotion={() => setReducedMotionSetting(!reducedMotionSetting)}
                      onResetTutorial={onboarding.resetAllOnboarding}
                    />
                  </div>

                  {/* Tombol Bantuan Topbar */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    data-tour="topbar-help"
                    onClick={() => onboarding.setIsHelpDrawerOpen(true)}
                    title="Pusat Bantuan & Tutorial (Shift+/)"
                    className="w-9 h-9 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ink"
                    aria-label="Pusat Bantuan"
                  >
                    <HelpCircle size={16} strokeWidth={1.8} />
                  </motion.button>
                </div>
              </div>
            </header>

            {/* Banner Mode Latihan (Jika aktif) */}
            <PracticeModeBanner
              isActive={onboarding.isPracticeMode}
              onExit={handleTogglePracticeMode}
            />

          {/* VIEW CONTAINER */}
          <div className="p-4 md:p-6 lg:p-8 flex-1">
            <AnimatePresence mode="wait">

              {/* ======================= DASHBOARD VIEW (Admin Only) ======================= */}
              {view === 'dashboard' && (
                <RoleGuard
                  allow={ROUTE_PERMISSIONS.dashboard.allowedRoles}
                  userRole={user.role}
                  targetViewName={ROUTE_PERMISSIONS.dashboard.label}
                  onFallback={handleViewChange}
                >
                  <PageTransition pageKey="dashboard" className="space-y-6">
                    <DashboardView
                      products={products}
                      transactions={transactions}
                      user={user}
                      onNavigate={handleViewChange}
                      onNavigateToInventoryWithFilter={(stockTab) => {
                        setInventoryInitialTab(stockTab);
                        handleViewChange('inventory');
                      }}
                      onNavigateToReportsWithPeriod={(p) => {
                        setReportsInitialPeriod(p);
                        handleViewChange('reports');
                      }}
                      onRestockProduct={(productId) => {
                        setInventoryInitialEditProductId(productId);
                        handleViewChange('inventory');
                      }}
                      onViewReceipt={(tx) => setLastReceipt(tx)}
                      onQuickAction={handleQuickAction}
                      showToast={showToast}
                    />
                  </PageTransition>
                </RoleGuard>
              )}

              {/* ======================= POS (KASIR) VIEW ======================= */}
              {view === 'pos' && (
                <PageTransition pageKey="pos" className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-140px)]">
                  {/* Katalog Produk Sisi Kiri */}
                  <div className="flex-1 flex flex-col gap-3.5 overflow-hidden">
                    
                    {/* 1. Bar Pencarian Produk di atas Grid dengan shortcut "/" dan input Barcode Scanner */}
                    <div data-tour="kasir-cari" className="relative flex items-center shrink-0">
                      <Search size={16} strokeWidth={2} className="absolute left-4 text-muted pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Scan barcode / cari nama produk / kode SKU... (Tekan '/')"
                        value={posSearchInput}
                        onChange={(e) => setPosSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const query = posSearchInput.trim().toLowerCase();
                            if (!query) return;

                            // 1. Cari kecocokan persis kode SKU atau nama
                            const exactMatch = products.find(p => 
                              p.code.toLowerCase() === query || p.name.toLowerCase() === query
                            );

                            // 2. Atau jika ada filter produk yang tepat menyisakan 1 barang
                            const matchedFiltered = products.filter(p => {
                              const matchSearch = p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
                              const matchCat = !posCategory || p.category === posCategory;
                              return matchSearch && matchCat;
                            });

                            const targetProd = exactMatch || (matchedFiltered.length === 1 ? matchedFiltered[0] : null);

                            if (targetProd) {
                              if (targetProd.stock <= 0) {
                                setStockLimitAlertId(targetProd.id);
                                setTimeout(() => setStockLimitAlertId(null), 1200);
                                showToast(`Stok "${targetProd.name}" habis!`, 'error');
                                playScanBeep();
                                return;
                              }
                              addToCart(targetProd);
                              playScanBeep();
                              setPosSearchInput('');
                              setPosSearch('');
                              showToast(`1x ${targetProd.name} ditambahkan via barcode`, 'success');
                            } else {
                              showToast(`Produk "${posSearchInput}" tidak ditemukan`, 'error');
                            }
                          }
                        }}
                        className="w-full bg-surface border border-ink/15 rounded-full pl-11 pr-14 py-2.5 text-[13px] font-medium text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors shadow-none"
                      />
                      {posSearchInput ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPosSearchInput('');
                            setPosSearch('');
                            searchInputRef.current?.focus();
                          }}
                          className="absolute right-3.5 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
                          aria-label="Hapus teks pencarian"
                        >
                          <X size={14} />
                        </button>
                      ) : (
                        <kbd className="absolute right-4 hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold text-muted bg-bg border border-ink/15 rounded-md select-none">
                          /
                        </kbd>
                      )}

                      <Coachmark
                        id="pos_search_shortcut"
                        hasSeen={onboarding.state.coachmarksSeen.includes('pos_search_shortcut')}
                        onDismiss={onboarding.markCoachmarkSeen}
                        title="Pintasan Tombol '/'"
                        message="Tekan tombol '/' pada keyboard kapan saja untuk langsung mencari produk atau scan barcode."
                        position="bottom"
                      />
                    </div>

                    {/* Filter Kategori: Tab Chip Pill, aktif hitam */}
                    <div data-tour="kasir-kategori" className="flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPosCategory('')}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors duration-150 cursor-pointer",
                          posCategory === '' ? "bg-ink text-white" : "bg-surface text-muted hover:text-ink border border-ink/10"
                        )}
                      >
                        Semua Kategori
                      </motion.button>
                      {CATEGORIES.map(cat => (
                        <motion.button
                          key={cat}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setPosCategory(cat)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors duration-150 cursor-pointer",
                            posCategory === cat ? "bg-ink text-white" : "bg-surface text-muted hover:text-ink border border-ink/10"
                          )}
                        >
                          {cat}
                        </motion.button>
                      ))}
                    </div>

                    {/* Grid Produk: Card Flat Krem, radius 22px */}
                    <div data-tour="kasir-grid" className="flex-1 overflow-y-auto pr-1">
                      {(() => {
                        const filtered = products.filter(p => {
                          const query = posSearch.toLowerCase().trim();
                          const matchSearch = !query || p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
                          const matchCat = !posCategory || p.category === posCategory;
                          return matchSearch && matchCat;
                        });

                        if (filtered.length === 0) {
                          return (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="py-16 px-4 bg-surface rounded-[24px] border border-ink/15 flex flex-col items-center justify-center text-center space-y-3"
                            >
                              <div className="w-14 h-14 rounded-full bg-bg border border-ink/10 flex items-center justify-center text-muted">
                                <Package size={26} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-base font-semibold text-ink">Produk tidak ditemukan</h4>
                                <p className="text-xs text-muted max-w-sm">
                                  {posSearch 
                                    ? `Tidak ada produk yang cocok dengan "${posSearch}". Coba kata kunci lain atau pilih Semua Kategori.`
                                    : 'Tidak ada produk dalam kategori ini.'}
                                </p>
                              </div>
                              {(posSearchInput || posCategory) && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setPosSearchInput('');
                                    setPosSearch('');
                                    setPosCategory('');
                                  }}
                                  className="mt-2"
                                >
                                  Reset Pencarian & Kategori
                                </Button>
                              )}
                            </motion.div>
                          );
                        }

                        return (
                          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                            <AnimatePresence>
                              {filtered.map((p, pIdx) => {
                                const cartItem = cart.find(ci => ci.id === p.id);
                                const catStyle = getCategoryStyle(p.category);
                                const CatIcon = CATEGORY_ICONS[p.category] || Package;
                                const isFlashing = flashingCardId === p.id;
                                const isStockAlert = stockLimitAlertId === p.id;

                                return (
                                  <motion.div
                                    key={p.id}
                                    data-tour={pIdx === 0 ? "kasir-tambah-produk" : undefined}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                  >
                                    <motion.div
                                      whileHover={p.stock > 0 ? { y: -2 } : {}}
                                      whileTap={p.stock > 0 ? { scale: 0.98 } : {}}
                                      onClick={() => {
                                        if (p.stock <= 0) {
                                          setStockLimitAlertId(p.id);
                                          setTimeout(() => setStockLimitAlertId(null), 1200);
                                          showToast(`Stok "${p.name}" habis!`, 'error');
                                          return;
                                        }
                                        if (cartItem && cartItem.quantity >= p.stock) {
                                          setStockLimitAlertId(p.id);
                                          setTimeout(() => setStockLimitAlertId(null), 1200);
                                          showToast(`Stok tersisa ${p.stock} ${p.unit}`, 'error');
                                          return;
                                        }
                                        addToCart(p);
                                      }}
                                      className={cn(
                                        "w-full h-full bg-surface rounded-[22px] border p-4 text-left flex flex-col justify-between transition-all duration-150 relative overflow-hidden group select-none",
                                        p.stock <= 0 ? "opacity-50 cursor-not-allowed border-ink/15" : "cursor-pointer hover:border-ink hover:bg-[#dfd8c5]",
                                        isFlashing ? "ring-2 ring-ink ring-offset-2 scale-[1.01]" : "border-ink/15"
                                      )}
                                    >
                                      {/* Gambar Produk atau Inisial & Ikon Pastel Kategori */}
                                      <div className="h-28 w-full bg-bg rounded-[16px] mb-3 overflow-hidden flex items-center justify-center border border-ink/10 relative">
                                        {p.image ? (
                                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className={cn("w-full h-full flex flex-col items-center justify-center gap-1.5 p-3 select-none", catStyle.bg)}>
                                            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center border", catStyle.border, catStyle.pill, "text-ink")}>
                                              <CatIcon size={18} />
                                            </div>
                                            <span className="font-bold text-xs tracking-wider text-ink opacity-80">
                                              {getProductInitials(p.name)}
                                            </span>
                                          </div>
                                        )}

                                        {/* Feedback visual: Ikon mini terbang ke keranjang */}
                                        {isFlashing && (
                                          <motion.span
                                            initial={{ scale: 0.6, y: 10, x: 0, opacity: 1 }}
                                            animate={{ scale: [1, 1.25, 0.9], y: -35, x: 25, opacity: [1, 1, 0] }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-ink text-white text-[11px] font-bold shadow-md pointer-events-none flex items-center gap-1"
                                          >
                                            <ShoppingCart size={11} /> +1
                                          </motion.span>
                                        )}
                                      </div>

                                      {/* Nama Produk dengan highlight kata kunci cocok */}
                                      <div>
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">{p.category}</span>
                                          <span className="text-[11px] font-mono text-muted">{highlightMatch(p.code, posSearch)}</span>
                                        </div>
                                        <h4 className="font-semibold text-[13px] text-ink line-clamp-2 leading-tight min-h-[32px]">
                                          {highlightMatch(p.name, posSearch)}
                                        </h4>
                                        <p className="text-sm font-semibold text-ink mt-2 tabular-nums">
                                          {formatCurrency(p.sellPrice)}
                                        </p>
                                      </div>

                                      {/* Bottom Row: Stok Badge & Stepper (- jumlah +) jika di keranjang */}
                                      <div className="mt-3 pt-2 border-t border-ink/10 flex items-center justify-between gap-1">
                                        <motion.span
                                          animate={isStockAlert ? { x: [-3, 3, -3, 3, 0] } : {}}
                                          transition={{ duration: 0.3 }}
                                          className={cn(
                                            "text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 transition-colors",
                                            isStockAlert || (cartItem && cartItem.quantity >= p.stock)
                                              ? "bg-pink text-ink border border-pink"
                                              : p.stock <= p.minStock
                                                ? "bg-pink text-ink"
                                                : "bg-green text-ink border border-ink/10"
                                          )}
                                        >
                                          {cartItem && cartItem.quantity >= p.stock
                                            ? `Stok tersisa ${p.stock}`
                                            : `${p.stock} ${p.unit}`}
                                        </motion.span>

                                        {/* Tombol "+" berubah jadi Stepper (- jumlah +) bila ada di keranjang */}
                                        {cartItem ? (
                                          <div
                                            className="flex items-center gap-1 bg-ink text-white rounded-full px-2 py-0.5 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateCartQuantity(p.id, -1);
                                              }}
                                              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                                              aria-label="Kurangi satu"
                                            >
                                              <Minus size={11} />
                                            </button>
                                            <span className="text-xs font-bold text-white px-1 tabular-nums min-w-[14px] text-center">
                                              {cartItem.quantity}
                                            </span>
                                            <button
                                              type="button"
                                              disabled={cartItem.quantity >= p.stock}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (cartItem.quantity >= p.stock) {
                                                  setStockLimitAlertId(p.id);
                                                  setTimeout(() => setStockLimitAlertId(null), 1200);
                                                  showToast(`Stok tersisa ${p.stock} ${p.unit}`, 'error');
                                                  return;
                                                }
                                                addToCart(p);
                                              }}
                                              className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                                                cartItem.quantity >= p.stock ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20 cursor-pointer"
                                              )}
                                              aria-label="Tambah satu"
                                              title={cartItem.quantity >= p.stock ? `Stok tersisa ${p.stock}` : "Tambah satu"}
                                            >
                                              <Plus size={11} />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center text-xs group-hover:bg-black font-semibold shrink-0">
                                            +
                                          </span>
                                        )}
                                      </div>
                                    </motion.div>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Keranjang Kasir Sisi Kanan: Card Krem, Tombol Pill Hitam */}
                  <div data-tour="kasir-keranjang" className="w-full lg:w-[390px] bg-surface rounded-[24px] border border-ink/15 p-5 flex flex-col justify-between shrink-0 min-h-[460px] lg:min-h-0">
                    {/* Header Keranjang: Judul, Tombol Tahan Transaksi, Kosongkan, Badge Item */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-ink/10 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shrink-0">
                          <ShoppingCart size={15} />
                        </div>
                        <h3 className="font-semibold text-base text-ink">Keranjang Kasir</h3>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Tombol Transaksi Tertahan (jika ada) */}
                        {heldCarts.length > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={() => setHeldCartsModalOpen(true)}
                            className="text-xs font-bold text-ink bg-yellow/60 hover:bg-yellow border border-ink/15 px-2.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                            title="Buka daftar transaksi yang ditahan"
                          >
                            <PauseCircle size={12} />
                            <span>Tertahan ({heldCarts.length})</span>
                          </motion.button>
                        )}

                        {/* Tombol Tahan Keranjang Saat Ini */}
                        {cart.length > 0 && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleHoldCart()}
                              className="text-xs font-semibold text-ink bg-bg hover:bg-surface border border-ink/15 px-2.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                              title="Tahan transaksi saat ini (F2)"
                            >
                              <span>Tahan</span>
                              <kbd className="text-[10px] bg-ink/10 px-1 py-0.2 rounded font-mono">F2</kbd>
                            </button>
                            <ContextHelp
                              content="Simpan transaksi yang sedang berlangsung ke daftar antrean sementara (F2) agar Anda dapat melayani pembeli lain terlebih dahulu."
                              placement="bottom"
                            />
                          </div>
                        )}

                        {cart.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setClearCartModalOpen(true)}
                            className="text-xs font-medium text-muted hover:text-ink hover:underline transition-colors cursor-pointer px-1 py-0.5"
                          >
                            Kosongkan
                          </button>
                        )}

                        {/* Badge Jumlah Item Membal */}
                        <motion.span
                          key={cartBadgeKey}
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ duration: 0.25 }}
                          className="bg-bg text-ink text-xs font-semibold px-2.5 py-1 rounded-full border border-ink/10 shrink-0"
                        >
                          {cart.reduce((s, i) => s + i.quantity, 0)} Item
                        </motion.span>
                      </div>
                    </div>

                    {/* Petunjuk Swipe Kiri di Atas Daftar */}
                    {cart.length > 0 && (
                      <div className="relative pt-2 text-[11px] text-muted flex items-center justify-between px-1">
                        <span>Geser item ke kiri untuk hapus cepat</span>
                        <span className="text-[10px] bg-bg px-2 py-0.2 rounded-full border border-ink/10">Swipe kiri = hapus</span>
                        <Coachmark
                          id="cart_swipe_hint"
                          hasSeen={onboarding.state.coachmarksSeen.includes('cart_swipe_hint')}
                          onDismiss={onboarding.markCoachmarkSeen}
                          title="Swipe Kiri untuk Hapus"
                          message="Geser kartu item ke kiri untuk menghapus dengan konfirmasi & Undo 5 detik."
                          position="top"
                        />
                      </div>
                    )}

                    {/* Daftar Item Keranjang */}
                    <div className="flex-1 overflow-y-auto py-2.5 space-y-2.5 my-1 pr-0.5">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted">
                          <ShoppingCart size={32} className="mb-2 opacity-30 text-ink" />
                          <p className="text-[13px] font-medium text-ink">Keranjang masih kosong</p>
                          <p className="text-xs text-muted mt-1 max-w-[220px]">
                            Klik produk di katalog, scan barcode, atau tekan '+' untuk menambahkan
                          </p>
                          {heldCarts.length > 0 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setHeldCartsModalOpen(true)}
                              className="mt-4 rounded-full text-xs font-semibold"
                            >
                              Buka {heldCarts.length} Transaksi Tertahan
                            </Button>
                          )}
                        </div>
                      ) : (
                        <AnimatePresence initial={false}>
                          {cart.map(item => {
                            const matchedProd = products.find(p => p.id === item.id);
                            const maxStock = matchedProd?.stock || 0;
                            const isMaxStock = item.quantity >= maxStock;
                            const isHighlighted = lastAddedItemId === item.id;

                            return (
                              <motion.div 
                                key={item.id} 
                                layout
                                drag="x"
                                dragConstraints={{ left: -75, right: 0 }}
                                dragSnapToOrigin={true}
                                onDragEnd={(_, info) => {
                                  if (info.offset.x < -45) {
                                    handleRemoveFromCart(item.id, true);
                                  }
                                }}
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ 
                                  opacity: 1, 
                                  scale: 1, 
                                  y: 0,
                                  backgroundColor: isHighlighted ? '#F5D76E40' : '#F6F1E3'
                                }}
                                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                                transition={{ duration: 0.2 }}
                                className="p-3 rounded-[18px] border border-ink/10 flex flex-col gap-1.5 transition-colors group cursor-grab active:cursor-grabbing relative overflow-hidden"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[13px] text-ink truncate">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <p className="text-xs text-muted font-medium">{formatCurrency(item.sellPrice)}</p>
                                      {isMaxStock && (
                                        <span className="text-[10px] font-semibold text-ink bg-pink/60 px-1.5 py-0.2 rounded-full border border-ink/10">
                                          Maks {item.quantity}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Quantity Pill Controls with Hold-to-Repeat */}
                                  <div className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded-full border border-ink/10 shrink-0">
                                    <motion.button 
                                      whileTap={{ scale: 0.85 }}
                                      onPointerDown={() => startHold(() => updateCartQuantity(item.id, -1))}
                                      onPointerUp={stopHold}
                                      onPointerLeave={stopHold}
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-ink hover:bg-black hover:text-white transition-colors cursor-pointer"
                                      title="Kurangi jumlah (tahan untuk cepat)"
                                    >
                                      {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                                    </motion.button>

                                    {/* Angka jumlah berganti dengan animasi naik/turun */}
                                    <div className="w-5 text-center relative overflow-hidden h-4 flex items-center justify-center">
                                      <AnimatePresence mode="popLayout" initial={false}>
                                        <motion.span
                                          key={item.quantity}
                                          initial={{ y: 8, opacity: 0 }}
                                          animate={{ y: 0, opacity: 1 }}
                                          exit={{ y: -8, opacity: 0 }}
                                          transition={{ duration: 0.15 }}
                                          className="text-xs font-semibold text-ink tabular-nums block"
                                        >
                                          {item.quantity}
                                        </motion.span>
                                      </AnimatePresence>
                                    </div>

                                    <motion.button 
                                      whileTap={{ scale: 0.85 }}
                                      disabled={isMaxStock}
                                      onPointerDown={() => {
                                        if (!isMaxStock) {
                                          startHold(() => updateCartQuantity(item.id, 1));
                                        }
                                      }}
                                      onPointerUp={stopHold}
                                      onPointerLeave={stopHold}
                                      className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center text-ink transition-colors",
                                        isMaxStock ? "opacity-30 cursor-not-allowed" : "hover:bg-black hover:text-white cursor-pointer"
                                      )}
                                      title={isMaxStock ? `Stok tersisa ${maxStock}` : "Tambah jumlah (tahan untuk cepat)"}
                                    >
                                      <Plus size={12} />
                                    </motion.button>
                                  </div>

                                  {/* Subtotal Item */}
                                  <div className="text-right shrink-0 min-w-[65px]">
                                    <p className="font-semibold text-[13px] text-ink tabular-nums">
                                      {formatCurrency(item.sellPrice * item.quantity)}
                                    </p>
                                  </div>

                                  {/* Tombol Hapus Langsung dengan Toast Undo 5 detik */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromCart(item.id, true)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer shrink-0"
                                    title="Hapus item dari keranjang"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                {/* Baris Catatan Item Opsional */}
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-ink/5">
                                  {item.notes ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveNoteItemId(item.id);
                                        setItemNoteInput(item.notes || '');
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow/40 border border-yellow/60 text-[11px] font-medium text-ink hover:bg-yellow/70 transition-colors text-left max-w-full truncate"
                                      title="Klik untuk ubah catatan"
                                    >
                                      <MessageSquare size={11} className="shrink-0" />
                                      <span className="truncate">{item.notes}</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveNoteItemId(item.id);
                                        setItemNoteInput('');
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink font-medium transition-colors"
                                    >
                                      <MessageSquare size={11} />
                                      <span>+ Catatan item</span>
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Ringkasan & Tombol Konfirmasi Pembayaran: Satu Sumber Nilai cartTotal */}
                    <div className="pt-4 border-t border-ink/10 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-medium text-muted">Total Pembayaran</span>
                        <span className="text-3xl font-semibold text-ink tabular-nums tracking-tight">
                          <CountUp value={cartTotal} formatter={formatCurrency} />
                        </span>
                      </div>
                      <Button 
                        data-tour="kasir-bayar"
                        className="w-full py-3.5 text-sm font-semibold rounded-full flex items-center justify-center gap-2"
                        disabled={cart.length === 0}
                        onClick={() => { setPaymentModal(true); setCashReceived(0); }}
                      >
                        {cart.length === 0 ? (
                          'Pilih produk dulu'
                        ) : (
                          <>
                            <span>Proses Pembayaran ({formatCurrency(cartTotal)})</span>
                            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] bg-white/20 text-white rounded font-mono">
                              Ctrl+Enter
                            </kbd>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </PageTransition>
              )}

              {/* ======================= INVENTORI VIEW (Admin Only) ======================= */}
              {view === 'inventory' && (
                <RoleGuard
                  allow={ROUTE_PERMISSIONS.inventory.allowedRoles}
                  userRole={user.role}
                  targetViewName={ROUTE_PERMISSIONS.inventory.label}
                  onFallback={handleViewChange}
                >
                  <PageTransition pageKey="inventory" className="space-y-4">
                    <InventoryView
                      products={products}
                      transactions={transactions}
                      initialStockTab={inventoryInitialTab}
                      initialEditProductId={inventoryInitialEditProductId}
                      onClearInitialEditProductId={() => setInventoryInitialEditProductId(null)}
                      onSaveProduct={(product, isEdit) => {
                        let updated: Product[];
                        if (isEdit) {
                          updated = products.map(p => p.id === product.id ? product : p);
                          showToast(`Produk "${product.name}" berhasil diperbarui`, 'success');
                        } else {
                          updated = [product, ...products];
                          showToast(`Produk "${product.name}" berhasil ditambahkan`, 'success');
                          trackOnboardingEvent('add_product', product);
                        }
                        if (product.minStock > 0) {
                          trackOnboardingEvent('set_min_stock', product);
                        }
                        setProducts(updated);
                        if (!onboarding.isPracticeMode) {
                          localStorage.setItem('products', JSON.stringify(updated));
                        }
                      }}
                      onDeleteProduct={(id) => {
                        const updated = products.filter(p => p.id !== id);
                        setProducts(updated);
                        localStorage.setItem('products', JSON.stringify(updated));
                      }}
                      onBatchDeleteProducts={(ids) => {
                        const updated = products.filter(p => !ids.includes(p.id));
                        setProducts(updated);
                        localStorage.setItem('products', JSON.stringify(updated));
                      }}
                      onBatchUpdateCategory={(ids, newCategory) => {
                        const updated = products.map(p => ids.includes(p.id) ? { ...p, category: newCategory } : p);
                        setProducts(updated);
                        localStorage.setItem('products', JSON.stringify(updated));
                      }}
                      onUpdateStock={(id, newStock) => {
                        const updated = products.map(p => p.id === id ? { ...p, stock: newStock } : p);
                        setProducts(updated);
                        localStorage.setItem('products', JSON.stringify(updated));
                      }}
                      onRestoreProducts={(restored) => {
                        const existingIds = new Set(products.map(p => p.id));
                        const toAdd = restored.filter(r => !existingIds.has(r.id));
                        const updated = products.map(p => {
                          const match = restored.find(r => r.id === p.id);
                          return match || p;
                        });
                        const finalProducts = [...toAdd, ...updated];
                        setProducts(finalProducts);
                        localStorage.setItem('products', JSON.stringify(finalProducts));
                      }}
                      showToast={showToast}
                    />
                  </PageTransition>
                </RoleGuard>
              )}

              {/* ======================= RIWAYAT SAYA (Kasir & Admin) ======================= */}
              {view === 'my-history' && (
                <RoleGuard
                  allow={ROUTE_PERMISSIONS['my-history'].allowedRoles}
                  userRole={user?.role}
                  targetViewName={ROUTE_PERMISSIONS['my-history'].label}
                  onFallback={handleViewChange}
                >
                  <PageTransition pageKey="my-history" className="space-y-6">
                    <MyHistoryView
                      currentUser={user!}
                      transactions={transactions}
                      onViewReceipt={(tx) => setLastReceipt(tx)}
                      onNavigateToPos={() => handleViewChange('pos')}
                      showToast={showToast}
                    />
                  </PageTransition>
                </RoleGuard>
              )}

              {/* ======================= LAPORAN VIEW (Admin Only) ======================= */}
              {view === 'reports' && (
                <RoleGuard
                  allow={ROUTE_PERMISSIONS.reports.allowedRoles}
                  userRole={user.role}
                  targetViewName={ROUTE_PERMISSIONS.reports.label}
                  onFallback={handleViewChange}
                >
                  <PageTransition pageKey="reports" className="space-y-6">
                    <SalesReports 
                      transactions={transactions}
                      products={products}
                      initialPeriod={reportsInitialPeriod}
                      onViewReceipt={(tx) => setLastReceipt(tx)}
                      onNavigateToPos={() => setView('pos')}
                      showToast={showToast}
                    />
                  </PageTransition>
                </RoleGuard>
              )}

              {/* ======================= PENGGUNA VIEW (Admin Only) ======================= */}
              {view === 'users' && (
                <RoleGuard
                  allow={ROUTE_PERMISSIONS.users.allowedRoles}
                  userRole={user.role}
                  targetViewName={ROUTE_PERMISSIONS.users.label}
                  onFallback={handleViewChange}
                >
                  <PageTransition pageKey="users" className="space-y-6">
                    <UsersView
                      currentUser={user}
                      users={appUsers}
                      onSaveUser={handleSaveUser}
                      onUpdateRole={handleUpdateRole}
                      onToggleStatus={handleToggleStatus}
                      onResetPassword={handleResetPassword}
                      onDeleteUser={handleDeleteUser}
                      showToast={showToast}
                    />
                  </PageTransition>
                </RoleGuard>
              )}

            </AnimatePresence>
          </div>

          {/* Tombol Kembali ke Atas pada Scroll Panjang */}
          <ScrollToTop containerRef={mainScrollRef} />
        </main>
      </div>

      {/* ======================= MODAL KONFIRMASI KOSONGKAN KERANJANG ======================= */}
      <Modal 
        isOpen={clearCartModalOpen} 
        onClose={() => setClearCartModalOpen(false)} 
        title="Kosongkan Keranjang?" 
        subtitle={`Yakin ingin membatalkan semua item dalam keranjang kasir?`}
        maxWidth="max-w-sm"
        initialFocusRef={cancelClearCartRef}
      >
        <div className="space-y-4 pt-1">
          <p className="text-[13px] text-muted leading-relaxed">
            Semua {cart.reduce((s, i) => s + i.quantity, 0)} produk yang telah ditambahkan akan dihapus dari transaksi saat ini. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-2.5 pt-2">
            <Button 
              ref={cancelClearCartRef}
              type="button" 
              variant="secondary" 
              className="flex-1 py-2.5 text-xs font-semibold rounded-full" 
              onClick={() => setClearCartModalOpen(false)}
            >
              Batal
            </Button>
            <Button 
              type="button" 
              className="flex-1 py-2.5 text-xs font-semibold rounded-full bg-pink text-ink hover:bg-[#e89dbd] border border-pink" 
              onClick={() => {
                setCart([]);
                setClearCartModalOpen(false);
                showToast('Keranjang kasir telah dikosongkan', 'success');
              }}
            >
              Ya, Kosongkan
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================= MODAL TRANSAKSI TERTAHAN (HOLD) ======================= */}
      <Modal
        isOpen={heldCartsModalOpen}
        onClose={() => setHeldCartsModalOpen(false)}
        title="Daftar Transaksi Tertahan (Hold)"
        subtitle={`${heldCarts.length} transaksi disimpan sementara`}
        maxWidth="max-w-md"
      >
        <div className="space-y-3.5">
          {heldCarts.length === 0 ? (
            <div className="py-8 text-center text-muted">
              <PauseCircle size={32} className="mx-auto mb-2 opacity-40 text-ink" />
              <p className="text-sm font-semibold text-ink">Tidak ada transaksi yang ditahan</p>
              <p className="text-xs text-muted mt-1">Gunakan tombol "Tahan" atau tekan F2 saat ada pesanan tertunda.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {heldCarts.map((held) => {
                const totalItems = held.items.reduce((s, it) => s + it.quantity, 0);
                const timeStr = new Date(held.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={held.id}
                    className="p-3.5 bg-bg rounded-[20px] border border-ink/15 flex flex-col gap-2 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-ink">{held.customerNote || 'Antrean'}</span>
                        <span className="text-[11px] text-muted bg-surface px-2 py-0.5 rounded-full border border-ink/10">
                          {timeStr}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-ink tabular-nums">
                        {formatCurrency(held.total)}
                      </span>
                    </div>

                    <p className="text-xs text-muted line-clamp-1">
                      {totalItems} item: {held.items.map(it => `${it.name} (${it.quantity}x)`).join(', ')}
                    </p>

                    <div className="flex items-center gap-2 pt-1 border-t border-ink/10">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeleteHeldCart(held.id)}
                        className="py-1 px-3 text-xs font-semibold text-pink-700 hover:bg-pink/20"
                      >
                        Hapus
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResumeHeldCart(held)}
                        className="flex-1 py-1 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5"
                      >
                        <PlayCircle size={13} />
                        Lanjutkan Transaksi
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            variant="secondary"
            className="w-full py-2.5 text-xs font-semibold rounded-full mt-2"
            onClick={() => setHeldCartsModalOpen(false)}
          >
            Tutup
          </Button>
        </div>
      </Modal>

      {/* ======================= MODAL CATATAN ITEM ======================= */}
      <Modal
        isOpen={!!activeNoteItemId}
        onClose={() => setActiveNoteItemId(null)}
        title="Catatan Tambahan Produk"
        subtitle={cart.find(it => it.id === activeNoteItemId)?.name || ''}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 pt-1">
          <input
            type="text"
            autoFocus
            placeholder="Contoh: Tanpa es, manis sedang, bungkus terpisah..."
            value={itemNoteInput}
            onChange={(e) => setItemNoteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && activeNoteItemId) {
                e.preventDefault();
                handleSaveItemNote(activeNoteItemId, itemNoteInput);
              }
            }}
            className="w-full bg-bg border border-ink/15 rounded-full px-4 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 py-2 text-xs font-semibold rounded-full"
              onClick={() => setActiveNoteItemId(null)}
            >
              Batal
            </Button>
            <Button
              className="flex-1 py-2 text-xs font-semibold rounded-full"
              onClick={() => {
                if (activeNoteItemId) {
                  handleSaveItemNote(activeNoteItemId, itemNoteInput);
                }
              }}
            >
              Simpan Catatan
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================= MODAL PEMBAYARAN ======================= */}
      <Modal 
        isOpen={paymentModal} 
        onClose={() => setPaymentModal(false)} 
        title="Konfirmasi Pembayaran"
      >
        <div className="space-y-5">
          {/* Metode Pembayaran: Tab Chip Pill */}
          <div className="flex bg-bg p-1 rounded-full border border-ink/10 gap-1">
            {[
              { id: PaymentMethod.CASH, label: 'Tunai', icon: Banknote },
              { id: PaymentMethod.QRIS, label: 'QRIS Scan', icon: CreditCard },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedPayment(m.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-semibold text-xs transition-colors cursor-pointer",
                  selectedPayment === m.id ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
              >
                <m.icon size={15} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Tagihan Box Hitam: Menggunakan Nilai cartTotal */}
          <div className="bg-ink p-5 rounded-[22px] text-center text-white">
            <span className="text-xs text-white/70 font-semibold block uppercase tracking-wider">Total Tagihan</span>
            <p className="text-3xl md:text-4xl font-semibold text-white tabular-nums tracking-tight mt-1">
              {formatCurrency(cartTotal)}
            </p>
          </div>

          {selectedPayment === PaymentMethod.CASH ? (
            <div className="space-y-4">
              {/* Input Nominal Diterima Berformat Rupiah Otomatis Tanpa Spinner */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted block ml-1.5">
                  Nominal Diterima
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4.5 font-bold text-ink text-lg select-none">
                    Rp
                  </span>
                  <input 
                    ref={cashInputRef}
                    type="text"
                    inputMode="numeric"
                    autoFocus 
                    placeholder="0"
                    value={cashReceived > 0 ? formatNumber(cashReceived) : ''} 
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const val = raw ? parseInt(raw, 10) : 0;
                      setCashReceived(val);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (cashReceived >= cartTotal && !loading) {
                          processPayment();
                        }
                      }
                    }}
                    className="w-full bg-bg border border-ink/15 rounded-full pl-13 pr-5 py-3 text-2xl font-bold text-ink text-center tabular-nums focus:outline-hidden focus:border-ink shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Tombol Uang Cepat (Uang Pas + Pecahan Disesuaikan Total) */}
              <div data-tour="kasir-uang-cepat" className="space-y-1.5">
                <div className="flex items-center gap-1.5 ml-1.5">
                  <span className="text-xs font-semibold text-muted block">Pilihan Uang Cepat</span>
                  <ContextHelp
                    content="Gunakan 'Uang Pas' untuk bayar tanpa kembalian, atau pilih pecahan terdekat untuk kalkulasi kembalian otomatis."
                    placement="top"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const amounts = new Set<number>();
                    amounts.add(cartTotal);
                    [20000, 50000, 100000, 200000].forEach(amt => {
                      if (amt >= cartTotal) amounts.add(amt);
                    });
                    if (cartTotal > 0) {
                      const ceil20k = Math.ceil(cartTotal / 20000) * 20000;
                      const ceil50k = Math.ceil(cartTotal / 50000) * 50000;
                      const ceil100k = Math.ceil(cartTotal / 100000) * 100000;
                      if (ceil20k > cartTotal) amounts.add(ceil20k);
                      if (ceil50k > cartTotal) amounts.add(ceil50k);
                      if (ceil100k > cartTotal) amounts.add(ceil100k);
                    }
                    return Array.from(amounts).sort((a, b) => a - b).slice(0, 5);
                  })().map(amt => (
                    <button 
                      key={amt} 
                      type="button" 
                      onClick={() => setCashReceived(amt)} 
                      className={cn(
                        "flex-1 min-w-[70px] py-2 px-2.5 border rounded-full text-xs font-semibold transition-colors cursor-pointer text-center",
                        cashReceived === amt
                          ? "bg-ink text-white border-ink"
                          : "bg-bg border-ink/15 text-ink hover:bg-ink hover:text-white"
                      )}
                    >
                      {amt === cartTotal ? 'Uang Pas' : formatNumber(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Kembalian Realtime / Kekurangan Berwarna Pink */}
              {cashReceived < cartTotal ? (
                <div className="bg-pink/35 border border-pink/60 p-4 rounded-[18px] flex justify-between items-center">
                  <span className="text-xs font-semibold text-ink">Uang Masih Kurang</span>
                  <span className="text-base font-bold text-[#b42b58] tabular-nums">
                    Kurang {formatCurrency(cartTotal - cashReceived)}
                  </span>
                </div>
              ) : (
                <div className="bg-bg p-4 rounded-[18px] flex justify-between items-center border border-ink/10">
                  <span className="text-xs font-semibold text-muted">Uang Kembalian</span>
                  <span className="text-2xl font-bold tabular-nums text-ink">
                    <CountUp value={cashReceived - cartTotal} formatter={formatCurrency} />
                  </span>
                </div>
              )}

              <Button 
                className={cn(
                  "w-full py-3.5 text-sm font-semibold rounded-full",
                  cashReceived < cartTotal && "opacity-40 cursor-not-allowed"
                )} 
                onClick={processPayment} 
                disabled={cashReceived < cartTotal || loading}
              >
                {loading ? 'Memproses Transaksi...' : `Konfirmasi Selesai (${formatCurrency(cartTotal)})`}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab QRIS: Instruksi Jelas & Label Konfirmasi Manual */}
              <div className="p-6 bg-bg border border-ink/15 rounded-[22px] flex flex-col items-center justify-center text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow/30 border border-yellow/50 text-xs font-semibold text-ink">
                  <AlertTriangle size={13} />
                  <span>Konfirmasi manual</span>
                </div>
                
                <div className="w-40 h-40 bg-white p-3 rounded-[18px] border border-ink/10 flex flex-col items-center justify-center">
                  <div className="w-full h-full border-2 border-dashed border-ink/20 rounded-[12px] flex flex-col items-center justify-center p-2 text-center">
                    <CreditCard size={28} className="text-muted mb-1" />
                    <span className="font-bold text-xs text-ink tracking-widest uppercase">QRIS KASIR</span>
                    <span className="text-[10px] text-muted font-medium mt-0.5">SobatDagang UMKM</span>
                  </div>
                </div>

                <div className="space-y-1 max-w-xs">
                  <p className="text-[13px] font-semibold text-ink">Tunjukkan QRIS ke Pelanggan</p>
                  <p className="text-xs text-muted leading-relaxed">
                    Sistem belum terintegrasi API QRIS otomatis. Harap verifikasi bukti transfer atau mutasi rekening manual di smartphone Anda sebelum konfirmasi.
                  </p>
                </div>
              </div>

              <Button 
                className="w-full py-3.5 text-sm font-semibold rounded-full" 
                onClick={processPayment} 
                disabled={loading}
              >
                {loading ? 'Memproses Transaksi...' : 'Konfirmasi Pembayaran Diterima'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* ======================= MODAL SUKSES TRANSAKSI (POST-PAYMENT) ======================= */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Pembayaran Berhasil"
        maxWidth="max-w-md"
      >
        {completedTransaction && (
          <div className="space-y-5 text-center">
            {/* Animasi Centang Tergambar */}
            <div className="w-16 h-16 mx-auto rounded-full bg-green flex items-center justify-center text-ink border border-ink/15">
              <svg
                className="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M20 6L9 17l-5-5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>
            </div>

            <div>
              <h4 className="text-xl font-bold text-ink">Transaksi Berhasil Selesai</h4>
              <p className="text-xs text-muted mt-1">ID: #{completedTransaction.id.split('-')[1]}</p>
            </div>

            {/* Ringkasan Singkat */}
            <div className="bg-bg rounded-[20px] p-4 border border-ink/10 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Metode Pembayaran</span>
                <span className="font-semibold text-ink">{completedTransaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Total Pembayaran</span>
                <span className="font-bold text-ink">{formatCurrency(completedTransaction.total)}</span>
              </div>
              {completedTransaction.paymentMethod === PaymentMethod.CASH && (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">Nominal Diterima</span>
                    <span className="font-semibold text-ink">{formatCurrency(completedTransaction.received)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-ink/10">
                    <span className="font-semibold text-ink">Kembalian</span>
                    <span className="font-bold text-ink text-sm">{formatCurrency(completedTransaction.change)}</span>
                  </div>
                </>
              )}
            </div>

            {/* 3 Tombol Aksi: Lihat Struk, Transaksi Baru, Riwayat Saya / Lihat di Laporan */}
            <div data-tour="kasir-riwayat" className="space-y-2 pt-1">
              <Button
                className="w-full py-3 text-sm font-semibold rounded-full flex items-center justify-center gap-2"
                onClick={() => {
                  setSuccessModalOpen(false);
                  setLastReceipt(completedTransaction);
                  trackOnboardingEvent('view_receipt');
                }}
              >
                <Printer size={16} /> Lihat Struk
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 py-2.5 text-xs font-semibold rounded-full"
                  onClick={() => setSuccessModalOpen(false)}
                >
                  Transaksi Baru
                </Button>
                {user?.role === Role.ADMIN ? (
                  <Button
                    variant="secondary"
                    className="flex-1 py-2.5 text-xs font-semibold rounded-full"
                    onClick={() => {
                      setSuccessModalOpen(false);
                      handleViewChange('reports');
                    }}
                  >
                    Lihat di Laporan
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="flex-1 py-2.5 text-xs font-semibold rounded-full"
                    onClick={() => {
                      setSuccessModalOpen(false);
                      handleViewChange('my-history');
                      trackOnboardingEvent('view_receipt');
                    }}
                  >
                    Riwayat Saya
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================= STRUK PEMBAYARAN (RECEIPT) ======================= */}
      <Modal isOpen={!!lastReceipt} onClose={() => setLastReceipt(null)} title="Struk Pembayaran">
        <div id="receipt" className="receipt-content max-w-[320px] mx-auto bg-bg p-6 rounded-[22px] border border-ink/15 text-[13px] text-ink">
          <div className="text-center pb-4 border-b border-ink/15">
            <h4 className="font-semibold text-base tracking-tight">SobatDagang</h4>
            <p className="text-xs text-muted mt-0.5">Partner Bisnis UMKM Modern</p>
            <p className="text-xs text-muted mt-1">INV: #{lastReceipt?.id.split('-')[1]} • {lastReceipt ? new Date(lastReceipt.date).toLocaleDateString('id-ID') : ''}</p>
          </div>

          <div className="py-4 space-y-2 border-b border-ink/15">
            {lastReceipt?.items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <div className="truncate max-w-[170px]">
                  <span className="font-semibold block truncate">{item.name}</span>
                  <span className="text-xs text-muted font-medium">{item.quantity} x {formatCurrency(item.sellPrice)}</span>
                </div>
                <span className="font-semibold tabular-nums">{formatCurrency(item.sellPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="py-3 space-y-1.5 text-xs font-medium">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(lastReceipt?.total || 0)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>Bayar ({lastReceipt?.paymentMethod})</span>
              <span>{formatCurrency(lastReceipt?.received || 0)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>Kembali</span>
              <span>{formatCurrency(lastReceipt?.change || 0)}</span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-ink/15 text-xs text-muted font-medium">
            Terima kasih atas kunjungan Anda
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setLastReceipt(null)}>
            Tutup
          </Button>
          <Button className="flex-1" onClick={() => window.print()}>
            <Printer size={15} /> Cetak Struk
          </Button>
        </div>
      </Modal>

      {/* ======================= COMMAND PALETTE (CTRL/CMD+K) ======================= */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        products={products}
        transactions={transactions}
        currentUser={user}
        onNavigate={handleViewChange}
        onQuickAction={handleQuickAction}
      />

      {/* ======================= MODAL WAJIB GANTI PASSWORD ======================= */}
      <Modal
        isOpen={Boolean(user?.mustChangePassword)}
        onClose={() => {}}
        title="Ganti Password Wajib"
        subtitle="Password Anda telah di-reset oleh Administrator. Silakan buat password baru Anda sebelum melanjutkan."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleForceChangePasswordSubmit} className="space-y-4 pt-1">
          <div className="p-3 bg-yellow/30 border border-yellow/50 rounded-[18px] text-xs text-ink space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <KeyRound size={14} />
              Pembaruan Keamanan Diperlukan
            </p>
            <p className="text-[11px] text-muted">
              Untuk melindungi akses akun Anda, wajib menetapkan kata sandi baru pribadi sebelum dapat menggunakan sistem.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink block">
              Password Baru <span className="text-pink-600">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={forceShowPass ? 'text' : 'password'}
                required
                placeholder="Minimal 6 karakter..."
                value={forceNewPass}
                onChange={(e) => setForceNewPass(e.target.value)}
                className="w-full bg-bg border border-ink/15 rounded-[16px] px-3.5 pr-10 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setForceShowPass(!forceShowPass)}
                className="absolute right-3 text-muted hover:text-ink cursor-pointer"
              >
                {forceShowPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink block">
              Ulangi Password Baru <span className="text-pink-600">*</span>
            </label>
            <input
              type={forceShowPass ? 'text' : 'password'}
              required
              placeholder="Ketik ulang password baru..."
              value={forceConfirmPass}
              onChange={(e) => setForceConfirmPass(e.target.value)}
              className="w-full bg-bg border border-ink/15 rounded-[16px] px-3.5 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors font-mono"
            />
          </div>

          {forceNewPass && (
            <div className="p-3 bg-bg rounded-[16px] border border-ink/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted font-medium text-[11px]">Kekuatan:</span>
                <span className={cn("font-bold text-[11px]", calculatePasswordStrength(forceNewPass).textColor)}>
                  {calculatePasswordStrength(forceNewPass).label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      step <= calculatePasswordStrength(forceNewPass).score ? calculatePasswordStrength(forceNewPass).color : "bg-ink/10"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {forcePassError && (
            <p className="text-xs font-semibold text-[#b42b58] bg-pink/20 p-2.5 rounded-[14px] border border-pink/40">
              {forcePassError}
            </p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3 text-xs font-semibold rounded-full flex items-center justify-center gap-2"
              disabled={!forceNewPass || forceNewPass.length < 6 || forceNewPass !== forceConfirmPass || forcePassLoading}
            >
              {forcePassLoading ? 'Menyimpan...' : 'Simpan Password Baru & Lanjutkan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================= ONBOARDING & TUTORIAL SUITE ======================= */}
      <WelcomeModal
        isOpen={onboarding.isWelcomeOpen}
        user={user}
        onStartTour={onboarding.startTour}
        onLater={onboarding.dismissWelcome}
        onNeverAgain={onboarding.dismissWelcomeForever}
      />

      <GuidedTour
        isOpen={onboarding.isTourActive}
        steps={onboarding.tourSteps}
        currentStepIndex={onboarding.currentStepIndex}
        onStepChange={onboarding.setTourStep}
        onComplete={onboarding.completeTour}
        onDismiss={onboarding.dismissTour}
        currentView={view}
        onNavigate={handleViewChange}
      />

      <OnboardingChecklist
        items={onboarding.checklistItems}
        completedIds={onboarding.state.checklistCompleted}
        isDismissed={onboarding.state.checklistDismissed}
        user={user}
        onDismiss={onboarding.dismissChecklist}
        onNavigateView={handleViewChange}
        onOpenHelp={() => onboarding.setIsHelpDrawerOpen(true)}
        onStartTour={onboarding.startTour}
      />

      <HelpCenterDrawer
        isOpen={onboarding.isHelpDrawerOpen}
        onClose={() => onboarding.setIsHelpDrawerOpen(false)}
        user={user}
        onStartTour={() => {
          onboarding.setIsHelpDrawerOpen(false);
          onboarding.startTour();
        }}
        onReopenChecklist={() => {
          onboarding.setIsHelpDrawerOpen(false);
          onboarding.restoreChecklist();
        }}
        onOpenWelcome={() => {
          onboarding.setIsHelpDrawerOpen(false);
          onboarding.openWelcomeModal();
        }}
        onResetTutorial={() => {
          onboarding.resetAllOnboarding();
          showToast('Tutorial & checklist telah di-reset ke awal');
        }}
        isPracticeMode={onboarding.isPracticeMode}
        onTogglePracticeMode={handleTogglePracticeMode}
        onNavigateView={handleViewChange}
      />

      {/* ======================= TOAST NOTIFIKASI TUMPUK ======================= */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  </MotionConfig>
);
}
