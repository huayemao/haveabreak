'use client';

import { useTranslations } from 'next-intl';
import { useScrollLock } from '../utils/useScrollLock';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MediaItem, FrameSettings } from '../types';
import { getCurrentWindow } from '@tauri-apps/api/window';
import PlayerViewport from './player/PlayerViewport';

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
  const [transitionType, setTransitionType] = useState<'slide' | 'fade'>('fade');
  const [isAutoplayMuted, setIsAutoplayMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingRef = useRef(false);
  const controlsTimeoutRef = useRef<number | null>(null);
  const lastManualSwitchRef = useRef<number>(0);

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

  // Calculate prev and next indices for 3-slot viewport
  const prevIndex = useMemo(() => {
    if (media.length <= 1) return 0;
    if (settings.shuffle) {
      return shuffledOrder[(shuffledIndex - 1 + media.length) % media.length];
    }
    return (currentIndex - 1 + media.length) % media.length;
  }, [media.length, settings.shuffle, shuffledOrder, shuffledIndex, currentIndex]);

  const nextIndex = useMemo(() => {
    if (media.length <= 1) return 0;
    if (settings.shuffle) {
      return shuffledOrder[(shuffledIndex + 1) % media.length];
    }
    return (currentIndex + 1) % media.length;
  }, [media.length, settings.shuffle, shuffledOrder, shuffledIndex, currentIndex]);

  const prevMedia = media.length > 1 ? media[prevIndex] : null;
  const nextMedia = media.length > 1 ? media[nextIndex] : null;

  // Clear video ref when current media is an image
  useEffect(() => {
    if (currentMedia?.type !== 'video') {
      videoRef.current = null;
    }
    setIsAutoplayMuted(false);
  }, [currentMedia?.url, currentMedia?.type]);

  // Attempt to play video with automatic muted fallback for mobile autoplay policy compliance
  const attemptPlayVideo = useCallback(
    async (video: HTMLVideoElement) => {
      if (!video.paused && !video.ended) return;
      try {
        video.volume = settings.volume ?? 0.3;
        video.muted = false;
        await video.play();
        setIsPlaying(true);
        setIsAutoplayMuted(false);
      } catch (err: any) {
        if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
          try {
            video.muted = true;
            await video.play();
            setIsPlaying(true);
            setIsAutoplayMuted(true);
          } catch (mutedErr) {
            console.warn('Muted autoplay failed:', mutedErr);
          }
        }
      }
    },
    [settings.volume]
  );

  const goToNext = useCallback(
    (type: 'slide' | 'fade' = 'fade') => {
      if (media.length === 0) return;
      if (media.length === 1 && currentMedia?.type === 'video' && videoRef.current) {
        videoRef.current.currentTime = 0;
        attemptPlayVideo(videoRef.current);
        return;
      }
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {}
      }
      setDirection('next');
      setTransitionType(type);
      if (settings.shuffle) {
        const nextShuffled = (shuffledIndex + 1) % media.length;
        if (nextShuffled === 0) {
          const newOrder = media.map((_, index) => index);
          for (let i = newOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
          }
          setShuffledOrder(newOrder);
          setCurrentIndex(newOrder[0]);
          setShuffledIndex(0);
        } else {
          setCurrentIndex(shuffledOrder[nextShuffled]);
          setShuffledIndex(nextShuffled);
        }
      } else {
        setCurrentIndex((prev) => (prev + 1) % media.length);
      }
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      lastManualSwitchRef.current = Date.now();
    },
    [media, currentMedia?.type, settings.shuffle, shuffledOrder, shuffledIndex, attemptPlayVideo]
  );

  const goToPrev = useCallback(
    (type: 'slide' | 'fade' = 'fade') => {
      if (media.length === 0) return;
      if (media.length === 1 && currentMedia?.type === 'video' && videoRef.current) {
        videoRef.current.currentTime = 0;
        attemptPlayVideo(videoRef.current);
        return;
      }
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {}
      }
      setDirection('prev');
      setTransitionType(type);
      if (settings.shuffle) {
        const prevShuffled = (shuffledIndex - 1 + media.length) % media.length;
        setShuffledIndex(prevShuffled);
        setCurrentIndex(shuffledOrder[prevShuffled]);
      } else {
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
      }
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      lastManualSwitchRef.current = Date.now();
    },
    [media, currentMedia?.type, settings.shuffle, shuffledOrder, shuffledIndex, attemptPlayVideo]
  );

  // Play/pause toggle
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (currentMedia?.type === 'video' && video) {
      if (isAutoplayMuted) {
        video.muted = false;
        video.volume = settings.volume ?? 0.3;
        setIsAutoplayMuted(false);
      }
      if (video.paused) {
        attemptPlayVideo(video);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentMedia?.type, isAutoplayMuted, attemptPlayVideo, settings.volume]);

  // Fullscreen support
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.setFullscreen(true);
      } catch {
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

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isScrubbingRef.current) {
        setShowControls(false);
      }
    }, 3500);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleContainerClick = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  // Controls auto-hide
  useEffect(() => {
    if (showControls) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isScrubbing, resetControlsTimeout]);

  // Slideshow auto-advance for images
  useEffect(() => {
    if (!isPlaying || !currentMedia || currentMedia.type !== 'image') {
      return;
    }

    const timer = setTimeout(() => {
      goToNext('fade');
    }, settings.slideInterval);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, settings.slideInterval, goToNext, currentMedia]);

  // Handle video element play state when current media or isPlaying changes
  useEffect(() => {
    const video = videoRef.current;
    if (currentMedia?.type === 'video' && video) {
      if (isPlaying) {
        attemptPlayVideo(video);
      } else {
        video.pause();
      }
    }
  }, [isPlaying, currentMedia?.url, attemptPlayVideo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimeout();
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          goToNext('slide');
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPrev('slide');
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
  }, [goToNext, goToPrev, togglePlayPause, onExit, resetControlsTimeout]);

  // Scrubbing logic
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

  const handleVideoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) {
      videoRef.current = el;
    }
  }, []);

  const handleVideoPause = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (videoRef.current && e.currentTarget !== videoRef.current) {
      return;
    }
    if (
      e.currentTarget.ended ||
      (e.currentTarget.duration > 0 && e.currentTarget.currentTime >= e.currentTarget.duration - 0.5)
    ) {
      return;
    }
    if (Date.now() - lastManualSwitchRef.current < 800) {
      return;
    }
    if (isScrubbingRef.current) {
      return;
    }
    setIsPlaying(false);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    setDuration(vid.duration || 0);
    if (isPlaying && vid.paused) {
      attemptPlayVideo(vid);
    }
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (isPlaying && vid.paused) {
      attemptPlayVideo(vid);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isScrubbingRef.current) return;
    const vid = e.currentTarget;
    setCurrentTime(vid.currentTime);
    if (vid.duration) {
      setProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  const handleVideoEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (videoRef.current && e.currentTarget !== videoRef.current) {
      return;
    }
    setIsPlaying(true);
    goToNext('fade');
  };

  const handleSelectIndex = (index: number) => {
    if (settings.shuffle) {
      const targetShuffled = shuffledOrder.indexOf(index);
      if (targetShuffled >= 0) {
        setShuffledIndex(targetShuffled);
      }
    }
    setTransitionType('fade');
    setCurrentIndex(index);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = settings.volume ?? 0.3;
      setIsAutoplayMuted(false);
    }
  };

  if (!currentMedia) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white text-xl">{t('frame.noMedia')}</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activePercent = scrubPercent !== null ? scrubPercent : progress;

  return (
    <div
      className="fixed inset-0 bg-black z-[100] overflow-hidden select-none touch-none"
      onPointerMove={handlePointerMove}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* 3-Slot Viewport: Handles gesture tracking, peek previews above/below, and natural cross-fade */}
      <PlayerViewport
        media={media}
        currentIndex={currentIndex}
        prevIndex={prevIndex}
        nextIndex={nextIndex}
        currentMedia={currentMedia}
        prevMedia={prevMedia}
        nextMedia={nextMedia}
        transitionType={transitionType}
        transitionDuration={settings.transitionDuration || 800}
        swipeEnabled={settings.swipeSwitching}
        isPlaying={isPlaying}
        videoRef={handleVideoCallbackRef}
        isAutoplayMuted={isAutoplayMuted}
        onUnmute={handleUnmute}
        onSlideNext={() => goToNext('slide')}
        onSlidePrev={() => goToPrev('slide')}
        onContainerClick={handleContainerClick}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => setIsPlaying(true)}
        onPause={handleVideoPause}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />

      {/* Tap to Unmute Button for Mobile Autoplay */}
      {isAutoplayMuted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUnmute();
          }}
          className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-40 bg-black/75 hover:bg-black/90 active:scale-95 backdrop-blur-md text-white text-xs sm:text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl border border-white/20 transition-all pointer-events-auto cursor-pointer"
        >
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <span>{t('frame.tapToUnmute') || '点击开启声音'}</span>
        </button>
      )}

      {/* Control Overlay: Top Bar, Video Scrubber, Playback Buttons, Pagination Dots */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="player-controls absolute inset-0 pointer-events-none z-30"
          >
            {/* Top Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-8 flex justify-between items-start pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
            >
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
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all group active:scale-95"
                title={t('frame.exitFullscreen')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bottom Controls */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 sm:p-8 flex flex-col items-center justify-end pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
            >
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
                    goToPrev('slide');
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
                    goToNext('slide');
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
                      handleSelectIndex(index);
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
