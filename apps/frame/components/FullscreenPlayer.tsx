import { useTranslations } from 'next-intl';
import { useScrollLock } from '../utils/useScrollLock';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import { MediaItem, FrameSettings } from '../types';

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

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(startPaused ? false : settings.autoPlay);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const slideIntervalRef = useRef<number | null>(null);

  // Lock body scroll when player is open
  useScrollLock();

  const updateUrl = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    updateUrl({
      index: currentIndex > 0 ? currentIndex.toString() : null,
      paused: !isPlaying ? 'true' : null
    });
  }, [currentIndex, isPlaying, updateUrl]);

  const currentMedia = media[currentIndex] || media[0];

  const goToNext = useCallback(() => {
    if (media.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % media.length);
    setProgress(0);
  }, [media.length]);

  const goToPrev = useCallback(() => {
    if (media.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    setProgress(0);
  }, [media.length]);

  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.warn('Fullscreen not available:', error);
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onExit();
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
    if (isPlaying && currentMedia?.type === 'image') {
      slideIntervalRef.current = window.setInterval(goToNext, settings.slideInterval);
    } else {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    }

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [isPlaying, currentMedia?.type, settings.slideInterval, goToNext]);

  useEffect(() => {
    if (currentMedia?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.warn('Auto-play blocked or failed:', err);
        });
      } else {
        videoRef.current.pause();
      }
    }
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
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
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

  return (
    <div
      className="fixed inset-0 bg-black z-[100] overflow-hidden cursor-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
      onClick={handleContainerClick}
    >
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMedia.url}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
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
                autoPlay={isPlaying}
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
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); setProgress(0); }}
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
