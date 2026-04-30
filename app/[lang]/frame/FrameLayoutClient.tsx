"use client";
import { useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFrameStore } from '@/apps/frame/store';
import { Dictionary } from '@/dictionaries';
import { MediaItem } from '@/apps/frame/types';
import FullscreenPlayer from '@/apps/frame/components/FullscreenPlayer';
import AddMediaModal from '@/apps/frame/components/AddMediaModal';

export default function FrameLayoutClient({
  children,
  dict,
  lang
}: {
  children: React.ReactNode;
  dict: Dictionary;
  lang: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const {
    media,
    collections,
    settings,
    isLoading,
    loadData,
    addMedia,
    deleteMedia,
    importUrlList
  } = useFrameStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global UI states (Query Params)
  const showFullscreen = searchParams.get('player') === 'true';
  const showAddModal = searchParams.get('modal') === 'add';
  const startIndex = parseInt(searchParams.get('index') || '0', 10);
  const startPaused = searchParams.get('paused') === 'true';
  const selectedCollectionId = searchParams.get('collection');

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

  const handleCloseModal = () => updateUrl({ modal: null });

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

  const handleExitFullscreen = () => {
    updateUrl({
      player: null,
      paused: null,
      index: null
    });
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-fg-muted">{dict.frame.loading}</p>
        </div>
      </div>
    );
  }

  const baseRoute = `/${lang}/frame`;
  const isGallery = pathname === `${baseRoute}/gallery` || pathname === baseRoute;
  const isCollections = pathname.startsWith(`${baseRoute}/collections`);
  const isDownload = pathname === `${baseRoute}/download`;
  const isSettings = pathname === `${baseRoute}/settings`;

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={baseRoute}>
                <div>
                  <h1 className="text-lg font-bold text-fg-primary font-display">
                    {dict.frame.appTitle}
                  </h1>
                  <p className="text-xs text-fg-muted hidden sm:block">{dict.frame.appSubtitle}</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href={`${baseRoute}/gallery`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isGallery
                      ? 'bg-accent text-white'
                      : 'neumorphic-button'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden md:inline text-sm">{dict.frame.mediaLibrary}</span>
                </Link>

                <Link
                  href={`${baseRoute}/collections`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isCollections
                      ? 'bg-accent text-white'
                      : 'neumorphic-button'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="hidden md:inline text-sm">{dict.frame.collections}</span>
                </Link>

                <Link
                  href={`${baseRoute}/download`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isDownload
                      ? 'bg-accent text-white'
                      : 'neumorphic-button'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden md:inline text-sm">{dict.frame.download}</span>
                </Link>

                <Link
                  href={`${baseRoute}/settings`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isSettings
                      ? 'bg-accent text-white'
                      : 'neumorphic-button'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  <span className="hidden md:inline text-sm">{dict.frame.settings}</span>
                </Link>
              </div>

              {media.length > 0 && (
                <button
                  onClick={() => handleStartSlideshow(false)}
                  className="neumorphic-button-primary p-2 flex items-center gap-2 rounded-2xl"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="hidden sm:inline text-sm">{dict.frame.slideshow}</span>
                </button>
              )}
            </div>
          </div>

          <div className="sm:hidden mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href={`${baseRoute}/gallery`}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${isGallery
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-sm">{dict.frame.mediaLibrary}</span>
              </Link>

              <Link
                href={`${baseRoute}/collections`}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${isCollections
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-sm">{dict.frame.collections}</span>
              </Link>

              <Link
                href={`${baseRoute}/download`}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${isDownload
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-sm">{dict.frame.download}</span>
              </Link>

              <Link
                href={`${baseRoute}/settings`}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${isSettings
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                <span className="text-sm">{dict.frame.settings}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>

      {showFullscreen && (
        <FullscreenPlayer
          media={currentMedia}
          settings={settings}
          dict={dict}
          onExit={handleExitFullscreen}
          onDelete={deleteMedia}
          startPaused={startPaused}
          startIndex={startIndex}
        />
      )}

      <AddMediaModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onAdd={addMedia}
        onAddUrlList={importUrlList}
        dict={dict}
      />
    </div>
  );
}
