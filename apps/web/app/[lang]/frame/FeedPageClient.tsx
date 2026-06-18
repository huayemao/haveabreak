"use client";
import { useFrameStore } from '@/apps/frame/store';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
import { startSlideshow, filterMediaByOrientation } from '@/apps/frame/utils/playerUtils';
import { useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import MediaThumbnail from '@/apps/frame/components/MediaThumbnail';
import { RefreshCw, Play } from 'lucide-react';

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

  const handleRefresh = () => {
    generateFeedMedia();
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
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
          {displayedMedia.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handlePlayFeedItem(index)}
              className="break-inside-avoid relative group bg-bg-base rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-white/5 mb-4"
            >
              <MediaThumbnail
                item={item}
                aspectRatio="aspect-auto"
                showPlayIcon={false}
                className="w-full h-auto"
              />
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
          ))}
        </div>
      )}
    </div>
  );
}
