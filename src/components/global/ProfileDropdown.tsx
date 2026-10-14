import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, LogOut, ShieldCheck, ShoppingCart, KeyRound, Check } from 'lucide-react';
import { User, Role } from '../../types';
import { Dropdown } from '../ui/Dropdown';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ProfileDropdownProps {
  user: User;
  onLogout: () => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onLogout, showToast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordError('Password minimal 4 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok');
      return;
    }

    // Update in localStorage
    try {
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        const usersList = JSON.parse(usersStr);
        const updated = usersList.map((u: any) => u.username === user.username ? { ...u, password: newPassword } : u);
        localStorage.setItem('users', JSON.stringify(updated));
      }
    } catch {}

    setChangePasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    if (showToast) {
      showToast('Password berhasil diperbarui', 'success');
    }
  };

  return (
    <>
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        width="w-64"
        align="right"
        trigger={
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsOpen(!isOpen)}
            title="Profil Pengguna"
            className="w-9 h-9 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ink"
            aria-label="Profil Pengguna"
          >
            <UserIcon size={16} strokeWidth={1.8} />
          </motion.button>
        }
      >
        <div className="p-4 border-b border-ink/10 bg-bg/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-ink truncate capitalize">
                {user.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    user.role === Role.ADMIN
                      ? 'bg-blue text-ink'
                      : 'bg-yellow text-ink'
                  }`}
                >
                  {user.role === Role.ADMIN ? (
                    <ShieldCheck size={11} />
                  ) : (
                    <ShoppingCart size={11} />
                  )}
                  {user.role}
                </span>
                <span className="text-[11px] text-muted">Aktif</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 space-y-1">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setChangePasswordModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink hover:bg-surface rounded-[14px] transition-colors cursor-pointer text-left"
          >
            <KeyRound size={14} className="text-muted" />
            <span>Ganti Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setShowLogoutConfirm(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink hover:bg-pink/40 rounded-[14px] transition-colors cursor-pointer text-left"
          >
            <LogOut size={14} strokeWidth={2} />
            <span>Keluar Akun (Log out)</span>
          </button>
        </div>
      </Dropdown>

      {/* Modal Ganti Password */}
      <Modal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        title="Ganti Password"
        subtitle={`Perbarui kata sandi untuk akun ${user.username}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Password Baru</label>
            <input
              type="password"
              placeholder="Masukkan password baru"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
              className="w-full bg-bg border border-ink/15 rounded-full px-4 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              className="w-full bg-bg border border-ink/15 rounded-full px-4 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-ink"
            />
          </div>

          {passwordError && (
            <p className="text-xs font-semibold text-pink-700 bg-pink/20 px-3 py-1 rounded-full">
              {passwordError}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 rounded-full text-xs font-semibold"
              onClick={() => setChangePasswordModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full text-xs font-semibold"
            >
              Simpan Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Logout Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={onLogout}
        title="Konfirmasi Keluar Akun"
        description="Apakah Anda yakin ingin keluar dari sistem? Keranjang kasir yang belum selesai akan direset."
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="warning"
      />
    </>
  );
};
