"use client";
import { useFrameStore } from '@/apps/frame/store';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
import { startSlideshow, filterMediaByOrientation } from '@/apps/frame/utils/playerUtils';
import { useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import MediaThumbnail from '@/apps/frame/components/MediaThumbnail';
import { RefreshCw, Play, Trash2, Download } from 'lucide-react';
import { Masonry } from 'masonic';
import { MediaItem } from '@/apps/frame/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

export default function FeedPageClient() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    media,
    feedMedia,
    settings,
    generateFeedMedia,
    deleteMedia,
  } = useFrameStore();

  useEffect(() => {
    if (feedMedia.length === 0 && media.length > 0) {
      generateFeedMedia();
    }
  }, [media, feedMedia.length, generateFeedMedia]);

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

  const displayedMedia = useMemo(() => {
    return filterMediaByOrientation(feedMedia, settings.filterByOrientation);
  }, [feedMedia, settings.filterByOrientation]);

  const handlePlayFeedItem = (index: number) => {
    startSlideshow({
      media: displayedMedia,
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
    });
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

  const handleRefresh = () => {
    generateFeedMedia();
  };

  const FeedCard = ({ data: item, index }: { data: MediaItem; index: number }) => {
    return (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger>
          <div
            onClick={() => handlePlayFeedItem(index)}
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
            onClick={() => handlePlayFeedItem(index)}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {t('frame.slideshow') || 'Slideshow'}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleDownload(item)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {t('frame.download') || 'Download'}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-fg-primary">{t('frame.feed') || 'Feed'}</h2>
          <p className="text-sm text-fg-muted mt-1">
            {t('frame.recommendedForYou') || 'Recommended for you'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="neumorphic-button px-4 py-2 text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('frame.refresh') || 'Refresh'}
        </button>
      </div>

      {displayedMedia.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-3xl">
          <p className="text-fg-muted">{t('frame.noMedia')}</p>
        </div>
      ) : (
        <Masonry
          items={displayedMedia}
          columnGutter={16}
          columnWidth={220}
          render={FeedCard}
        />
      )}
    </div>
  );
}
