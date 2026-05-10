"use client"
import { useTranslations } from 'next-intl';
import { useCardStore } from '@/apps/card/store';
import { useEffect, Suspense } from 'react';

export default function CardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const { isLoading, loadData } = useCardStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-fg-muted">{t('loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base pt-28">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
