'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCardStore } from '@/apps/card/store';
import { useState } from 'react';
import { X, Download, Upload } from 'lucide-react';

export default function SettingsModal() {
  const router = useRouter();
  const t = useTranslations();
  const { exportData, importData, loadData } = useCardStore();
  const [importDataText, setImportDataText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleImport = () => {
    if (importDataText.trim()) {
      try {
        importData(importDataText.trim());
        loadData();
        setSuccessMessage(t('card.importSuccess', { defaultValue: 'Import successful!' }));
        setShowSuccess(true);
        setImportDataText('');
        setTimeout(() => setShowSuccess(false), 3000);
      } catch {
        alert(t('card.importFailed', { defaultValue: 'Import failed. Please check your data format.' }));
      }
    }
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'card-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setSuccessMessage(t('card.exportSuccess', { defaultValue: 'Export successful!' }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
      />

      <div className="relative w-full max-w-lg bg-bg-base shadow-extruded rounded-[32px] overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-fg-primary font-display flex items-center gap-2">
            <Download className="w-5 h-5 text-accent" />
            {t('card.settings', { defaultValue: 'Settings' })}
          </h2>
          <button
            onClick={handleClose}
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
              <button
                onClick={handleImport}
                className="flex-1 neumorphic-button py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
              >
                <Upload className="w-5 h-5" />
                {t('card.import', { defaultValue: 'Import' })}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-fg-muted">{t('card.importDataLabel', { defaultValue: 'Paste imported data here' })}</label>
            <textarea
              value={importDataText}
              onChange={(e) => setImportDataText(e.target.value)}
              placeholder='{"books": [...], "quotes": [...]}'
              className="w-full h-40 p-4 rounded-2xl bg-bg-base shadow-inset focus:shadow-inset-deep outline-none transition-all resize-none text-fg-primary text-sm font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}