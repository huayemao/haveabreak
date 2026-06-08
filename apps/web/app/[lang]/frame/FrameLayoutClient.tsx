'use client';
import { useTranslations } from 'next-intl';
import { useFrameStore } from '@/apps/frame/store';
import FullscreenPlayer from '@/apps/frame/components/FullscreenPlayer';
import AddMediaModal from '@/apps/frame/components/AddMediaModal';
import { usePathname, useRouter, Link } from 'i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useEffect, useCallback, useMemo, Suspense } from 'react';
import { Plus, Settings, Image as ImageIcon, Video } from 'lucide-react';
import NeumorphicBottomNav from '@/components/NeumorphicBottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import { startSlideshow, filterMediaByOrientation } from '@/apps/frame/utils/playerUtils';
import { MediaItem } from '@/apps/frame/types';

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
    return filterMediaByOrientation(mediaList, settings.filterByOrientation);
  }, [selectedCollectionId, collections, media, settings.filterByOrientation]);

  const imageMedia = useMemo(() => currentMedia.filter((m) => m.type === 'image'), [currentMedia]);
  const videoMedia = useMemo(() => currentMedia.filter((m) => m.type === 'video'), [currentMedia]);

  const handleExitFullscreen = () => {
    updateUrl({
      player: null,
      paused: null,
      index: null
    });
  };

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

  const handleStartImageSlideshow = (paused = false, index = 0) => {
    startSlideshow({
      media: imageMedia,
      settings,
      updateUrl,
      collectionId: null,
      paused,
      index
    });
  };

  const handleStartVideoSlideshow = (paused = false, index = 0) => {
    startSlideshow({
      media: videoMedia,
      settings,
      updateUrl,
      collectionId: null,
      paused,
      index
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
    <div className="bg-bg-base pb-20 min-h-screen">
      <InstallPrompt appId="frame" />
      <header className="bg-bg-base/90 backdrop-blur-lg border-b border-white/10 transition-all duration-300 mt-6">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {imageMedia.length > 0 && (
                <button
                  onClick={() => handleStartImageSlideshow(false)}
                  className="neumorphic-button-primary p-2 flex items-center gap-2 rounded-2xl"
                  title={t('frame.imageSlideshow')}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">{t('frame.imageSlideshow')}</span>
                </button>
              )}
              {videoMedia.length > 0 && (
                <button
                  onClick={() => handleStartVideoSlideshow(false)}
                  className="neumorphic-button-primary p-2 flex items-center gap-2 rounded-2xl"
                  title={t('frame.videoSlideshow')}
                >
                  <Video className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">{t('frame.videoSlideshow')}</span>
                </button>
              )}
              {currentMedia.length > 0 && (
                <button
                  onClick={() => handleStartSlideshow(false)}
                  className="neumorphic-button-primary p-2 flex items-center gap-2 rounded-2xl"
                  title={t('frame.mixedSlideshow')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                  </svg>
                  <span className="hidden sm:inline text-sm">{t('frame.mixedSlideshow')}</span>
                </button>
              )}
            </div>
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
