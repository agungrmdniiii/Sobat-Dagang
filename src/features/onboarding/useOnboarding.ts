import { useState, useEffect, useCallback, useMemo } from 'react';
import { OnboardingState } from './types';
import { User, Role } from '../../types';
import { KASIR_TOUR_STEPS, ADMIN_TOUR_STEPS } from './tours';
import { OnboardingEventType } from './events';
import { ONBOARDING_CHECKLIST_ITEMS } from './helpContent';

const DEFAULT_STATE: OnboardingState = {
  hasSeenWelcome: false,
  welcomeDismissedForever: false,
  tourCompleted: false,
  tourStep: 0,
  checklistCompleted: [],
  checklistDismissed: false,
  coachmarksSeen: [],
};

export function useOnboarding(user: User | null) {
  const storageKey = useMemo(() => {
    return user ? `sd_onboarding_${user.id || user.username}` : null;
  }, [user]);

  // Read initial state safely
  const [state, setState] = useState<OnboardingState>(() => {
    if (!storageKey || typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...DEFAULT_STATE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse onboarding state from localStorage', e);
    }
    return DEFAULT_STATE;
  });

  // Re-read if user changes
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setState({ ...DEFAULT_STATE, ...JSON.parse(stored) });
      } else {
        setState(DEFAULT_STATE);
      }
    } catch (e) {
      console.warn('Failed to parse onboarding state on user change', e);
      setState(DEFAULT_STATE);
    }
  }, [storageKey]);

  // Helper to persist state updates
  const updateState = useCallback((updater: (prev: OnboardingState) => OnboardingState) => {
    setState((prev) => {
      const next = updater(prev);
      if (storageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to save onboarding state', e);
        }
      }
      return next;
    });
  }, [storageKey]);

  // Transient UI states
  const [isTourActive, setIsTourActive] = useState(false);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Auto-trigger welcome modal on first login if not seen and not dismissed forever
  useEffect(() => {
    if (!user) return;
    if (!state.hasSeenWelcome && !state.welcomeDismissedForever) {
      const timer = setTimeout(() => {
        setIsWelcomeModalOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [user, state.hasSeenWelcome, state.welcomeDismissedForever]);

  // Tour steps according to user role
  const tourSteps = useMemo(() => {
    if (!user) return [];
    return user.role === Role.ADMIN ? ADMIN_TOUR_STEPS : KASIR_TOUR_STEPS;
  }, [user]);

  // Action methods
  const openWelcomeModal = useCallback(() => {
    setIsWelcomeModalOpen(true);
  }, []);

  const closeWelcomeModal = useCallback((dismissForever: boolean = false) => {
    setIsWelcomeModalOpen(false);
    updateState((prev) => ({
      ...prev,
      hasSeenWelcome: true,
      welcomeDismissedForever: dismissForever ? true : prev.welcomeDismissedForever,
    }));
  }, [updateState]);

  const startTour = useCallback((fromBeginning: boolean = true) => {
    setIsWelcomeModalOpen(false);
    updateState((prev) => ({
      ...prev,
      hasSeenWelcome: true,
      tourStep: fromBeginning ? 0 : prev.tourStep,
    }));
    setIsTourActive(true);
  }, [updateState]);

  const closeTour = useCallback(() => {
    setIsTourActive(false);
  }, []);

  const completeTour = useCallback(() => {
    setIsTourActive(false);
    updateState((prev) => ({
      ...prev,
      tourCompleted: true,
      tourStep: 0,
    }));
  }, [updateState]);

  const setTourStep = useCallback((step: number) => {
    updateState((prev) => ({
      ...prev,
      tourStep: step,
    }));
  }, [updateState]);

  const markChecklistTask = useCallback((taskId: string) => {
    updateState((prev) => {
      if (prev.checklistCompleted.includes(taskId)) return prev;
      return {
        ...prev,
        checklistCompleted: [...prev.checklistCompleted, taskId],
      };
    });
  }, [updateState]);

  const dismissChecklist = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      checklistDismissed: true,
    }));
  }, [updateState]);

  const restoreChecklist = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      checklistDismissed: false,
    }));
  }, [updateState]);

  const markCoachmarkSeen = useCallback((coachmarkId: string) => {
    updateState((prev) => {
      if (prev.coachmarksSeen.includes(coachmarkId)) return prev;
      return {
        ...prev,
        coachmarksSeen: [...prev.coachmarksSeen, coachmarkId],
      };
    });
  }, [updateState]);

  const resetAllOnboarding = useCallback(() => {
    const fresh = { ...DEFAULT_STATE };
    setState(fresh);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(fresh));
      } catch (e) {
        console.warn('Failed to clear onboarding state', e);
      }
    }
    setIsTourActive(false);
    setIsWelcomeModalOpen(true);
    setIsPracticeMode(false);
  }, [storageKey]);

  // Listen to onboarding events dispatched from various interactions
  useEffect(() => {
    if (!user) return;
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: OnboardingEventType; detail?: any }>;
      const { type } = customEvent.detail || {};
      if (!type) return;

      if (user.role === Role.KASIR) {
        if (type === 'search_product') markChecklistTask('kasir_search');
        if (type === 'add_to_cart') markChecklistTask('kasir_add_cart');
        if (type === 'transaction_completed') markChecklistTask('kasir_complete_tx');
        if (type === 'view_receipt') markChecklistTask('kasir_view_receipt');
      } else if (user.role === Role.ADMIN) {
        if (type === 'add_product') markChecklistTask('admin_add_product');
        if (type === 'set_min_stock') markChecklistTask('admin_set_min_stock');
        if (type === 'create_user') markChecklistTask('admin_create_user');
        if (type === 'transaction_completed') markChecklistTask('admin_test_tx');
        if (type === 'view_reports') markChecklistTask('admin_view_reports');
      }
    };

    window.addEventListener('sd-onboarding-event', handleEvent);
    return () => {
      window.removeEventListener('sd-onboarding-event', handleEvent);
    };
  }, [user, markChecklistTask]);

  const checklistItems = useMemo(() => {
    if (!user) return [];
    return ONBOARDING_CHECKLIST_ITEMS.filter((item) => item.roles.includes(user.role));
  }, [user]);

  const dismissWelcomeForever = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      hasSeenWelcome: true,
      welcomeDismissedForever: true,
    }));
    setIsWelcomeModalOpen(false);
  }, [updateState]);

  return {
    state,
    isTourActive,
    tourSteps,
    currentTourStepIndex: state.tourStep,
    currentStepIndex: state.tourStep,
    isHelpDrawerOpen,
    isWelcomeModalOpen,
    isWelcomeOpen: isWelcomeModalOpen,
    isPracticeMode,
    checklistItems,
    setIsHelpDrawerOpen,
    setIsPracticeMode,
    openWelcomeModal,
    closeWelcomeModal,
    dismissWelcome: closeWelcomeModal,
    dismissWelcomeForever,
    startTour,
    closeTour,
    dismissTour: closeTour,
    completeTour,
    setTourStep,
    markChecklistTask,
    dismissChecklist,
    restoreChecklist,
    markCoachmarkSeen,
    resetAllOnboarding,
  };
}
