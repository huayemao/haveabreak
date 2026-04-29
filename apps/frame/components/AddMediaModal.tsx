"use client";
import { useState } from 'react';
import { MediaType } from '../types';
import { Dictionary } from '@/dictionaries';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string, type: MediaType, title?: string) => void;
  onAddUrlList: (urls: string[], type: MediaType) => void;
  dict: Dictionary;
}

export default function AddMediaModal({ isOpen, onClose, onAdd, onAddUrlList, dict }: AddMediaModalProps) {
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [urlList, setUrlList] = useState('');

  const extractUrls = (text: string): string[] => {
    const urlPattern = /https?:\/\/[^\s'"<>()\[\]{}]+/gi;
    const markdownImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/gi;
    const markdownLinkPattern = /\[([^\]]*)\]\(([^)]+)\)/gi;
    
    const urls: string[] = [];
    
    let match;
    while ((match = markdownImagePattern.exec(text)) !== null) {
      urls.push(match[2]);
    }
    
    while ((match = markdownLinkPattern.exec(text)) !== null) {
      if (!urls.includes(match[2])) {
        urls.push(match[2]);
      }
    }
    
    const plainUrls = text.match(urlPattern) || [];
    plainUrls.forEach(url => {
      if (!urls.includes(url)) {
        urls.push(url);
      }
    });
    
    return urls.filter(url => url.trim());
  };

  const handleAdd = () => {
    if (newUrl.trim()) {
      onAdd(newUrl.trim(), mediaType, newTitle.trim() || undefined);
      setNewUrl('');
      setNewTitle('');
      onClose();
    }
  };

  const handleBatchAdd = () => {
    const urls = extractUrls(urlList);
    if (urls.length > 0) {
      onAddUrlList(urls, mediaType);
      setUrlList('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="neumorphic-dialog p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{dict.frame.addMedia}</h3>
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`text-sm px-3 py-1 rounded-full transition-all ${
              isBatchMode
                ? 'bg-accent text-white'
                : 'bg-muted text-fg-primary'
            }`}
          >
            {isBatchMode ? dict.frame.single : dict.frame.batch}
          </button>
        </div>
        
        <div className="space-y-4">
          {isBatchMode ? (
            <div>
              <label className="block text-sm font-medium mb-2">{dict.frame.urlList}</label>
              <textarea
                value={urlList}
                onChange={(e) => setUrlList(e.target.value)}
                placeholder={dict.frame.urlListPlaceholder || 'https://example.com/image1.jpg\nhttps://example.com/image2.jpg\n![alt](https://example.com/img3.jpg)'}
                rows={6}
                className="neumorphic-input w-full resize-none font-mono text-sm"
              />
            </div>
          ) : (
            <>
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
            </>
          )}

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
            onClick={isBatchMode ? handleBatchAdd : handleAdd}
            className="flex-1 neumorphic-button-primary"
          >
            {dict.frame.save}
          </button>
        </div>
      </div>
    </div>
  );
}