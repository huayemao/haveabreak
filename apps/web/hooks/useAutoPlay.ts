import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseAutoPlayOptions {
  onNext: () => void;
  interval?: number;
  autoStart?: boolean;
}

export function useAutoPlay({ onNext, interval = 5000, autoStart = false }: UseAutoPlayOptions) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoStart);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const handleNext = useCallback(() => {
    onNextRef.current();
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isAutoPlaying) {
      timeoutId = setInterval(() => {
        handleNext();
      }, interval);
    }

    return () => {
      if (timeoutId) {
        clearInterval(timeoutId);
      }
    };
  }, [isAutoPlaying, handleNext, interval]);

  const toggleAutoPlay = useCallback((fullscreenTarget?: React.RefObject<HTMLDivElement | null>) => {
    setIsAutoPlaying(prev => {
      const next = !prev;
      if (next && fullscreenTarget?.current && !document.fullscreenElement) {
        fullscreenTarget.current.requestFullscreen().catch(() => {});
      }
      return next;
    });
  }, []);

  return {
    isAutoPlaying,
    setIsAutoPlaying,
    toggleAutoPlay,
  };
}