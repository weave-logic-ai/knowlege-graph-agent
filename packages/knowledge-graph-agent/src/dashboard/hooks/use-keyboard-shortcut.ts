/**
 * useKeyboardShortcut Hook
 *
 * Handle keyboard shortcuts with modifier key support.
 */

import { useEffect, useCallback, useRef } from 'react';

export interface ShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcut(
  options: ShortcutOptions | ShortcutOptions[],
  callback: (event: KeyboardEvent) => void
): void {
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const shortcuts = Array.isArray(options) ? options : [options];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

        // Support Cmd on Mac and Ctrl on Windows/Linux
        const cmdOrCtrl = shortcut.ctrlKey || shortcut.metaKey;
        const cmdOrCtrlMatch = cmdOrCtrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;

        const modifiersMatch = cmdOrCtrl
          ? cmdOrCtrlMatch && altMatch && shiftMatch
          : ctrlMatch && metaMatch && altMatch && shiftMatch;

        if (keyMatch && modifiersMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          callbackRef.current(event);
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Common shortcut presets
 */
export const SHORTCUT_PRESETS = {
  SEARCH: { key: 'k', metaKey: true },
  ESCAPE: { key: 'Escape' },
  ENTER: { key: 'Enter' },
  ARROW_UP: { key: 'ArrowUp' },
  ARROW_DOWN: { key: 'ArrowDown' },
  SELECT_ALL: { key: 'a', metaKey: true },
  REFRESH: { key: 'r', metaKey: true },
  SAVE: { key: 's', metaKey: true },
  NEW: { key: 'n', metaKey: true },
  DELETE: { key: 'Backspace', metaKey: true },
} as const;

/**
 * Format shortcut for display
 */
export function formatShortcut(options: ShortcutOptions): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  if (options.metaKey || options.ctrlKey) {
    parts.push(isMac ? '\u2318' : 'Ctrl');
  }
  if (options.altKey) {
    parts.push(isMac ? '\u2325' : 'Alt');
  }
  if (options.shiftKey) {
    parts.push(isMac ? '\u21E7' : 'Shift');
  }

  const keyDisplay = options.key.length === 1
    ? options.key.toUpperCase()
    : options.key;
  parts.push(keyDisplay);

  return parts.join(isMac ? '' : '+');
}
