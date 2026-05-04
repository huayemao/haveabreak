"use client";
import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a component is mounted.
 * Useful for modals, dialogs, and fullscreen players.
 */
export function useScrollLock(lock: boolean = true) {
  useEffect(() => {
    if (!lock) return;

    // Save original overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Restore on unmount
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [lock]);
}
