"use client";
import { useFrameStore } from '@/apps/frame/store';
import MediaGallery from '@/apps/frame/components/MediaGallery';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { MediaItem } from '@/apps/frame/types';

export default function GalleryPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    media,
    deleteMedia,
    addMedia,
    importUrlList,
    settings
  } = useFrameStore();

  const filterMediaByOrientation = useCallback((mediaList: MediaItem[]) => {
    if (!settings.filterByOrientation) return mediaList;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetOrientation = isMobile ? 'portrait' : 'landscape';
    return mediaList.filter(item => item.orientation === targetOrientation || item.orientation === 'square');
  }, [settings.filterByOrientation]);

  const updateUrl = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    const queryString = newParams.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleStartSlideshow = (paused = false, index = 0) => {
    const filtered = filterMediaByOrientation(media);
    const originalMedia = media[index];
    let finalIndex = 0;
    if (originalMedia) {
      const filteredIndex = filtered.findIndex(item => item.id === originalMedia.id);
      finalIndex = filteredIndex >= 0 ? filteredIndex : 0;
    }
    
    updateUrl({
      player: 'true',
      paused: paused ? 'true' : null,
      index: finalIndex > 0 ? finalIndex.toString() : null,
      collection: null
    });
  };

  return (
    <MediaGallery
      media={media}
      onDelete={deleteMedia}
      onAdd={addMedia}
      onAddUrlList={importUrlList}
      onPlay={(paused, index) => handleStartSlideshow(paused, index)}
    />
  );
}
