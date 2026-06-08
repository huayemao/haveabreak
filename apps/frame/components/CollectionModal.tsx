"use client";
import { useState, useEffect } from 'react';
import { Collection, MediaItem } from '../types';
import { useTranslations } from 'next-intl';
import MediaThumbnail from './MediaThumbnail';

interface CollectionModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  collection?: Collection | null;
  media: MediaItem[];
  onClose: () => void;
  onSave: (name: string, description: string, mediaIds: string[]) => void;
}

export default function CollectionModal({
  isOpen,
  mode,
  collection,
  media,
  onClose,
  onSave,
}: CollectionModalProps) {
  const t = useTranslations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && collection) {
        setName(collection.name);
        setDescription(collection.description || '');
        setSelectedMediaIds([...collection.mediaIds]);
      } else {
        setName('');
        setDescription('');
        setSelectedMediaIds([]);
      }
    }
  }, [isOpen, mode, collection]);

  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim(), selectedMediaIds);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="neumorphic-dialog p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">
          {mode === 'add' ? t('frame.addCollection') : t('common.edit')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('frame.collectionName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('frame.collectionName')}
              className="neumorphic-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('frame.collectionDesc')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('frame.collectionDesc')}
              rows={2}
              className="neumorphic-input w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('frame.selectMedia')}</label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {media.map((item) => (
                <div
                  key={item.id}
                  className={`relative cursor-pointer rounded-xl overflow-hidden ${
                    selectedMediaIds.includes(item.id) ? 'ring-2 ring-accent' : ''
                  }`}
                  onClick={() => toggleMediaSelection(item.id)}
                >
                  <MediaThumbnail item={item} className="w-full h-full" />
                  {selectedMediaIds.includes(item.id) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 neumorphic-button"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 neumorphic-button-primary"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
