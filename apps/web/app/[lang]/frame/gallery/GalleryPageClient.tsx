"use client";
import { useFrameStore } from '@/apps/frame/store';
import MediaGallery from '@/apps/frame/components/MediaGallery';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from 'i18n/routing';
import { startSlideshow } from '@/apps/frame/utils/playerUtils';
import { useCallback } from 'react';

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
    startSlideshow({
      media,
      settings,
      updateUrl,
      collectionId: null,
      paused,
      index
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
