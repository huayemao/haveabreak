"use client";
import { MediaItem } from '../types';

interface MediaThumbnailProps {
  item: MediaItem;
  className?: string;
  showPlayIcon?: boolean;
}

export default function MediaThumbnail({ item, className = '', showPlayIcon = true }: MediaThumbnailProps) {
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
        <div className="w-full h-full relative bg-black/10">
          <video
            src={item.url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
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