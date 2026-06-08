"use client";
import { useState } from 'react';
import { Collection } from '../types';
import { useTranslations } from 'next-intl';

interface ShareModalProps {
  isOpen: boolean;
  collection: Collection | null;
  pathname: string;
  onClose: () => void;
}

export default function ShareModal({ isOpen, collection, pathname, onClose }: ShareModalProps) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const copyShareLink = () => {
    if (collection) {
      const shareData = JSON.stringify({
        id: collection.id,
        name: collection.name,
        mediaIds: collection.mediaIds,
      });
      const encoded = btoa(shareData);
      const link = `${window.location.origin}${pathname}?share=${encoded}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !collection) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="neumorphic-dialog p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">{t('frame.shareCollection')}</h3>
        
        <div className="space-y-4">
          <p className="text-sm text-fg-muted">{t('frame.shareDesc')}</p>
          
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}${pathname}?share=...`}
              className="neumorphic-input flex-1 text-sm"
            />
            <button
              onClick={copyShareLink}
              className="neumorphic-button px-4"
            >
              {copied ? t('frame.copied') : t('frame.copy')}
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="neumorphic-button"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
