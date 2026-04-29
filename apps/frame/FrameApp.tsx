"use client";
import { useState, useEffect, useCallback } from 'react';
import { MediaItem, Collection, FrameSettings, MediaType } from './types';
import {
  getStoredMedia,
  saveMedia,
  addMedia,
  deleteMedia,
  getCollections,
  saveCollections,
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
import MediaLibrary from './components/MediaLibrary';
import CollectionManager from './components/CollectionManager';
import SettingsPanel from './components/SettingsPanel';
import Downloader from './components/Downloader';

type TabType = 'media' | 'collections' | 'slideshow' | 'settings' | 'download';

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
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [showFullscreen, setShowFullscreen] = useState(false);
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
    setSelectedMediaIds((prev) => prev.filter((mid) => mid !== id));
    setCollections((prev) =>
      prev.map((col) => ({
        ...col,
        mediaIds: col.mediaIds.filter((mid) => mid !== id),
      }))
    );
  };

  const handleSelectMedia = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
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

  const handleStartSlideshow = () => {
    setShowFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setShowFullscreen(false);
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-fg-primary font-display">
                {dict.frame.appTitle}
              </h1>
              <p className="text-sm text-fg-muted">{dict.frame.appSubtitle}</p>
            </div>
            {activeTab !== 'slideshow' && currentMedia.length > 0 && (
              <button
                onClick={handleStartSlideshow}
                className="neumorphic-button-primary px-6 py-2"
              >
                {dict.frame.slideshow}
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="sticky top-[72px] z-30 bg-bg-base/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'media' as TabType, label: dict.frame.mediaLibrary },
              { id: 'collections' as TabType, label: dict.frame.collections },
              { id: 'download' as TabType, label: dict.frame.download },
              { id: 'settings' as TabType, label: dict.frame.settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'neumorphic-button'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'media' && (
          <MediaLibrary
            media={media}
            selectedIds={selectedMediaIds}
            onSelect={handleSelectMedia}
            onDelete={handleDeleteMedia}
            onAdd={handleAddMedia}
            dict={dict}
          />
        )}

        {activeTab === 'collections' && (
          <CollectionManager
            collections={collections}
            media={media}
            selectedCollectionId={selectedCollectionId}
            onSelect={setSelectedCollectionId}
            onCreate={handleCreateCollection}
            onUpdate={handleUpdateCollection}
            onDelete={handleDeleteCollection}
            onShare={() => {}}
            dict={dict}
          />
        )}

        {activeTab === 'download' && (
          <Downloader media={currentMedia} dict={dict} />
        )}

        {activeTab === 'settings' && (
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
        />
      )}
    </div>
  );
}