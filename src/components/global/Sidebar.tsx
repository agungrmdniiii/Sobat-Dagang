import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  History,
  Users,
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  X,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { User, Role } from '../../types';
import { ROUTE_PERMISSIONS, canAccessView, AppView } from '../../lib/permissions';
import { cn } from '../../lib/utils';

interface SidebarProps {
  view: AppView;
  setView: (view: AppView) => void;
  user: User;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout: () => void;
  onOpenHelp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  view,
  setView,
  user,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  setMobileOpen,
  onLogout,
  onOpenHelp,
}) => {
  const navItems = [
    {
      group: 'General',
      items: [
        { 
          id: 'dashboard' as const, 
          label: ROUTE_PERMISSIONS.dashboard.label, 
          icon: LayoutDashboard, 
          roles: ROUTE_PERMISSIONS.dashboard.allowedRoles 
        },
        { 
          id: 'pos' as const, 
          label: ROUTE_PERMISSIONS.pos.label, 
          icon: ShoppingCart, 
          roles: ROUTE_PERMISSIONS.pos.allowedRoles 
        },
        { 
          id: 'my-history' as const, 
          label: ROUTE_PERMISSIONS['my-history'].label, 
          icon: History, 
          roles: ROUTE_PERMISSIONS['my-history'].allowedRoles 
        },
      ],
    },
    {
      group: 'Tools',
      items: [
        { 
          id: 'inventory' as const, 
          label: ROUTE_PERMISSIONS.inventory.label, 
          icon: Package, 
          roles: ROUTE_PERMISSIONS.inventory.allowedRoles 
        },
        { 
          id: 'reports' as const, 
          label: ROUTE_PERMISSIONS.reports.label, 
          icon: BarChart3, 
          roles: ROUTE_PERMISSIONS.reports.allowedRoles 
        },
        { 
          id: 'users' as const, 
          label: ROUTE_PERMISSIONS.users.label, 
          icon: Users, 
          roles: ROUTE_PERMISSIONS.users.allowedRoles 
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs z-[60] lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 bg-ink text-white flex flex-col z-[70] transition-all duration-200 lg:relative lg:translate-x-0 no-print shrink-0 rounded-r-[24px] lg:rounded-r-none lg:rounded-l-[28px] md:rounded-l-[30px] select-none',
          mobileOpen ? 'translate-x-0 w-[210px]' : '-translate-x-full lg:translate-x-0',
          // Desktop width depending on collapse state
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[200px]'
        )}
      >
        {/* Top Header & Logo */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-white/10 min-h-[64px]">
          <div className={cn('flex items-center gap-2.5', isCollapsed && 'lg:justify-center lg:w-full')}>
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
              <Store size={16} className="text-white" strokeWidth={1.8} />
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div className="overflow-hidden">
                <h1 className="font-semibold text-sm tracking-tight text-white leading-none truncate">
                  SobatDagang
                </h1>
                <span className="text-xs text-white/70 font-medium block mt-1 truncate">
                  POS & Stock
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/60 hover:text-white p-1 rounded-full cursor-pointer"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 px-2.5 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
          {navItems.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.group} className="space-y-1">
                {(!isCollapsed || mobileOpen) && (
                  <p className="px-3 text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider truncate">
                    {section.group}
                  </p>
                )}

                {visibleItems.map((item) => {
                  const active = view === item.id;
                  const Icon = item.icon;

                  return (
                    <div key={item.id} className="relative group">
                      <button
                        data-tour={`menu-${item.id}`}
                        onClick={() => {
                          setView(item.id);
                          setMobileOpen(false);
                        }}
                        className={cn(
                          'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer z-10 focus-visible:ring-2 focus-visible:ring-white',
                          isCollapsed && !mobileOpen ? 'justify-center px-0' : '',
                          active
                            ? 'text-ink font-semibold'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="sidebarActivePill"
                            className="absolute inset-0 bg-pink rounded-full -z-10"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}

                        <Icon
                          size={17}
                          strokeWidth={active ? 2.2 : 1.8}
                          className={cn(
                            'shrink-0',
                            active ? 'text-ink' : 'text-white/80'
                          )}
                        />

                        {(!isCollapsed || mobileOpen) && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </button>

                      {/* Tooltip on collapsed mode (desktop only) */}
                      {isCollapsed && !mobileOpen && (
                        <div className="hidden lg:group-hover:block absolute left-full ml-2.5 top-1/2 -translate-y-1/2 bg-surface text-ink text-xs font-bold px-3 py-1.5 rounded-[12px] border border-ink/20 shadow-md whitespace-nowrap z-50 pointer-events-none">
                          {item.label}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Bantuan Item in Tools Group */}
                {section.group === 'Tools' && onOpenHelp && (
                  <div className="relative group pt-1">
                    <button
                      type="button"
                      data-tour="sidebar-help"
                      onClick={() => {
                        onOpenHelp();
                        setMobileOpen(false);
                      }}
                      className={cn(
                        'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer z-10 focus-visible:ring-2 focus-visible:ring-white text-white/80 hover:text-white hover:bg-white/10',
                        isCollapsed && !mobileOpen ? 'justify-center px-0' : ''
                      )}
                    >
                      <HelpCircle size={17} strokeWidth={1.8} className="shrink-0 text-white/80" />
                      {(!isCollapsed || mobileOpen) && (
                        <span className="truncate">Bantuan & Tur</span>
                      )}
                    </button>
                    {isCollapsed && !mobileOpen && (
                      <div className="hidden lg:group-hover:block absolute left-full ml-2.5 top-1/2 -translate-y-1/2 bg-surface text-ink text-xs font-bold px-3 py-1.5 rounded-[12px] border border-ink/20 shadow-md whitespace-nowrap z-50 pointer-events-none">
                        Bantuan & Tur
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Section: User Profile & Collapse Toggle */}
        <div className="p-3 border-t border-white/10 space-y-2 shrink-0">
          {/* User badge */}
          <div
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 bg-white/5 rounded-[18px]',
              isCollapsed && !mobileOpen && 'justify-center px-0'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-surface text-ink flex items-center justify-center font-bold text-xs shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate capitalize">
                  {user.username}
                </p>
                <p className="text-[11px] text-white/60 font-medium truncate flex items-center gap-1">
                  <ShieldCheck size={11} /> {user.role}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 px-2 rounded-full text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isCollapsed ? 'Perlebar Sidebar' : 'Lipat Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={15} />
            ) : (
              <>
                <ChevronLeft size={15} />
                <span className="text-[11px]">Lipat Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
