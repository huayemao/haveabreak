'use client';

import { useTranslations } from 'next-intl';
import { Download, Upload } from 'lucide-react';
import { Book } from '@/apps/card/types';

interface DataManagementSectionProps {
  books: Book[];
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataManagementSection({
  books,
  onExport,
  onImport,
}: DataManagementSectionProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-fg-primary">{t('card.dataManagement', { defaultValue: 'Data Management' })}</h3>
      <p className="text-sm text-fg-muted">
        {t('card.dataManagementDesc', { defaultValue: 'Export your books and quotes to back them up, or import data from a previous backup.' })}
      </p>

      <div className="flex gap-3">
        <button
          onClick={onExport}
          className="flex-1 neumorphic-button py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
        >
          <Download className="w-5 h-5" />
          {t('common.export')}
        </button>
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
    </div>
  );
}
