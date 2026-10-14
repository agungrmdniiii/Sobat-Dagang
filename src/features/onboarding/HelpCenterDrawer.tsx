import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  X, 
  Search, 
  PlayCircle, 
  CheckSquare, 
  Sparkles, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Phone, 
  Clock, 
  Mail, 
  ShoppingCart, 
  PauseCircle, 
  History, 
  Package, 
  Users, 
  BarChart3, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { User, Role } from '../../types';
import { HELP_GUIDES, KEYBOARD_SHORTCUTS, FAQ_ITEMS, ADMIN_CONTACT_INFO } from './helpContent';
import { Button } from '../../components/ui';

export interface HelpCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onStartTour: () => void;
  onReopenChecklist: () => void;
  onOpenWelcome?: () => void;
  onResetAllOnboarding?: () => void;
  onResetTutorial?: () => void;
  isPracticeMode?: boolean;
  onTogglePracticeMode?: () => void;
  onNavigateView?: (view: any) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart,
  PauseCircle,
  History,
  Package,
  Users,
  BarChart3,
  FileText,
};

export const HelpCenterDrawer: React.FC<HelpCenterDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onStartTour,
  onReopenChecklist,
  onOpenWelcome,
  onResetAllOnboarding,
  onResetTutorial,
  isPracticeMode = false,
  onTogglePracticeMode,
  onNavigateView,
}) => {
  const handleReset = onResetAllOnboarding || onResetTutorial || (() => {});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'guides' | 'shortcuts' | 'faq' | 'contact'>('guides');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Filter guides by user role and search query
  const filteredGuides = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return HELP_GUIDES.filter((guide) => {
      const matchRole = guide.roles.includes(user.role);
      if (!matchRole) return false;
      if (!query) return true;
      const matchTitle = guide.title.toLowerCase().includes(query);
      const matchSummary = guide.summary.toLowerCase().includes(query);
      const matchTags = guide.tags.some((t) => t.toLowerCase().includes(query));
      const matchSteps = guide.steps.some((s) => s.text.toLowerCase().includes(query));
      return matchTitle || matchSummary || matchTags || matchSteps;
    });
  }, [user.role, searchQuery]);

  // Filter FAQs by user role and search
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return FAQ_ITEMS.filter((faq) => {
      const matchRole = faq.roles.includes(user.role);
      if (!matchRole) return false;
      if (!query) return true;
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    });
  }, [user.role, searchQuery]);

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return KEYBOARD_SHORTCUTS.filter((sc) => {
      const matchRole = sc.roles.includes(user.role);
      if (!matchRole) return false;
      if (!query) return true;
      return (
        sc.label.toLowerCase().includes(query) ||
        sc.description.toLowerCase().includes(query) ||
        sc.keyCombo.join(' ').toLowerCase().includes(query)
      );
    });
  }, [user.role, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/50 backdrop-blur-xs cursor-pointer"
        />

        {/* Drawer Panel */}
        <motion.aside
          role="dialog"
          aria-label="Pusat Bantuan & Tutorial"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg bg-bg h-full shadow-2xl flex flex-col z-10 border-l border-ink/20 select-none overflow-hidden"
        >
          {/* Topbar Header */}
          <div className="p-4 sm:p-5 border-b border-ink/10 flex items-center justify-between bg-bg shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xs shrink-0">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink leading-tight">Pusat Bantuan</h3>
                <p className="text-xs text-muted">Panduan resmi & edukasi SobatDagang</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-ink/15 flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              title="Tutup Bantuan (Esc)"
              aria-label="Tutup Bantuan"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Search */}
          <div className="p-4 sm:px-5 pb-3 border-b border-ink/10 bg-surface/50 shrink-0">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari panduan, cara jual, pintasan keyboard..."
                className="w-full bg-surface border border-ink/15 rounded-full pl-10 pr-9 py-2 text-xs font-medium text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 w-5 h-5 rounded-full flex items-center justify-center text-muted hover:text-ink"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sub-Tabs */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
              {[
                { id: 'guides' as const, label: 'Panduan Langkah', count: filteredGuides.length },
                { id: 'shortcuts' as const, label: 'Pintasan Keyboard', count: filteredShortcuts.length },
                { id: 'faq' as const, label: 'FAQ', count: filteredFaqs.length },
                { id: 'contact' as const, label: 'Kontak Admin' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-ink text-white'
                      : 'bg-surface text-muted hover:text-ink border border-ink/10'
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span className="ml-1 opacity-70 text-[10px]">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            
            {/* 1. Quick Launchers Section (Always visible at top when not searching or in 'guides' tab) */}
            {activeTab === 'guides' && !searchQuery && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Mulai Cepat & Tur
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Ulangi Tur */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartTour();
                    }}
                    className="p-3 bg-surface hover:bg-surface/80 rounded-[18px] border border-ink/15 text-left transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-pink text-ink flex items-center justify-center shrink-0">
                      <Compass size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink group-hover:underline">Tur Interaktif</p>
                      <p className="text-[11px] text-muted">Jalankan tur pemandu fitur</p>
                    </div>
                  </button>

                  {/* Buka Checklist */}
                  <button
                    type="button"
                    onClick={() => {
                      onReopenChecklist();
                      onClose();
                    }}
                    className="p-3 bg-surface hover:bg-surface/80 rounded-[18px] border border-ink/15 text-left transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue text-ink flex items-center justify-center shrink-0">
                      <CheckSquare size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink group-hover:underline">Checklist Tugas</p>
                      <p className="text-[11px] text-muted">Tampilkan widget target awal</p>
                    </div>
                  </button>

                  {/* Buka Sambutan */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenWelcome) onOpenWelcome();
                    }}
                    className="p-3 bg-surface hover:bg-surface/80 rounded-[18px] border border-ink/15 text-left transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow text-ink flex items-center justify-center shrink-0">
                      <Sparkles size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink group-hover:underline">Kartu Sambutan</p>
                      <p className="text-[11px] text-muted">Buka ringkasan 3 poin peran</p>
                    </div>
                  </button>

                  {/* Mode Latihan Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onTogglePracticeMode) onTogglePracticeMode();
                    }}
                    className={`p-3 rounded-[18px] border text-left transition-all cursor-pointer flex items-center gap-3 group ${
                      isPracticeMode
                        ? 'bg-yellow/40 border-yellow/60'
                        : 'bg-surface hover:bg-surface/80 border-ink/15'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow text-ink flex items-center justify-center shrink-0">
                      <PlayCircle size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">
                        {isPracticeMode ? 'Keluar Mode Latihan' : 'Coba Mode Latihan'}
                      </p>
                      <p className="text-[11px] text-muted">Uji fitur tanpa ubah data asli</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: PANDUAN LANGKAH DEMI LANGKAH */}
            {activeTab === 'guides' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Panduan Peran ({user.role})
                  </span>
                  <span className="text-[11px] text-muted">
                    {filteredGuides.length} panduan tersedia
                  </span>
                </div>

                {filteredGuides.length === 0 ? (
                  <div className="py-8 text-center bg-surface rounded-[20px] border border-ink/10 p-4">
                    <AlertCircle size={28} className="mx-auto text-muted mb-2 opacity-50" />
                    <p className="text-xs font-bold text-ink">Tidak ada panduan yang cocok</p>
                    <p className="text-[11px] text-muted mt-1">Coba gunakan kata kunci lain seperti "jual", "stok", atau "kasir".</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredGuides.map((guide) => {
                      const isExpanded = expandedGuideId === guide.id;
                      const IconComponent = ICON_MAP[guide.iconName] || FileText;

                      return (
                        <div
                          key={guide.id}
                          className="bg-surface rounded-[20px] border border-ink/15 overflow-hidden transition-all"
                        >
                          {/* Accordion Trigger */}
                          <button
                            type="button"
                            onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                            className="w-full p-3.5 text-left flex items-start justify-between gap-3 cursor-pointer hover:bg-surface/70 transition-colors"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-[12px] bg-bg border border-ink/10 flex items-center justify-center text-ink shrink-0 mt-0.5">
                                <IconComponent size={15} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-bg px-2 py-0.5 rounded-full border border-ink/10">
                                  {guide.category}
                                </span>
                                <h4 className="text-xs sm:text-[13px] font-bold text-ink mt-1">
                                  {guide.title}
                                </h4>
                                <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                                  {guide.summary}
                                </p>
                              </div>
                            </div>

                            <div className="text-muted mt-1 shrink-0">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {/* Accordion Content with Animated Steps */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="px-4 pb-4 pt-2 border-t border-ink/10 bg-bg/40 space-y-2.5"
                              >
                                <p className="text-xs text-muted">{guide.summary}</p>
                                
                                <div className="space-y-2 pt-1">
                                  {guide.steps.map((st) => (
                                    <div key={st.number} className="flex items-start gap-2.5 text-xs">
                                      <span className="w-5 h-5 rounded-full bg-ink text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                        {st.number}
                                      </span>
                                      <p className="text-ink leading-relaxed font-medium">
                                        {st.text}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PINTASAN KEYBOARD */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Daftar Pintasan Cepat
                  </span>
                  <span className="text-[11px] text-muted">
                    Operasi kasir tanpa mouse
                  </span>
                </div>

                <div className="bg-surface rounded-[22px] border border-ink/15 overflow-hidden divide-y divide-ink/10">
                  {filteredShortcuts.map((sc, idx) => (
                    <div
                      key={idx}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-ink">{sc.label}</p>
                        <p className="text-[11px] text-muted mt-0.5">{sc.description}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keyCombo.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 bg-bg border border-ink/20 rounded-md font-mono text-[11px] font-bold text-ink shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: FAQ */}
            {activeTab === 'faq' && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Pertanyaan Sering Diajukan
                </span>

                <div className="space-y-2.5">
                  {filteredFaqs.map((faq) => {
                    const isFaqExpanded = expandedFaqId === faq.id;

                    return (
                      <div
                        key={faq.id}
                        className="bg-surface rounded-[20px] border border-ink/15 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isFaqExpanded ? null : faq.id)}
                          className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-surface/70"
                        >
                          <span className="text-xs sm:text-[13px] font-bold text-ink">
                            {faq.question}
                          </span>
                          <span className="text-muted shrink-0">
                            {isFaqExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </span>
                        </button>

                        <AnimatePresence>
                          {isFaqExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-3.5 pb-3.5 pt-1 border-t border-ink/10 text-xs text-muted leading-relaxed"
                            >
                              {faq.answer}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: HUBUNGI ADMIN */}
            {activeTab === 'contact' && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Kontak Bantuan & Administrator
                </span>

                <div className="bg-surface rounded-[22px] border border-ink/15 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {ADMIN_CONTACT_INFO.storeName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{ADMIN_CONTACT_INFO.storeName}</h4>
                      <p className="text-xs text-muted">{ADMIN_CONTACT_INFO.supportOfficer}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-ink/10 text-xs">
                    <div className="flex items-center gap-2 text-ink">
                      <Phone size={14} className="text-muted shrink-0" />
                      <span className="font-semibold">{ADMIN_CONTACT_INFO.whatsappNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink">
                      <Mail size={14} className="text-muted shrink-0" />
                      <span>{ADMIN_CONTACT_INFO.helpEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <Clock size={14} className="shrink-0" />
                      <span>Jam Layanan: {ADMIN_CONTACT_INFO.operatingHours}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted pt-2 border-t border-ink/10 leading-normal">
                    Hubungi administrator toko jika Anda mengalami kendala otorisasi, perubahan shift, atau membutuhkan persetujuan hapus rekaman.
                  </p>
                </div>
              </div>
            )}

            {/* Reset Onboarding / Ulangi Semua Tutorial */}
            <div className="p-4 bg-surface rounded-[22px] border border-ink/15 space-y-2">
              <div className="flex items-center gap-2">
                <RotateCcw size={15} className="text-ink" />
                <h5 className="text-xs font-bold text-ink">Ulangi Semua Tutorial</h5>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Ingin mempelajari kembali panduan dari awal? Tombol ini akan mengembalikan sambutan, tur fitur, dan checklist tugas awal ke status baru.
              </p>
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="rounded-full text-xs font-semibold py-1.5 px-3 border-ink/20 hover:border-ink"
                >
                  Ulangi Semua Tutorial
                </Button>
              </div>
            </div>

          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
