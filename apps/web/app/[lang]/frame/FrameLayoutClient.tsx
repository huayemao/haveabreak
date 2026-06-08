'use client';
import { useTranslations } from 'next-intl';
import { useFrameStore } from '@/apps/frame/store';
import { MediaItem } from '@/apps/frame/types';
import FullscreenPlayer from '@/apps/frame/components/FullscreenPlayer';
import AddMediaModal from '@/apps/frame/components/AddMediaModal';
import { usePathname, useRouter, Link } from 'i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useEffect, useCallback, useMemo, Suspense } from 'react';
import { Plus, Settings } from 'lucide-react';
import NeumorphicBottomNav from '@/components/NeumorphicBottomNav';
import InstallPrompt from '@/components/InstallPrompt';

export default function FrameLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    media,
    collections,
    settings,
    isLoading,
    isImporting,
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
          <p className="text-fg-muted">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const baseRoute = `/frame`;
  const isGallery = pathname === `${baseRoute}/gallery`;
  const isCollections = pathname.startsWith(`${baseRoute}/collections`) || pathname === baseRoute;
  const isDownload = pathname === `${baseRoute}/download`;
  const isSettings = pathname === `${baseRoute}/settings`;

  const navItems = [
    {
      href: `${baseRoute}/collections`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      label: t('frame.collections'),
      activePath: `${baseRoute}/collections`,
    },
    {
      href: `${baseRoute}/gallery`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      label: t('frame.mediaLibrary'),
      activePath: `${baseRoute}/gallery`,
    },
    {
      href: `${baseRoute}/download`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      label: t('frame.download'),
      activePath: `${baseRoute}/download`,
    },
    {
      href: `${baseRoute}/settings`,
      icon: <Settings className="w-5 h-5" />,
      label: t('frame.settings'),
      variant: 'action' as const,
    },
  ];

  return (
    <div className="bg-bg-base pb-20">
      <InstallPrompt appId="frame" />
      <header className=" bg-bg-base/90 backdrop-blur-lg border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {media.length > 0 && (
              <button
                onClick={() => handleStartSlideshow(false)}
                className="neumorphic-button-primary p-2 flex items-center gap-2 rounded-2xl"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="hidden sm:inline text-sm">{t('frame.slideshow')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>

      <NeumorphicBottomNav items={navItems} />

      {showFullscreen && (
        <FullscreenPlayer
          media={currentMedia}
          settings={settings}
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
        isImporting={isImporting}
        collectionId={selectedCollectionId || undefined}
      />
    </div>
  );
}
