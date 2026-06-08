"use client";
import { MediaItem } from '../types';
import { useState, useEffect, useRef } from 'react';

interface MediaThumbnailProps {
  item: MediaItem;
  className?: string;
  showPlayIcon?: boolean;
}

export default function MediaThumbnail({ item, className = '', showPlayIcon = true }: MediaThumbnailProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item.type !== 'video' || !videoRef.current) return;

    const video = videoRef.current;

    const handleLoadedMetadata = () => {
      setVideoLoaded(true);
    };

    const handleError = () => {
      setVideoError(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [item.type, item.url]);

  return (
    <div className={`aspect-square ${className}`}>
      {item.type === 'image' ? (
        <img
          src={item.url}
          alt={item.title || ''}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full relative bg-muted">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title || ''}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={item.url}
                className={`w-full h-full object-cover ${videoLoaded && !videoError ? '' : 'hidden'}`}
                muted
                loop
                playsInline
                preload="metadata"
              />
              {!videoLoaded || videoError ? (
                <div className="w-full h-full flex items-center justify-center bg-black/10">
                  <svg className="w-12 h-12 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : null}
            </>
          )}
          {showPlayIcon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
