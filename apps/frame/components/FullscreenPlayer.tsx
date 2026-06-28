import { useTranslations } from 'next-intl';
import { useScrollLock } from '../utils/useScrollLock';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter, usePathname } from 'i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MediaItem, FrameSettings } from '../types';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface FullscreenPlayerProps {
  media: MediaItem[];
  settings: FrameSettings;
  onExit: () => void;
  onDelete?: (id: string) => void;
  startPaused?: boolean;
  startIndex?: number;
}

export default function FullscreenPlayer({ media, settings, onExit, onDelete, startPaused = false, startIndex = 0 }: FullscreenPlayerProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const shuffleArray = useMemo(() => {
    const array = media.map((_, index) => index);
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    if (startIndex >= 0 && startIndex < media.length) {
      const idx = array.indexOf(startIndex);
      if (idx !== -1) {
        array.splice(idx, 1);
        array.unshift(startIndex);
      }
    }
    return array;
  }, [media, startIndex]);

  const [shuffledOrder, setShuffledOrder] = useState<number[]>(shuffleArray);
  const [shuffledIndex, setShuffledIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(settings.shuffle ? shuffledOrder[0] : startIndex);
  const [isPlaying, setIsPlaying] = useState(startPaused ? false : settings.autoPlay);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const lastManualSwitchRef = useRef<number>(0);
  
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSwitchTimeRef = useRef<number>(0);

  // Lock body scroll when player is open
  useScrollLock();

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    const targetIndex = currentIndex > 0 ? currentIndex.toString() : null;
    const targetPaused = !isPlaying ? 'true' : null;

    let changed = false;
    if (newParams.get('index') !== targetIndex) {
      if (targetIndex === null) newParams.delete('index');
      else newParams.set('index', targetIndex);
      changed = true;
    }
    if (newParams.get('paused') !== targetPaused) {
      if (targetPaused === null) newParams.delete('paused');
      else newParams.set('paused', targetPaused);
      changed = true;
    }

    if (changed) {
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  }, [currentIndex, isPlaying, pathname, router, searchParams]);

  const currentMedia = media[currentIndex] || media[0];

  const goToNext = useCallback(() => {
    if (media.length === 0) return;
    setDirection('next');
    if (settings.shuffle) {
      const nextShuffledIndex = (shuffledIndex + 1) % media.length;
      if (nextShuffledIndex === 0) {
        const newOrder = media.map((_, index) => index);
        for (let i = newOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
        }
        setShuffledOrder(newOrder);
        setCurrentIndex(newOrder[0]);
        setShuffledIndex(0);
      } else {
        setCurrentIndex(shuffledOrder[nextShuffledIndex]);
        setShuffledIndex(nextShuffledIndex);
      }
    } else {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }
    setProgress(0);
    lastManualSwitchRef.current = Date.now();
  }, [media.length, settings.shuffle, shuffledOrder, shuffledIndex]);

  const goToPrev = useCallback(() => {
    if (media.length === 0) return;
    setDirection('prev');
    if (settings.shuffle) {
      const prevShuffledIndex = (shuffledIndex - 1 + media.length) % media.length;
      setShuffledIndex(prevShuffledIndex);
      setCurrentIndex(shuffledOrder[prevShuffledIndex]);
    } else {
      setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    }
    setProgress(0);
    lastManualSwitchRef.current = Date.now();
  }, [media.length, settings.shuffle, shuffledOrder, shuffledIndex]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!settings.swipeSwitching) return;
    if ((e.target as HTMLElement).closest('.player-controls')) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!settings.swipeSwitching || !dragStartRef.current) return;
    const deltaY = e.clientY - dragStartRef.current.y;
    const deltaX = e.clientX - dragStartRef.current.x;
    dragStartRef.current = null;

    const swipeThreshold = 55;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold) {
      const now = Date.now();
      if (now - lastSwitchTimeRef.current < 450) return;
      lastSwitchTimeRef.current = now;

      if (deltaY < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!settings.swipeSwitching) return;
    const now = Date.now();
    if (now - lastSwitchTimeRef.current < 650) return;

    if (Math.abs(e.deltaY) > 30) {
      lastSwitchTimeRef.current = now;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.setFullscreen(true);
      } catch (tauriError) {
        console.warn('Tauri fullscreen failed, falling back to Web API:', tauriError);
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (webError) {
          console.warn('Web fullscreen also failed:', webError);
        }
      }
    };

    enterFullscreen();

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        try {
          const appWindow = getCurrentWindow();
          const isFullscreen = await appWindow.isFullscreen();
          if (!isFullscreen) {
            onExit();
          }
        } catch {
          onExit();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onExit]);

  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (showControls) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  useEffect(() => {
    if (!isPlaying || !currentMedia || currentMedia.type !== 'image') {
      return;
    }

    const timer = setTimeout(() => {
      goToNext();
    }, settings.slideInterval);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, settings.slideInterval, goToNext, currentMedia]);

  useEffect(() => {
    const video = videoRef.current;
    if (currentMedia?.type === 'video' && video) {
      if (isPlaying) {
        video.play().catch(err => {
          console.warn('Auto-play blocked or failed:', err);
        });
      } else {
        video.pause();
      }
    }
    return () => {
      if (video) {
        video.pause();
      }
    };
  }, [isPlaying, currentMedia?.url]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'ArrowUp':
          e.preventDefault();
          goToPrev();
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'Escape':
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onExit]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.player-controls')) return;
    setShowControls((prev) => !prev);
  };

  if (!currentMedia) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white text-xl">{t('frame.noMedia')}</p>
      </div>
    );
  }

  const variants = {
    initial: (dir: 'next' | 'prev') => {
      if (settings.swipeSwitching) {
        return {
          y: dir === 'next' ? '100%' : '-100%',
          opacity: 1,
          scale: 1,
        };
      }
      return { opacity: 0, scale: 1.02, y: 0 };
    },
    animate: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
    exit: (dir: 'next' | 'prev') => {
      if (settings.swipeSwitching) {
        return {
          y: dir === 'next' ? '-100%' : '100%',
          opacity: 1,
          scale: 1,
        };
      }
      return { opacity: 0, scale: 0.98, y: 0 };
    },
  };

  return (
    <div
      className="fixed inset-0 bg-black z-[100] overflow-hidden cursor-none touch-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
      onClick={handleContainerClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <div className="absolute inset-0">
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={currentMedia.url}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={settings.swipeSwitching
              ? { duration: 0.45, ease: [0.25, 1, 0.5, 1] }
              : { duration: 0.5, ease: "easeInOut" }
            }
            className="w-full h-full"
          >
            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={currentMedia.title || ''}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <video
                key={currentMedia.url}
                ref={videoRef}
                src={currentMedia.url}
                className="w-full h-full object-cover"
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={goToNext}
                draggable={false}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="player-controls absolute inset-0 pointer-events-none"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent p-8 flex justify-between items-start pointer-events-auto">
              <div className="text-white">
                <h3 className="text-xl font-medium drop-shadow-md">{currentMedia.title || ''}</h3>
                <p className="text-sm text-white/60">{currentIndex + 1} / {media.length}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onExit(); }}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all group"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent p-8 flex flex-col items-center justify-end pointer-events-auto">
              {/* Progress Bar for Video */}
              {currentMedia.type === 'video' && (
                <div className="w-full max-w-4xl mb-8 px-4">
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden group/progress cursor-pointer relative">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-white"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex items-center gap-8">
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                  className="w-20 h-20 rounded-full bg-white text-black hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-xl"
                >
                  {isPlaying ? (
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Indicators */}
              <div className="flex gap-2.5 mt-8">
                {media.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (settings.shuffle) {
                        const targetShuffledIndex = shuffledOrder.indexOf(index);
                        if (targetShuffledIndex >= 0) {
                          setShuffledIndex(targetShuffledIndex);
                        }
                      }
                      setCurrentIndex(index);
                      setProgress(0);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-500 ${index === currentIndex ? 'bg-white w-8' : 'bg-white/30 w-1.5'
                      }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} loop />
    </div>
  );
}
