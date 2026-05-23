'use client';

import { useTranslations } from 'next-intl';
import { useCardStore } from '@/apps/card/store';
import { useEffect, Suspense } from 'react';
import { Plus, Library, Sparkles, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NeumorphicBottomNav from '@/components/NeumorphicBottomNav';

export default function CardLayoutClient({
  children,
  modals,
}: {
  children: React.ReactNode;
  modals?: React.ReactNode;
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

  const navItems = [
    {
      href: '/card',
      icon: <Sparkles className="w-5 h-5" />,
      label: t('card.feed', { defaultValue: 'Feed' }),
      activePath: '/card',
    },
    {
      href: '/card/library',
      icon: <Library className="w-5 h-5" />,
      label: t('card.library', { defaultValue: 'Library' }),
      activePath: '/card/library',
    },
    {
      href: '/card/settings',
      icon: <Settings className="w-5 h-5" />,
      label: t('card.settings', { defaultValue: 'Settings' }),
      variant: 'action' as const,
    },
    {
      href: '/card/add-book',
      icon: <Plus className="w-6 h-6" />,
      label: t('card.addBook'),
      variant: 'action' as const,
    },
  ];

  return (
    <div className="bg-bg-base">
      <main className="h-full max-w-7xl mx-auto px-4">
        <Suspense fallback={null}>
          {children}
        </Suspense>
        <AnimatePresence mode="wait">
          {modals}
        </AnimatePresence>
      </main>

      <NeumorphicBottomNav items={navItems} />
    </div>
  );
}
