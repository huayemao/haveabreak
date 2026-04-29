import { useState } from 'react';
import { MediaItem, MediaType } from '../types';
import { Dictionary } from '@/dictionaries';

interface MediaLibraryProps {
  media: MediaItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (url: string, type: MediaType, title?: string) => void;
  dict: Dictionary;
}

export default function MediaLibrary({ media, selectedIds, onSelect, onDelete, onAdd, dict }: MediaLibraryProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-fg-primary">{dict.frame.mediaLibrary}</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="neumorphic-button px-4 py-2 text-sm"
        >
          {dict.frame.addMedia}
        </button>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-12 text-fg-muted">
          {dict.frame.noMedia}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className={`relative group rounded-[32px] overflow-hidden cursor-pointer transition-all duration-300 ${
                selectedIds.includes(item.id)
                  ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-base'
                  : ''
              }`}
              onClick={() => onSelect(item.id)}
            >
              <div className="aspect-square bg-muted">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.title || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/20">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <span className="text-xs px-2 py-1 bg-white/90 rounded-full text-fg-primary">
                  {item.type === 'image' ? dict.frame.image : dict.frame.video}
                </span>
                <span className="text-xs px-2 py-1 bg-white/90 rounded-full text-fg-primary">
                  {item.orientation === 'landscape' ? dict.frame.landscape : 
                   item.orientation === 'portrait' ? dict.frame.portrait : dict.frame.square}
                </span>
              </div>

              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm truncate">{item.title}</p>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(item.id);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
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

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">{dict.frame.confirmDelete}</h3>
            <p className="mb-6">{dict.frame.confirmDeleteMedia}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 neumorphic-button"
              >
                {dict.frame.cancel}
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 neumorphic-button-destructive"
              >
                {dict.frame.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}