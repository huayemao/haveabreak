"use client";
import { useFrameStore } from '@/apps/frame/store';
import CollectionManager from '@/apps/frame/components/CollectionManager';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
import { Collection, MediaItem } from '@/apps/frame/types';
import { startSlideshow } from '@/apps/frame/utils/playerUtils';
import { useCallback } from 'react';

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
    // Use the locale-aware pathname and router
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handlePlayCollection = (collection: Collection, paused = false, index = 0, shuffle?: boolean) => {
    const collectionMedia = media.filter((m) => collection.mediaIds.includes(m.id));
    startSlideshow({
      media: collectionMedia,
      settings,
      updateUrl,
      collectionId: collection.id,
      paused,
      index,
      shuffle
    });
  };

  const handleSelectCollection = (id: string | null) => {
    if (id) {
      // The router from @/i18n/routing automatically handles the locale prefix.
      // pathname here is the locale-aware one (e.g. /en/frame/collections).
      // next-intl's router.push expects a path without the locale prefix if it's already configured to handle it,
      // but if we pass a full path starting with the current locale-aware pathname, we need to ensure it's handled correctly.
      // Usually, with next-intl's router, it's better to use relative paths or strip the locale from the pathname.
      
      // However, if we use the Link component or router from routing.ts, 
      // we should be able to just push the subpath if we know the structure.
      router.push(`/frame/collections/detail?id=${id}`);
    } else {
      router.push(`/frame/collections`);
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
      onMediaAdd={(url, type, title) => addMedia(url, type, title, selectedCollectionId || undefined)}
      onMediaAddUrlList={importUrlList}
      onMediaDelete={deleteMedia}
    />
  );
}
