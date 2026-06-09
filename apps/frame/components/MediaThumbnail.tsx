"use client";
import { MediaItem } from '../types';
import { useState, useEffect, useRef, useCallback } from 'react';

interface MediaThumbnailProps {
  item: MediaItem;
  className?: string;
  showPlayIcon?: boolean;
}

export default function MediaThumbnail({ item, className = '', showPlayIcon = true }: MediaThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailBlobUrlRef = useRef<string | null>(null);

  const extractThumbnail = useCallback(async (video: HTMLVideoElement) => {
    return new Promise<void>((resolve, reject) => {
      const handleSeeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              // Revoke old blob URL if exists
              if (thumbnailBlobUrlRef.current) {
                URL.revokeObjectURL(thumbnailBlobUrlRef.current);
              }
              const url = URL.createObjectURL(blob);
              setThumbnailUrl(url);
              thumbnailBlobUrlRef.current = url;
            }
            resolve();
          }, 'image/jpeg', 0.8);
        } catch (err) {
          reject(err);
        } finally {
          video.removeEventListener('seeked', handleSeeked);
        }
      };

      video.addEventListener('seeked', handleSeeked);
      // Seek to 1 second or 10% of duration to get a meaningful frame
      video.currentTime = Math.min(1, video.duration * 0.1);
    });
  }, []);

  useEffect(() => {
    if (item.type !== 'video') return;

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const handleLoadedMetadata = async () => {
      try {
        await extractThumbnail(video);
        if (!cancelled) {
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    };

    const handleError = () => {
      if (!cancelled) {
        setError(true);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    // Trigger metadata loading
    video.load();

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [item.url, extractThumbnail]);

  // Cleanup blob URL on unmount or item change
  useEffect(() => {
    return () => {
      if (thumbnailBlobUrlRef.current) {
        URL.revokeObjectURL(thumbnailBlobUrlRef.current);
      }
    };
  }, [item.url]);

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
          ) : thumbnailUrl && !error ? (
            <img
              src={thumbnailUrl}
              alt={item.title || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black/10">
              <svg className="w-12 h-12 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          {/* Hidden video element for thumbnail extraction */}
          <video
            ref={videoRef}
            src={item.url}
            className="hidden"
            muted
            preload="metadata"
            crossOrigin="anonymous"
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
