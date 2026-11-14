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
import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import MediaThumbnail from "@haveabreak/frame/components/MediaThumbnail";
import {
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Layers,
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
const PULL_THRESHOLD = 80;
const PULL_MAX = 150;
const UNCOLLECTED_COLLECTION_ID = "__uncollected__";
const SWIPER_MODULES = [EffectCards, Keyboard, Mousewheel];
const KEYBOARD_CONFIG = { enabled: true };
const MOUSEWHEEL_CONFIG = { forceToAxis: true };

interface FeedDeckCard {
  id: string;
  kind: "collection" | "uncollected";
  collection?: Collection;
  coverMedia: MediaItem;
  title: string;
  playableMedia: MediaItem[];
}

interface FeedCardViewProps {
  card: FeedDeckCard;
  isFront: boolean;
  sequentialLabel: string;
  shuffleLabel: string;
  viewDetailLabel: string;
  downloadLabel: string;
  onCardClick: (card: FeedDeckCard) => void;
  onPlayCard: (card: FeedDeckCard, shufflePlay?: boolean) => void;
  onViewDetail: (collectionId: string) => void;
  onDownload: (item: MediaItem) => void;
}

const FeedCardView = React.memo(function FeedCardView({
  card,
  isFront,
  sequentialLabel,
  shuffleLabel,
  viewDetailLabel,
  downloadLabel,
  onCardClick,
  onPlayCard,
  onViewDetail,
  onDownload,
}: FeedCardViewProps) {
  const innerCard = (
    <div
      onClick={() => onCardClick(card)}
      className="relative w-full h-full overflow-hidden group cursor-pointer bg-bg-base select-none"
    >
      {/* Cover Media */}
      <MediaThumbnail
        item={card.coverMedia}
        aspectRatio="w-full h-full"
        showPlayIcon={false}
        className="w-full h-full pointer-events-none select-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />

      {/* Minimalist Bottom Gradient & Collection Name Only */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pt-16 pb-5 px-6 pointer-events-none">
        <h3 className="text-white text-base sm:text-lg font-medium tracking-wide truncate drop-shadow-sm">
          {card.title}
        </h3>
      </div>
    </div>
  );

  if (!isFront) {
    return innerCard;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block w-full h-full">
        {innerCard}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => onPlayCard(card, false)}
          className="gap-2"
        >
          <ListOrdered className="w-4 h-4" />
          {sequentialLabel}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onPlayCard(card, true)}
          className="gap-2"
        >
          <Shuffle className="w-4 h-4" />
          {shuffleLabel}
        </ContextMenuItem>
        {card.kind === "collection" && card.collection && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onViewDetail(card.collection!.id)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {viewDetailLabel}
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDownload(card.coverMedia)}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {downloadLabel}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

/**
 * Strictly limits visible slides in Swiper EffectCards to the 3-card stack (progress in [-2, 0]),
 * eliminating 3D preserve-3d Z-fighting and GPU overdraw when there are many slides.
 */
function syncSlidesVisibility(swiper: SwiperType) {
  const slides = swiper.slides;
  if (!slides) return;

  for (let i = 0; i < slides.length; i += 1) {
    const slideEl = slides[i] as HTMLElement & { progress?: number };
    const p = slideEl.progress ?? 0;

    if (p <= -2.95 || p >= 0.98) {
      slideEl.style.visibility = "hidden";
      slideEl.style.opacity = "0";
      slideEl.style.pointerEvents = "none";
    } else if (p < -2) {
      slideEl.style.visibility = "visible";
      slideEl.style.opacity = String(Math.max(0, Math.min(1, 3 + p)));
      slideEl.style.pointerEvents = "none";
    } else if (p > 0) {
      slideEl.style.visibility = "visible";
      slideEl.style.opacity = String(Math.max(0, Math.min(1, 1 - p)));
      slideEl.style.pointerEvents = "none";
    } else {
      slideEl.style.visibility = "visible";
      slideEl.style.opacity = "1";
      slideEl.style.pointerEvents = p > -0.5 ? "auto" : "none";
    }
  }
}

export default function FeedPageClient() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const media = useFrameStore((s) => s.media);
  const collections = useFrameStore((s) => s.collections);
  const feedFilter = useFrameStore((s) => s.feedFilter);
  const settings = useFrameStore((s) => s.settings);
  const generateFeedMedia = useFrameStore((s) => s.generateFeedMedia);

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false,
  );

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile((prev) => (prev !== mobile ? mobile : prev));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [refreshSeed, setRefreshSeed] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const swiperRef = useRef<SwiperType | null>(null);

  // Pull-to-refresh state
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const handleRefreshWithPull = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    generateFeedMedia();
    setRefreshSeed((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      refreshingRef.current = false;
    }, 400);
  }, [generateFeedMedia]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      const touch = e.touches[0];
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (
        touchStartYRef.current === null ||
        touchStartXRef.current === null ||
        refreshingRef.current
      ) {
        return;
      }
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      // Ignore horizontal swipes on the card stack
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        touchStartYRef.current = null;
        touchStartXRef.current = null;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      if (deltaY <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      const damped = Math.min(PULL_MAX, deltaY * 0.5);
      pullDistanceRef.current = damped;
      setPullDistance(damped);
    };

    const onTouchEnd = () => {
      if (touchStartYRef.current === null) return;
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      const current = pullDistanceRef.current;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      if (current >= PULL_THRESHOLD) {
        handleRefreshWithPull();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [handleRefreshWithPull]);

  // Build randomized deck of Collection cards + up to 10 Uncollected representative cards
  const deck = useMemo<FeedDeckCard[]>(() => {
    if (media.length === 0) return [];

    const filterByType = (list: MediaItem[]) => {
      if (feedFilter === "image") return list.filter((m) => m.type === "image");
      if (feedFilter === "video") return list.filter((m) => m.type === "video");
      return list;
    };

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

      const typedMedia = filterByType(colMedia);
      if (typedMedia.length === 0) continue;

      const orientedMedia = filterMediaByOrientation(
        typedMedia,
        settings.filterByOrientation,
      );
      const pool = orientedMedia.length > 0 ? orientedMedia : typedMedia;
      const randomCover = pool[Math.floor(Math.random() * pool.length)];

      cards.push({
        id: `col-${col.id}`,
        kind: "collection",
        collection: col,
        coverMedia: randomCover,
        title: col.name,
        playableMedia: pool,
      });
    }

    // 2. Uncollected media: randomly pick up to 10 items as representatives of the uncollected set
    const rawUncollected = filterByType(
      media.filter((m) => !collectedIds.has(m.id)),
    );
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
          playableMedia: uncollectedPool,
        });
      }
    }

    return shuffleArray(cards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    media,
    collections,
    feedFilter,
    settings.filterByOrientation,
    isMobile,
    refreshSeed,
  ]);

  // Reset activeIndex when deck or filter changes
  useEffect(() => {
    setActiveIndex(0);
    if (swiperRef.current && !swiperRef.current.destroyed) {
      swiperRef.current.slideTo(0, 0);
      syncSlidesVisibility(swiperRef.current);
    }
  }, [deck.length, feedFilter, refreshSeed]);

  const cardsEffectConfig = useMemo(
    () => ({
      perSlideOffset: isMobile ? 7 : 8,
      perSlideRotate: 2.2,
      rotate: true,
      slideShadows: false,
    }),
    [isMobile],
  );

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
      const mediaType = feedFilter === "all" ? "mixed" : feedFilter;

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
        mediaType,
      });
    },
    [feedFilter, settings, updateUrl],
  );

  const handleCardClick = useCallback(
    (card: FeedDeckCard) => {
      const currentCard = deck[activeIndex];
      if (currentCard && currentCard.id === card.id) {
        handlePlayCard(card);
      } else {
        const targetIdx = deck.findIndex((c) => c.id === card.id);
        if (targetIdx >= 0) {
          swiperRef.current?.slideTo(targetIdx);
        }
      }
    },
    [deck, activeIndex, handlePlayCard],
  );

  const handleViewDetail = useCallback(
    (collectionId: string) => {
      router.push(`/frame/collections/detail?collection=${collectionId}`);
    },
    [router],
  );

  const handleDownload = useCallback(async (item: MediaItem) => {
    try {
      const ext = item.type === "image" ? "jpg" : "mp4";
      const filename = item.title
        ? `${item.title}.${ext}`
        : `media-${item.id}.${ext}`;
      await downloadMediaFile(item.url, filename);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, []);

  const handleSwiperInit = useCallback((swiper: SwiperType) => {
    swiperRef.current = swiper;
    syncSlidesVisibility(swiper);
  }, []);

  const handleSwiperProgress = useCallback((swiper: SwiperType) => {
    syncSlidesVisibility(swiper);
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
    syncSlidesVisibility(swiper);
  }, []);

  const sequentialLabel = t("frame.sequential");
  const shuffleLabel = t("frame.shuffle");
  const viewDetailLabel = t("frame.viewDetail");
  const downloadLabel = t("frame.download");

  const headerHeight = 64;

  return (
    <div className="relative h-[calc(100dvh-8.5rem)] flex flex-col items-center justify-center gap-5 py-2 overflow-hidden select-none">
      {/* Pull-to-Refresh Indicator */}
      <div
        className="flex flex-col items-center justify-center text-xs text-fg-muted overflow-hidden shrink-0 pointer-events-none"
        style={{
          height: isRefreshing
            ? `${headerHeight}px`
            : `${Math.min(pullDistance, headerHeight)}px`,
          transition:
            pullDistance > 0 || isRefreshing ? "none" : "height 250ms ease",
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
        }}
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-accent mb-1" />
            <span>{t("common.loading")}</span>
          </>
        ) : (
          <>
            <RefreshCw
              className={`w-4 h-4 mb-1 transition-transform ${
                pullDistance >= PULL_THRESHOLD ? "text-accent rotate-180" : ""
              }`}
            />
            <span>
              {pullDistance >= PULL_THRESHOLD
                ? t("frame.releaseToRefresh")
                : t("frame.pullToRefresh")}
            </span>
          </>
        )}
      </div>

      {deck.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-white/10 flex items-center justify-center mb-4 text-fg-muted">
            <Layers className="w-7 h-7 stroke-[1.5]" />
          </div>
          <p className="text-fg-muted text-sm tracking-wide">
            {t("frame.noMedia")}
          </p>
        </div>
      ) : (
        <>
          {/* Center Stage: 3-Card Stack with windowed rendering and Z-plane culling */}
          <div className="relative w-full flex items-center justify-center px-4">
            <Swiper
              key={`${isMobile ? "mobile" : "desktop"}-${feedFilter}-${refreshSeed}`}
              effect="cards"
              grabCursor={true}
              modules={SWIPER_MODULES}
              keyboard={KEYBOARD_CONFIG}
              mousewheel={MOUSEWHEEL_CONFIG}
              rewind={true}
              cardsEffect={cardsEffectConfig}
              onSwiper={handleSwiperInit}
              onProgress={handleSwiperProgress}
              onSetTranslate={handleSwiperProgress}
              onSlideChange={handleSlideChange}
              className="w-[min(80vw,350px)] aspect-[3/4] max-h-[60dvh] md:w-[min(68vw,700px)] lg:w-[min(62vw,780px)] md:aspect-[16/10] md:max-h-[60dvh]"
            >
              {deck.map((card, idx) => {
                // Only mount DOM/media for slides within the visible 3-card stack window [activeIndex - 1, activeIndex + 3]
                const isNear =
                  (idx >= activeIndex - 1 && idx <= activeIndex + 3) ||
                  (activeIndex === 0 && idx === deck.length - 1) ||
                  (activeIndex >= deck.length - 3 && idx <= 2);

                return (
                  <SwiperSlide
                    key={card.id}
                    className="rounded-[28px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/15 bg-bg-base"
                  >
                    {isNear ? (
                      <FeedCardView
                        card={card}
                        isFront={idx === activeIndex}
                        sequentialLabel={sequentialLabel}
                        shuffleLabel={shuffleLabel}
                        viewDetailLabel={viewDetailLabel}
                        downloadLabel={downloadLabel}
                        onCardClick={handleCardClick}
                        onPlayCard={handlePlayCard}
                        onViewDetail={handleViewDetail}
                        onDownload={handleDownload}
                      />
                    ) : null}
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
              className="w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/70 border border-white/10 flex items-center justify-center text-fg-primary transition-all active:scale-90 disabled:opacity-30 cursor-pointer"
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
              className="w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/70 border border-white/10 flex items-center justify-center text-fg-primary transition-all active:scale-90 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-fg-muted/20 mx-0.5" />

            <button
              onClick={handleRefreshWithPull}
              disabled={isRefreshing}
              aria-label={t("frame.refresh")}
              title={t("frame.refresh")}
              className="group w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/70 border border-white/10 flex items-center justify-center text-fg-muted hover:text-fg-primary transition-all active:scale-90 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 transition-transform duration-500 ${
                  isRefreshing ? "animate-spin" : "group-hover:rotate-180"
                }`}
              />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
