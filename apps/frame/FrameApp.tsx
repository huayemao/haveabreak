"use client";
import { useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MediaItem, Collection, FrameSettings, MediaType } from './types';
import { exportData } from './storage';
import { Dictionary } from '@/dictionaries';
import FullscreenPlayer from './components/FullscreenPlayer';
import MediaGallery from './components/MediaGallery';
import CollectionManager from './components/CollectionManager';
import SettingsPanel from './components/SettingsPanel';
import Downloader from './components/Downloader';
import AddMediaModal from './components/AddMediaModal';
import { useFrameStore } from './store';

type ViewMode = 'gallery' | 'collections' | 'settings' | 'download';

interface FrameAppProps {
  dict: Dictionary;
}

function FrameAppContent({ dict }: FrameAppProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Zustand Store
  const {
    media,
    collections,
    settings,
    isLoading,
    loadData,
    addMedia,
    deleteMedia,
    createCollection,
    updateCollection,
    deleteCollection,
    updateSettings,
    importData,
    importUrlList
  } = useFrameStore();

  // URL States (Soft Navigation)
  const viewMode = (searchParams.get('view') as ViewMode) || 'gallery';
  const showFullscreen = searchParams.get('player') === 'true';
  const showAddModal = searchParams.get('modal') === 'add';
  const selectedCollectionId = searchParams.get('collection');
  const startIndex = parseInt(searchParams.get('index') || '0', 10);
  const startPaused = searchParams.get('paused') === 'true';

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const setViewMode = (mode: ViewMode) => updateUrl({ view: mode === 'gallery' ? null : mode });
  const setShowFullscreen = (show: boolean) => updateUrl({ player: show ? 'true' : null });
  const setSelectedCollectionId = (id: string | null) => updateUrl({ collection: id });
  const handleCloseModal = () => updateUrl({ modal: null });

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'frame-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const filterMediaByOrientation = useCallback((mediaList: MediaItem[]) => {
    if (!settings.filterByOrientation) return mediaList;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetOrientation = isMobile ? 'portrait' : 'landscape';
    return mediaList.filter(item => item.orientation === targetOrientation || item.orientation === 'square');
  }, [settings.filterByOrientation]);

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

  const handleExitFullscreen = () => {
    updateUrl({
      player: null,
      paused: null,
      index: null
    });
  };

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

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-fg-primary font-display">
                  {dict.frame.appTitle}
                </h1>
                <p className="text-xs text-fg-muted hidden sm:block">{dict.frame.appSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${viewMode === 'gallery'
                      ? 'bg-accent text-white'
                      : 'neumorphic-button'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden md:inline text-sm">{dict.frame.mediaLibrary}</span>
                </button>

                <button
                  onClick={() => setViewMode('collections')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${viewMode === 'collections'
                      ? 'bg-accent text-white'
                      : 'neumorphic-button'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="hidden md:inline text-sm">{dict.frame.collections}</span>
                </button>

                <button
                  onClick={() => setViewMode('download')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${viewMode === 'download'
                      ? 'bg-accent text-white'
                      : 'neumorphic-button'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden md:inline text-sm">{dict.frame.download}</span>
                </button>

                <button
                  onClick={() => setViewMode('settings')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${viewMode === 'settings'
                      ? 'bg-accent text-white'
                      : 'neumorphic-button'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  <span className="hidden md:inline text-sm">{dict.frame.settings}</span>
                </button>
              </div>

              {currentMedia.length > 0 && (
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
              <button
                onClick={() => setViewMode('gallery')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${viewMode === 'gallery'
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-sm">{dict.frame.mediaLibrary}</span>
              </button>

              <button
                onClick={() => setViewMode('collections')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${viewMode === 'collections'
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-sm">{dict.frame.collections}</span>
              </button>

              <button
                onClick={() => setViewMode('download')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${viewMode === 'download'
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-sm">{dict.frame.download}</span>
              </button>

              <button
                onClick={() => setViewMode('settings')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${viewMode === 'settings'
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                <span className="text-sm">{dict.frame.settings}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'gallery' && (
          <MediaGallery
            media={media}
            onDelete={deleteMedia}
            onAdd={addMedia}
            onAddUrlList={importUrlList}
            onPlay={(paused, index) => handleStartSlideshow(paused, index)}
            dict={dict}
          />
        )}

        {viewMode === 'collections' && (
          <CollectionManager
            collections={collections}
            media={media}
            selectedCollectionId={selectedCollectionId}
            onSelect={setSelectedCollectionId}
            onCreate={createCollection}
            onUpdate={updateCollection}
            onDelete={deleteCollection}
            onShare={() => { }}
            onPlay={handlePlayCollection}
            onMediaAdd={addMedia}
            onMediaAddUrlList={importUrlList}
            onMediaDelete={deleteMedia}
            dict={dict}
          />
        )}

        {viewMode === 'download' && (
          <Downloader media={currentMedia} dict={dict} />
        )}

        {viewMode === 'settings' && (
          <SettingsPanel
            settings={settings}
            onUpdate={updateSettings}
            onExport={handleExport}
            onImport={importData}
            dict={dict}
          />
        )}
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

export default function FrameApp(props: FrameAppProps) {
  return (
    <Suspense fallback={null}>
      <FrameAppContent {...props} />
    </Suspense>
  );
}
