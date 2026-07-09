import FrameLayoutClient from '@haveabreak/frame/components/FrameLayoutClient';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Locale } from '@/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const messages: any = await getMessages({ locale: lang });

  return {
    title: `${messages.frame?.appTitle || 'Digital Frame'} - haveabreak`,
    description: messages.frame?.appSubtitle || 'A beautiful digital frame for your mindful rest.',
    icons: {
      icon: [
        { url: '/api/frame/icon?size=32', sizes: '32x32', type: 'image/png' },
        { url: '/api/frame/icon?size=192', sizes: '192x192', type: 'image/png' },
        { url: '/api/frame/icon?size=512', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/api/frame/icon?size=180', sizes: '180x180', type: 'image/png' },
      ]
    },
    manifest: `/api/frame/manifest?lang=${lang}`,
  };
}

export default async function FrameLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.lang);

  return (
    <Suspense fallback={null}>
      <FrameLayoutClient>
        {children}
      </FrameLayoutClient>
    </Suspense>
  );
}
