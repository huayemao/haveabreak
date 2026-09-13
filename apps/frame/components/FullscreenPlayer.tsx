'use client';

import { useTranslations } from 'next-intl';
import { useScrollLock } from '../utils/useScrollLock';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MediaItem, FrameSettings } from '../types';
import { getCurrentWindow } from '@tauri-apps/api/window';
import PlayerViewport from './player/PlayerViewport';
import PlayerControls from './player/PlayerControls';

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
  }, [goToNext, goToPrev, togglePlayPause, onExit]);

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

  return (
    <div
      className="fixed inset-0 bg-black z-[100] overflow-hidden select-none touch-none"
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
        onContainerClick={() => setShowControls((prev) => !prev)}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => setIsPlaying(true)}
        onPause={handleVideoPause}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />

      {/* Control Overlay: Top Bar, Video Scrubber, Playback Buttons, Pagination Dots */}
      <PlayerControls
        showControls={showControls}
        media={media}
        currentMedia={currentMedia}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        scrubPercent={scrubPercent}
        progressBarRef={progressBarRef}
        onExit={onExit}
        onTogglePlayPause={togglePlayPause}
        onPrev={() => goToPrev('slide')}
        onNext={() => goToNext('slide')}
        onSelectIndex={handleSelectIndex}
        onProgressBarPointerDown={handleProgressBarPointerDown}
        onProgressBarPointerMove={handleProgressBarPointerMove}
        onProgressBarPointerUp={handleProgressBarPointerUp}
      />
    </div>
  );
}
