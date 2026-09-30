'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, animate, AnimatePresence, type PanInfo } from 'motion/react';
import { MediaItem } from '../../types';
import PlayerMediaView from './PlayerMediaView';

interface PlayerViewportProps {
  media: MediaItem[];
  currentIndex: number;
  prevIndex: number;
  nextIndex: number;
  currentMedia: MediaItem;
  prevMedia: MediaItem | null;
  nextMedia: MediaItem | null;
  transitionType: 'slide' | 'fade';
  transitionDuration: number;
  swipeEnabled: boolean;
  isPlaying: boolean;
  videoRef: (el: HTMLVideoElement | null) => void;
  isAutoplayMuted: boolean;
  onUnmute: () => void;
  onSlideNext: () => void;
  onSlidePrev: () => void;
  onContainerClick: (e?: React.MouseEvent) => void;
  // Video lifecycle events
  onPlay?: () => void;
  onPlaying?: () => void;
  onLoadedData?: () => void;
  onPause?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onCanPlay?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
}

export default function PlayerViewport({
  media,
  currentIndex,
  prevIndex,
  nextIndex,
  currentMedia,
  prevMedia,
  nextMedia,
  transitionType,
  transitionDuration,
  swipeEnabled,
  isPlaying,
  videoRef,
  isAutoplayMuted,
  onUnmute,
  onSlideNext,
  onSlidePrev,
  onContainerClick,
  onPlay,
  onPlaying,
  onLoadedData,
  onPause,
  onLoadedMetadata,
  onCanPlay,
  onTimeUpdate,
  onEnded,
}: PlayerViewportProps) {
  const y = useMotionValue(0);
  const isDraggingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const lastWheelTimeRef = useRef(0);

  const hasMultipleMedia = media.length > 1;
  const canSwipe = swipeEnabled && hasMultipleMedia;

  // Programmatic vertical slide (used for swipe release, wheel, buttons, keyboard)
  const executeSlide = useCallback(
    (direction: 'next' | 'prev') => {
      if (isAnimatingRef.current || !hasMultipleMedia) return;
      isAnimatingRef.current = true;

      const windowHeight = window.innerHeight || 800;
      const targetY = direction === 'next' ? -windowHeight : windowHeight;

      animate(y, targetY, {
        duration: 0.35,
        ease: [0.32, 0.72, 0, 1] as const,
      }).then(() => {
        if (direction === 'next') {
          onSlideNext();
        } else {
          onSlidePrev();
        }
        y.set(0);
        isAnimatingRef.current = false;
      });
    },
    [y, hasMultipleMedia, onSlideNext, onSlidePrev]
  );

  const dragStartTimeRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  const triggerTap = useCallback(() => {
    if (isAnimatingRef.current) return;
    const now = Date.now();
    if (now - lastTapTimeRef.current < 350) return;
    lastTapTimeRef.current = now;
    onContainerClick();
  }, [onContainerClick]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
    dragStartTimeRef.current = Date.now();
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);

    const offsetY = info.offset.y;
    const velocityY = info.velocity.y;
    const isTinyOffset = Math.abs(offsetY) < 15 && Math.abs(info.offset.x) < 15;
    const elapsed = Date.now() - dragStartTimeRef.current;

    if (!hasMultipleMedia || isAnimatingRef.current) {
      animate(y, 0, { type: 'spring', stiffness: 350, damping: 30 });
      if (isTinyOffset && elapsed < 400) {
        triggerTap();
      }
      return;
    }

    const threshold = 70;
    const velocityThreshold = 400;

    // Swiped up -> next media
    if (offsetY < -threshold || velocityY < -velocityThreshold) {
      executeSlide('next');
    }
    // Swiped down -> previous media
    else if (offsetY > threshold || velocityY > velocityThreshold) {
      executeSlide('prev');
    }
    // Did not exceed threshold -> spring back to center
    else {
      animate(y, 0, { type: 'spring', stiffness: 350, damping: 30 });
      if (isTinyOffset && elapsed < 400) {
        triggerTap();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!canSwipe || isAnimatingRef.current) return;
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 600) return;

    if (Math.abs(e.deltaY) > 30) {
      lastWheelTimeRef.current = now;
      if (e.deltaY > 0) {
        executeSlide('next');
      } else {
        executeSlide('prev');
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current && Math.abs(y.get()) > 10) return;
    triggerTap();
  };

  // When transitionType is 'fade', ensure y is centered
  useEffect(() => {
    if (transitionType === 'fade') {
      y.set(0);
    }
  }, [transitionType, y]);

  // Fade transition duration in seconds (customized via settings.transitionDuration)
  const fadeDurationSeconds = Math.max(0.2, (transitionDuration || 800) / 1000);

  return (
    <div
      className="absolute inset-0 overflow-hidden select-none touch-none"
      onClick={handleClick}
      onWheel={handleWheel}
    >
      {/* 3-Slot Vertical Container for 1:1 real-time drag following (跟手且露前后媒体) */}
      <motion.div
        style={{ y }}
        drag={canSwipe ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={canSwipe ? 1 : 0.1}
        onPointerDown={() => {
          dragStartTimeRef.current = Date.now();
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTap={() => triggerTap()}
        className="absolute inset-0 w-full h-full touch-none cursor-grab active:cursor-grabbing"
      >
        {/* Previous Slide: physically positioned directly above (-100%) */}
        {hasPrevSlot(canSwipe, prevMedia) && (
          <div
            key={`prev-${prevMedia!.id || prevIndex}`}
            className="absolute inset-0 w-full h-full -translate-y-full pointer-events-none"
          >
            <PlayerMediaView media={prevMedia!} isActive={false} />
          </div>
        )}

        {/* Current Active Slide: centered (0) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {transitionType === 'fade' ? (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentMedia.id || currentMedia.url}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: fadeDurationSeconds, ease: 'easeInOut' as const }}
                className="w-full h-full"
              >
                <PlayerMediaView
                  media={currentMedia}
                  isActive={true}
                  isPlaying={isPlaying}
                  videoRef={videoRef}
                  isAutoplayMuted={isAutoplayMuted}
                  onUnmute={onUnmute}
                  onPlay={onPlay}
                  onPlaying={onPlaying}
                  onLoadedData={onLoadedData}
                  onPause={onPause}
                  onLoadedMetadata={onLoadedMetadata}
                  onCanPlay={onCanPlay}
                  onTimeUpdate={onTimeUpdate}
                  onEnded={onEnded}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div key={currentMedia.id || currentMedia.url} className="w-full h-full">
              <PlayerMediaView
                media={currentMedia}
                isActive={true}
                isPlaying={isPlaying}
                videoRef={videoRef}
                isAutoplayMuted={isAutoplayMuted}
                onUnmute={onUnmute}
                onPlay={onPlay}
                onPlaying={onPlaying}
                onLoadedData={onLoadedData}
                onPause={onPause}
                onLoadedMetadata={onLoadedMetadata}
                onCanPlay={onCanPlay}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
              />
            </div>
          )}
        </div>

        {/* Next Slide: physically positioned directly below (+100%) */}
        {hasNextSlot(canSwipe, nextMedia) && (
          <div
            key={`next-${nextMedia!.id || nextIndex}`}
            className="absolute inset-0 w-full h-full translate-y-full pointer-events-none"
          >
            <PlayerMediaView media={nextMedia!} isActive={false} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function hasPrevSlot(canSwipe: boolean, prevMedia: MediaItem | null): boolean {
  return Boolean(canSwipe && prevMedia);
}

function hasNextSlot(canSwipe: boolean, nextMedia: MediaItem | null): boolean {
  return Boolean(canSwipe && nextMedia);
}
