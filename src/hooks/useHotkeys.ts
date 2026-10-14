import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface HotkeyOptions {
  preventDefault?: boolean;
  enableOnFormTags?: boolean;
}

/**
 * Hook to bind keyboard shortcuts like 'ctrl+k', 'meta+k', '/', 'escape'
 */
export function useHotkeys(
  keyCombo: string,
  callback: KeyHandler,
  options: HotkeyOptions = {}
) {
  const { preventDefault = true, enableOnFormTags = false } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isFormTag =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // If key is triggered inside input and enableOnFormTags is false, skip (unless keyCombo is Escape)
      if (isFormTag && !enableOnFormTags && keyCombo.toLowerCase() !== 'escape') {
        return;
      }

      const comboParts = keyCombo.toLowerCase().split('+').map((s) => s.trim());
      const needsCtrl = comboParts.includes('ctrl') || comboParts.includes('meta');
      const needsShift = comboParts.includes('shift');
      const needsAlt = comboParts.includes('alt');
      const mainKey = comboParts.filter(
        (part) => !['ctrl', 'meta', 'shift', 'alt', 'cmd'].includes(part)
      )[0];

      const hasCtrl = event.ctrlKey || event.metaKey;
      const hasShift = event.shiftKey;
      const hasAlt = event.altKey;

      const mainKeyMatches =
        mainKey &&
        (event.key.toLowerCase() === mainKey.toLowerCase() ||
          event.code.toLowerCase() === mainKey.toLowerCase());

      if (
        (needsCtrl ? hasCtrl : !hasCtrl) &&
        (needsShift ? hasShift : !hasShift) &&
        (needsAlt ? hasAlt : !hasAlt) &&
        mainKeyMatches
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyCombo, callback, preventDefault, enableOnFormTags]);
}
