import { useState, useCallback } from 'react';

export interface UseSwipeNavigationOptions {
  onNext?: () => void;
  onPrev?: () => void;
  threshold?: number;
}

export function useSwipeNavigation(options: UseSwipeNavigationOptions = {}) {
  const { onNext, onPrev, threshold = 80 } = options;
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onDragEnd = useCallback(
    (_event: any, info: any) => {
      setIsDragging(false);
      if (info.offset.y < -threshold) {
        onNext?.();
      } else if (info.offset.y > threshold) {
        onPrev?.();
      }
    },
    [onNext, onPrev, threshold]
  );

  return {
    isDragging,
    onDragStart,
    onDragEnd,
    dragProps: {
      drag: 'y' as const,
      dragConstraints: { top: 0, bottom: 0 },
      dragElastic: 0.1,
      onDragStart,
      onDragEnd,
    },
  };
}
