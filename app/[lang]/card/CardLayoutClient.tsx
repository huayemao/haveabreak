'use client';

import { useTranslations } from 'next-intl';
import { useCardStore } from '@/apps/card/store';
import { useEffect, Suspense } from 'react';
import { Plus, Library, Sparkles, Settings } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';

export default function CardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const { isLoading, loadData } = useCardStore();
  const pathname = usePathname();

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

  const isFeed = pathname === '/card';
  const isLibrary = pathname.startsWith('/card/library');

  return (
    <div className="min-h-screen bg-bg-base pt-28 pb-24">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>

      {/* Modern Neumorphic Bottom Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] flex items-center p-2 rounded-full bg-bg-base/80 backdrop-blur-lg shadow-extruded border border-white/5">
        <Link
          href="/card"
          className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
            isFeed ? 'bg-accent text-white shadow-extruded-sm scale-105' : 'text-fg-muted hover:text-fg-primary'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-sm hidden sm:inline">{t('card.feed', { defaultValue: 'Feed' })}</span>
        </Link>

        <div className="w-px h-6 bg-fg-muted/20 mx-2" />

        <Link
          href="/card/library"
          className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
            isLibrary ? 'bg-accent text-white shadow-extruded-sm scale-105' : 'text-fg-muted hover:text-fg-primary'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="font-bold text-sm hidden sm:inline">{t('card.library', { defaultValue: 'Library' })}</span>
        </Link>

        <div className="w-px h-6 bg-fg-muted/20 mx-2" />

        <Link
          href="/card/settings"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-bg-base text-fg-muted shadow-extruded-sm hover:scale-110 active:shadow-inset transition-all"
          title={t('card.settings', { defaultValue: 'Settings' })}
        >
          <Settings className="w-5 h-5" />
        </Link>

        <div className="w-px h-6 bg-fg-muted/20 mx-2" />

        <Link
          href="/card/add-book"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-bg-base text-accent shadow-extruded-sm hover:scale-110 active:shadow-inset transition-all"
          title={t('card.addBook')}
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}