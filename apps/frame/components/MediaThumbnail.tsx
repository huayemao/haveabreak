"use client";
import { MediaItem } from '../types';
import { useState, useEffect } from 'react';
import { getVideoThumbnail, generateVideoPoster } from '../utils/videoThumbnail';

interface MediaThumbnailProps {
  item: MediaItem;
  className?: string;
  showPlayIcon?: boolean;
  aspectRatio?: string;
}

export default function MediaThumbnail({
  item,
  className = '',
  showPlayIcon = true,
  aspectRatio = 'aspect-square',
}: MediaThumbnailProps) {
  const [extractedThumb, setExtractedThumb] = useState<string | null>(null);

  useEffect(() => {
    if (item.type !== 'video' || item.thumbnailUrl) return;

    let active = true;
    getVideoThumbnail(item.url, item.id).then((url) => {
      if (active && url) {
        setExtractedThumb(url);
      }
    });

    return () => {
      active = false;
    };
  }, [item.url, item.id, item.type, item.thumbnailUrl]);

  const computedAspectRatio =
    aspectRatio === 'aspect-auto'
      ? item.orientation === 'portrait'
        ? 'aspect-[3/4]'
        : item.orientation === 'landscape'
        ? 'aspect-[16/10]'
        : 'aspect-square'
      : aspectRatio;

  const videoThumb = item.thumbnailUrl || extractedThumb || generateVideoPoster(item.title);

  return (
    <div className={`${computedAspectRatio} ${className}`}>
      {item.type === 'image' ? (
        <img
          src={item.url}
          alt={item.title || ''}
          className={aspectRatio === 'aspect-auto' ? 'w-full h-auto' : 'w-full h-full object-cover'}
          loading="lazy"
        />
      ) : (
        <div className={`w-full relative bg-muted overflow-hidden ${aspectRatio === 'aspect-auto' ? 'h-auto' : 'h-full'} ${computedAspectRatio}`}>
          <img
            src={videoThumb}
            alt={item.title || ''}
            className="w-full h-full object-cover"
            loading="lazy"
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
