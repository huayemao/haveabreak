'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem } from '../../types';
import { getVideoThumbnail, generateVideoPoster, TRANSPARENT_POSTER } from '../../utils/videoThumbnail';
import { useTranslations } from 'next-intl';

interface PlayerMediaViewProps {
  media: MediaItem;
  isActive: boolean;
  isPlaying?: boolean;
  videoRef?: (el: HTMLVideoElement | null) => void;
  isAutoplayMuted?: boolean;
  onUnmute?: () => void;
  onPlay?: () => void;
  onPlaying?: () => void;
  onLoadedData?: () => void;
  onPause?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onCanPlay?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
}

export default function PlayerMediaView({
  media,
  isActive,
  isPlaying = false,
  videoRef,
  isAutoplayMuted = false,
  onUnmute,
  onPlay,
  onPlaying,
  onLoadedData,
  onPause,
  onLoadedMetadata,
  onCanPlay,
  onTimeUpdate,
  onEnded,
}: PlayerMediaViewProps) {
  const t = useTranslations();
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    setIsVideoReady(false);
    if (media.type === 'video') {
      if (media.thumbnailUrl) {
        setVideoThumbnail(media.thumbnailUrl);
      } else {
        let active = true;
        getVideoThumbnail(media.url, media.id).then((url) => {
          if (active && url) {
            setVideoThumbnail(url);
          }
        });
        return () => {
          active = false;
        };
      }
    } else {
      setVideoThumbnail(null);
    }
  }, [media.url, media.id, media.type, media.thumbnailUrl]);

  if (media.type === 'image') {
    return (
      <div className="relative w-full h-full overflow-hidden select-none">
        <img
          src={media.url}
          alt={media.title || ''}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>
    );
  }

  // Video view: when not active (e.g. peeking preview above/below), render poster only for max performance
  if (!isActive) {
    return (
      <div className="relative w-full h-full overflow-hidden select-none bg-black">
        <img
          src={videoThumbnail || media.thumbnailUrl || generateVideoPoster(media.title)}
          alt={media.title || ''}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>
    );
  }

  // Active video slide
  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black">
      <video
        key={media.id || media.url}
        ref={videoRef}
        src={media.url}
        poster={videoThumbnail || media.thumbnailUrl || TRANSPARENT_POSTER}
        preload="auto"
        autoPlay={isPlaying}
        className="w-full h-full object-cover pointer-events-none"
        playsInline
        draggable={false}
        onPlay={() => {
          setIsVideoReady(true);
          onPlay?.();
        }}
        onPlaying={() => {
          setIsVideoReady(true);
          onPlaying?.();
        }}
        onLoadedData={() => {
          setIsVideoReady(true);
          onLoadedData?.();
        }}
        onPause={onPause}
        onLoadedMetadata={onLoadedMetadata}
        onCanPlay={onCanPlay}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />

      {/* Poster / Cover Layer to ensure zero native placeholder or black flash */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isVideoReady ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <img
          src={videoThumbnail || media.thumbnailUrl || generateVideoPoster(media.title)}
          alt={media.title || ''}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Tap to Unmute Button for Mobile Autoplay */}
      {isAutoplayMuted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnmute?.();
          }}
          className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 bg-black/75 hover:bg-black/90 active:scale-95 backdrop-blur-md text-white text-xs sm:text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl border border-white/20 transition-all pointer-events-auto cursor-pointer"
        >
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <span>{t('frame.tapToUnmute') || '点击开启声音'}</span>
        </button>
      )}
    </div>
  );
}
