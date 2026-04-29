"use client";
import { useState } from 'react';
import { MediaType } from '../types';
import { Dictionary } from '@/dictionaries';
import { detectMediaType, extractUrls, ImportResultItem } from '../utils/mediaDetector';
import ImportResultDialog from './ImportResultDialog';

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
  const [showResult, setShowResult] = useState(false);
  const [importResults, setImportResults] = useState<ImportResultItem[]>([]);

  const handleAdd = () => {
    if (newUrl.trim()) {
      onAdd(newUrl.trim(), mediaType, newTitle.trim() || undefined);
      setNewUrl('');
      setNewTitle('');
      onClose();
    }
  };

  const handleBatchAdd = async () => {
    const urls = extractUrls(urlList);
    if (urls.length === 0) return;

    const results: ImportResultItem[] = urls.map(url => ({
      url,
      originalType: mediaType,
      detectedType: null,
      status: 'detecting',
    }));
    setImportResults(results);

    for (let i = 0; i < urls.length; i++) {
      const detectedType = await detectMediaType(urls[i]);
      
      setImportResults(prev => prev.map((item, index) => {
        if (index === i) {
          return {
            ...item,
            detectedType,
            status: detectedType !== null ? 'success' : 'failed',
            error: detectedType === null ? dict.frame.cannotDetectType : undefined,
          };
        }
        return item;
      }));
    }

    setShowResult(true);
  };

  const handleConfirmResults = () => {
    const validItems = importResults.filter(item => item.detectedType !== null);
    
    const images = validItems
      .filter(item => item.detectedType === 'image')
      .map(item => item.url);
    
    const videos = validItems
      .filter(item => item.detectedType === 'video')
      .map(item => item.url);
    
    if (images.length > 0) {
      onAddUrlList(images, 'image');
    }
    if (videos.length > 0) {
      onAddUrlList(videos, 'video');
    }
    
    setShowResult(false);
    setUrlList('');
    onClose();
  };

  const handleRetryDetection = async () => {
    const failedUrls = importResults.filter(item => item.status === 'failed');
    
    setImportResults(prev => prev.map(item => 
      item.status === 'failed' 
        ? { ...item, status: 'detecting', detectedType: null }
        : item
    ));

    for (const failedItem of failedUrls) {
      const index = importResults.findIndex(item => item.url === failedItem.url);
      const detectedType = await detectMediaType(failedItem.url);
      
      setImportResults(prev => prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            detectedType,
            status: detectedType !== null ? 'success' : 'failed',
          };
        }
        return item;
      }));
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setImportResults([]);
  };

  if (!isOpen) return null;

  return (
    <>
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
                <label className="block text-sm font-medium mb-2">{dict.frame.importUrlList}</label>
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
              disabled={isBatchMode ? !urlList.trim() : !newUrl.trim()}
              className="flex-1 neumorphic-button-primary disabled:opacity-50"
            >
              {dict.frame.save}
            </button>
          </div>
        </div>
      </div>

      <ImportResultDialog
        isOpen={showResult}
        results={importResults}
        onClose={handleCloseResult}
        onConfirm={handleConfirmResults}
        onRetry={handleRetryDetection}
        dict={dict}
      />
    </>
  );
}