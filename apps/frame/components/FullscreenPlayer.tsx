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

export default function FullscreenPlayer({
  media,
  settings,
  onExit,
  onDelete,
  startPaused = false,
  startIndex = 0,
}: FullscreenPlayerProps) {
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
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPercent, setScrubPercent] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingRef = useRef(false);
  const controlsTimeoutRef = useRef<number | null>(null);
  const lastManualSwitchRef = useRef<number>(0);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSwitchTimeRef = useRef<number>(0);

  // Lock body scroll when player is open
  useScrollLock();

  // Sync index to URL without triggering heavy layout re-renders
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    const targetIndex = currentIndex > 0 ? currentIndex.toString() : null;

    if (newParams.get('index') !== targetIndex) {
      if (targetIndex === null) newParams.delete('index');
      else newParams.set('index', targetIndex);
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  }, [currentIndex, pathname, router, searchParams]);

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
    setCurrentTime(0);
    setDuration(0);
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
    setCurrentTime(0);
    setDuration(0);
    lastManualSwitchRef.current = Date.now();
  }, [media.length, settings.shuffle, shuffledOrder, shuffledIndex]);

  // Robust play/pause toggle directly bound to user gesture
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (currentMedia?.type === 'video' && video) {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.warn('Video play blocked or failed:', err);
              setIsPlaying(false);
            });
        }
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentMedia?.type]);

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

  // Fullscreen support
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.setFullscreen(true);
      } catch (tauriError) {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (webError) {
          console.warn('Fullscreen entry failed:', webError);
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

  // Controls auto-hide
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (showControls) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        if (!isScrubbingRef.current) {
          setShowControls(false);
        }
      }, 3500);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isScrubbing]);

  // Slideshow auto-advance for images
  useEffect(() => {
    if (!isPlaying || !currentMedia || currentMedia.type !== 'image') {
      return;
    }

    const timer = setTimeout(() => {
      goToNext();
    }, settings.slideInterval);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, settings.slideInterval, goToNext, currentMedia]);

  // Handle video element play state when current media or isPlaying changes
  useEffect(() => {
    const video = videoRef.current;
    if (currentMedia?.type === 'video' && video) {
      video.volume = settings.volume ?? 0.3;
      if (isPlaying) {
        video.play().catch((err) => {
          console.warn('Video play prevented:', err);
        });
      } else {
        video.pause();
      }
    }
  }, [isPlaying, currentMedia?.url, settings.volume]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPrev();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, togglePlayPause, onExit]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.player-controls')) return;
    setShowControls((prev) => !prev);
  };

  // Video progress bar scrubbing logic
  const calculateProgressFromPointer = (clientX: number) => {
    const bar = progressBarRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const clickX = clientX - rect.left;
    return Math.max(0, Math.min(1, clickX / rect.width));
  };

  const handleProgressBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video || !video.duration) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isScrubbingRef.current = true;
    setIsScrubbing(true);

    const ratio = calculateProgressFromPointer(e.clientX);
    const targetTime = ratio * video.duration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    setProgress(ratio * 100);
    setScrubPercent(ratio * 100);
  };

  const handleProgressBarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const ratio = calculateProgressFromPointer(e.clientX);
    const targetTime = ratio * video.duration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    setProgress(ratio * 100);
    setScrubPercent(ratio * 100);
  };

  const handleProgressBarPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setScrubPercent(null);

    const video = videoRef.current;
    if (video && isPlaying && video.paused) {
      video.play().catch((err) => console.warn('Resume play after scrub failed:', err));
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const activePercent = scrubPercent !== null ? scrubPercent : progress;

  return (
    <div
      className="fixed inset-0 bg-black z-[100] overflow-hidden select-none touch-none"
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
            transition={
              settings.swipeSwitching
                ? { duration: 0.45, ease: [0.25, 1, 0.5, 1] }
                : { duration: 0.5, ease: 'easeInOut' }
            }
            className="w-full h-full"
          >
            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={currentMedia.title || ''}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            ) : (
              <video
                key={currentMedia.url}
                ref={(el) => {
                  videoRef.current = el;
                }}
                src={currentMedia.url}
                className="w-full h-full object-cover"
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => {
                  if (!isScrubbingRef.current) {
                    setIsPlaying(false);
                  }
                }}
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  setDuration(vid.duration || 0);
                  vid.volume = settings.volume ?? 0.3;
                  if (isPlaying) {
                    vid.play().catch((err) => console.warn('Autoplay on metadata failed:', err));
                  }
                }}
                onTimeUpdate={(e) => {
                  if (isScrubbingRef.current) return;
                  const vid = e.currentTarget;
                  setCurrentTime(vid.currentTime);
                  if (vid.duration) {
                    setProgress((vid.currentTime / vid.duration) * 100);
                  }
                }}
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
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-8 flex justify-between items-start pointer-events-auto">
              <div className="text-white">
                <h3 className="text-xl font-medium drop-shadow-md">{currentMedia.title || ''}</h3>
                <p className="text-sm text-white/60">
                  {currentIndex + 1} / {media.length}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExit();
                }}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all group"
                title={t('frame.exitFullscreen')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 sm:p-8 flex flex-col items-center justify-end pointer-events-auto">
              {/* Progress Bar for Video with Drag Scrubbing */}
              {currentMedia.type === 'video' && (
                <div className="w-full max-w-4xl mb-6 px-4">
                  <div className="flex items-center justify-between text-xs text-white/70 font-mono mb-1.5 px-0.5 select-none">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div
                    ref={progressBarRef}
                    className="h-6 flex items-center cursor-pointer group/progress relative touch-none"
                    onPointerDown={handleProgressBarPointerDown}
                    onPointerMove={handleProgressBarPointerMove}
                    onPointerUp={handleProgressBarPointerUp}
                    onPointerCancel={handleProgressBarPointerUp}
                  >
                    {/* Track Background */}
                    <div className="w-full h-1.5 group-hover/progress:h-2 bg-white/25 rounded-full overflow-hidden transition-all relative">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${activePercent}%` }}
                      />
                    </div>
                    {/* Draggable Scrubber Knob */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none transition-transform group-hover/progress:scale-125"
                      style={{ left: `${activePercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex items-center gap-8">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95"
                  title={t('frame.previous')}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  className="w-20 h-20 rounded-full bg-white text-black hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-xl"
                  title={isPlaying ? t('frame.pause') : t('frame.play')}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95"
                  title={t('frame.next')}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Media Index Indicators */}
              <div className="flex gap-2 mt-6 max-w-xl overflow-hidden py-1">
                {media.slice(0, 30).map((_, index) => (
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
                      setCurrentTime(0);
                      setDuration(0);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'bg-white w-8' : 'bg-white/30 w-1.5 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
