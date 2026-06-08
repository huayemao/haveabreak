"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Collection, MediaItem } from '../types';
import { useTranslations } from 'next-intl';
import MediaThumbnail from './MediaThumbnail';
import useEmblaCarousel from 'embla-carousel-react';

interface CollectionBannerProps {
  collections: Collection[];
  media: MediaItem[];
  onPlay: (collection: Collection, paused?: boolean, startIndex?: number) => void;
}

export default function CollectionBanner({ collections, media, onPlay }: CollectionBannerProps) {
  const t = useTranslations();
  const [emblaIndex, setEmblaIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
  });

  useEffect(() => {
    if (emblaApi) {
   
      emblaApi.on('select', () => {
        setEmblaIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi && collections.length > 0) {
      const randomIndex = Math.floor(Math.random() * collections.length);
      emblaApi.scrollTo(randomIndex);
    }
  }, [collections]);

  const nextBanner = useCallback(() => {
    emblaApi?.scrollNext();
  }, []);

  const prevBanner = useCallback(() => {
    emblaApi?.scrollPrev();
  }, []);

  return (
    <div ref={emblaRef} className="relative overflow-hidden rounded-2xl">
      <div className="flex">
        {collections.map((collection) => {
          const bannerFirstMediaId = collection.mediaIds[0];
          const bannerFirstMedia = media.find((m) => m.id === bannerFirstMediaId);
          
          return (
            <div key={collection.id} className="flex-shrink-0 w-full">
              <div
                className="relative aspect-video bg-muted"
                onClick={() => onPlay(collection, false, 0)}
              >
                {bannerFirstMedia ? (
                  <MediaThumbnail item={bannerFirstMedia} className="w-full h-full object-cover" showPlayIcon={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-fg-muted text-sm">{t('frame.noMedia')}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                  <button className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
                    <svg className="w-20 h-20 md:w-24 md:h-24 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <p className="text-white text-lg md:text-xl font-bold">{collection.name}</p>
                  {collection.description && (
                    <p className="text-white/80 text-sm md:text-base mt-1 line-clamp-2">{collection.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-white/70 text-xs md:text-sm">
                    <span>{collection.mediaIds.length} {t('frame.media')}</span>
                    <span>•</span>
                    <span>{(collection.slideInterval / 1000).toFixed(0)}s</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {collections.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              prevBanner();
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              nextBanner();
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {collections.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1 z-10">
          {collections.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === emblaIndex ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                emblaApi?.scrollTo(index);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
