import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Role } from '../../types';
import { canAccessView, AppView, getDefaultViewForRole } from '../../lib/permissions';
import { Button } from './Button';

export interface RoleGuardProps {
  allow: Role[];
  userRole: Role | undefined | null;
  targetViewName?: string;
  onFallback?: (view: AppView) => void;
  children: React.ReactNode;
}

/**
 * RoleGuard protects views and sensitive components based on current user role.
 * If user lacks required role, renders an elegant SobatDagang styled access-denied state
 * instead of leaking restricted UI.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allow,
  userRole,
  targetViewName = 'Halaman Ini',
  onFallback,
  children,
}) => {
  const isAllowed = userRole && allow.includes(userRole);

  if (isAllowed) {
    return <>{children}</>;
  }

  const fallbackView = getDefaultViewForRole(userRole);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="min-h-[440px] flex items-center justify-center p-6 text-center"
    >
      <div className="max-w-md w-full bg-surface border border-ink/15 rounded-[24px] p-8 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-pink/20 border border-pink/30 flex items-center justify-center mx-auto mb-4 text-ink">
          <ShieldAlert size={28} className="text-pink-600" />
        </div>

        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-pink-700 bg-pink/20 px-3 py-1 rounded-full mb-3">
          Akses Khusus Admin
        </span>

        <h3 className="text-xl font-bold text-ink tracking-tight mb-2">
          Akses {targetViewName} Dibatasi
        </h3>

        <p className="text-[13px] text-muted leading-relaxed mb-6">
          Akun Anda saat ini masuk dengan hak akses <strong className="text-ink uppercase">{userRole || 'Tamu'}</strong>. Halaman ini hanya dapat diakses oleh Administrator toko.
        </p>

        {onFallback && (
          <Button
            onClick={() => onFallback(fallbackView)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-xs font-semibold"
          >
            <ShoppingCart size={15} />
            Kembali ke Kasir POS
          </Button>
        )}
      </div>
    </motion.div>
  );
};
