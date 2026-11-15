'use client';

import { useTranslations } from 'next-intl';
import { useScrollLock } from '../utils/useScrollLock';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Layers, MoreHorizontal, FolderPlus, Check } from 'lucide-react';
import { Collection, MediaItem, FrameSettings } from '../types';
import { useFrameStore } from '../store';
import { downloadMediaFile } from '../storage';
import { getCurrentWindow } from '@tauri-apps/api/window';
import PlayerViewport from './player/PlayerViewport';
import PlayerMediaMenu, { PlayerMenuView } from './player/PlayerMediaMenu';

interface FullscreenPlayerProps {
  media: MediaItem[];
  settings: FrameSettings;
  onExit: () => void;
  onDelete?: (id: string) => void;
  startPaused?: boolean;
  startIndex?: number;
}

export default function FullscreenPlayer({
  media: initialPropMedia,
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

  const storeMedia = useFrameStore((s) => s.media);
  const collections = useFrameStore((s) => s.collections);
  const updateMedia = useFrameStore((s) => s.updateMedia);
  const storeDeleteMedia = useFrameStore((s) => s.deleteMedia);
  const toggleMediaInCollection = useFrameStore((s) => s.toggleMediaInCollection);
  const createCollection = useFrameStore((s) => s.createCollection);
  const updateCollection = useFrameStore((s) => s.updateCollection);

  const activeCollectionId = searchParams.get('collection');

  // Keep a stable session queue of media IDs so adding an uncollected item to a collection
  // during fullscreen playback does not abruptly eject the current slide from under the user.
  const [sessionMediaIds, setSessionMediaIds] = useState<string[]>(() =>
    initialPropMedia.map((m) => m.id)
  );

  // Sync any newly added items from prop media while preserving existing session items that still exist in store
  useEffect(() => {
    setSessionMediaIds((prev) => {
      const storeIds = new Set(storeMedia.map((m) => m.id));
      const validPrev = prev.filter((id) => storeIds.has(id));
      const existingSet = new Set(validPrev);
      const additions = initialPropMedia
        .map((m) => m.id)
        .filter((id) => storeIds.has(id) && !existingSet.has(id));
      return additions.length > 0 ? [...validPrev, ...additions] : validPrev;
    });
  }, [initialPropMedia, storeMedia]);

  // Resolve latest MediaItem metadata (title, description, orientation, url) from store
  const media = useMemo<MediaItem[]>(() => {
    const storeMap = new Map(storeMedia.map((m) => [m.id, m]));
    const propMap = new Map(initialPropMedia.map((m) => [m.id, m]));
    return sessionMediaIds
      .map((id) => storeMap.get(id) || propMap.get(id))
      .filter((m): m is MediaItem => Boolean(m));
  }, [sessionMediaIds, storeMedia, initialPropMedia]);

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
  }, [media.length, startIndex]);

  const [shuffledOrder, setShuffledOrder] = useState<number[]>(shuffleArray);
  const [shuffledIndex, setShuffledIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(
    settings.shuffle ? (shuffleArray[0] ?? 0) : startIndex
  );
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

  // Context menu & quick edit state
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    initialView: PlayerMenuView;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    initialView: 'menu',
  });

  // Fullscreen toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Keep currentIndex and shuffledOrder within bounds when media items are deleted
  useEffect(() => {
    if (media.length === 0) {
      onExit();
      return;
    }
    setCurrentIndex((prev) => (prev >= media.length ? Math.max(0, media.length - 1) : prev));
    setShuffledOrder((prev) => {
      const filtered = prev.filter((idx) => idx < media.length);
      if (filtered.length === media.length) return prev;
      return media.map((_, idx) => idx);
    });
    setShuffledIndex((prev) => (prev >= media.length ? 0 : prev));
  }, [media.length, onExit]);

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

  // Slideshow auto-advance for images (paused while context menu / editor is open)
  useEffect(() => {
    if (!isPlaying || menuState.isOpen || !currentMedia || currentMedia.type !== 'image') {
      return;
    }

    const timer = setTimeout(() => {
      goToNext('fade');
    }, settings.slideInterval);

    return () => clearTimeout(timer);
  }, [isPlaying, menuState.isOpen, currentIndex, settings.slideInterval, goToNext, currentMedia]);

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
      const target = e.target as HTMLElement | null;
      const isEditingInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        if (menuState.isOpen) {
          e.preventDefault();
          setMenuState((prev) => ({ ...prev, isOpen: false }));
          return;
        }
        onExit();
        return;
      }

      if (isEditingInput || menuState.isOpen) {
        return;
      }

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, togglePlayPause, onExit, resetControlsTimeout, menuState.isOpen]);

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
      if (videoRef.current && videoRef.current !== el) {
        try {
          videoRef.current.pause();
          videoRef.current.muted = true;
        } catch {}
      }
      videoRef.current = el;
    }
  }, []);

  // Ensure any active video is paused and unloaded when FullscreenPlayer unmounts
  useEffect(() => {
    return () => {
      const vid = videoRef.current;
      if (vid) {
        try {
          vid.pause();
          vid.muted = true;
          vid.removeAttribute('src');
          vid.load();
        } catch {}
        videoRef.current = null;
      }
    };
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
    if (videoRef.current && vid !== videoRef.current) {
      try {
        vid.pause();
        vid.muted = true;
      } catch {}
      return;
    }
    setDuration(vid.duration || 0);
    if (isPlaying && vid.paused) {
      attemptPlayVideo(vid);
    }
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (videoRef.current && vid !== videoRef.current) {
      try {
        vid.pause();
        vid.muted = true;
      } catch {}
      return;
    }
    if (isPlaying && vid.paused) {
      attemptPlayVideo(vid);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isScrubbingRef.current) return;
    const vid = e.currentTarget;
    if (videoRef.current && vid !== videoRef.current) {
      return;
    }
    setCurrentTime(vid.currentTime);
    if (vid.duration) {
      setProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  const handleVideoEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (videoRef.current && e.currentTarget !== videoRef.current) {
      return;
    }
    if (menuState.isOpen) {
      e.currentTarget.currentTime = 0;
      attemptPlayVideo(e.currentTarget);
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

  const handleOpenContextMenu = useCallback(
    (x: number, y: number, initialView: PlayerMenuView = 'menu') => {
      setMenuState({
        isOpen: true,
        x,
        y,
        initialView,
      });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleToggleCollection = useCallback(
    async (col: Collection) => {
      if (!currentMedia) return false;
      const added = await toggleMediaInCollection(currentMedia.id, col.id);
      showToast(
        added
          ? t('frame.addedToCollection', { name: col.name })
          : t('frame.removedFromCollection', { name: col.name })
      );
      return added;
    },
    [currentMedia, toggleMediaInCollection, showToast, t]
  );

  const handleCreateCollectionWithMedia = useCallback(
    async (name: string) => {
      if (!currentMedia) return;
      await createCollection(name, undefined, [currentMedia.id]);
      showToast(t('frame.addedToCollection', { name }));
    },
    [currentMedia, createCollection, showToast, t]
  );

  const handleUpdateCurrentMedia = useCallback(
    async (updates: Partial<MediaItem>) => {
      if (!currentMedia) return;
      await updateMedia(currentMedia.id, updates);
      showToast(t('frame.savedSuccess'));
    },
    [currentMedia, updateMedia, showToast, t]
  );

  const handleRemoveFromActiveCollection = useCallback(async () => {
    if (!currentMedia || !activeCollectionId || activeCollectionId === '__uncollected__') return;
    const col = collections.find((c) => c.id === activeCollectionId);
    if (!col) return;
    await updateCollection(col.id, {
      mediaIds: col.mediaIds.filter((id) => id !== currentMedia.id),
    });
    setSessionMediaIds((prev) => prev.filter((id) => id !== currentMedia.id));
    showToast(t('frame.removedFromCollection', { name: col.name }));
  }, [currentMedia, activeCollectionId, collections, updateCollection, showToast, t]);

  const handleDeleteCurrentMedia = useCallback(async () => {
    if (!currentMedia) return;
    const targetId = currentMedia.id;
    setSessionMediaIds((prev) => prev.filter((id) => id !== targetId));
    if (onDelete) {
      await onDelete(targetId);
    } else {
      await storeDeleteMedia(targetId);
    }
  }, [currentMedia, onDelete, storeDeleteMedia]);

  const handleDownloadCurrentMedia = useCallback(async () => {
    if (!currentMedia) return;
    try {
      const ext = currentMedia.type === 'image' ? 'jpg' : 'mp4';
      const filename = currentMedia.title
        ? `${currentMedia.title}.${ext}`
        : `media-${currentMedia.id}.${ext}`;
      await downloadMediaFile(currentMedia.url, filename);
      showToast(t('frame.downloadComplete'));
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [currentMedia, showToast, t]);

  const handleCopyCurrentUrl = useCallback(async () => {
    if (!currentMedia) return;
    try {
      await navigator.clipboard.writeText(currentMedia.url);
      showToast(t('frame.copiedToClipboard'));
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [currentMedia, showToast, t]);

  const currentMediaCollections = useMemo(() => {
    if (!currentMedia) return [];
    return collections.filter((col) => col.mediaIds.includes(currentMedia.id));
  }, [collections, currentMedia]);

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
      style={{ cursor: showControls || menuState.isOpen ? 'default' : 'none' }}
    >
      {/* 3-Slot Viewport: Handles gesture tracking, peek previews above/below, long-press/right-click, and cross-fade */}
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
        isMenuOpen={menuState.isOpen}
        isPlaying={isPlaying}
        videoRef={handleVideoCallbackRef}
        isAutoplayMuted={isAutoplayMuted}
        onUnmute={handleUnmute}
        onSlideNext={() => goToNext('slide')}
        onSlidePrev={() => goToPrev('slide')}
        onContainerClick={handleContainerClick}
        onOpenContextMenu={(x, y) => handleOpenContextMenu(x, y, 'menu')}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => setIsPlaying(true)}
        onPause={handleVideoPause}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />

      {/* Fullscreen Floating Feedback Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[10010] bg-neutral-900/90 backdrop-blur-xl border border-white/15 text-white text-xs sm:text-sm px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
            </span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="absolute top-0 left-0 right-0 min-h-32 bg-gradient-to-b from-black/75 via-black/35 to-transparent p-6 sm:p-8 flex justify-between items-start gap-4 pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="text-white min-w-0 flex-1">
                {currentMedia.title && (
                  <h3 className="text-lg sm:text-xl font-medium drop-shadow-md truncate">
                    {currentMedia.title}
                  </h3>
                )}
                {currentMedia.description && (
                  <p className="text-xs sm:text-sm text-white/75 line-clamp-1 mt-0.5 max-w-xl drop-shadow">
                    {currentMedia.description}
                  </p>
                )}
                <div className="flex items-center flex-wrap gap-2 mt-1.5">
                  <span className="text-xs sm:text-sm text-white/60 font-mono">
                    {currentIndex + 1} / {media.length}
                  </span>

                  {/* Interactive Collection Badges / Quick Add Pill */}
                  {currentMediaCollections.length > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleOpenContextMenu(rect.left, rect.bottom + 8, 'collections');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/10 text-xs text-white/90 transition-all active:scale-95 cursor-pointer"
                      title={t('frame.addToCollection')}
                    >
                      <Layers className="w-3 h-3 text-accent shrink-0" />
                      <span className="truncate max-w-[160px]">
                        {currentMediaCollections.map((c) => c.name).join(' · ')}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleOpenContextMenu(rect.left, rect.bottom + 8, 'collections');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-xs text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
                      title={t('frame.addToCollection')}
                    >
                      <FolderPlus className="w-3 h-3 text-accent shrink-0" />
                      <span>{t('frame.addToCollection')}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleOpenContextMenu(rect.right - 272, rect.bottom + 10, 'menu');
                  }}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
                  title={t('frame.editInfo')}
                >
                  <MoreHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExit();
                  }}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all group active:scale-95 cursor-pointer"
                  title={t('frame.exitFullscreen')}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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

      {/* Long-Press / Right-Click Glassmorphic Media Editor & Context Menu */}
      <PlayerMediaMenu
        isOpen={menuState.isOpen}
        initialView={menuState.initialView}
        anchor={{ x: menuState.x, y: menuState.y }}
        media={currentMedia}
        collections={collections}
        activeCollectionId={activeCollectionId}
        onClose={handleCloseContextMenu}
        onToggleCollection={handleToggleCollection}
        onCreateCollectionWithMedia={handleCreateCollectionWithMedia}
        onUpdateMedia={handleUpdateCurrentMedia}
        onRemoveFromActiveCollection={handleRemoveFromActiveCollection}
        onDeleteMedia={handleDeleteCurrentMedia}
        onDownloadMedia={handleDownloadCurrentMedia}
        onCopyUrl={handleCopyCurrentUrl}
      />
    </div>
  );
}
