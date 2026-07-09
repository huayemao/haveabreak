'use client';

import { useTranslations } from 'next-intl';
import { Clock, FileText, Shuffle } from 'lucide-react';

interface SortSectionProps {
  quoteSortOrder: 'createdAt' | 'page';
  onSortOrderChange: (order: 'createdAt' | 'page') => void;
  isRandom: boolean;
  onIsRandomChange: (isRandom: boolean) => void;
}

export default function SortSection({
  quoteSortOrder,
  onSortOrderChange,
  isRandom,
  onIsRandomChange,
}: SortSectionProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-bold text-fg-primary">{t('card.randomPlay', { defaultValue: 'Random Play' })}</h3>
        <p className="text-sm text-fg-muted">
          {t('card.randomPlayDesc', { defaultValue: 'Shuffle quotes randomly when navigating.' })}
        </p>
        <button
          onClick={() => onIsRandomChange(!isRandom)}
          className={`p-4 rounded-2xl flex items-center justify-center gap-3 transition-all w-full ${
            isRandom
              ? 'neumorphic-button-primary'
              : 'neumorphic-button'
          }`}
        >
          <Shuffle className="w-6 h-6" />
          <div className="text-center">
            <div className="font-bold text-sm">
              {isRandom ? t('card.randomEnabled', { defaultValue: 'Enabled' }) : t('card.randomDisabled', { defaultValue: 'Disabled' })}
            </div>
          </div>
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-fg-primary">{t('card.quoteSortOrder', { defaultValue: 'Quote Sort Order' })}</h3>
        <p className="text-sm text-fg-muted">
          {t('card.quoteSortOrderDesc', { defaultValue: 'Choose how quotes are sorted in book detail view.' })}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSortOrderChange('createdAt')}
            className={`p-4 rounded-2xl flex flex-col items-center gap-3 transition-all ${
              quoteSortOrder === 'createdAt'
                ? 'neumorphic-button-primary'
                : 'neumorphic-button'
            }`}
          >
            <Clock className="w-6 h-6" />
            <div className="text-center">
              <div className="font-bold text-sm">
                {t('card.sortByCreatedTime', { defaultValue: 'Created Time' })}
              </div>
              <div className="text-xs text-fg-muted mt-1">
                {t('card.sortByCreatedTimeDesc', { defaultValue: 'Sort by when quotes were added' })}
              </div>
            </div>
          </button>

          <button
            onClick={() => onSortOrderChange('page')}
            className={`p-4 rounded-2xl flex flex-col items-center gap-3 transition-all ${
              quoteSortOrder === 'page'
                ? 'neumorphic-button-primary'
                : 'neumorphic-button'
            }`}
          >
            <FileText className="w-6 h-6" />
            <div className="text-center">
              <div className="font-bold text-sm">
                {t('card.sortByPageNumber', { defaultValue: 'Page Number' })}
              </div>
              <div className="text-xs text-fg-muted mt-1">
                {t('card.sortByPageNumberDesc', { defaultValue: 'Sort by page number' })}
              </div>
            </div>
          </button>
        </div>

        {quoteSortOrder === 'page' && (
          <div className="p-3 rounded-xl bg-bg-secondary text-xs text-fg-muted">
            {t('card.sortByPageNote', { defaultValue: 'Quotes without page numbers will be sorted last by creation time.' })}
          </div>
        )}
      </div>
    </div>
  );
}
