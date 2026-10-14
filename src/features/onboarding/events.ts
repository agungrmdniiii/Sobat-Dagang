export type OnboardingEventType = 
  | 'search_product'
  | 'add_to_cart'
  | 'transaction_completed'
  | 'view_receipt'
  | 'add_product'
  | 'set_min_stock'
  | 'create_user'
  | 'view_reports';

export function trackOnboardingEvent(type: OnboardingEventType, detail?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sd-onboarding-event', { detail: { type, detail } }));
  }
}
