'use client';

import { useTranslations } from 'next-intl';
import { Check, RefreshCw, AlertCircle } from 'lucide-react';

interface SubscriptionUpdateInfoProps {
  subscriptionDiff: {
    newBooks: any[];
    updatedBooks: any[];
    deletedBooks: any[];
    newQuotes: any[];
    updatedQuotes: any[];
    deletedQuotes: any[];
  } | null;
  hasUpdate: boolean;
  onApplyUpdate: () => void;
  onClearUpdate: () => void;
}

export default function SubscriptionUpdateInfo({
  subscriptionDiff,
  hasUpdate,
  onApplyUpdate,
  onClearUpdate,
}: SubscriptionUpdateInfoProps) {
  const t = useTranslations();

  if (!subscriptionDiff) return null;

  return (
    <div className="p-4 rounded-xl bg-bg-elevated space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-fg-primary">{t('common.updateAvailable', { defaultValue: 'Update Available' })}</h4>
        <button onClick={onClearUpdate} className="text-sm text-fg-muted hover:text-fg-primary">
          {t('common.close', { defaultValue: 'Close' })}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        {subscriptionDiff.newBooks.length > 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-4 h-4" />
            {t('common.newBooks', { defaultValue: '{count} new books', count: subscriptionDiff.newBooks.length })}
          </div>
        )}
        {subscriptionDiff.updatedBooks.length > 0 && (
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="w-4 h-4" />
            {t('common.updatedBooks', { defaultValue: '{count} updated books', count: subscriptionDiff.updatedBooks.length })}
          </div>
        )}
        {subscriptionDiff.deletedBooks.length > 0 && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            {t('common.deletedBooks', { defaultValue: '{count} deleted books', count: subscriptionDiff.deletedBooks.length })}
          </div>
        )}
        {subscriptionDiff.newQuotes.length > 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-4 h-4" />
            {t('common.newQuotes', { defaultValue: '{count} new quotes', count: subscriptionDiff.newQuotes.length })}
          </div>
        )}
        {subscriptionDiff.updatedQuotes.length > 0 && (
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="w-4 h-4" />
            {t('common.updatedQuotes', { defaultValue: '{count} updated quotes', count: subscriptionDiff.updatedQuotes.length })}
          </div>
        )}
        {subscriptionDiff.deletedQuotes.length > 0 && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            {t('common.deletedQuotes', { defaultValue: '{count} deleted quotes', count: subscriptionDiff.deletedQuotes.length })}
          </div>
        )}
      </div>
    </div>
  );
}
