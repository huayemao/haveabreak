"use client";

import { useFrameStore } from "@haveabreak/frame/store";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  startSlideshow,
  filterMediaByOrientation,
  shuffleArray,
} from "@haveabreak/frame/utils/playerUtils";
import { downloadMediaFile } from "@haveabreak/frame/storage";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MediaThumbnail from "@haveabreak/frame/components/MediaThumbnail";
import {
  RefreshCw,
  Play,
  Download,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Shuffle,
  ListOrdered,
  Eye,
} from "lucide-react";
import { Collection, MediaItem } from "@haveabreak/frame/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@haveabreak/ui/components/ui/context-menu";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Keyboard, Mousewheel } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-cards";

const MOBILE_BREAKPOINT = 768;
const UNCOLLECTED_COLLECTION_ID = "__uncollected__";

interface FeedDeckCard {
  id: string;
  kind: "collection" | "uncollected";
  collection?: Collection;
  coverMedia: MediaItem;
  title: string;
  subtitle?: string;
  mediaCount: number;
  playableMedia: MediaItem[];
}

export default function FeedPageClient() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { media, collections, settings, generateFeedMedia } = useFrameStore();

  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  const isMobile = windowWidth < MOBILE_BREAKPOINT;

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWindowWidth(window.innerWidth));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const [refreshSeed, setRefreshSeed] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  // Ensure store feedMedia is initialized for uncollected playback ordering
  useEffect(() => {
    if (media.length > 0) {
      generateFeedMedia();
    }
  }, [media.length, generateFeedMedia]);

  // Build randomized deck of Collection cards + up to 10 Uncollected representative cards
  const deck = useMemo<FeedDeckCard[]>(() => {
    if (media.length === 0) return [];

    const mediaMap = new Map<string, MediaItem>();
    for (const item of media) {
      mediaMap.set(item.id, item);
    }

    const cards: FeedDeckCard[] = [];
    const collectedIds = new Set<string>();

    // 1. Collection cards: each collection gets 1 card with a random cover media from it
    for (const col of collections) {
      const colMedia: MediaItem[] = [];
      for (const id of col.mediaIds || []) {
        collectedIds.add(id);
        const found = mediaMap.get(id);
        if (found) colMedia.push(found);
      }

      if (colMedia.length === 0) continue;

      const orientedMedia = filterMediaByOrientation(
        colMedia,
        settings.filterByOrientation,
      );
      const pool = orientedMedia.length > 0 ? orientedMedia : colMedia;
      const randomCover = pool[Math.floor(Math.random() * pool.length)];

      cards.push({
        id: `col-${col.id}`,
        kind: "collection",
        collection: col,
        coverMedia: randomCover,
        title: col.name,
        subtitle: col.description || randomCover.title,
        mediaCount: pool.length,
        playableMedia: pool,
      });
    }

    // 2. Uncollected media: randomly pick up to 10 items as representatives of the uncollected set
    const rawUncollected = media.filter((m) => !collectedIds.has(m.id));
    if (rawUncollected.length > 0) {
      const orientedUncollected = filterMediaByOrientation(
        rawUncollected,
        settings.filterByOrientation,
      );
      const uncollectedPool =
        orientedUncollected.length > 0 ? orientedUncollected : rawUncollected;
      const representatives = shuffleArray(uncollectedPool).slice(0, 10);

      for (const repItem of representatives) {
        cards.push({
          id: `uncol-${repItem.id}`,
          kind: "uncollected",
          coverMedia: repItem,
          title: repItem.title || t("frame.defaultCollection"),
          subtitle:
            repItem.title && repItem.description
              ? repItem.description
              : t("frame.recommendedForYou"),
          mediaCount: uncollectedPool.length,
          playableMedia: uncollectedPool,
        });
      }
    }

    return shuffleArray(cards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, collections, settings.filterByOrientation, isMobile, refreshSeed]);

  // Reset activeIndex when deck changes
  useEffect(() => {
    setActiveIndex(0);
    if (swiperRef.current && !swiperRef.current.destroyed) {
      swiperRef.current.slideTo(0, 0);
    }
  }, [deck.length, refreshSeed]);

  const handleShuffleDeck = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    generateFeedMedia();
    setRefreshSeed((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 350);
  }, [generateFeedMedia, isRefreshing]);

  const goNext = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

  const goPrev = useCallback(() => {
    swiperRef.current?.slidePrev();
  }, []);

  const updateUrl = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      const queryString = newParams.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handlePlayCard = useCallback(
    (card: FeedDeckCard, shufflePlay?: boolean) => {
      const targetCollectionId =
        card.kind === "collection" && card.collection
          ? card.collection.id
          : UNCOLLECTED_COLLECTION_ID;

      startSlideshow({
        media: card.playableMedia,
        settings,
        updateUrl: (params) => {
          updateUrl({
            ...params,
            feed: "true",
            collection: targetCollectionId,
            item: card.coverMedia.id,
            index: null,
            shuffle:
              shufflePlay !== undefined
                ? shufflePlay
                  ? "true"
                  : "false"
                : null,
          });
        },
        collectionId: targetCollectionId,
        paused: false,
        index: 0,
        shuffle: shufflePlay ?? false,
        mediaType: "mixed",
      });
    },
    [settings, updateUrl],
  );

  const handleDownload = async (item: MediaItem) => {
    try {
      const ext = item.type === "image" ? "jpg" : "mp4";
      const filename = item.title
        ? `${item.title}.${ext}`
        : `media-${item.id}.${ext}`;
      await downloadMediaFile(item.url, filename);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const activeCard = deck[activeIndex] || deck[0];

  if (deck.length === 0) {
    return (
      <div className="h-[calc(100dvh-5.5rem)] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-white/10 flex items-center justify-center mb-4 text-fg-muted">
          <Layers className="w-7 h-7 stroke-[1.5]" />
        </div>
        <p className="text-fg-muted text-sm tracking-wide">
          {t("frame.noMedia")}
        </p>
      </div>
    );
  }

  return (
      <div className="relative h-[calc(100dvh-5.25rem)] flex flex-col items-center justify-center gap-6 pt-10 pb-4 overflow-hidden select-none">
        {/* Subtle Ambient Glow from Active Card Cover */}
        {activeCard?.coverMedia?.type === "image" && (
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <img
              key={activeCard.coverMedia.id}
              src={activeCard.coverMedia.url}
              alt=""
              draggable={false}
              className="w-full h-full object-cover blur-[90px] scale-125 saturate-150 opacity-15 transition-opacity duration-700"
            />
          </div>
        )}

          {/* Center Stage: Swiper EffectCards Stack with balanced proportions */}
          <div className="relative w-full flex items-center justify-center px-4">
            <Swiper
              key={`${isMobile ? "mobile" : "desktop"}-${refreshSeed}`}
              effect="cards"
              grabCursor={true}
              modules={[EffectCards, Keyboard, Mousewheel]}
              keyboard={{ enabled: true }}
              mousewheel={{ forceToAxis: true }}
              rewind={true}
              cardsEffect={{
                perSlideOffset: isMobile ? 7 : 8,
                perSlideRotate: 2.2,
                rotate: true,
                slideShadows: true,
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={(swiper) => {
                setActiveIndex(swiper.realIndex);
              }}
              className="w-[min(80vw,350px)] aspect-[3/4] max-h-[62dvh] md:w-[min(68vw,700px)] lg:w-[min(62vw,780px)] md:aspect-[16/10] md:max-h-[62dvh]"
            >
              {deck.map((card, idx) => {
                const isFront = idx === activeIndex;
                return (
                  <SwiperSlide
                    key={card.id}
                    className="rounded-[28px] overflow-hidden shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] ring-1 ring-white/15 bg-bg-base"
                  >
                    <ContextMenu>
                      <ContextMenuTrigger className="block w-full h-full">
                        <div
                          onClick={() => {
                            if (isFront) {
                              handlePlayCard(card);
                            } else {
                              swiperRef.current?.slideTo(idx);
                            }
                          }}
                          className="relative w-full h-full overflow-hidden group cursor-pointer"
                        >
                          {/* Cover Media */}
                          <MediaThumbnail
                            item={card.coverMedia}
                            aspectRatio="w-full h-full"
                            showPlayIcon={false}
                            className="w-full h-full pointer-events-none select-none transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          />

                          {/* Subtle Vignette */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />

                          {/* Top Minimal Badges */}
                          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-medium tracking-wide">
                              {card.kind === "collection" ? (
                                <>
                                  <Layers className="w-3 h-3 text-white/80" />
                                  <span>{t("frame.collections")}</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-white/80" />
                                  <span>{t("frame.defaultCollection")}</span>
                                </>
                              )}
                            </div>

                            <div className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-white/85 text-[11px] font-mono">
                              {card.mediaCount}
                            </div>
                          </div>

                          {/* Bottom Editorial Info & Play Action */}
                          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex items-end justify-between gap-4 pointer-events-none">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-white text-lg sm:text-xl font-semibold tracking-tight truncate drop-shadow-sm">
                                {card.title}
                              </h3>
                              {card.subtitle && (
                                <p className="text-white/70 text-xs sm:text-sm line-clamp-1 mt-1 font-normal">
                                  {card.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-105">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </ContextMenuTrigger>

                      <ContextMenuContent className="w-48">
                        <ContextMenuItem
                          onClick={() => handlePlayCard(card, false)}
                          className="gap-2"
                        >
                          <ListOrdered className="w-4 h-4" />
                          {t("frame.sequential")}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handlePlayCard(card, true)}
                          className="gap-2"
                        >
                          <Shuffle className="w-4 h-4" />
                          {t("frame.shuffle")}
                        </ContextMenuItem>
                        {card.kind === "collection" && card.collection && (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() =>
                                router.push(
                                  `/frame/collections/detail?collection=${card.collection!.id}`,
                                )
                              }
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              {t("frame.viewDetail")}
                            </ContextMenuItem>
                          </>
                        )}
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => handleDownload(card.coverMedia)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {t("frame.download")}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* Compact Bottom Switcher & Refresh Bar */}
          <div className="shrink-0 flex items-center justify-center gap-3 z-20">
            <button
              onClick={goPrev}
              disabled={deck.length <= 1}
              aria-label={t("frame.previous")}
              className="w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-fg-primary transition-all active:scale-90 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="min-w-[72px] text-center font-mono text-xs tracking-[0.2em] text-fg-muted">
              <span className="text-fg-primary font-semibold">
                {String(activeIndex + 1).padStart(2, "0")}
              </span>
              <span className="mx-1.5 opacity-40">/</span>
              <span>{String(deck.length).padStart(2, "0")}</span>
            </div>

            <button
              onClick={goNext}
              disabled={deck.length <= 1}
              aria-label={t("frame.next")}
              className="w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-fg-primary transition-all active:scale-90 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-fg-muted/20 mx-0.5" />

            <button
              onClick={handleShuffleDeck}
              disabled={isRefreshing}
              aria-label={t("frame.refresh")}
              title={t("frame.refresh")}
              className="group w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-fg-muted hover:text-fg-primary transition-all active:scale-90 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 transition-transform duration-500 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"
                  }`}
              />
            </button>
          </div>
        </div>
        );
}
