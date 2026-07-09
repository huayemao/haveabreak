import CardLayoutClient from '@haveabreak/card/components/CardLayoutClient';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Locale } from '@/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const messages: any = await getMessages({ locale: lang });
  const cardMessages = messages.card || {};

  return {
    title: `${cardMessages.pageTitle || 'Book Excerpts'} - ${cardMessages.pageSubtitle || 'Swipe through book excerpts like short videos'}`,
    description: cardMessages.pageSubtitle || 'Swipe through book excerpts like short videos',
    icons: {
      icon: [
        { url: '/api/card/icon?size=32', sizes: '32x32', type: 'image/png' },
        { url: '/api/card/icon?size=192', sizes: '192x192', type: 'image/png' },
        { url: '/api/card/icon?size=512', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/api/card/icon?size=180', sizes: '180x180', type: 'image/png' },
      ]
    },
    manifest: `/api/card/manifest?lang=${lang}`,
  };
}

export default async function CardLayout({
  children,
  modals,
  params
}: {
  children: React.ReactNode;
  modals?: React.ReactNode;
  params: Promise<{ lang: string }>
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.lang);

  return (
    <Suspense fallback={null}>
      <CardLayoutClient modals={modals}>
        {children}
      </CardLayoutClient>
    </Suspense>
  );
}