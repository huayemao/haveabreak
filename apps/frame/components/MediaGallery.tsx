"use client";
import { useState, useCallback } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import { MediaItem, MediaType } from '../types';
import { Dictionary } from '@/dictionaries';
import 'yet-another-react-lightbox/styles.css';

interface MediaGalleryProps {
  media: MediaItem[];
  onDelete: (id: string) => void;
  onAdd: (url: string, type: MediaType, title?: string) => void;
  dict: Dictionary;
}

export default function MediaGallery({ media, onDelete, onAdd, dict }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<MediaItem | null>(null);

  const imageMedia = media.filter((item) => item.type === 'image');
  const slides = imageMedia.map((item) => ({
    src: item.url,
    title: item.title || '',
  }));

  const handleMediaClick = useCallback((item: MediaItem, index: number) => {
    if (item.type === 'image') {
      const imageIndex = imageMedia.findIndex((img) => img.id === item.id);
      setCurrentIndex(imageIndex);
      setLightboxOpen(true);
    } else {
      setCurrentVideo(item);
      setShowVideoModal(true);
    }
  }, [imageMedia]);

  const handleAdd = () => {
    if (newUrl.trim()) {
      onAdd(newUrl.trim(), mediaType, newTitle.trim() || undefined);
      setNewUrl('');
      setNewTitle('');
      setShowAddModal(false);
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setSelectedId(null);
  };

  const getOrientationLabel = (orientation: string) => {
    switch (orientation) {
      case 'landscape':
        return dict.frame.landscape;
      case 'portrait':
        return dict.frame.portrait;
      case 'square':
        return dict.frame.square;
      default:
        return '';
    }
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
        <button
          onClick={() => setShowAddModal(true)}
          className="neumorphic-button-primary px-4 py-2 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {dict.frame.addMedia}
        </button>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-fg-muted mb-4">{dict.frame.noMedia}</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="neumorphic-button text-sm"
          >
            {dict.frame.addMedia}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item, index) => (
            <div
              key={item.id}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                selectedId === item.id ? 'ring-2 ring-accent ring-offset-2' : ''
              }`}
              onClick={() => handleMediaClick(item, index)}
            >
              <div className="aspect-square bg-muted overflow-hidden">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.title || ''}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full relative bg-black/10">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <svg className="w-10 h-10 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {item.title && (
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  )}
                  <div className="flex gap-1 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full text-white">
                      {item.type === 'image' ? dict.frame.image : dict.frame.video}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full text-white">
                      {getOrientationLabel(item.orientation)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(selectedId === item.id ? null : item.id);
                  }}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {selectedId === item.id ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={currentIndex}
        plugins={[]}
        render={{
          slideFooter: ({ slide }) => (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center pointer-events-auto">
                <button
                  onClick={() => {
                    const currentMedia = imageMedia.find((m) => m.url === slide.src);
                    if (currentMedia) {
                      handleDelete(currentMedia.id);
                      setLightboxOpen(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  {dict.frame.delete || 'Delete'}
                </button>
              </div>
            </div>
          ),
        }}
      />

      {showVideoModal && currentVideo && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowVideoModal(false)}>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <video
                src={currentVideo.url}
                className="w-full max-h-[80vh] object-contain rounded-xl"
                controls
                autoPlay
              />
              {currentVideo.title && (
                <p className="text-white text-center mt-4">{currentVideo.title}</p>
              )}
            </div>
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">{dict.frame.addMedia}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.url}</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="neumorphic-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.title}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={dict.frame.title}
                  className="neumorphic-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.mediaType}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMediaType('image')}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                      mediaType === 'image'
                        ? 'bg-accent text-white'
                        : 'neumorphic-button'
                    }`}
                  >
                    {dict.frame.image}
                  </button>
                  <button
                    onClick={() => setMediaType('video')}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                      mediaType === 'video'
                        ? 'bg-accent text-white'
                        : 'neumorphic-button'
                    }`}
                  >
                    {dict.frame.video}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 neumorphic-button"
              >
                {dict.frame.cancel}
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 neumorphic-button-primary"
              >
                {dict.frame.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
