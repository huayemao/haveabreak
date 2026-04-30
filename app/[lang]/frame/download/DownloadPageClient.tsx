"use client";
import { useFrameStore } from '@/apps/frame/store';
import Downloader from '@/apps/frame/components/Downloader';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dictionary } from '@/dictionaries';
import { MediaItem } from '@/apps/frame/types';

export default function DownloadPageClient({ dict }: { dict: Dictionary }) {
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
    <Downloader media={currentMedia} dict={dict} />
  );
}
