"use client";
import { useFrameStore } from '@/apps/frame/store';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
import { startSlideshow, filterMediaByOrientation } from '@/apps/frame/utils/playerUtils';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import MediaThumbnail from '@/apps/frame/components/MediaThumbnail';
import { RefreshCw, Play, Trash2, Download } from 'lucide-react';
import { Masonry } from 'masonic';
import { MediaItem } from '@/apps/frame/types';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

const MOBILE_BREAKPOINT = 768;
const PULL_THRESHOLD = 80;
const PULL_MAX = 160;

type MediaFilter = 'all' | 'image' | 'video';

export default function FeedPageClient() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    media,
    feedMedia,
    collections,
    settings,
    generateFeedMedia,
    deleteMedia,
  } = useFrameStore();

  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');

  const touchStartYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (feedMedia.length === 0 && media.length > 0) {
      generateFeedMedia();
    }
  }, [media, feedMedia.length, generateFeedMedia]);

  const handleRefreshWithPull = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await generateFeedMedia();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        refreshingRef.current = false;
      }, 400);
    }
  }, [generateFeedMedia]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      const touch = e.touches[0];
      touchStartYRef.current = touch.clientY;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null) return;
      if (refreshingRef.current) return;
      const touch = e.touches[0];
      const delta = touch.clientY - touchStartYRef.current;
      if (delta <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      const damped = Math.min(PULL_MAX, delta * 0.5);
      pullDistanceRef.current = damped;
      setPullDistance(damped);
    };

    const onTouchEnd = () => {
      if (touchStartYRef.current === null) return;
      touchStartYRef.current = null;
      const current = pullDistanceRef.current;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      if (current >= PULL_THRESHOLD) {
        handleRefreshWithPull();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleRefreshWithPull]);

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

  const filteredMedia = useMemo(() => {
    let list = filterMediaByOrientation(feedMedia, settings.filterByOrientation);
    if (mediaFilter === 'image') {
      list = list.filter((m) => m.type === 'image');
    } else if (mediaFilter === 'video') {
      list = list.filter((m) => m.type === 'video');
    }
    return list;
  }, [feedMedia, settings.filterByOrientation, mediaFilter]);

  const handlePlayFeedItem = (item: MediaItem, index: number) => {
    const targetCollection = collections.find((col) => col.mediaIds.includes(item.id));
    if (targetCollection) {
      const collectionMedia = media.filter((m) => targetCollection.mediaIds.includes(m.id));
      const filteredCollectionMedia = filterMediaByOrientation(collectionMedia, settings.filterByOrientation);
      const idx = filteredCollectionMedia.findIndex((m) => m.id === item.id);
      startSlideshow({
        media,
        collectionMedia,
        settings,
        updateUrl: (params) => {
          updateUrl({
            ...params,
            feed: null,
          });
        },
        collectionId: targetCollection.id,
        paused: false,
        index: idx >= 0 ? idx : 0,
        shuffle: false,
      });
    } else {
      startSlideshow({
        media: filteredMedia,
        settings,
        updateUrl: (params) => {
          updateUrl({
            ...params,
            feed: 'true',
          });
        },
        collectionId: null,
        paused: false,
        index,
        shuffle: false,
        mediaType: mediaFilter === 'all' ? 'mixed' : mediaFilter,
      });
    }
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.title || `media-${item.id}.${item.type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = (id: string) => {
    deleteMedia(id);
  };

  const FeedCard = ({ data: item, index }: { data: MediaItem; index: number }) => {
    return (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger>
          <div
            onClick={() => handlePlayFeedItem(item, index)}
            className="relative group bg-bg-base rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-white/5"
          >
            <MediaThumbnail
              item={item}
              aspectRatio="aspect-auto"
              showPlayIcon={false}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-black/10">
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <svg className="w-10 h-10 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-md">
                <Play className="w-5 h-5 fill-current" />
              </div>
            </div>
            {item.title && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs font-semibold truncate">{item.title}</p>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => handlePlayFeedItem(item, index)}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {t('frame.slideshow')}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleDownload(item)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {t('frame.download')}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleDelete(item.id)}
            className="gap-2 text-red-500 focus:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
            {t('common.delete')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWindowWidth(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const feedCardGutter = 16;
  const isMobile = windowWidth < MOBILE_BREAKPOINT;
  const feedCardColumnCount = isMobile ? 2 : undefined;
  const feedCardColumnWidth = isMobile
    ? Math.max(120, Math.floor((windowWidth - feedCardGutter * 3) / 2))
    : 220;

  const headerHeight = 80;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-fg-primary">{t('frame.feed')}</h2>
          <p className="text-sm text-fg-muted mt-1">
            {t('frame.recommendedForYou')}
          </p>
        </div>
        <button
          onClick={handleRefreshWithPull}
          disabled={isRefreshing}
          className="neumorphic-button px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('frame.refresh')}
        </button>
      </div>

      <Tabs
        value={mediaFilter}
        onValueChange={(val) => setMediaFilter(val as MediaFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">{t('frame.mixedSlideshow')}</TabsTrigger>
          <TabsTrigger value="image">{t('frame.image')}</TabsTrigger>
          <TabsTrigger value="video">{t('frame.video')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="relative">
            <div
              className="flex flex-col items-center justify-center text-xs text-fg-muted overflow-hidden"
              style={{
                height: isRefreshing
                  ? `${headerHeight}px`
                  : `${Math.min(pullDistance, headerHeight)}px`,
                transition: pullDistance > 0 || isRefreshing ? 'none' : 'height 250ms ease',
                opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
                marginTop: pullDistance > 0 ? `${pullDistance - headerHeight}px` : 0,
              }}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-accent mb-1" />
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <RefreshCw
                    className={`w-5 h-5 mb-1 transition-transform ${pullDistance >= PULL_THRESHOLD ? 'text-accent rotate-180' : ''}`}
                  />
                  <span>
                    {pullDistance >= PULL_THRESHOLD
                      ? t('frame.releaseToRefresh')
                      : t('frame.pullToRefresh')}
                  </span>
                </>
              )}
            </div>

            {filteredMedia.length === 0 ? (
              <div className="text-center py-16 bg-muted/50 rounded-3xl">
                <p className="text-fg-muted">{t('frame.noMedia')}</p>
              </div>
            ) : (
              <Masonry
                items={filteredMedia}
                columnGutter={feedCardGutter}
                columnWidth={feedCardColumnWidth}
                columnCount={feedCardColumnCount}
                render={FeedCard}
                overscanBy={2}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="image">
          <div className="relative">
            {filteredMedia.length === 0 ? (
              <div className="text-center py-16 bg-muted/50 rounded-3xl">
                <p className="text-fg-muted">{t('frame.noMedia')}</p>
              </div>
            ) : (
              <Masonry
                items={filteredMedia}
                columnGutter={feedCardGutter}
                columnWidth={feedCardColumnWidth}
                columnCount={feedCardColumnCount}
                render={FeedCard}
                overscanBy={2}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="video">
          <div className="relative">
            {filteredMedia.length === 0 ? (
              <div className="text-center py-16 bg-muted/50 rounded-3xl">
                <p className="text-fg-muted">{t('frame.noMedia')}</p>
              </div>
            ) : (
              <Masonry
                items={filteredMedia}
                columnGutter={feedCardGutter}
                columnWidth={feedCardColumnWidth}
                columnCount={feedCardColumnCount}
                render={FeedCard}
                overscanBy={2}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
