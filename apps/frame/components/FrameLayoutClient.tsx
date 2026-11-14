"use client";
import { useTranslations } from "next-intl";
import { useFrameStore, FeedMediaFilter } from "@haveabreak/frame/store";
import FullscreenPlayer from "@haveabreak/frame/components/FullscreenPlayer";
import AddMediaModal from "@haveabreak/frame/components/AddMediaModal";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useEffect, useCallback, useMemo, Suspense } from "react";
import {
  Settings,
  Image as ImageIcon,
  Video,
  Layers,
  LayoutGrid,
  Sparkles,
  ArrowLeft,
  FolderKanban,
} from "lucide-react";
import InstallPrompt from "@/components/InstallPrompt";
import {
  startSlideshow,
  filterMediaByOrientation,
} from "@haveabreak/frame/utils/playerUtils";
import { MediaItem } from "@haveabreak/frame/types";

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
    feedMedia,
    feedFilter,
    setFeedFilter,
    settings,
    isLoading,
    isImporting,
    loadData,
    addMedia,
    deleteMedia,
    importUrlList,
  } = useFrameStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global UI states (Query Params)
  const showFullscreen = searchParams.get("player") === "true";
  const showAddModal = searchParams.get("modal") === "add";
  const startIndex = parseInt(searchParams.get("index") || "0", 10);
  const startPaused = searchParams.get("paused") === "true";
  const selectedCollectionId = searchParams.get("collection");
  const selectedItemId = searchParams.get("item");

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

  const handleCloseModal = () => updateUrl({ modal: null });

  const isFeed = searchParams.get("feed") === "true";

  const currentMedia = useMemo(() => {
    let mediaList: MediaItem[];
    if (selectedCollectionId && !isFeed) {
      const collection = collections.find(
        (col) => col.id === selectedCollectionId,
      );
      if (collection) {
        mediaList = media.filter((m) => collection.mediaIds.includes(m.id));
      } else {
        mediaList = media;
      }
    } else if (isFeed) {
      const baseFeed = feedMedia.length > 0 ? feedMedia : media;
      if (selectedCollectionId === "__uncollected__") {
        const collectedIds = new Set(
          collections.flatMap((col) => col.mediaIds || []),
        );
        const uncollectedMedia = baseFeed.filter(
          (m) => !collectedIds.has(m.id),
        );
        const itemIdx = selectedItemId
          ? uncollectedMedia.findIndex((m) => m.id === selectedItemId)
          : -1;
        mediaList =
          itemIdx >= 0
            ? [
                uncollectedMedia[itemIdx],
                ...uncollectedMedia.slice(0, itemIdx),
                ...uncollectedMedia.slice(itemIdx + 1),
              ]
            : uncollectedMedia;
      } else if (selectedCollectionId) {
        const collection = collections.find(
          (col) => col.id === selectedCollectionId,
        );
        if (collection) {
          const collectionMedia = (collection.mediaIds || [])
            .map((id) => media.find((m) => m.id === id))
            .filter((m): m is MediaItem => !!m);

          const itemIdx = selectedItemId
            ? collectionMedia.findIndex((m) => m.id === selectedItemId)
            : -1;

          mediaList =
            itemIdx >= 0
              ? [
                  ...collectionMedia.slice(itemIdx),
                  ...collectionMedia.slice(0, itemIdx),
                ]
              : collectionMedia;
        } else {
          mediaList = baseFeed;
        }
      } else {
        mediaList = baseFeed;
      }
    } else {
      mediaList = media;
    }
    const filtered = filterMediaByOrientation(
      mediaList,
      settings.filterByOrientation,
    );
    return filtered.length > 0 ? filtered : mediaList;
  }, [
    selectedCollectionId,
    selectedItemId,
    collections,
    media,
    feedMedia,
    settings.filterByOrientation,
    isFeed,
  ]);

  const currentCollection = useMemo(() => {
    if (!selectedCollectionId) return null;
    return collections.find((col) => col.id === selectedCollectionId);
  }, [selectedCollectionId, collections]);

  const handleExitFullscreen = () => {
    updateUrl({
      player: null,
      paused: null,
      index: null,
      shuffle: null,
      mediaType: null,
      item: null,
      ...(isFeed ? { collection: null, feed: null } : {}),
    });
  };

  const baseRoute = `/frame`;
  const isFeedPage = pathname === baseRoute || pathname === `${baseRoute}/`;
  const isGallery = pathname === `${baseRoute}/gallery`;
  const isCollections = pathname.startsWith(`${baseRoute}/collections`);
  const isSettings = pathname === `${baseRoute}/settings`;
  const isManage = isCollections || isGallery;

  const pageTitle = isFeedPage
    ? t("frame.feed")
    : isCollections
      ? t("frame.collections")
      : isGallery
        ? t("frame.mediaLibrary")
        : isSettings
          ? t("frame.settings")
          : t("frame.appTitle");

  const feedTabs: {
    value: FeedMediaFilter;
    label: string;
    icon: typeof Sparkles;
  }[] = [
    {
      value: "all",
      label: t("frame.mixedSlideshow"),
      icon: Sparkles,
    },
    {
      value: "image",
      label: t("frame.image"),
      icon: ImageIcon,
    },
    {
      value: "video",
      label: t("frame.video"),
      icon: Video,
    },
  ];

  const urlShuffle = searchParams.get("shuffle");
  const urlMediaType = searchParams.get("mediaType");
  const playShuffle =
    urlShuffle !== null
      ? urlShuffle === "true"
      : isFeed
        ? false
        : settings.shuffle;

  const playMedia = useMemo(() => {
    if (urlMediaType === "image") {
      return currentMedia.filter((m) => m.type === "image");
    }
    if (urlMediaType === "video") {
      return currentMedia.filter((m) => m.type === "video");
    }
    return currentMedia;
  }, [currentMedia, urlMediaType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-fg-muted">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-base pb-20 min-h-screen">
      <InstallPrompt appId="frame" />

      {/* Unified Top Bar: Left = Navigation Title, Right = Clever Manage & Settings Entries */}
      <header className="max-w-7xl mx-auto px-5 pt-6 pb-2 flex items-center justify-between gap-4 z-30 relative">
        {/* Top-Left: Navigation Title (with Back button on subpages) */}
        <div className="flex items-center gap-3 min-w-0">
          {!isFeedPage && (
            <Link
              href={baseRoute}
              className="w-9 h-9 rounded-full bg-bg-base shadow-extruded-sm active:shadow-inset border border-white/10 flex items-center justify-center text-fg-muted hover:text-fg-primary transition-all shrink-0"
              title={t("frame.feed")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-fg-primary truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Top-Right: Unified Manage Switcher (Collections + Gallery) & Settings Entry */}
        <div className="flex items-center gap-2 shrink-0">
          {isManage ? (
            /* Inside Manage: Segmented Switcher between Collections & Media Library */
            <div className="flex items-center p-1 rounded-full bg-bg-base shadow-inset border border-white/5">
              <Link
                href={`${baseRoute}/collections`}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isCollections
                    ? "bg-accent text-white shadow-extruded-sm"
                    : "text-fg-muted hover:text-fg-primary"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t("frame.collections")}</span>
              </Link>
              <Link
                href={`${baseRoute}/gallery`}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isGallery
                    ? "bg-accent text-white shadow-extruded-sm"
                    : "text-fg-muted hover:text-fg-primary"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t("frame.mediaLibrary")}</span>
              </Link>
            </div>
          ) : (
            /* Outside Manage: Single Subtle Manage Entry Pill */
            <Link
              href={`${baseRoute}/collections`}
              title={`${t("frame.collections")} / ${t("frame.mediaLibrary")}`}
              className="w-9 h-9 rounded-full bg-bg-base/80 hover:bg-bg-base shadow-extruded-sm active:shadow-inset border border-white/10 flex items-center justify-center text-fg-muted hover:text-fg-primary transition-all"
            >
              <FolderKanban className="w-4 h-4" />
            </Link>
          )}

          {/* Settings Entry Pill (Toggles back to Feed if already on Settings) */}
          <Link
            href={isSettings ? baseRoute : `${baseRoute}/settings`}
            title={t("frame.settings")}
            className={`w-9 h-9 rounded-full border border-white/10 flex items-center justify-center transition-all ${
              isSettings
                ? "bg-accent text-white shadow-extruded-sm"
                : "bg-bg-base/80 hover:bg-bg-base shadow-extruded-sm active:shadow-inset text-fg-muted hover:text-fg-primary"
            }`}
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main
        className={
          isFeedPage
            ? "max-w-7xl mx-auto px-4"
            : "max-w-7xl mx-auto px-4 py-4"
        }
      >
        <Suspense fallback={null}>{children}</Suspense>
      </main>

      {/* Bottom Floating Media Filter Tabs (Icon-only on mobile, Icon + Label on sm+) */}
      {isFeedPage && (
        <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-[50] flex items-center p-1.5 rounded-full bg-bg-base/85 backdrop-blur-lg shadow-extruded border border-white/10">
          {feedTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const active = feedFilter === tab.value;
            return (
              <div key={tab.value} className="flex items-center">
                {idx > 0 && <div className="w-px h-5 bg-fg-muted/15 mx-1" />}
                <button
                  onClick={() => setFeedFilter(tab.value)}
                  title={tab.label}
                  aria-label={tab.label}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-accent text-white shadow-extruded-sm scale-[1.03]"
                      : "text-fg-muted hover:text-fg-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showFullscreen && (
        <FullscreenPlayer
          media={playMedia}
          settings={{
            ...settings,
            shuffle: playShuffle,
            slideInterval:
              currentCollection?.slideInterval || settings.slideInterval,
          }}
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
