import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  X, 
  Sparkles, 
  ShoppingBag, 
  TrendingUp, 
  Receipt, 
  Package, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { USERS, INITIAL_APP_USERS } from '../../constants';
import { User, Role, AppUser } from '../../types';
import { verifyPassword } from '../../lib/crypto';

interface LoginPageProps {
  onSuccess: (user: User) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, showToast }) => {
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Modals & Panels
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Refs
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const forgotModalCloseRef = useRef<HTMLButtonElement>(null);

  // Pre-fill remembered username from localStorage
  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem('sobatdagang_remember_username');
      if (savedRemember) {
        setUsername(savedRemember);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Keyboard shortcut to close forgot password modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (forgotPasswordModal && e.key === 'Escape') {
        setForgotPasswordModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forgotPasswordModal]);

  // Focus modal button on open
  useEffect(() => {
    if (forgotPasswordModal) {
      setTimeout(() => forgotModalCloseRef.current?.focus(), 50);
    }
  }, [forgotPasswordModal]);

  // Detect Caps Lock
  const handleKeyModifierCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  // Carousel Auto-Rotate (5 seconds)
  useEffect(() => {
    if (isCarouselHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [isCarouselHovered]);

  // Form Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMessage('Silakan masukkan username Anda');
      usernameInputRef.current?.focus();
      return;
    }

    if (!password) {
      setErrorMessage('Silakan masukkan password Anda');
      passwordInputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      // Load current registered users from localStorage or initial seed
      let currentUsers: AppUser[] = INITIAL_APP_USERS;
      try {
        const stored = localStorage.getItem('sobatdagang_users');
        if (stored) {
          currentUsers = JSON.parse(stored);
        } else {
          localStorage.setItem('sobatdagang_users', JSON.stringify(INITIAL_APP_USERS));
        }
      } catch {
        currentUsers = INITIAL_APP_USERS;
      }

      // Find user by username
      const foundUser = currentUsers.find(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );

      if (!foundUser) {
        // Fallback check in legacy USERS constant for safety
        const legacyUser = USERS.find(
          (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.password === password
        );
        if (legacyUser) {
          const userSession: User = {
            id: legacyUser.id,
            username: legacyUser.username,
            role: legacyUser.role,
            isActive: true,
          };
          onSuccess(userSession);
          return;
        }

        setErrorMessage('Username atau password salah. Cek kembali kredensial Anda.');
        setLoading(false);
        return;
      }

      // Check if user account is deactivated
      if (!foundUser.isActive) {
        setErrorMessage('Akun ini telah dinonaktifkan oleh Administrator. Hubungi admin toko.');
        setLoading(false);
        return;
      }

      // Verify hashed password
      const isPasswordValid = await verifyPassword(password, foundUser.passwordHash);

      // Support fallback if legacy plain text password matched
      const isLegacyMatch = (foundUser as unknown as { password?: string }).password === password;

      if (isPasswordValid || isLegacyMatch) {
        // Save or clear remember me preference
        try {
          if (rememberMe) {
            localStorage.setItem('sobatdagang_remember_username', cleanUsername);
          } else {
            localStorage.removeItem('sobatdagang_remember_username');
          }
        } catch {
          // Ignore
        }

        // Update last login timestamp in storage
        const nowIso = new Date().toISOString();
        const updatedUsers = currentUsers.map((u) =>
          u.id === foundUser.id ? { ...u, lastLogin: nowIso } : u
        );
        try {
          localStorage.setItem('sobatdagang_users', JSON.stringify(updatedUsers));
        } catch {
          // Ignore
        }

        const userSession: User = {
          id: foundUser.id,
          name: foundUser.name,
          username: foundUser.username,
          role: foundUser.role,
          isActive: foundUser.isActive,
          mustChangePassword: foundUser.mustChangePassword,
          lastLogin: nowIso,
        };

        onSuccess(userSession);
      } else {
        setErrorMessage('Username atau password salah. Cek kembali kredensial Anda.');
        setLoading(false);
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat memverifikasi kredensial.');
      setLoading(false);
    }
  };

  // Quick Demo Auto-Fill
  const handleFillDemo = (demoUser: 'admin' | 'kasir') => {
    if (demoUser === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('kasir');
      setPassword('kasir123');
    }
    setErrorMessage('');
    showToast(`Kredensial ${demoUser.toUpperCase()} terisi otomatis`, 'info');
  };

  // Slide content data
  const slides = [
    {
      title: 'Kasir cepat, antrean pendek',
      description: 'Proses transaksi hitungan detik dengan pencarian kilat dan kalkulasi kembalian otomatis.',
      accent: '#8FA866',
      badge: 'POS & KASIR',
      renderVisual: () => (
        <div className="relative w-full h-[270px] flex items-center justify-center select-none">
          {/* Main Mini Receipt Card */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[260px] bg-bg rounded-[20px] border border-ink/15 p-4 shadow-sm z-10"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center">
                  <Receipt size={12} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-ink leading-none">STRUK #INV-0842</p>
                  <p className="text-[9px] text-muted">Kasir 01 · Baru saja</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#111111] bg-[#8FA866]/30 px-2 py-0.5 rounded-full">
                Lunas
              </span>
            </div>
            
            <div className="space-y-1.5 text-[11px] border-b border-ink/10 pb-2.5 mb-2.5">
              <div className="flex justify-between text-ink font-medium">
                <span className="truncate max-w-[140px]">Beras Premium 5kg</span>
                <span>Rp 75.000</span>
              </div>
              <div className="flex justify-between text-ink font-medium">
                <span className="truncate max-w-[140px]">Minyak Goreng 1L x2</span>
                <span>Rp 33.000</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline font-bold text-ink">
              <span className="text-[10px] text-muted uppercase tracking-wider">Total</span>
              <span className="text-base text-ink tracking-tight">Rp 108.000</span>
            </div>
          </motion.div>

          {/* Floating Pill: Quick Payment */}
          <motion.div
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="absolute -top-1 -right-2 bg-[#F5D76E] border border-ink/15 rounded-full px-3.5 py-1.5 flex items-center gap-2 shadow-sm z-20"
          >
            <Check size={12} className="stroke-[3] text-ink" />
            <span className="text-[11px] font-bold text-ink">Kembalian Rp 12.000</span>
          </motion.div>

          {/* Floating Pill: Category Chip */}
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-2 -left-2 bg-[#B7C7F2] border border-ink/15 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm z-20"
          >
            <ShoppingBag size={12} className="text-ink" />
            <span className="text-[11px] font-bold text-ink">Cash & QRIS Siap</span>
          </motion.div>
        </div>
      )
    },
    {
      title: 'Stok selalu terpantau',
      description: 'Notifikasi produk menipis dan pembaruan stok real-time langsung dari kasir.',
      accent: '#F5D76E',
      badge: 'MANAJEMEN INVENTORI',
      renderVisual: () => (
        <div className="relative w-full h-[270px] flex items-center justify-center select-none">
          {/* Main Mini Stock Card */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[260px] bg-bg rounded-[20px] border border-ink/15 p-4 shadow-sm z-10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center">
                  <Package size={12} />
                </div>
                <span className="text-[11px] font-bold text-ink">Status Produk</span>
              </div>
              <span className="text-[10px] font-bold text-ink bg-[#8FA866]/30 px-2 py-0.5 rounded-full">
                15 Terdaftar
              </span>
            </div>

            {/* Item 1 */}
            <div className="bg-surface/60 rounded-xl p-2.5 mb-2 border border-ink/5">
              <div className="flex justify-between text-[11px] font-semibold text-ink mb-1">
                <span>Indomie Goreng</span>
                <span className="text-[#8FA866] font-bold">120 pcs</span>
              </div>
              <div className="w-full h-1.5 bg-ink/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#8FA866] rounded-full w-[85%]" />
              </div>
            </div>

            {/* Item 2 */}
            <div className="bg-[#F4B6D2]/30 rounded-xl p-2.5 border border-[#F4B6D2]/50">
              <div className="flex justify-between text-[11px] font-semibold text-ink mb-1">
                <span>Kecap Bango 550ml</span>
                <span className="text-ink font-bold text-[10px] bg-[#F4B6D2] px-1.5 py-0.2 rounded-md">8 pcs (Menipis)</span>
              </div>
              <div className="w-full h-1.5 bg-ink/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#111111] rounded-full w-[25%]" />
              </div>
            </div>
          </motion.div>

          {/* Floating Pill: Low Stock Alert */}
          <motion.div
            animate={{ y: [6, -6, 6] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className="absolute -top-1 -left-2 bg-[#F4B6D2] border border-ink/15 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm z-20"
          >
            <AlertTriangle size={12} className="text-ink" />
            <span className="text-[11px] font-bold text-ink">3 Perlu Restok</span>
          </motion.div>

          {/* Floating Pill: Quick Stepper Badge */}
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="absolute -bottom-2 -right-2 bg-[#F5D76E] border border-ink/15 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm z-20"
          >
            <span className="text-[11px] font-bold text-ink">Beras +5 Karung</span>
          </motion.div>
        </div>
      )
    },
    {
      title: 'Laporan penjualan real-time',
      description: 'Pantau omzet harian, laba kotor, dan produk terlaris tanpa rekap manual.',
      accent: '#B7C7F2',
      badge: 'ANALITIK & REKAP',
      renderVisual: () => (
        <div className="relative w-full h-[270px] flex items-center justify-center select-none">
          {/* Main Mini Analytics Card */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[260px] bg-bg rounded-[20px] border border-ink/15 p-4 shadow-sm z-10"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Omzet Hari Ini</span>
              <span className="inline-flex items-center text-[10px] font-bold text-[#8FA866] bg-[#8FA866]/20 px-1.5 py-0.5 rounded-full">
                <ArrowUpRight size={10} className="mr-0.5" /> +18.4%
              </span>
            </div>
            
            <p className="text-xl font-bold text-ink tracking-tight mb-2">Rp 2.450.000</p>

            {/* Sparkline SVG */}
            <div className="w-full h-12 bg-surface/50 rounded-xl p-1.5 mb-2.5 border border-ink/5 flex items-end">
              <svg viewBox="0 0 100 32" className="w-full h-full stroke-ink" fill="none">
                <path
                  d="M 0,26 Q 16,28 25,18 T 50,14 T 75,6 T 100,2"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="stroke-ink"
                />
                <circle cx="100" cy="2" r="3" className="fill-ink" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] border-t border-ink/10 pt-2 text-muted">
              <span>Transaksi: <strong className="text-ink">38 nota</strong></span>
              <span>Rata-rata: <strong className="text-ink">Rp 64.5k</strong></span>
            </div>
          </motion.div>

          {/* Floating Pill: Best Seller */}
          <motion.div
            animate={{ y: [6, -6, 6] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="absolute -top-1 -right-1 bg-[#8FA866] text-white border border-ink/15 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm z-20"
          >
            <TrendingUp size={12} />
            <span className="text-[10px] font-bold">Top: Indomie Goreng</span>
          </motion.div>

          {/* Floating Pill: CSV Export */}
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-2 -left-2 bg-[#F5D76E] border border-ink/15 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm z-20"
          >
            <span className="text-[11px] font-bold text-ink">Rekap Siap Ekspor</span>
          </motion.div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen min-h-dvh bg-bg text-ink font-sans flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Outer Card Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[460px] lg:max-w-[1180px] min-h-[560px] lg:h-[780px] max-h-[840px] bg-bg border border-ink/15 rounded-[28px] sm:rounded-[32px] overflow-hidden flex flex-col lg:flex-row shadow-sm relative"
      >
        {/* LEFT COLUMN: Authentication Form (~45%) */}
        <div className="w-full lg:w-[46%] xl:w-[44%] p-5 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between overflow-y-auto">
          {/* Top Brand Logo */}
          <div>
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center shrink-0">
                  <Store size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-ink tracking-tight leading-none">SobatDagang</h1>
                  <p className="text-[11px] text-muted font-medium mt-0.5">POS & Manajemen Stok</p>
                </div>
              </div>

              {/* Demo Mode Toggle Badge in Top Corner */}
              <button
                type="button"
                onClick={() => setDemoMode(!demoMode)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  demoMode 
                    ? 'bg-ink text-white border-ink' 
                    : 'bg-surface/80 text-muted border-ink/15 hover:border-ink/40 hover:text-ink'
                }`}
                title="Buka opsi cepat untuk pengujian"
              >
                <Sparkles size={11} className={demoMode ? 'text-yellow' : ''} />
                {demoMode ? 'Mode Demo Aktif' : 'Mode Demo'}
              </button>
            </div>

            {/* Greetings Heading */}
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-ink tracking-tight leading-tight">
                Selamat datang kembali
              </h2>
              <p className="text-sm text-muted font-medium mt-1.5 leading-relaxed">
                Masuk untuk mengelola kasir dan stok toko Anda.
              </p>
            </div>

            {/* Error Banner */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-5 bg-[#F4B6D2] border border-ink/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-ink font-medium"
                >
                  <AlertTriangle size={16} className="text-ink shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('')}
                    className="text-ink/60 hover:text-ink cursor-pointer p-0.5"
                    aria-label="Tutup pesan error"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input Pill */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="login-username" 
                  className="block text-xs font-semibold uppercase tracking-wider text-muted px-1"
                >
                  Username
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4.5 text-muted pointer-events-none">
                    <UserIcon size={18} strokeWidth={1.8} />
                  </div>
                  <input
                    id="login-username"
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Masukkan username Anda"
                    autoComplete="username"
                    className="w-full h-[48px] sm:h-[52px] pl-12 pr-4 bg-surface/60 hover:bg-surface border border-ink/15 focus:border-ink focus:bg-bg rounded-full text-sm font-medium text-ink placeholder:text-muted/60 transition-colors focus:outline-none"
                  />
                  {username && (
                    <button
                      type="button"
                      onClick={() => setUsername('')}
                      className="absolute right-4 text-muted hover:text-ink cursor-pointer p-1"
                      aria-label="Hapus username"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Password Input Pill */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label 
                    htmlFor="login-password" 
                    className="block text-xs font-semibold uppercase tracking-wider text-muted"
                  >
                    Password
                  </label>
                  {capsLockActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-ink bg-[#F5D76E] px-2 py-0.5 rounded-full"
                    >
                      <AlertTriangle size={11} /> Caps Lock Aktif
                    </motion.span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-4.5 text-muted pointer-events-none">
                    <Lock size={18} strokeWidth={1.8} />
                  </div>
                  <input
                    id="login-password"
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onKeyDown={handleKeyModifierCheck}
                    onKeyUp={handleKeyModifierCheck}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full h-[48px] sm:h-[52px] pl-12 pr-12 bg-surface/60 hover:bg-surface border border-ink/15 focus:border-ink focus:bg-bg rounded-full text-sm font-medium text-ink placeholder:text-muted/60 transition-colors focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-muted hover:text-ink cursor-pointer p-1 transition-colors"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                      rememberMe
                        ? 'bg-ink border-ink text-white'
                        : 'border-ink/30 bg-surface/50 group-hover:border-ink'
                    }`}
                  >
                    {rememberMe && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className="text-xs font-medium text-ink">Ingat saya</span>
                </label>

                <button
                  type="button"
                  onClick={() => setForgotPasswordModal(true)}
                  className="text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer hover:underline underline-offset-4"
                >
                  Lupa password?
                </button>
              </div>

              {/* Submit Pill Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="w-full h-[48px] sm:h-[52px] bg-ink hover:bg-ink/90 text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Quick Demo Mode Panel (Only shown if demo mode active) */}
            <AnimatePresence>
              {demoMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 pt-5 border-t border-ink/10"
                >
                  <div className="relative mb-3 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider bg-bg px-2">
                      PILIH AKUN DEMO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleFillDemo('admin')}
                      className="p-2.5 bg-[#B7C7F2]/30 hover:bg-[#B7C7F2]/50 border border-ink/15 rounded-2xl text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-ink">ADMIN TOKO</span>
                        <ShieldCheck size={14} className="text-ink" />
                      </div>
                      <p className="text-[10px] text-muted font-medium">admin / admin123</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFillDemo('kasir')}
                      className="p-2.5 bg-[#F4B6D2]/30 hover:bg-[#F4B6D2]/50 border border-ink/15 rounded-2xl text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-ink">KASIR KAS</span>
                        <ShoppingBag size={14} className="text-ink" />
                      </div>
                      <p className="text-[10px] text-muted font-medium">kasir / kasir123</p>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-ink/10 flex items-center justify-between text-xs text-muted">
            <span>© {new Date().getFullYear()} SobatDagang</span>
            <span className="font-semibold text-ink/70">Versi 1.2.0</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Visual Panel & Interactive Carousel (~55% on desktop >= 1024px) */}
        <div className="hidden lg:flex lg:w-[54%] xl:w-[56%] p-4 bg-bg">
          <div className="w-full h-full bg-[#EAE4D3] border border-ink/15 rounded-[24px] p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Background Texture / Subtle Grid Rings */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.2" fill="#111111" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-dots)" />
              </svg>
            </div>

            {/* Top Carousel Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[11px] font-bold text-ink bg-bg border border-ink/15 px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                {slides[currentSlide].badge}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                <span>0{currentSlide + 1}</span>
                <span>/</span>
                <span>0{slides.length}</span>
              </div>
            </div>

            {/* Center Carousel Visual Composition (Pauses on Hover) */}
            <div 
              className="relative z-10 my-auto py-2"
              onMouseEnter={() => setIsCarouselHovered(true)}
              onMouseLeave={() => setIsCarouselHovered(false)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {slides[currentSlide].renderVisual()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Carousel Text & Dot Indicators */}
            <div className="relative z-10">
              <div className="mb-6 min-h-[70px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h3 className="text-xl font-bold text-ink tracking-tight">
                      {slides[currentSlide].title}
                    </h3>
                    <p className="text-xs text-muted font-medium mt-1 leading-relaxed max-w-md">
                      {slides[currentSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dot Indicators (Pill shape for active) */}
              <div className="flex items-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                      currentSlide === index
                        ? 'w-8 bg-ink'
                        : 'w-2 bg-ink/25 hover:bg-ink/50'
                    }`}
                    aria-label={`Lihat slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MODAL: Lupa Password */}
      <AnimatePresence>
        {forgotPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setForgotPasswordModal(false)}
              className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm bg-bg border border-ink/20 rounded-[24px] p-6 shadow-md z-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-modal-title"
            >
              <div className="w-10 h-10 rounded-full bg-surface border border-ink/15 flex items-center justify-center mb-3 text-ink">
                <HelpCircle size={20} />
              </div>

              <h4 id="forgot-modal-title" className="text-lg font-bold text-ink tracking-tight">
                Lupa Password?
              </h4>
              <p className="text-xs text-muted font-medium mt-2 leading-relaxed">
                Untuk alasan keamanan sistem toko, akun pengguna dikelola secara terpusat. Silakan <strong>hubungi admin toko</strong> untuk mereset atau memperbarui kata sandi Anda.
              </p>

              <div className="mt-5 flex justify-end">
                <button
                  ref={forgotModalCloseRef}
                  type="button"
                  onClick={() => setForgotPasswordModal(false)}
                  className="px-5 py-2.5 bg-ink text-white hover:bg-ink/90 text-xs font-semibold rounded-full cursor-pointer transition-colors focus:ring-2 focus:ring-ink"
                >
                  OK, Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
