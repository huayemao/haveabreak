'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { MediaItem } from '../../types';

interface PlayerControlsProps {
  showControls: boolean;
  media: MediaItem[];
  currentMedia: MediaItem;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  scrubPercent: number | null;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  onExit: () => void;
  onTogglePlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (index: number) => void;
  onProgressBarPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onProgressBarPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onProgressBarPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export default function PlayerControls({
  showControls,
  media,
  currentMedia,
  currentIndex,
  isPlaying,
  currentTime,
  duration,
  progress,
  scrubPercent,
  progressBarRef,
  onExit,
  onTogglePlayPause,
  onPrev,
  onNext,
  onSelectIndex,
  onProgressBarPointerDown,
  onProgressBarPointerMove,
  onProgressBarPointerUp,
}: PlayerControlsProps) {
  const t = useTranslations();

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activePercent = scrubPercent !== null ? scrubPercent : progress;

  return (
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
                  onPointerDown={onProgressBarPointerDown}
                  onPointerMove={onProgressBarPointerMove}
                  onPointerUp={onProgressBarPointerUp}
                  onPointerCancel={onProgressBarPointerUp}
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
                  onPrev();
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
                  onTogglePlayPause();
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
                  onNext();
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
                    onSelectIndex(index);
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
  );
}
