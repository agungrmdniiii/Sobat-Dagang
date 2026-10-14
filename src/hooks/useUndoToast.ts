import { useState, useCallback } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useUndoToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'success',
      action?: { label: string; onClick: () => void },
      duration: number = 4000
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = {
        id,
        message,
        type,
        action,
        duration,
      };

      // Tumpuk rapi maksimal 3 toast
      setToasts((prev) => [...prev.slice(-2), newToast]);
      return id;
    },
    []
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };
}
