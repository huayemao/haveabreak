"use client";
import { useState, useEffect, useCallback } from 'react';
import { MediaItem, Collection, FrameSettings, MediaType } from './types';
import {
  getStoredMedia,
  addMedia,
  deleteMedia,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getSettings,
  saveSettings,
  exportData,
  importData,
  importUrlList,
} from './storage';
import { Dictionary } from '@/dictionaries';
import FullscreenPlayer from './components/FullscreenPlayer';
import MediaGallery from './components/MediaGallery';
import CollectionManager from './components/CollectionManager';
import SettingsPanel from './components/SettingsPanel';
import Downloader from './components/Downloader';

type ViewMode = 'gallery' | 'collections' | 'settings' | 'download';

interface FrameAppProps {
  dict: Dictionary;
}

export default function FrameApp({ dict }: FrameAppProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<FrameSettings>({
    autoPlay: true,
    slideInterval: 5000,
    showInfo: false,
    shuffle: false,
    filterByOrientation: true,
    backgroundMusicEnabled: false,
    volume: 0.3,
  });
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [startPaused, setStartPaused] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mediaData, collectionsData, settingsData] = await Promise.all([
        getStoredMedia(),
        getCollections(),
        getSettings(),
      ]);
      setMedia(mediaData);
      setCollections(collectionsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddMedia = async (url: string, type: MediaType, title?: string) => {
    try {
      const newItem = await addMedia(url, type, title);
      setMedia((prev) => [...prev, newItem]);
    } catch (error) {
      console.error('Failed to add media:', error);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    await deleteMedia(id);
    setMedia((prev) => prev.filter((m) => m.id !== id));
    setCollections((prev) =>
      prev.map((col) => ({
        ...col,
        mediaIds: col.mediaIds.filter((mid) => mid !== id),
      }))
    );
  };

  const handleCreateCollection = async (name: string, description?: string, mediaIds?: string[]) => {
    const newCollection = await createCollection(name, description, mediaIds);
    setCollections((prev) => [...prev, newCollection]);
  };

  const handleUpdateCollection = async (id: string, updates: Partial<Collection>) => {
    await updateCollection(id, updates);
    setCollections((prev) =>
      prev.map((col) => (col.id === id ? { ...col, ...updates, updatedAt: Date.now() } : col))
    );
  };

  const handleDeleteCollection = async (id: string) => {
    await deleteCollection(id);
    setCollections((prev) => prev.filter((col) => col.id !== id));
    if (selectedCollectionId === id) {
      setSelectedCollectionId(null);
    }
  };

  const handleUpdateSettings = (newSettings: FrameSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

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

  const handleImport = (data: string) => {
    importData(data);
    loadData();
  };

  const handleImportUrlList = async (urls: string[]) => {
    await importUrlList(urls);
    loadData();
  };

  const handleStartSlideshow = (paused = false, index = 0) => {
    setStartPaused(paused);
    setStartIndex(index);
    setShowFullscreen(true);
  };

  const handlePlayCollection = (collection: Collection, paused = false, startIndex = 0) => {
    setSelectedCollectionId(collection.id);
    setStartPaused(paused);
    setStartIndex(startIndex);
    setShowFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setShowFullscreen(false);
    setStartPaused(false);
  };

  const getCurrentMedia = () => {
    if (selectedCollectionId) {
      const collection = collections.find((col) => col.id === selectedCollectionId);
      if (collection) {
        return media.filter((m) => collection.mediaIds.includes(m.id));
      }
    }
    return media;
  };

  const currentMedia = getCurrentMedia();

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
                onClick={() => { setViewMode('gallery');  }}
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
                onClick={() => { setViewMode('collections');  }}
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
                onClick={() => { setViewMode('download');  }}
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
                onClick={() => { setViewMode('settings');  }}
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
            onDelete={handleDeleteMedia}
            onAdd={handleAddMedia}
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
            onCreate={handleCreateCollection}
            onUpdate={handleUpdateCollection}
            onDelete={handleDeleteCollection}
            onShare={() => { }}
            onPlay={handlePlayCollection}
            onMediaAdd={handleAddMedia}
            onMediaDelete={handleDeleteMedia}
            dict={dict}
          />
        )}

        {viewMode === 'download' && (
          <Downloader media={currentMedia} dict={dict} />
        )}

        {viewMode === 'settings' && (
          <SettingsPanel
            settings={settings}
            onUpdate={handleUpdateSettings}
            onExport={handleExport}
            onImport={handleImport}
            onImportUrlList={handleImportUrlList}
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
          onDelete={handleDeleteMedia}
          startPaused={startPaused}
          startIndex={startIndex}
        />
      )}
    </div>
  );
}
