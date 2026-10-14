import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  User as UserIcon, 
  Lock, 
  KeyRound, 
  Check, 
  X, 
  AlertTriangle, 
  Clock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Trash2, 
  Copy
} from 'lucide-react';
import { Role, User, AppUser } from '../../types';
import { canPerform } from '../../lib/permissions';
import { hashPassword, calculatePasswordStrength, generateTemporaryPassword } from '../../lib/crypto';
import { 
  Button, 
  Card, 
  Badge, 
  Drawer, 
  Modal, 
  ConfirmDialog, 
  EmptyState, 
  Tooltip,
  Skeleton
} from '../ui';
import { cn } from '../../lib/utils';

export interface UsersViewProps {
  currentUser: User;
  users: AppUser[];
  onSaveUser: (user: AppUser, isEdit: boolean) => void;
  onUpdateRole: (userId: string, newRole: Role) => void;
  onToggleStatus: (userId: string) => void;
  onResetPassword: (userId: string, newPasswordHash: string, plainTempPassword: string) => void;
  onDeleteUser: (userId: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  currentUser,
  users,
  onSaveUser,
  onUpdateRole,
  onToggleStatus,
  onResetPassword,
  onDeleteUser,
  showToast,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | Role>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Drawer Tambah Pengguna State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRole, setFormRole] = useState<Role>(Role.KASIR);
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  // Modal Reset Password State
  const [resetModalUser, setResetModalUser] = useState<AppUser | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(true);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [copiedTempPassword, setCopiedTempPassword] = useState(false);

