import { Role } from '../types';

export type AppView = 'dashboard' | 'pos' | 'my-history' | 'inventory' | 'reports' | 'users';

export interface RoutePermission {
  id: AppView;
  label: string;
  allowedRoles: Role[];
  description: string;
}

/**
 * Single source of truth for page & feature access permissions in SobatDagang
 */
export const ROUTE_PERMISSIONS: Record<AppView, RoutePermission> = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard Bisnis',
    allowedRoles: [Role.ADMIN],
    description: 'Ringkasan omzet, statistik penjualan & stok toko',
  },
  pos: {
    id: 'pos',
    label: 'Kasir POS',
    allowedRoles: [Role.ADMIN, Role.KASIR],
    description: 'Transaksi kasir, scan/pilih barang & cetak struk',
  },
  'my-history': {
    id: 'my-history',
    label: 'Riwayat Saya',
    allowedRoles: [Role.ADMIN, Role.KASIR],
    description: 'Daftar transaksi kasir hari ini, buka struk, dan tutup shift',
  },
  inventory: {
    id: 'inventory',
    label: 'Inventori Produk',
    allowedRoles: [Role.ADMIN],
    description: 'Katalog barang, edit stok, & tambah produk',
  },
  reports: {
    id: 'reports',
    label: 'Laporan Penjualan',
    allowedRoles: [Role.ADMIN],
    description: 'Analisis omzet, tren harian, & ekspor data transaksi',
  },
  users: {
    id: 'users',
    label: 'Pengguna',
    allowedRoles: [Role.ADMIN],
    description: 'Manajemen akun kasir & admin, hak akses, dan reset password',
  },
};

export type UserAction = 
  | 'create_user'
  | 'change_role'
  | 'toggle_status'
  | 'reset_password'
  | 'delete_user';

export interface CanPerformResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Enforces business logic and security policies for user management actions:
 * - Admin cannot demote, deactivate, or delete themselves
 * - At least one active Admin must always remain in the system
 */
export function canPerform(
  currentUser: { id: string; role: Role } | null | undefined,
  action: UserAction,
  targetUser?: { id: string; role: Role; isActive: boolean },
  allUsers?: { id: string; role: Role; isActive: boolean }[]
): CanPerformResult {
  if (!currentUser) {
    return { allowed: false, reason: 'Sesi pengguna tidak valid atau belum masuk.' };
  }

  // Only Admin has user management capabilities
  if (currentUser.role !== Role.ADMIN) {
    return { allowed: false, reason: 'Hanya Administrator yang memiliki wewenang untuk tindakan ini.' };
  }

  const activeAdmins = allUsers ? allUsers.filter((u) => u.role === Role.ADMIN && u.isActive) : [];

  switch (action) {
    case 'create_user':
      return { allowed: true };

    case 'change_role':
      if (targetUser && targetUser.id === currentUser.id) {
        return { allowed: false, reason: 'Admin tidak boleh menurunkan role akun dirinya sendiri.' };
      }
      if (targetUser && targetUser.role === Role.ADMIN && targetUser.isActive && activeAdmins.length <= 1) {
        return { allowed: false, reason: 'Harus selalu ada minimal satu Administrator aktif di sistem.' };
      }
      return { allowed: true };

    case 'toggle_status':
      if (targetUser && targetUser.id === currentUser.id) {
        return { allowed: false, reason: 'Admin tidak boleh menonaktifkan akun dirinya sendiri.' };
      }
      if (targetUser && targetUser.role === Role.ADMIN && targetUser.isActive && activeAdmins.length <= 1) {
        return { allowed: false, reason: 'Tidak dapat menonaktifkan satu-satunya Administrator aktif di sistem.' };
      }
      return { allowed: true };

    case 'delete_user':
      if (targetUser && targetUser.id === currentUser.id) {
        return { allowed: false, reason: 'Admin tidak boleh menghapus akun dirinya sendiri.' };
      }
      if (targetUser && targetUser.role === Role.ADMIN && targetUser.isActive && activeAdmins.length <= 1) {
        return { allowed: false, reason: 'Tidak dapat menghapus satu-satunya Administrator aktif di sistem.' };
      }
      return { allowed: true };

    case 'reset_password':
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Tindakan tidak dikenal.' };
  }
}

/**
 * Check if a role can access a particular view
 */
export function canAccessView(role: Role | undefined | null, view: AppView): boolean {
  if (!role) return false;
  const config = ROUTE_PERMISSIONS[view];
  if (!config) return false;
  return config.allowedRoles.includes(role);
}

/**
 * Filter a list of views by user role
 */
export function getAllowedViews(role: Role | undefined | null): AppView[] {
  if (!role) return [];
  return (Object.keys(ROUTE_PERMISSIONS) as AppView[]).filter((v) =>
    ROUTE_PERMISSIONS[v].allowedRoles.includes(role)
  );
}

/**
 * Fallback route when a user attempts to navigate to a forbidden page
 */
export function getDefaultViewForRole(role: Role | undefined | null): AppView {
  if (role === Role.ADMIN) return 'dashboard';
  return 'pos';
}
