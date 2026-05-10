import CardLayoutClient from './CardLayoutClient';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { getMessages } from 'next-intl/server';
import { Locale } from '@/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const messages: any = await getMessages({ locale: lang });

  return {
    title: `Card - haveabreak`,
    description: 'Swipe through beautiful book quotes.',
  };
}

export default async function CardLayout({
  children,
  modals,
}: {
  children: React.ReactNode;
  modals: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <CardLayoutClient>
        {children}
        {modals}
      </CardLayoutClient>
    </Suspense>
  );
}