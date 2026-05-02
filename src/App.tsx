/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  UploadCloud
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Role, User, Product, Transaction, CartItem, PaymentMethod, DashboardStats } from './types.ts';
import { INITIAL_PRODUCTS, CATEGORIES, USERS } from './constants.ts';
import { cn, formatCurrency, formatNumber } from './lib/utils.ts';

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

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all active:scale-95',
      secondary: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all active:scale-95',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200/50 transition-all active:scale-95',
      ghost: 'hover:bg-slate-100 text-slate-500 transition-all',
    };
    const sizes = {
      sm: 'px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl',
      md: 'px-6 py-3 rounded-2xl font-semibold',
      lg: 'px-8 py-4 text-lg rounded-3xl font-bold',
    };
    return (
      <button
        ref={ref}
        className={cn('inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  extra?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title, extra }) => (
  <div className={cn('bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden', className)}>
    {(title || extra) && (
      <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
        {title && <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>}
        {extra}
      </div>
    )}
    <div className="p-8">{children}</div>
  </div>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-2 w-full">
      {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
      <input
        ref={ref}
        className={cn('w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium', className)}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 font-medium ml-1">{error}</p>}
    </div>
  )
);

const Select = ({ label, options, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: string[], error?: string }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <select
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium appearance-none"
      {...props}
    >
      <option value="">Pilih {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {error && <p className="text-xs text-rose-500 font-medium ml-1">{error}</p>}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
            <button onClick={onClose} className="w-10 h-10 border border-slate-200 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 md:p-10 max-h-[85vh] md:max-h-[75vh] overflow-y-auto scroll-smooth custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Toast = ({ message, type, isVisible, onClose }: { message: string, type: 'success' | 'error', isVisible: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className={cn(
            "fixed bottom-10 right-10 z-[100] px-8 py-5 rounded-3xl shadow-2xl border flex items-center gap-4 min-w-[300px]",
            type === 'success' 
              ? "bg-white border-emerald-100 text-emerald-900 shadow-emerald-200/50" 
              : "bg-white border-rose-100 text-rose-900 shadow-rose-200/50"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
            type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          )}>
            {type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">{type === 'success' ? 'Sukses' : 'Perhatian'}</p>
            <span className="font-bold tracking-tight">{message}</span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Main App Logic ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'pos' | 'inventory' | 'reports'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth States
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  // POS States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [lastReceipt, setLastReceipt] = useState<Transaction | null>(null);

  // Inventory States
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'low' | 'instock'>('all');
  const [productModal, setProductModal] = useState<{ isOpen: boolean, product: Product | null }>({ isOpen: false, product: null });
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    
    // Default view for Kasir
    if (savedUser && JSON.parse(savedUser).role === Role.KASIR) setView('pos');
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const foundUser = USERS.find(u => u.username === authForm.username && u.password === authForm.password);
      if (foundUser) {
        const { password, ...userWithoutPass } = foundUser;
        setUser(userWithoutPass as User);
        localStorage.setItem('user', JSON.stringify(userWithoutPass));
        setView(userWithoutPass.role === Role.ADMIN ? 'dashboard' : 'pos');
        showToast(`Selamat datang, ${userWithoutPass.username}!`);
      } else {
        setAuthError('Username atau password salah');
      }
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCart([]);
    setView('dashboard');
  };

  // POS Logic
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return showToast('Stok habis!', 'error');
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast('Batas stok tercapai', 'error');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(0, item.quantity + delta);
        if (product && newQty > product.stock) {
          showToast('Stok tidak mencukupi', 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

  const processPayment = () => {
    if (selectedPayment === PaymentMethod.CASH && cashReceived < cartTotal) {
      return showToast('Uang tunai kurang!', 'error');
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

      // Update Stock
      const updatedProducts = products.map(p => {
        const cartItem = cart.find(item => item.id === p.id);
        if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
        return p;
      });

      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      setLastReceipt(newTransaction);
      setCart([]);
      setPaymentModal(false);
      setCashReceived(0);
      setLoading(false);
      showToast('Transaksi Berhasil!');
    }, 1000);
  };

  // Inventory Logic
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      let updatedProducts: Product[];
      if (productModal.product) {
        // Edit
        updatedProducts = products.map(p => p.id === productModal.product?.id ? { ...p, ...productForm } as Product : p);
        showToast('Produk diperbarui');
      } else {
        // Create
        const newProduct: Product = {
          ...productForm as Product,
          id: Date.now().toString(),
          stock: Number(productForm.stock || 0),
          buyPrice: Number(productForm.buyPrice || 0),
          sellPrice: Number(productForm.sellPrice || 0),
          minStock: Number(productForm.minStock || 0),
        };
        updatedProducts = [...products, newProduct];
        showToast('Produk ditambahkan');
      }
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      setProductModal({ isOpen: false, product: null });
      setLoading(false);
    }, 500);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Hapus produk ini?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem('products', JSON.stringify(updated));
      showToast('Produk dihapus');
    }
  };

  // Reports Derived Data
  const topProducts = React.useMemo(() => {
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

  // Stats Logic
  const stats: DashboardStats = {
    totalSalesToday: transactions
      .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.total, 0),
    totalProducts: products.length,
    lowStockCount: products.filter(p => p.stock <= p.minStock).length,
    transactionsToday: transactions
      .filter(t => new Date(t.date).toDateString() === new Date().toDateString()).length,
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="bg-emerald-900 p-10 text-center text-white">
            <div className="inline-flex p-4 bg-emerald-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/20">
              <Store size={40} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">SobatDagang</h1>
            <p className="text-emerald-500/80 mt-3 text-[10px] font-black uppercase tracking-[0.3em]">Partner Bisnis Digital UMKM</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-8">
            <Input 
              label="Username" 
              placeholder="admin / kasir"
              value={authForm.username}
              onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={authForm.password}
              onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
            />
            {authError && <p className="text-xs text-rose-500 font-bold text-center bg-rose-50 py-2 rounded-lg">{authError}</p>}
            <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
              {loading ? 'Memproses...' : 'Login Ke Sistem'}
            </Button>
            <div className="pt-6 border-t border-slate-50 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Demo Access</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] bg-white border border-slate-200 p-2 rounded-xl">
                    <span className="font-bold text-emerald-600 block">ADMIN</span>
                    <span className="text-slate-500">U: admin / P: admin123</span>
                  </div>
                  <div className="text-[10px] bg-white border border-slate-200 p-2 rounded-xl">
                    <span className="font-bold text-emerald-600 block">KASIR</span>
                    <span className="text-slate-500">U: kasir / P: kasir123</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2024 Agung Ramdani Project</p>
              </div>
            </div>
          </form>
        </motion.div>
        <Toast isVisible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
      </div>
    );
  }

  const SidebarItem = ({ id, label, icon: Icon, roles = [Role.ADMIN, Role.KASIR] }: { id: typeof view, label: string, icon: any, roles?: Role[] }) => {
    if (!roles.includes(user.role)) return null;
    const active = view === id;
    return (
      <button 
        onClick={() => { setView(id); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group text-left",
          active ? "bg-emerald-800 text-white shadow-lg border border-emerald-700/50" : "text-emerald-100/60 hover:bg-emerald-800/30 hover:text-white"
        )}
      >
        <Icon size={20} className={cn(active ? "text-emerald-400" : "text-emerald-100/40 group-hover:text-emerald-400")} />
        <span className="font-semibold tracking-tight">{label}</span>
        {active && (
          <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        )}
      </button>
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for localStorage
        showToast('Ukuran gambar terlalu besar (Maks 1MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm({ ...productForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-emerald-900 text-emerald-50 flex flex-col shadow-2xl z-[70] transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0 no-print",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Store size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl leading-none tracking-tight text-white drop-shadow-sm">SobatDagang</h1>
            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-emerald-100/40 mt-1.5 block">Partner Setia UMKM</span>
          </div>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-2">
          <div className="pb-6 mb-6 border-b border-emerald-800/50">
            <p className="px-5 text-[10px] font-bold text-emerald-100/30 uppercase tracking-[0.2em] mb-4">Dashboard Utama</p>
            <SidebarItem id="dashboard" label="Analisa Bisnis" icon={LayoutDashboard} roles={[Role.ADMIN]} />
            <SidebarItem id="pos" label="Sistem Kasir" icon={ShoppingCart} />
          </div>
          <div>
            <p className="px-5 text-[10px] font-bold text-emerald-100/30 uppercase tracking-[0.2em] mb-4">Manajemen Data</p>
            <SidebarItem id="inventory" label="Kelola Stok" icon={Package} roles={[Role.ADMIN]} />
            <SidebarItem id="reports" label="Laporan Laba" icon={BarChart3} roles={[Role.ADMIN]} />
          </div>
        </nav>

        <div className="p-6 mt-auto">
          <div className="flex items-center gap-4 p-4 bg-emerald-950/40 rounded-[1.5rem] mb-4 border border-emerald-800/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate capitalize">{user.username}</p>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{user.role}</p>
            </div>
            <button onClick={handleLogout} className="text-emerald-100/40 hover:text-rose-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col no-print w-full">
        <header className="h-20 shrink-0 sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 active:scale-95 transition-all"
            >
              <LayoutDashboard size={20} />
            </button>
            <h2 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight capitalize truncate max-w-[150px] md:max-w-none">
              {view === 'pos' ? 'Kasir' : view === 'inventory' ? 'Inventori' : view === 'reports' ? 'Laporan' : 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex flex-col items-end">
              <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              <p className="text-sm md:text-lg font-black text-slate-800 tabular-nums leading-none mt-1">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 flex-1">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Penjualan Hari Ini', value: formatCurrency(stats.totalSalesToday), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Katalog Produk', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Perlu Restok', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Total Transaksi', value: stats.transactionsToday, icon: History, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  ].map((s, i) => (
                    <Card key={i} className="group hover:-translate-y-1 transition-all duration-300 border-none shadow-xl shadow-slate-200/50">
                      <div className="flex flex-col gap-4">
                        <div className={cn("inline-flex w-fit p-3 rounded-2xl", s.bg)}>
                          <s.icon className={s.color} size={24} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
                          <p className="text-3xl font-black text-slate-900 mt-1">{s.value}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card title="Tren Penjualan (7 Hari Terakhir)" className="lg:col-span-2">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transactions.slice(0, 7).reverse().map(t => ({ date: new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), total: t.total }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={v => `Rp${v/1000}k`} dx={-10} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                            itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                            formatter={(v: number) => [formatCurrency(v), 'Penjualan']}
                          />
                          <Bar dataKey="total" fill="var(--color-emerald-500)" radius={[12, 12, 0, 0]} barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card title="Produk Hampir Habis">
                    <div className="space-y-6">
                      {products.filter(p => p.stock <= p.minStock).slice(0, 5).map(p => (
                        <div key={p.id} className="group flex items-center justify-between p-5 bg-rose-50/50 rounded-[1.5rem] border border-rose-100/50 hover:bg-rose-50 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-rose-500 ring-2 ring-rose-100">
                              <AlertTriangle size={18} />
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm tracking-tight">{p.name}</p>
                              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-0.5">{p.stock} {p.unit} Tersisa</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-rose-300" />
                        </div>
                      ))}
                      {stats.lowStockCount === 0 && (
                        <div className="text-center py-10 bg-emerald-50/50 rounded-[2rem] border border-dashed border-emerald-200">
                          <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={40} />
                          <p className="text-sm font-bold text-emerald-700 tracking-tight">Semua Stok Aman</p>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Pengecekan Sistem Otomatis</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {view === 'pos' && (
              <motion.div key="pos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col xl:flex-row gap-6 md:gap-10 h-auto xl:h-[calc(100vh-200px)]">
                {/* Product List */}
                <div className="flex-1 flex flex-col gap-6 md:gap-8 overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input 
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-700 text-sm md:text-base"
                        placeholder="Cari produk..."
                        value={posSearch}
                        onChange={e => setPosSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 xl:overflow-y-auto pr-0 md:pr-4 scroll-smooth">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-6">
                      {products
                        .filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase()) || p.code.toLowerCase().includes(posSearch.toLowerCase()))
                        .map(p => (
                          <motion.button
                            layout
                            key={p.id}
                            onClick={() => addToCart(p)}
                            disabled={p.stock <= 0}
                            className={cn(
                              "group flex flex-col bg-white border border-slate-100 rounded-[2rem] p-6 transition-all duration-300 text-left relative overflow-hidden",
                              p.stock <= 0 ? "opacity-50 grayscale" : "hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-100 hover:-translate-y-2 active:scale-95"
                            )}
                          >
                            <div className="mb-4 relative h-32 w-full flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden group-hover:bg-white transition-colors">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm font-bold">
                                  <Package size={28} />
                                </div>
                              )}
                            </div>
                            <p className="font-bold text-slate-800 line-clamp-2 min-h-[3rem] text-sm leading-tight mb-2 tracking-tight">{p.name}</p>
                            <p className="text-emerald-600 font-extrabold text-xl tracking-tight">{formatCurrency(p.sellPrice)}</p>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-widest">{p.category}</span>
                              <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter", p.stock <= p.minStock ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700")}>
                                {p.stock} {p.unit}
                              </span>
                            </div>
                            {p.stock <= 0 && (
                              <div className="absolute inset-0 bg-slate-100/60 flex items-center justify-center backdrop-blur-[2px]">
                                <span className="bg-rose-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-rose-200">OUT OF STOCK</span>
                              </div>
                            )}
                          </motion.button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Cart Side */}
                <div className="w-full xl:w-[450px] flex flex-col gap-8 mt-6 xl:mt-0">
                  <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[400px] xl:min-h-0">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                          <ShoppingCart size={20} />
                        </div>
                        <h3 className="font-black text-slate-800 tracking-tight">Kantung Belanja</h3>
                      </div>
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{cart.length} Item</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20">
                          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 grayscale opacity-40">
                            <ShoppingCart size={40} className="text-slate-300" />
                          </div>
                          <p className="font-bold text-slate-400 text-sm tracking-tight">Belum ada barang di sini</p>
                        </div>
                      ) : (
                        cart.map(item => (
                          <div key={item.id} className="flex gap-5 group items-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                              <Package size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 truncate text-sm tracking-tight">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider bg-slate-50 px-1.5 py-0.5 rounded uppercase">{formatCurrency(item.sellPrice)}</span>
                                <span className="text-emerald-500 font-extrabold text-sm">{formatCurrency(item.sellPrice * item.quantity)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                              <button 
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="p-1.5 hover:bg-white hover:shadow-sm text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                              >
                                {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                              </button>
                              <span className="w-6 text-center font-black text-slate-700 tabular-nums text-xs">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className="p-1.5 hover:bg-white hover:shadow-sm text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                      <div className="flex justify-between items-end mb-8 px-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Bayar</span>
                          <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{formatCurrency(cartTotal)}</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full py-5 text-xl font-bold rounded-[1.5rem] shadow-2xl shadow-emerald-200" 
                        disabled={cart.length === 0}
                        onClick={() => { setPaymentModal(true); setCashReceived(0); }}
                      >
                        Konfirmasi Pembayaran
                        <ChevronRight size={24} />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'inventory' && (
              <motion.div key="inventory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <Card 
                  title="Inventori" 
                  extra={
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-end">
                      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
                        <select 
                          value={inventoryCategoryFilter}
                          onChange={e => setInventoryCategoryFilter(e.target.value)}
                          className="bg-transparent text-[10px] md:text-xs font-bold text-slate-500 outline-none px-2 py-1 cursor-pointer flex-1 md:flex-none"
                        >
                          <option value="">Kategori</option>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <select 
                          value={inventoryStockFilter}
                          onChange={e => setInventoryStockFilter(e.target.value as any)}
                          className="bg-transparent text-[10px] md:text-xs font-bold text-slate-500 outline-none px-2 py-1 cursor-pointer flex-1 md:flex-none"
                        >
                          <option value="all">Stok</option>
                          <option value="low">Tipis</option>
                          <option value="instock">Ada</option>
                        </select>
                      </div>
                      <div className="relative flex-1 md:w-48 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={14} />
                        <input 
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 outline-none text-[11px] font-semibold text-slate-700 transition-all"
                          placeholder="Cari..."
                          value={inventorySearch}
                          onChange={e => setInventorySearch(e.target.value)}
                        />
                      </div>
                      <Button size="sm" className="hidden md:flex" onClick={() => { 
                        const newCode = generateBarcode();
                        setProductForm({ code: newCode }); 
                        setProductModal({ isOpen: true, product: null }); 
                      }}>
                        <Plus size={18} />
                        Tambah
                      </Button>
                    </div>
                  }
                >
                  <div className="md:hidden mb-4">
                    <Button className="w-full" size="sm" onClick={() => { 
                      const newCode = generateBarcode();
                      setProductForm({ code: newCode }); 
                      setProductModal({ isOpen: true, product: null }); 
                    }}>
                      <Plus size={18} />
                      Tambah Item Baru
                    </Button>
                  </div>
                  <div className="overflow-x-auto -mx-4 md:-mx-8">
                    <div className="min-w-[800px] md:min-w-0 px-4 md:px-8">
                      <table className="w-full text-left">
                      <thead>
                        <tr className="border-y border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                          <th className="px-8 py-5">Kode SKU</th>
                          <th className="px-8 py-5">Identitas Produk</th>
                          <th className="px-8 py-5">Kategori</th>
                          <th className="px-8 py-5 text-right">Modal</th>
                          <th className="px-8 py-5 text-right">Jual</th>
                          <th className="px-8 py-5 text-center">Stok</th>
                          <th className="px-8 py-5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {products
                          .filter(p => {
                            const matchSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.code.toLowerCase().includes(inventorySearch.toLowerCase());
                            const matchCategory = !inventoryCategoryFilter || p.category === inventoryCategoryFilter;
                            const matchStock = inventoryStockFilter === 'all' 
                              ? true 
                              : inventoryStockFilter === 'low' 
                                ? p.stock <= p.minStock 
                                : p.stock > p.minStock;
                            return matchSearch && matchCategory && matchStock;
                          })
                          .map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 group transition-colors">
                              <td className="px-8 py-5 font-mono text-[10px] text-slate-400 font-bold uppercase">{p.code}</td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 flex-shrink-0">
                                    {p.image ? (
                                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageIcon size={20} />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 text-sm tracking-tight">{p.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{p.unit}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md uppercase tracking-widest">{p.category}</span>
                              </td>
                              <td className="px-8 py-5 text-right text-slate-400 text-xs tabular-nums font-bold tracking-tight">{formatCurrency(p.buyPrice)}</td>
                              <td className="px-8 py-5 text-right text-emerald-600 font-black tabular-nums tracking-tight">{formatCurrency(p.sellPrice)}</td>
                              <td className="px-8 py-5 text-center">
                                <div className={cn(
                                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-[10px] tracking-tight",
                                  p.stock <= p.minStock ? "bg-rose-100 text-rose-600 ring-2 ring-rose-200 ring-offset-2" : "bg-emerald-100 text-emerald-800"
                                )}>
                                  {p.stock}
                                  {p.stock <= p.minStock && <AlertTriangle size={12} className="animate-pulse" />}
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => { setProductForm(p); setProductModal({ isOpen: true, product: p }); }} className="p-2.5 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-colors">
                                    <TrendingUp size={18} />
                                  </button>
                                  <button onClick={() => deleteProduct(p.id)} className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </motion.div>
            )}

            {view === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 md:space-y-10">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
                  <Card title="Riwayat Penjualan">
                    <div className="space-y-6">
                      {transactions.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                          <p className="font-bold text-slate-400 text-sm tracking-tight">Belum ada aktivitas hari ini</p>
                        </div>
                      ) : (
                        transactions.map(tx => (
                          <div key={tx.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group" onClick={() => setLastReceipt(tx)}>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shadow-sm">
                                  <History size={20} />
                                </div>
                                <div>
                                  <p className="font-black text-slate-800 text-sm tracking-tighter">INV-{tx.id.split('-')[1]}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {tx.userName}</p>
                                </div>
                              </div>
                              <p className="font-black text-emerald-600 text-lg tracking-tight tabular-nums">{formatCurrency(tx.total)}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100/50">
                              <span className="text-[9px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest shadow-sm">{tx.paymentMethod}</span>
                              <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                <span>Detail</span>
                                <ChevronRight size={12} />
                              </div>
                            </div>
                          </div>
                        )).slice(0, 5)
                      )}
                    </div>
                  </Card>

                  <Card title="5 Produk Terlaris (30 Hari Terakhir)">
                    {topProducts.length === 0 ? (
                      <div className="h-[350px] flex items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                        <p className="font-bold text-slate-400 text-sm">Belum ada data penjualan tersedia</p>
                      </div>
                    ) : (
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={topProducts} margin={{ left: 20, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={120} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                              itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                            />
                            <Bar 
                              dataKey="quantity" 
                              fill="var(--color-emerald-500)" 
                              radius={[0, 12, 12, 0]} 
                              barSize={32}
                            >
                              {topProducts.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={`var(--color-emerald-${500 - (index * 50)})`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card>

                  <Card title="Statistik Inventori">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={CATEGORIES.map(cat => ({
                              name: cat,
                              value: products.filter(p => p.category === cat).reduce((sum, p) => sum + p.stock, 0)
                            })).filter(d => d.value > 0)}
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {CATEGORIES.map((_, i) => (
                              <Cell key={i} fill={`var(--color-emerald-${(i % 5 + 3) * 100})`} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                            itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-8 px-4">
                      {CATEGORIES.map((cat, i) => {
                        const count = products.filter(p => p.category === cat).length;
                        if (count === 0) return null;
                        return (
                          <div key={cat} className="flex items-center justify-between pb-2 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full ring-4 ring-offset-2 transition-all" style={{ backgroundColor: `var(--color-emerald-${(i % 5 + 3) * 100})`, ringColor: `var(--color-emerald-${(i % 5 + 3) * 100}20)` }} />
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                            </div>
                            <span className="text-xs font-black text-slate-800 tabular-nums">{count} Item</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Penyelesaian Bayar">
        <div className="space-y-8">
          <div className="flex bg-slate-100 p-2 rounded-[1.5rem] gap-2">
            {[
              { id: PaymentMethod.CASH, label: 'Tunai', icon: Banknote },
              { id: PaymentMethod.QRIS, label: 'QRIS Scan', icon: CreditCard },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedPayment(m.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                  selectedPayment === m.id ? "bg-white text-emerald-600 shadow-xl shadow-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <m.icon size={20} />
                {m.label}
              </button>
            ))}
          </div>

          <div className="bg-emerald-900 p-8 rounded-[2rem] text-center shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800 rounded-full translate-x-10 -translate-y-10 blur-3xl opacity-50"></div>
            <p className="text-emerald-400/60 font-black text-[10px] uppercase tracking-[0.3em] mb-2 relative z-10">Tagihan Belanja</p>
            <p className="text-5xl font-black text-white tabular-nums tracking-tighter relative z-10">{formatCurrency(cartTotal)}</p>
          </div>

          {selectedPayment === PaymentMethod.CASH ? (
            <div className="space-y-6">
              <Input 
                label="Nominal Terima" 
                type="number"
                placeholder="Rupiah..."
                autoFocus
                className="text-3xl font-black text-center py-6 h-auto tracking-tighter text-emerald-600"
                value={cashReceived || ''}
                onChange={e => setCashReceived(Number(e.target.value))}
              />
              <div className="grid grid-cols-2 gap-4">
                {[50000, 100000].map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => setCashReceived(amt)}
                    className="py-3 border-2 border-slate-100 rounded-2xl text-slate-600 font-black text-xs hover:border-emerald-500 hover:text-emerald-600 transition-all uppercase tracking-widest"
                  >
                    + {formatNumber(amt)}
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 p-6 rounded-[1.5rem] flex justify-between items-center border border-slate-100">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Uang Kembali</span>
                <span className={cn("text-2xl font-black tabular-nums tracking-tighter", (cashReceived - cartTotal) >= 0 ? "text-emerald-600" : "text-rose-500")}>
                  {formatCurrency(Math.max(0, cashReceived - cartTotal))}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-10 bg-white border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-6">
                <div className="w-56 h-56 bg-white p-4 border border-slate-50 rounded-3xl shadow- inner relative flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-slate-900/5 absolute inset-0 flex items-center justify-center font-black text-slate-200 text-center leading-none text-4xl transform -rotate-12">QRIS<br/>SCAN</div>
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg relative z-10"></div>
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">Menunggu Pembayaran...</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Status: Sinkronisasi QRIS Cloud</p>
                </div>
            </div>
          )}

          <Button className="w-full py-5 text-xl font-black rounded-3xl" onClick={processPayment} disabled={loading}>
            {loading ? 'Konfirmasi...' : 'Finalisasi Transaksi'}
          </Button>
        </div>
      </Modal>

      {/* Product Management Modal */}
      <Modal isOpen={productModal.isOpen} onClose={() => setProductModal({ isOpen: false, product: null })} title={productModal.product ? 'Edit Produk' : 'Tambah Produk Baru'}>
        <form onSubmit={handleSaveProduct} className="space-y-8">
          {/* Image Upload Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Foto Produk</label>
              <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Maks 1MB</span>
            </div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-50'); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  const event = { target: { files: [file] } } as any;
                  handleImageChange(event);
                }
              }}
              className={cn(
                "group relative border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center",
                productForm.image ? "bg-slate-50 border-emerald-100" : "hover:border-emerald-200 hover:bg-emerald-50/30"
              )}
            >
              {productForm.image ? (
                <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-xl ring-4 ring-white">
                  <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud size={24} className="text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
                    <ImagePlus size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Tarik gambar ke sini</p>
                    <p className="text-xs text-slate-400 mt-1">klik untuk pilih file (Maks 1MB)</p>
                  </div>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            {productForm.image && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setProductForm({ ...productForm, image: undefined }); }}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center w-full hover:text-rose-600 transition-colors"
              >
                Hapus Foto
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori Produk</label>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Pilih Salah Satu</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
              {CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat] || Package;
                const isSelected = productForm.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProductForm({ ...productForm, category: cat })}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 group",
                      isSelected 
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100" 
                        : "bg-slate-50 border-transparent text-slate-500 hover:border-emerald-100 hover:bg-emerald-50"
                    )}
                  >
                    <Icon size={20} className={cn("transition-transform group-hover:scale-110", isSelected ? "text-white" : "text-slate-400")} />
                    <span className="text-[10px] font-bold tracking-tight text-center leading-tight">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              label="Kode Barcode (Otomatis)" 
              value={productForm.code || ''} 
              onChange={e => setProductForm({ ...productForm, code: e.target.value })} 
              required 
              className="bg-slate-100/50 font-mono tracking-wider focus:ring-0"
            />
            <Input label="Satuan" placeholder="pcs/kg/lit" value={productForm.unit || ''} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} required />
          </div>

          <Input label="Nama Produk" placeholder="Contoh: Beras Premium Super" value={productForm.name || ''} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
          
          <div className="grid grid-cols-2 gap-6">
            <Input label="Harga Beli (Modal)" type="number" placeholder="0" value={productForm.buyPrice || ''} onChange={e => setProductForm({ ...productForm, buyPrice: Number(e.target.value) })} required />
            <Input label="Harga Jual" type="number" placeholder="0" value={productForm.sellPrice || ''} onChange={e => setProductForm({ ...productForm, sellPrice: Number(e.target.value) })} required />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Input label="Stok Saat Ini" type="number" placeholder="0" value={productForm.stock || ''} onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })} required />
            <Input label="Stok Minimum (Alert)" type="number" placeholder="0" value={productForm.minStock || ''} onChange={e => setProductForm({ ...productForm, minStock: Number(e.target.value) })} required />
          </div>

          <div className="pt-4 flex gap-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setProductModal({ isOpen: false, product: null })}>Batal</Button>
            <Button type="submit" className="flex-1 shadow-emerald-100" disabled={loading}>
              {loading ? 'Memproses...' : (productModal.product ? 'Perbarui Data' : 'Simpan Produk')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Preview (Print Optimization) */}
      <Modal isOpen={!!lastReceipt} onClose={() => setLastReceipt(null)} title="Detail Transaksi">
        <div className="mb-8 flex flex-wrap gap-4 px-2 no-print">
          <div className="p-5 bg-slate-50 rounded-3xl flex-1 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Metode Bayar</p>
            <p className="text-sm font-extrabold text-slate-800">{lastReceipt?.paymentMethod}</p>
          </div>
          <div className="p-5 bg-slate-50 rounded-3xl flex-1 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Petugas Kasir</p>
            <p className="text-sm font-extrabold text-slate-800 capitalize">{lastReceipt?.userName}</p>
          </div>
        </div>

        <div id="receipt" className="receipt-content max-w-[340px] mx-auto bg-white p-10 rounded-[3rem] text-[10px] font-mono leading-relaxed border border-slate-100 shadow-2xl shadow-slate-200/50 mb-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/30">
              <Store size={28} />
            </div>
            <h4 className="text-lg font-black uppercase tracking-[0.2em] text-slate-900 leading-none">SOBAT DAGANG</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-2 tracking-tight">Partner Bisnis UMKM Pintar</p>
            <p className="text-[9px] text-slate-400 mt-1 opacity-60">Jl. Berkah No. 123, Jakarta Selatan</p>
            <div className="border-t-2 border-dashed border-slate-100 my-10"></div>
            <div className="flex justify-between text-left mb-2 font-bold text-slate-500 uppercase tracking-tighter text-[9px]">
              <span>INV: #{lastReceipt?.id.split('-')[1]}</span>
              <span>{lastReceipt ? new Date(lastReceipt.date).toLocaleDateString('id-ID') : ''}</span>
            </div>
            <div className="flex justify-between text-left mb-2 font-bold text-slate-500 uppercase tracking-tighter text-[9px]">
              <span>SHIFT: {lastReceipt?.userName.toUpperCase()}</span>
              <span>{lastReceipt ? new Date(lastReceipt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
            <div className="border-t-2 border-dashed border-slate-100 my-10"></div>
          </div>

          <div className="space-y-4 mb-10">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">Daftar Item Belanja</p>
            {lastReceipt?.items.map(item => (
              <div key={item.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between font-black text-slate-900 text-[12px]">
                  <span className="uppercase">{item.name}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-bold text-[10px] pb-4 border-b border-slate-50/50">
                  <span>{item.quantity} x {formatCurrency(item.sellPrice)}</span>
                  <span className="text-slate-800 font-black">{formatCurrency(item.sellPrice * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between font-black text-slate-900 text-[14px] tracking-tighter">
              <span className="uppercase">Grand Total</span>
              <span>{formatCurrency(lastReceipt?.total || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-400 font-bold text-[10px] uppercase tracking-widest pt-3 border-t-2 border-double border-slate-100">
              <span className="opacity-60">Metode: {lastReceipt?.paymentMethod}</span>
              <span className="text-slate-600 font-black">{formatCurrency(lastReceipt?.received || 0)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-black text-[12px] uppercase tracking-tighter pb-6 border-b-2 border-dashed border-slate-100">
              <span>Kembalian</span>
              <span>{formatCurrency(lastReceipt?.change || 0)}</span>
            </div>
          </div>

          <div className="text-center mt-12 space-y-2 opacity-50 font-bold text-[9px] uppercase tracking-[0.25em] leading-relaxed">
            <p>Terima Kasih Atas Kunjungan Anda</p>
            <p className="text-[7px]">Sistem POS & Inventori Digital v1.0</p>
          </div>
        </div>
        <div className="mt-4 flex gap-5 no-print">
          <Button variant="outline" className="flex-1 py-4 rounded-2xl font-bold" onClick={() => setLastReceipt(null)}>Tutup Detail</Button>
          <Button className="flex-1 py-4 shadow-xl shadow-emerald-200 rounded-2xl font-bold" onClick={() => window.print()}>
            <Printer size={18} />
            Cetak Struk
          </Button>
        </div>
      </Modal>

      <Toast isVisible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