  // Dialog Konfirmasi Aksi
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    actionType: 'toggle_status' | 'change_role' | 'delete_user';
    targetUser: AppUser | null;
    pendingRole?: Role;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'toggle_status',
    targetUser: null,
  });

  // Strength calculations
  const formPasswordStrength = useMemo(() => calculatePasswordStrength(formPassword), [formPassword]);
  const tempPasswordStrength = useMemo(() => calculatePasswordStrength(tempPassword), [tempPassword]);

  // Validasi Username Unik
  const cleanFormUsername = formUsername.trim().toLowerCase();
  const isUsernameDuplicate = useMemo(() => {
    if (!cleanFormUsername) return false;
    return users.some((u) => u.username.toLowerCase() === cleanFormUsername);
  }, [cleanFormUsername, users]);

  const isFormValid = useMemo(() => {
    const validName = formName.trim().length >= 2;
    const validUsername = cleanFormUsername.length >= 3 && !isUsernameDuplicate && /^[a-z0-9_]+$/.test(cleanFormUsername);
    const validPassword = formPassword.length >= 6;
    return validName && validUsername && validPassword && !formSubmitting;
  }, [formName, cleanFormUsername, isUsernameDuplicate, formPassword, formSubmitting]);

  // Reset Drawer Form
  const resetDrawerForm = () => {
    setFormName('');
    setFormUsername('');
    setFormRole(Role.KASIR);
    setFormPassword('');
    setShowFormPassword(false);
    setUsernameTouched(false);
  };

  // Submit Tambah Pengguna
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Check permission
    const perm = canPerform(currentUser, 'create_user');
    if (!perm.allowed) {
      showToast(perm.reason || 'Izin ditolak', 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      const passwordHash = await hashPassword(formPassword);
      const newUser: AppUser = {
        id: `u-${Date.now()}`,
        name: formName.trim(),
        username: cleanFormUsername,
        role: formRole,
        isActive: true,
        passwordHash,
        mustChangePassword: true, // Baru dibuat: wajib ganti password saat login pertama
        createdAt: new Date().toISOString(),
        lastLogin: undefined,
      };

      onSaveUser(newUser, false);
      showToast(`Pengguna "${newUser.name}" (@${newUser.username}) berhasil ditambahkan!`, 'success');
      setDrawerOpen(false);
      resetDrawerForm();
    } catch {
      showToast('Gagal memproses password pengguna.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (user: AppUser) => {
    const perm = canPerform(currentUser, 'reset_password', user, users);
    if (!perm.allowed) {
      showToast(perm.reason || 'Izin ditolak', 'error');
      return;
    }

    const initialTemp = generateTemporaryPassword();
    setResetModalUser(user);
    setTempPassword(initialTemp);
    setShowTempPassword(true);
    setCopiedTempPassword(false);
  };

  // Submit Reset Password
  const handleConfirmResetPassword = async () => {
    if (!resetModalUser || !tempPassword || tempPassword.length < 6) return;

    setResetSubmitting(true);
    try {
      const newHash = await hashPassword(tempPassword);
      onResetPassword(resetModalUser.id, newHash, tempPassword);
      showToast(
        `Password @${resetModalUser.username} berhasil di-reset. Pengguna wajib mengganti password saat login berikutnya.`,
        'success'
      );
      setResetModalUser(null);
      setTempPassword('');
    } catch {
      showToast('Gagal memproses reset password.', 'error');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Copy temporary password
  const handleCopyTempPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopiedTempPassword(true);
    showToast('Password sementara disalin ke clipboard!', 'info');
    setTimeout(() => setCopiedTempPassword(false), 2000);
  };

  // Confirm Actions (Toggle status, Change role, Delete)
  const executeConfirmedAction = () => {
    const { actionType, targetUser, pendingRole } = confirmDialog;
    if (!targetUser) return;

    if (actionType === 'toggle_status') {
      const perm = canPerform(currentUser, 'toggle_status', targetUser, users);
      if (!perm.allowed) {
        showToast(perm.reason || 'Aksi tidak diizinkan', 'error');
        return;
      }
      onToggleStatus(targetUser.id);
      showToast(
        targetUser.isActive 
          ? `Akun @${targetUser.username} telah dinonaktifkan.` 
          : `Akun @${targetUser.username} telah diaktifkan kembali.`,
        'success'
      );
    } else if (actionType === 'change_role' && pendingRole) {
      const perm = canPerform(currentUser, 'change_role', targetUser, users);
      if (!perm.allowed) {
        showToast(perm.reason || 'Aksi tidak diizinkan', 'error');
        return;
      }
      onUpdateRole(targetUser.id, pendingRole);
      showToast(`Role @${targetUser.username} diubah menjadi ${pendingRole}.`, 'success');
    } else if (actionType === 'delete_user') {
      const perm = canPerform(currentUser, 'delete_user', targetUser, users);
      if (!perm.allowed) {
        showToast(perm.reason || 'Aksi tidak diizinkan', 'error');
        return;
      }
      onDeleteUser(targetUser.id);
      showToast(`Akun @${targetUser.username} telah dihapus permanen.`, 'success');
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);

      // Filter Role
      const matchRole = filterRole === 'ALL' || u.role === filterRole;

      // Filter Status
      const matchStatus = 
        filterStatus === 'ALL' || 
        (filterStatus === 'ACTIVE' && u.isActive) || 
        (filterStatus === 'INACTIVE' && !u.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  // Statistics
  const activeAdmins = users.filter((u) => u.role === Role.ADMIN && u.isActive).length;
  const activeCashiers = users.filter((u) => u.role === Role.KASIR && u.isActive).length;
  const totalInactive = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header & Summary Stats */}
      <div className="bg-surface border border-ink/15 rounded-[24px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg border border-ink/10 text-xs font-semibold text-ink mb-2">
            <ShieldCheck size={14} />
            <span>Manajemen Akses & Hak Pengguna</span>
            <span className="text-muted">•</span>
            <span className="text-muted">Khusus Administrator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Daftar Pengguna Sistem
          </h2>
          <p className="text-[13px] text-muted font-normal mt-1 max-w-xl">
            Kelola akun kasir dan admin, pantau aktivitas login terakhir, ubah hak akses, dan lakukan reset password sementara secara aman dengan enkripsi hash.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              resetDrawerForm();
              setDrawerOpen(true);
            }}
            className="rounded-full py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <UserPlus size={15} />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      {/* 2. Ringkasan Kartu Pastel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-yellow/35 border border-yellow/60 rounded-[22px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Total Akun</span>
            <div className="w-8 h-8 rounded-full bg-yellow/60 flex items-center justify-center text-ink border border-yellow/70">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-ink tracking-tight">{users.length}</h3>
            <p className="text-[11px] text-muted font-medium mt-0.5">Terdaftar di sistem</p>
          </div>
        </div>

        <div className="bg-blue/35 border border-blue/60 rounded-[22px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Admin Aktif</span>
            <div className="w-8 h-8 rounded-full bg-blue/60 flex items-center justify-center text-ink border border-blue/70">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-ink tracking-tight">{activeAdmins}</h3>
            <p className="text-[11px] text-muted font-medium mt-0.5">Wajib min. 1 admin aktif</p>
          </div>
        </div>

        <div className="bg-green/35 border border-green/60 rounded-[22px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Kasir Aktif</span>
            <div className="w-8 h-8 rounded-full bg-green/60 flex items-center justify-center text-ink border border-green/70">
              <UserIcon size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-ink tracking-tight">{activeCashiers}</h3>
            <p className="text-[11px] text-muted font-medium mt-0.5">Dapat login ke Kasir POS</p>
          </div>
        </div>

        <div className="bg-pink/35 border border-pink/60 rounded-[22px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Akun Nonaktif</span>
            <div className="w-8 h-8 rounded-full bg-pink/60 flex items-center justify-center text-ink border border-pink/70">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-ink tracking-tight">{totalInactive}</h3>
            <p className="text-[11px] text-muted font-medium mt-0.5">Akses login ditangguhkan</p>
          </div>
        </div>
      </div>

      {/* 3. Toolbar Pencarian & Filter */}
      <div className="bg-surface border border-ink/15 rounded-[24px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-ink/10">
          <div>
            <h3 className="text-base font-bold text-ink">Daftar Akun Terdaftar</h3>
            <p className="text-xs text-muted">
              Menampilkan {filteredUsers.length} dari {users.length} akun pengguna
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex items-center min-w-[220px]">
              <Search size={14} className="absolute left-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama atau @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg border border-ink/15 rounded-full pl-9 pr-8 py-2 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-muted hover:text-ink cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Role */}
            <div className="flex bg-bg p-0.5 rounded-full border border-ink/15 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterRole('ALL')}
                className={cn(
                  "px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                  filterRole === 'ALL' ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
              >
                Semua Role
              </button>
              <button
                type="button"
                onClick={() => setFilterRole(Role.ADMIN)}
                className={cn(
                  "px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                  filterRole === Role.ADMIN ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setFilterRole(Role.KASIR)}
                className={cn(
                  "px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                  filterRole === Role.KASIR ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
              >
                Kasir
              </button>
            </div>

            {/* Filter Status */}
            <div className="flex bg-bg p-0.5 rounded-full border border-ink/15 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={cn(
                  "px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                  filterStatus === 'ALL' ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('ACTIVE')}
                className={cn(
                  "px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                  filterStatus === 'ACTIVE' ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('INACTIVE')}
                className={cn(
                  "px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                  filterStatus === 'INACTIVE' ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
              >
                Nonaktif
              </button>
            </div>
          </div>
        </div>

        {/* 4. Tabel Daftar Pengguna */}
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="Pengguna tidak ditemukan"
            description={
              searchQuery || filterRole !== 'ALL' || filterStatus !== 'ALL'
                ? "Tidak ada akun pengguna yang sesuai dengan kriteria filter saat ini."
                : "Belum ada akun pengguna terdaftar selain akun sistem."
            }
            actionLabel="Reset Filter"
            onAction={() => {
              setSearchQuery('');
              setFilterRole('ALL');
              setFilterStatus('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-ink/10 text-muted uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-3">Pengguna</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status Akun</th>
                  <th className="py-3 px-3">Terakhir Login</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {filteredUsers.map((u) => {
                  const isCurrentSelf = u.id === currentUser.id;
                  const canChangeRole = canPerform(currentUser, 'change_role', u, users);
                  const canToggleStatus = canPerform(currentUser, 'toggle_status', u, users);
                  const canDelete = canPerform(currentUser, 'delete_user', u, users);

                  // Formatting last login
                  let formattedLastLogin = 'Belum pernah login';
                  if (u.lastLogin) {
                    try {
                      formattedLastLogin = new Date(u.lastLogin).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    } catch {
                      formattedLastLogin = u.lastLogin;
                    }
                  }

                  const initials = u.name
                    ? u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : u.username.slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        "hover:bg-bg/60 transition-colors group",
                        !u.isActive && "opacity-65 bg-ink/[0.02]"
                      )}
                    >
                      {/* Nama & Username */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border shrink-0",
                              u.role === Role.ADMIN
                                ? "bg-ink text-white border-ink"
                                : "bg-green text-ink border-green/60"
                            )}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[13px] text-ink">{u.name}</span>
                              {isCurrentSelf && (
                                <span className="text-[10px] font-bold bg-yellow/60 border border-yellow text-ink px-1.5 py-0.2 rounded-full">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs text-muted">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        {u.role === Role.ADMIN ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-ink text-white">
                            <ShieldCheck size={12} />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green/40 border border-green text-ink">
                            <UserIcon size={12} />
                            Kasir
                          </span>
                        )}
                      </td>

                      {/* Status Akun */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green/30 text-[#2e4c13] border border-green/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink/40 text-[#b42b58] border border-pink/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink" />
                              Nonaktif
                            </span>
                          )}

                          {u.mustChangePassword && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-yellow/40 border border-yellow/60 text-ink" title="Pengguna wajib membuat password baru saat login berikutnya">
                              <KeyRound size={10} />
                              Wajib Ganti Password
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Terakhir Login */}
                      <td className="py-3.5 px-3 text-muted">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-muted/70 shrink-0" />
                          <span className="tabular-nums">{formattedLastLogin}</span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Ubah Role */}
                          <Tooltip
                            content={
                              !canChangeRole.allowed
                                ? canChangeRole.reason || 'Tidak dapat mengubah role'
                                : `Ubah role ke ${u.role === Role.ADMIN ? 'Kasir' : 'Admin'}`
                            }
                          >
                            <button
                              type="button"
                              disabled={!canChangeRole.allowed}
                              onClick={() => {
                                const newRole = u.role === Role.ADMIN ? Role.KASIR : Role.ADMIN;
                                setConfirmDialog({
                                  isOpen: true,
                                  title: `Ubah Role ke ${newRole}?`,
                                  description: `Apakah Anda yakin ingin mengubah wewenang @${u.username} dari ${u.role} menjadi ${newRole}?`,
                                  actionType: 'change_role',
                                  targetUser: u,
                                  pendingRole: newRole,
                                });
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer",
                                !canChangeRole.allowed
                                  ? "opacity-35 cursor-not-allowed bg-ink/5 border-ink/10 text-muted"
                                  : "bg-surface hover:bg-bg border-ink/15 text-ink"
                              )}
                            >
                              Role: {u.role === Role.ADMIN ? 'Jadikan Kasir' : 'Jadikan Admin'}
                            </button>
                          </Tooltip>

                          {/* Toggle Status Aktif / Nonaktif */}
                          <Tooltip
                            content={
                              !canToggleStatus.allowed
                                ? canToggleStatus.reason || 'Tidak dapat mengubah status'
                                : u.isActive ? 'Nonaktifkan akun ini' : 'Aktifkan akun ini'
                            }
                          >
                            <button
                              type="button"
                              disabled={!canToggleStatus.allowed}
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: u.isActive ? 'Nonaktifkan Akun Pengguna?' : 'Aktifkan Kembali Akun Pengguna?',
                                  description: u.isActive
                                    ? `Pengguna @${u.username} tidak akan dapat login ke dalam sistem hingga diaktifkan kembali oleh Administrator.`
                                    : `Pengguna @${u.username} akan dapat login dan mengakses sistem kembali sesuai role (${u.role}).`,
                                  actionType: 'toggle_status',
                                  targetUser: u,
                                });
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer",
                                !canToggleStatus.allowed
                                  ? "opacity-35 cursor-not-allowed bg-ink/5 border-ink/10 text-muted"
                                  : u.isActive
                                    ? "bg-pink/20 hover:bg-pink/50 text-[#b42b58] border-pink/40"
                                    : "bg-green/20 hover:bg-green/50 text-[#2e4c13] border-green/40"
                              )}
                            >
                              {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          </Tooltip>

                          {/* Reset Password */}
                          <Tooltip content="Tetapkan password sementara & wajibkan ganti password saat login berikutnya">
                            <button
                              type="button"
                              onClick={() => openResetPasswordModal(u)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-ink/15 bg-surface hover:bg-bg text-ink transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <KeyRound size={11} />
                              Reset Sandi
                            </button>
                          </Tooltip>

                          {/* Hapus Akun */}
                          {!isCurrentSelf && (
                            <Tooltip
                              content={
                                !canDelete.allowed
                                  ? canDelete.reason || 'Tidak dapat menghapus akun'
                                  : 'Hapus akun pengguna ini'
                              }
                            >
                              <button
                                type="button"
                                disabled={!canDelete.allowed}
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Hapus Akun Pengguna?',
                                    description: `Akun @${u.username} (${u.name}) akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.`,
                                    actionType: 'delete_user',
                                    targetUser: u,
                                  });
                                }}
                                className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border shrink-0",
                                  !canDelete.allowed
                                    ? "opacity-30 cursor-not-allowed border-ink/10 text-muted"
                                    : "text-muted hover:text-ink hover:bg-pink/30 hover:border-pink border-transparent"
                                )}
                              >
                                <Trash2 size={13} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================= DRAWER TAMBAH PENGGUNA ======================= */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          if (!formSubmitting) setDrawerOpen(false);
        }}
        title="Tambah Pengguna Baru"
        subtitle="Buat akun untuk kasir atau administrator toko baru"
        width="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-5 pb-6">
          {/* 1. Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink block">
              Nama Lengkap <span className="text-pink-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Siti Rahmawati"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-bg border border-ink/15 rounded-[16px] px-3.5 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors"
            />
          </div>

          {/* 2. Username Unik */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink block">
              Username Unik <span className="text-pink-600">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-muted font-mono text-xs select-none">@</span>
              <input
                type="text"
                required
                placeholder="siti_kasir"
                value={formUsername}
                onBlur={() => setUsernameTouched(true)}
                onChange={(e) => {
                  setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                }}
                className={cn(
                  "w-full bg-bg border rounded-[16px] pl-8 pr-8 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden transition-colors font-mono",
                  isUsernameDuplicate
                    ? "border-pink focus:border-pink bg-pink/10"
                    : "border-ink/15 focus:border-ink"
                )}
              />
              {cleanFormUsername && (
                <div className="absolute right-3">
                  {isUsernameDuplicate ? (
                    <XCircle size={15} className="text-[#b42b58]" />
                  ) : (
                    <CheckCircle2 size={15} className="text-[#2e4c13]" />
                  )}
                </div>
              )}
            </div>
            {isUsernameDuplicate && (
              <p className="text-[11px] font-semibold text-[#b42b58] ml-1">
                Username "@{cleanFormUsername}" sudah digunakan oleh akun lain. Gunakan username lain.
              </p>
            )}
            {usernameTouched && !cleanFormUsername && (
              <p className="text-[11px] text-muted ml-1">
                Username minimal 3 karakter huruf kecil, angka, atau underscore (_).
              </p>
            )}
          </div>

          {/* 3. Role Pengguna */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink block">
              Hak Akses / Peran (Role) <span className="text-pink-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormRole(Role.KASIR)}
                className={cn(
                  "p-3 rounded-[18px] border text-left transition-all cursor-pointer flex flex-col justify-between",
                  formRole === Role.KASIR
                    ? "bg-green/30 border-green ring-1 ring-green text-ink"
                    : "bg-bg border-ink/15 text-muted hover:text-ink hover:bg-surface"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-ink">Kasir POS</span>
                  <UserIcon size={14} />
                </div>
                <p className="text-[10px] text-muted mt-1 leading-tight">
                  Akses kasir, kelola keranjang belanja, cetak struk, dan riwayat shift saya.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormRole(Role.ADMIN)}
                className={cn(
                  "p-3 rounded-[18px] border text-left transition-all cursor-pointer flex flex-col justify-between",
                  formRole === Role.ADMIN
                    ? "bg-ink text-white border-ink ring-1 ring-ink"
                    : "bg-bg border-ink/15 text-muted hover:text-ink hover:bg-surface"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Administrator</span>
                  <ShieldCheck size={14} />
                </div>
                <p className={cn("text-[10px] mt-1 leading-tight", formRole === Role.ADMIN ? "text-white/80" : "text-muted")}>
                  Akses penuh: Dashboard, Inventori, Laporan Penjualan, dan Pengguna.
                </p>
              </button>
            </div>
          </div>

          {/* 4. Password Awal & Indikator Kekuatan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">
                Password Awal <span className="text-pink-600">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const autoPass = generateTemporaryPassword();
                  setFormPassword(autoPass);
                  setShowFormPassword(true);
                }}
                className="text-[11px] font-semibold text-ink underline hover:text-muted cursor-pointer"
              >
                Buat Password Otomatis
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type={showFormPassword ? 'text' : 'password'}
                required
                placeholder="Minimal 6 karakter..."
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full bg-bg border border-ink/15 rounded-[16px] px-3.5 pr-10 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowFormPassword(!showFormPassword)}
                className="absolute right-3 text-muted hover:text-ink cursor-pointer"
                aria-label={showFormPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showFormPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Indikator Kekuatan Password */}
            {formPassword && (
              <div className="p-3 bg-bg rounded-[16px] border border-ink/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-medium">Kekuatan Sandi:</span>
                  <span className={cn("font-bold text-[11px]", formPasswordStrength.textColor)}>
                    {formPasswordStrength.label}
                  </span>
                </div>

                {/* Progress bar bertingkat 4 */}
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        step <= formPasswordStrength.score ? formPasswordStrength.color : "bg-ink/10"
                      )}
                    />
                  ))}
                </div>

                <p className="text-[10px] text-muted leading-tight">
                  {formPasswordStrength.feedback}
                </p>
              </div>
            )}

            <div className="p-3 bg-yellow/30 border border-yellow/50 rounded-[16px] text-[11px] text-ink leading-relaxed">
              <span className="font-bold">Keamanan:</span> Password akan disimpan dalam format hash enkripsi SHA-256. Pengguna baru akan diwajibkan mengganti password saat pertama kali login.
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-3 border-t border-ink/10 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 py-2.5 text-xs font-semibold rounded-full"
              onClick={() => setDrawerOpen(false)}
              disabled={formSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 py-2.5 text-xs font-semibold rounded-full flex items-center justify-center gap-2"
              disabled={!isFormValid || formSubmitting}
            >
              {formSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Simpan Pengguna</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* ======================= MODAL RESET PASSWORD ======================= */}
      <Modal
        isOpen={!!resetModalUser}
        onClose={() => {
          if (!resetSubmitting) setResetModalUser(null);
        }}
        title="Reset Password Sementara"
        subtitle={resetModalUser ? `Untuk akun @${resetModalUser.username} (${resetModalUser.name})` : ''}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-muted leading-relaxed">
            Tetapkan password sementara untuk pengguna ini. Pengguna akan <span className="font-bold text-ink">diwajibkan membuat password baru</span> saat pertama kali login menggunakan password sementara ini.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">
                Password Sementara
              </label>
              <button
                type="button"
                onClick={() => {
                  const auto = generateTemporaryPassword();
                  setTempPassword(auto);
                  setShowTempPassword(true);
                  setCopiedTempPassword(false);
                }}
                className="text-[11px] font-semibold text-ink underline hover:text-muted cursor-pointer"
              >
                Buat Acak Baru
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type={showTempPassword ? 'text' : 'password'}
                value={tempPassword}
                onChange={(e) => {
                  setTempPassword(e.target.value);
                  setCopiedTempPassword(false);
                }}
                placeholder="Minimal 6 karakter..."
                className="w-full bg-bg border border-ink/15 rounded-[16px] pl-3.5 pr-20 py-2.5 text-sm font-mono font-bold text-ink focus:outline-hidden focus:border-ink"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyTempPassword}
                  className="p-1 rounded-md text-muted hover:text-ink hover:bg-ink/5 cursor-pointer"
                  title="Salin password sementara"
                >
                  {copiedTempPassword ? <Check size={14} className="text-[#2e4c13]" /> : <Copy size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTempPassword(!showTempPassword)}
                  className="p-1 rounded-md text-muted hover:text-ink hover:bg-ink/5 cursor-pointer"
                >
                  {showTempPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Indikator Kekuatan */}
            {tempPassword && (
              <div className="p-2.5 bg-bg rounded-[14px] border border-ink/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted text-[11px]">Kekuatan:</span>
                  <span className={cn("font-bold text-[11px]", tempPasswordStrength.textColor)}>
                    {tempPasswordStrength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        step <= tempPasswordStrength.score ? tempPasswordStrength.color : "bg-ink/10"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-yellow/30 border border-yellow/50 rounded-[16px] text-[11px] text-ink leading-relaxed">
            <span className="font-bold">Perhatian:</span> Berikan password sementara ini kepada pengguna bersangkutan. Password disimpan dalam format hash SHA-256 untuk keamanan maksimal.
          </div>

          <div className="flex gap-2 pt-2 border-t border-ink/10">
            <Button
              variant="secondary"
              className="flex-1 py-2.5 text-xs font-semibold rounded-full"
              onClick={() => setResetModalUser(null)}
              disabled={resetSubmitting}
            >
              Batal
            </Button>
            <Button
              className="flex-1 py-2.5 text-xs font-semibold rounded-full flex items-center justify-center gap-2"
              onClick={handleConfirmResetPassword}
              disabled={!tempPassword || tempPassword.length < 6 || resetSubmitting}
            >
              {resetSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <KeyRound size={14} />
                  <span>Konfirmasi Reset</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================= DIALOG KONFIRMASI AKSI ======================= */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeConfirmedAction}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.actionType === 'delete_user' ? 'danger' : 'warning'}
        confirmLabel={
          confirmDialog.actionType === 'delete_user' 
            ? 'Ya, Hapus Akun' 
            : confirmDialog.actionType === 'change_role'
            ? 'Ya, Ubah Role'
            : 'Ya, Lanjutkan'
        }
      />
    </div>
  );
};
