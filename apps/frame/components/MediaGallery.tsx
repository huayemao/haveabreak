"use client";
import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import { Collection, MediaItem, MediaType } from '../types';
import { useTranslations } from 'next-intl';
import 'yet-another-react-lightbox/styles.css';
import MediaCard from './MediaCard';
import { useScrollLock } from '../utils/useScrollLock';
import { downloadMediaFile } from '../storage';
import { useFrameStore } from '../store';
import PlayerMediaMenu, { PlayerMenuView } from './player/PlayerMediaMenu';
import { FolderPlus, Edit3 } from 'lucide-react';

interface MediaGalleryProps {
  media: MediaItem[];
  onDelete: (id: string) => void;
  onAdd: (url: string, type: MediaType, title?: string) => void;
  onAddUrlList: (urls: string[], type: MediaType) => void;
  onPlay?: (paused: boolean, startIndex?: number, shuffle?: boolean) => void;
  showAddButton?: boolean;
}

export default function MediaGallery({
  media,
  onDelete,
  onAdd,
  onAddUrlList,
  onPlay,
  showAddButton = true,
}: MediaGalleryProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const collections = useFrameStore((s) => s.collections);
  const updateMedia = useFrameStore((s) => s.updateMedia);
  const toggleMediaInCollection = useFrameStore((s) => s.toggleMediaInCollection);
  const createCollection = useFrameStore((s) => s.createCollection);
  const updateCollection = useFrameStore((s) => s.updateCollection);
  const activeCollectionId = searchParams.get('collection');

  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    item: MediaItem | null;
    x: number;
    y: number;
    view: PlayerMenuView;
  }>({
    isOpen: false,
    item: null,
    x: 0,
    y: 0,
    view: 'menu',
  });

  useScrollLock(lightboxOpen || showDeleteConfirm || menuState.isOpen);

  // Support right-click & long-press when Lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;

    let timer: number | null = null;
    let startPos: { x: number; y: number } | null = null;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.yarl__root')) return;
      e.preventDefault();
      clearTimer();
      const activeItem = media[currentIndex];
      if (activeItem) {
        setMenuState({
          isOpen: true,
          item: activeItem,
          x: e.clientX,
          y: e.clientY,
          view: 'menu',
        });
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2) return;
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.yarl__slide')) return;
      startPos = { x: e.clientX, y: e.clientY };
      clearTimer();
      timer = window.setTimeout(() => {
        timer = null;
        const activeItem = media[currentIndex];
        if (activeItem && startPos) {
          try {
            navigator.vibrate?.(15);
          } catch {}
          setMenuState({
            isOpen: true,
            item: activeItem,
            x: startPos.x,
            y: startPos.y,
            view: 'menu',
          });
        }
      }, 450);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!startPos || timer === null) return;
      if (Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y) > 12) {
        clearTimer();
      }
    };

    const onPointerUp = () => {
      clearTimer();
      startPos = null;
    };

    window.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerUp, true);

    return () => {
      clearTimer();
      window.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerUp, true);
    };
  }, [lightboxOpen, media, currentIndex]);

  const handleOpenCardEditMenu = useCallback(
    (item: MediaItem, view: PlayerMenuView, e?: React.MouseEvent) => {
      const x = e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 - 160 : 120);
      const y = e?.clientY || (typeof window !== 'undefined' ? window.innerHeight / 3 : 120);
      setMenuState({
        isOpen: true,
        item,
        x,
        y,
        view,
      });
    },
    []
  );

  const slides = media.map((item) => {
    if (item.type === 'video') {
      let width = 1280;
      let height = 720;
      
      if (item.orientation === 'portrait') {
        width = 720;
        height = 1280;
      } else if (item.orientation === 'square') {
        width = 1080;
        height = 1080;
      }
      
      return {
        type: 'video' as const,
        poster: '',
        sources: [
          {
            src: item.url,
            type: 'video/mp4',
          },
        ],
        width,
        height,
      };
    }
    return {
      src: item.url,
      title: item.title || '',
      type: undefined,
    };
  });

  const handleMediaClick = useCallback((item: MediaItem, index: number) => {
    const mediaIndex = media.findIndex((m) => m.id === item.id);
    setCurrentIndex(mediaIndex);
    setLightboxOpen(true);
  }, [media]);

  const handleDelete = (id: string) => {
    onDelete(id);
    setSelectedId(null);
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      const filename = item.title ? `${item.title}.${item.type === 'image' ? 'jpg' : 'mp4'}` : `media-${item.id}.${item.type === 'image' ? 'jpg' : 'mp4'}`;
      await downloadMediaFile(item.url, filename);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const openAddModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('modal', 'add');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-fg-primary">{t('frame.mediaLibrary')}</h2>
          <p className="text-sm text-fg-muted mt-1">
            {t('frame.totalMedia')}: {media.length}
          </p>
        </div>
        {showAddButton && (
          <button
            onClick={openAddModal}
            className="neumorphic-button-primary px-4 py-2 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('frame.addMedia')}
          </button>
        )}
      </div>

      {media.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-fg-muted mb-4">{t('frame.noMedia')}</p>
          {showAddButton && (
            <button
              onClick={openAddModal}
              className="neumorphic-button text-sm"
            >
              {t('frame.addMedia')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              index={index}
              selectedId={selectedId}
              onSelect={handleMediaClick}
              onDelete={handleDelete}
              onPlay={onPlay}
              onDownload={handleDownload}
              onOpenEditMenu={handleOpenCardEditMenu}
            />
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={currentIndex}
        on={{
          view: ({ index }) => setCurrentIndex(index),
        }}
        plugins={[Video]}
        controller={{
          closeOnPullDown: true,
          closeOnBackdropClick: true,
        }}
        toolbar={{
          buttons: [
            ...(onPlay ? [
              <button
                key="play"
                type="button"
                onClick={() => {
                  setLightboxOpen(false);
                  onPlay(true, currentIndex);
                }}
                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 shadow-lg transition-all"
                title={t('frame.slideshow') || 'Slideshow'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ] : []),
            <button
              key="add-collection"
              type="button"
              onClick={(e) => {
                const activeItem = media[currentIndex];
                if (activeItem) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuState({
                    isOpen: true,
                    item: activeItem,
                    x: rect.left,
                    y: rect.bottom + 8,
                    view: 'collections',
                  });
                }
              }}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 shadow-lg transition-all"
              title={t('frame.addToCollection')}
            >
              <FolderPlus className="w-5 h-5" />
            </button>,
            <button
              key="edit-info"
              type="button"
              onClick={(e) => {
                const activeItem = media[currentIndex];
                if (activeItem) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuState({
                    isOpen: true,
                    item: activeItem,
                    x: rect.left,
                    y: rect.bottom + 8,
                    view: 'edit',
                  });
                }
              }}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 shadow-lg transition-all"
              title={t('frame.editInfo')}
            >
              <Edit3 className="w-5 h-5" />
            </button>,
            <button
              key="delete"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 shadow-lg transition-all"
              title={t('common.delete') || 'Delete'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>,
            "close",
          ],
        }}
      />

      {menuState.item && (
        <PlayerMediaMenu
          isOpen={menuState.isOpen}
          initialView={menuState.view}
          anchor={{ x: menuState.x, y: menuState.y }}
          media={media.find((m) => m.id === menuState.item?.id) || menuState.item}
          collections={collections}
          activeCollectionId={activeCollectionId}
          onClose={() => setMenuState((prev) => ({ ...prev, isOpen: false }))}
          onToggleCollection={(col: Collection) =>
            toggleMediaInCollection(menuState.item!.id, col.id)
          }
          onCreateCollectionWithMedia={async (name: string) => {
            await createCollection(name, undefined, [menuState.item!.id]);
          }}
          onUpdateMedia={async (updates) => {
            await updateMedia(menuState.item!.id, updates);
          }}
          onRemoveFromActiveCollection={
            activeCollectionId && activeCollectionId !== '__uncollected__'
              ? async () => {
                  const col = collections.find((c) => c.id === activeCollectionId);
                  if (col && menuState.item) {
                    await updateCollection(col.id, {
                      mediaIds: col.mediaIds.filter((id) => id !== menuState.item!.id),
                    });
                  }
                }
              : undefined
          }
          onDeleteMedia={async () => {
            if (menuState.item) {
              handleDelete(menuState.item.id);
              if (lightboxOpen && media.length <= 1) {
                setLightboxOpen(false);
              }
            }
          }}
          onDownloadMedia={async () => {
            if (menuState.item) {
              await handleDownload(menuState.item);
            }
          }}
          onCopyUrl={async () => {
            if (menuState.item) {
              try {
                await navigator.clipboard.writeText(menuState.item.url);
              } catch {}
            }
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">{t('frame.confirmDelete') || 'Confirm Delete'}</h3>
            <p className="mb-6">{t('frame.confirmDeleteMedia') || 'Are you sure you want to delete this media?'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 neumorphic-button"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  const currentMedia = media[currentIndex];
                  if (currentMedia) {
                    handleDelete(currentMedia.id);
                    setShowDeleteConfirm(false);
                    setLightboxOpen(false);
                  }
                }}
                className="flex-1 neumorphic-button-destructive"
              >
                {t('common.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
