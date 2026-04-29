"use client";
import { useState } from 'react';
import { MediaType } from '../types';
import { Dictionary } from '@/dictionaries';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string, type: MediaType, title?: string) => void;
  dict: Dictionary;
}

export default function AddMediaModal({ isOpen, onClose, onAdd, dict }: AddMediaModalProps) {
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');

  const handleAdd = () => {
    if (newUrl.trim()) {
      onAdd(newUrl.trim(), mediaType, newTitle.trim() || undefined);
      setNewUrl('');
      setNewTitle('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
  );
}