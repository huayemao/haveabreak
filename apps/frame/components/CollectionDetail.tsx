"use client";
import { Collection, MediaItem, MediaType } from '../types';
import { Dictionary } from '@/dictionaries';
import MediaGallery from './MediaGallery';

interface CollectionDetailProps {
  collection: Collection;
  media: MediaItem[];
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Collection>) => void;
  onDelete: (id: string) => void;
  onPlay: (collection: Collection) => void;
  onShare: (collection: Collection) => void;
  onMediaAdd: (url: string, type: MediaType, title?: string) => void;
  onMediaDelete: (id: string) => void;
  dict: Dictionary;
}

export default function CollectionDetail({
  collection,
  media,
  onBack,
  onUpdate,
  onDelete,
  onPlay,
  onShare,
  onMediaAdd,
  onMediaDelete,
  dict,
}: CollectionDetailProps) {
  const collectionMedia = media.filter((m) => collection.mediaIds.includes(m.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-fg-primary">{collection.name}</h2>
          {collection.description && (
            <p className="text-sm text-fg-muted mt-1">{collection.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onShare(collection)}
            className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            title={dict.frame.share}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            onClick={() => onPlay(collection)}
            className="w-10 h-10 rounded-full bg-accent hover:bg-accent-light flex items-center justify-center text-white transition-colors"
            title={dict.frame.slideshow}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-fg-muted">
        <span>{collectionMedia.length} {dict.frame.mediaLibrary}</span>
        <span>{(collection.slideInterval / 1000).toFixed(0)}s {dict.frame.slideInterval}</span>
      </div>

      <MediaGallery
        media={collectionMedia}
        onDelete={onMediaDelete}
        onAdd={onMediaAdd}
        onPlay={() => onPlay(collection)}
        dict={dict}
        showAddButton={true}
      />
    </div>
  );
}