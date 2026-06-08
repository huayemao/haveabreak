'use client';

import { useTranslations } from 'next-intl';
import { Download, Upload, Copy, Clipboard } from 'lucide-react';
import { useState } from 'react';

interface DataManagementSectionProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyJson?: () => Promise<string>;
  onPasteJson?: (json: string) => void;
}

export default function DataManagementSection({
  onExport,
  onImport,
  onCopyJson,
  onPasteJson,
}: DataManagementSectionProps) {
  const t = useTranslations();
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handleCopyJson = async () => {
    if (!onCopyJson) return;
    try {
      const json = await onCopyJson();
      await navigator.clipboard.writeText(json);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch {
      alert(t('common.copyFailed') || 'Copy failed');
    }
  };

  const handlePasteJson = () => {
    if (!onPasteJson || !pasteText.trim()) return;
    try {
      JSON.parse(pasteText);
      onPasteJson(pasteText);
      setPasteText('');
      alert(t('common.importSuccess') || 'Import successful');
    } catch {
      alert(t('common.invalidJson') || 'Invalid JSON');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPasteText(text);
    } catch {
      alert(t('common.pasteFailed') || 'Paste failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={onExport}
          className="flex-1 neumorphic-button py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
        >
          <Download className="w-5 h-5" />
          {t('common.export')}
        </button>
        {onCopyJson && (
          <button
            onClick={handleCopyJson}
            className="flex-1 neumorphic-button py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
          >
            {showCopySuccess ? (
              <>
                <Clipboard className="w-5 h-5" />
                {t('common.copied') || 'Copied'}
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                {t('common.copyJson') || 'Copy JSON'}
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-bold text-fg-muted">{t('common.importDataLabel')}</label>
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-fg-muted/30 rounded-xl">
          <Upload className="w-12 h-12 text-fg-muted mb-4" />
          <p className="text-fg-muted mb-4">{t('common.selectFile')}</p>
          <label className="cursor-pointer neumorphic-button-primary px-6 py-2">
            {t('common.chooseFile')}
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {onPasteJson && (
        <div className="space-y-3">
          <label className="text-sm font-bold text-fg-muted">{t('common.pasteJsonLabel') || 'Paste JSON'}</label>
          <div className="space-y-2">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={t('common.pasteJsonPlaceholder') || 'Paste JSON data here...'}
              className="w-full px-4 py-3 bg-white rounded-xl border border-muted focus:outline-none focus:border-accent min-h-[120px] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePasteFromClipboard}
                className="neumorphic-button px-4 py-2 flex items-center gap-2"
              >
                <Clipboard className="w-4 h-4" />
                {t('common.paste') || 'Paste'}
              </button>
              <button
                onClick={handlePasteJson}
                disabled={!pasteText.trim()}
                className="neumorphic-button-primary px-4 py-2 flex-1"
              >
                {t('common.import') || 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}