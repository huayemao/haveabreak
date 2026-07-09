'use client';

import { useTranslations } from 'next-intl';

interface QuoteMetadataProps {
  chapter?: string | null;
  page?: string | null;
  className?: string;
}

export default function QuoteMetadata({ chapter, page, className = '' }: QuoteMetadataProps) {
  const t = useTranslations();

  if (!chapter && !page) return null;

  return (
    <div className={`flex flex-wrap gap-4 text-[10px] font-bold text-accent/70 uppercase tracking-widest font-display ${className}`}>
      {chapter && (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/30" />
          {chapter}
        </div>
      )}
      {page && (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/30" />
          {t('card.pagePrefix')}{page}{t('card.pageSuffix')}
        </div>
      )}
    </div>
  );
}