"use client";
import { Collection, MediaItem } from '../types';
import { useTranslations } from 'next-intl';
import MediaThumbnail from './MediaThumbnail';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../web/components/ui/context-menu';
import { Play, Trash2, Share2, Edit3, Eye, Shuffle, ListOrdered } from 'lucide-react';

interface CollectionCardProps {
  collection: Collection;
  media: MediaItem[];
  selectedCollectionId: string | null;
  onPlay: (collection: Collection, paused?: boolean, startIndex?: number, shuffle?: boolean) => void;
  onSelect: (id: string) => void;
  onEdit: (collection: Collection) => void;
  onShare: (collection: Collection) => void;
  onDelete: (id: string) => void;
}

export default function CollectionCard({
  collection,
  media,
  selectedCollectionId,
  onPlay,
  onSelect,
  onEdit,
  onShare,
  onDelete,
}: CollectionCardProps) {
  const t = useTranslations();
  const firstMediaId = collection.mediaIds[0];
  const firstMedia = media.find((m) => m.id === firstMediaId);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            selectedCollectionId === collection.id ? 'ring-2 ring-accent ring-offset-2' : ''
          }`}
          onClick={() => onPlay(collection, false, 0)}
        >
          <div className="aspect-square bg-muted">
            {firstMedia ? (
              <MediaThumbnail item={firstMedia} className="w-full h-full" showPlayIcon={false} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-fg-muted text-sm">{t('frame.noMedia')}</span>
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-black/10">
            {collection.mediaIds.length > 0 && (
              <button
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(collection, false, 0);
                }}
              >
                <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-sm font-medium truncate">{collection.name}</p>
              {collection.description && (
                <p className="text-white/80 text-xs mt-1 line-clamp-2">{collection.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-white/70 text-xs">
                <span>{collection.mediaIds.length} {t('frame.media')}</span>
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => onPlay(collection, false, 0, false)}
          className="gap-2"
        >
          <ListOrdered className="w-4 h-4" />
          {t('frame.sequential')}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onPlay(collection, false, 0, true)}
          className="gap-2"
        >
          <Shuffle className="w-4 h-4" />
          {t('frame.shuffle')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onSelect(collection.id)}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {t('frame.viewDetail')}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onEdit(collection)}
          className="gap-2"
        >
          <Edit3 className="w-4 h-4" />
          {t('common.edit')}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onShare(collection)}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          {t('frame.share')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(collection.id)}
          className="gap-2 text-red-500 focus:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
          {t('common.delete')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
