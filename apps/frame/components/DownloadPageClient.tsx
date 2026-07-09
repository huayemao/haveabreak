"use client";
import { useFrameStore } from '@haveabreak/frame/store';
import Downloader from '@haveabreak/frame/components/Downloader';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MediaItem } from '@haveabreak/frame/types';

export default function DownloadPageClient() {
  const searchParams = useSearchParams();
  const {
    media,
    collections,
    settings,
  } = useFrameStore();

  const selectedCollectionId = searchParams.get('collection');

  const filterMediaByOrientation = useCallback((mediaList: MediaItem[]) => {
    if (!settings.filterByOrientation) return mediaList;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetOrientation = isMobile ? 'portrait' : 'landscape';
    return mediaList.filter(item => item.orientation === targetOrientation || item.orientation === 'square');
  }, [settings.filterByOrientation]);

  const currentMedia = useMemo(() => {
    let mediaList: MediaItem[];
    if (selectedCollectionId) {
      const collection = collections.find((col) => col.id === selectedCollectionId);
      if (collection) {
        mediaList = media.filter((m) => collection.mediaIds.includes(m.id));
      } else {
        mediaList = media;
      }
    } else {
      mediaList = media;
    }
    return filterMediaByOrientation(mediaList);
  }, [selectedCollectionId, collections, media, filterMediaByOrientation]);

  return (
    <Downloader media={currentMedia}  />
  );
}
