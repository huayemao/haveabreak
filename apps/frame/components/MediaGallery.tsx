"use client";
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import { MediaItem, MediaType } from '../types';
import { Dictionary } from '@/dictionaries';
import 'yet-another-react-lightbox/styles.css';
import MediaCard from './MediaCard';
import { useScrollLock } from '../utils/useScrollLock';

interface MediaGalleryProps {
  media: MediaItem[];
  onDelete: (id: string) => void;
  onAdd: (url: string, type: MediaType, title?: string) => void;
  onAddUrlList: (urls: string[], type: MediaType) => void;
  onPlay?: (paused: boolean, startIndex?: number) => void;
  dict: Dictionary;
  showAddButton?: boolean;
}

export default function MediaGallery({
  media,
  onDelete,
  onAdd,
  onAddUrlList,
  onPlay,
  dict,
  showAddButton = true,
}: MediaGalleryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useScrollLock(lightboxOpen || showDeleteConfirm);

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

  const openAddModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('modal', 'add');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-fg-primary">{dict.frame.mediaLibrary}</h2>
          <p className="text-sm text-fg-muted mt-1">
            {dict.frame.totalMedia}: {media.length}
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
            {dict.frame.addMedia}
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
          <p className="text-fg-muted mb-4">{dict.frame.noMedia}</p>
          {showAddButton && (
            <button
              onClick={openAddModal}
              className="neumorphic-button text-sm"
            >
              {dict.frame.addMedia}
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
              dict={dict}
            />
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={currentIndex}
        plugins={[Video]}
        render={{
          slideFooter: ({ slide }) => (
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent pointer-events-none">
              <div className="absolute top-0 left-0 right-0 p-4">
                <div className="flex items-center justify-center gap-3">
                  {onPlay && (
                    <button
                      onClick={() => {
                        setLightboxOpen(false);
                        onPlay(true, currentIndex);
                      }}
                      className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 shadow-lg transition-all pointer-events-auto"
                      title={dict.frame.slideshow || 'Slideshow'}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 shadow-lg transition-all pointer-events-auto"
                    title={dict.frame.delete || 'Delete'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ),
        }}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">{dict.frame.confirmDelete || 'Confirm Delete'}</h3>
            <p className="mb-6">{dict.frame.confirmDeleteMedia || 'Are you sure you want to delete this media?'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 neumorphic-button"
              >
                {dict.frame.cancel || 'Cancel'}
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
                {dict.frame.delete || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}