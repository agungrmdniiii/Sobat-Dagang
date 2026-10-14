import { Role } from '../../types';

export interface OnboardingState {
  hasSeenWelcome: boolean;
  welcomeDismissedForever: boolean;
  tourCompleted: boolean;
  tourStep: number;
  checklistCompleted: string[];
  checklistDismissed: boolean;
  coachmarksSeen: string[];
}

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  id: string;
  targetId: string; // matches data-tour="id"
  title: string;
  description: string;
  placement?: TourPlacement;
  targetView?: 'dashboard' | 'pos' | 'inventory' | 'reports' | 'my-history' | 'users';
  actionHint?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  roles: Role[];
  targetView?: 'dashboard' | 'pos' | 'inventory' | 'reports' | 'my-history' | 'users';
}

export interface StepGuide {
  number: number;
  text: string;
}

export interface HelpGuide {
  id: string;
  title: string;
  category: string;
  iconName: string;
  summary: string;
  steps: StepGuide[];
  roles: Role[];
  tags: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  roles: Role[];
}

export interface KeyboardShortcut {
  keyCombo: string[];
  label: string;
  description: string;
  roles: Role[];
}
