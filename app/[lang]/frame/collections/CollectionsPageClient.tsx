"use client";
import { useFrameStore } from '@/apps/frame/store';
import CollectionManager from '@/apps/frame/components/CollectionManager';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Collection, MediaItem } from '@/apps/frame/types';

export default function CollectionsPageClient({ 
  selectedCollectionId = null 
}: { 
  selectedCollectionId?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    media,
    collections,
    settings,
    addMedia,
    deleteMedia,
    importUrlList,
    createCollection,
    updateCollection,
    deleteCollection
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

  const handlePlayCollection = (collection: Collection, paused = false, index = 0) => {
    const collectionMedia = media.filter((m) => collection.mediaIds.includes(m.id));
    const filtered = filterMediaByOrientation(collectionMedia);
    const originalMedia = collectionMedia[index];
    let finalIndex = 0;
    if (originalMedia) {
      const filteredIndex = filtered.findIndex(item => item.id === originalMedia.id);
      finalIndex = filteredIndex >= 0 ? filteredIndex : 0;
    }

    updateUrl({
      player: 'true',
      paused: paused ? 'true' : null,
      index: finalIndex > 0 ? finalIndex.toString() : null,
      collection: collection.id
    });
  };

  const handleSelectCollection = (id: string | null) => {
    if (id) {
      router.push(`${pathname}/${id}`);
    } else {
      // If we are in a detail view, going back means going to /collections
      const base = pathname.split('/collections')[0];
      router.push(`${base}/collections`);
    }
  };

  return (
    <CollectionManager
      collections={collections}
      media={media}
      selectedCollectionId={selectedCollectionId}
      onSelect={handleSelectCollection}
      onCreate={createCollection}
      onUpdate={updateCollection}
      onDelete={deleteCollection}
      onShare={() => { }}
      onPlay={handlePlayCollection}
      onMediaAdd={addMedia}
      onMediaAddUrlList={importUrlList}
      onMediaDelete={deleteMedia}
    />
  );
}
