'use client';

import { useTranslations } from 'next-intl';
import { useScrollLock } from '@/apps/frame/utils/useScrollLock';
import { useState } from 'react';
import { X, Download, Upload } from 'lucide-react';
import { Book } from '@/apps/card/types';

interface CardSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onExport: (filename: string) => void;
  onImport: (data: string) => void;
}

export default function CardSettingsPanel({
  isOpen,
  onClose,
  books,
  onExport,
  onImport,
}: CardSettingsPanelProps) {
  const t = useTranslations();
  useScrollLock(isOpen);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            onImport(content);
            setSuccessMessage(t('card.importSuccess', { defaultValue: 'Import successful!' }));
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } catch {
            alert(t('card.importFailed', { defaultValue: 'Import failed. Please check your data format.' }));
          }
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleExport = () => {
    const bookName = books.length > 0
      ? books.map(b => b.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')).join('-')
      : 'all';
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${bookName}-${timestamp}.json`;
    onExport(filename);
    setSuccessMessage(t('card.exportSuccess', { defaultValue: 'Export successful!' }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
      />

      <div className="relative w-full max-w-lg bg-bg-base shadow-extruded rounded-[32px] overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-fg-primary font-display flex items-center gap-2">
            <Download className="w-5 h-5 text-accent" />
            {t('card.settings', { defaultValue: 'Settings' })}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {showSuccess && (
            <div className="p-4 rounded-2xl bg-green-100 text-green-700 text-center font-medium">
              {successMessage}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-fg-primary">{t('card.dataManagement', { defaultValue: 'Data Management' })}</h3>
            <p className="text-sm text-fg-muted">
              {t('card.dataManagementDesc', { defaultValue: 'Export your books and quotes to back them up, or import data from a previous backup.' })}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex-1 neumorphic-button py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
              >
                <Download className="w-5 h-5" />
                {t('card.export', { defaultValue: 'Export' })}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-fg-muted">{t('card.importDataLabel', { defaultValue: 'Import data' })}</label>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-fg-muted/30 rounded-xl">
              <Upload className="w-12 h-12 text-fg-muted mb-4" />
              <p className="text-fg-muted mb-4">{t('card.selectFile', { defaultValue: 'Select a JSON file' })}</p>
              <label className="cursor-pointer neumorphic-button-primary px-6 py-2">
                {t('card.chooseFile', { defaultValue: 'Choose File' })}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}