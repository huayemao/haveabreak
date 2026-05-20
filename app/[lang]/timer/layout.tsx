import { Metadata } from 'next';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Locale } from '@/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const messages: any = await getMessages({ locale: lang });

  return {
    title: messages.title || 'haveabreak',
    description: messages.seoDesc || 'A mindful PWA timer application.',
    icons: {
      icon: [
        { url: '/api/timer/icon?size=32', sizes: '32x32', type: 'image/png' },
        { url: '/api/timer/icon?size=192', sizes: '192x192', type: 'image/png' },
        { url: '/api/timer/icon?size=512', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/api/timer/icon?size=180', sizes: '180x180', type: 'image/png' },
      ]
    },
    manifest: `/api/timer/manifest?lang=${lang}`,
  };
}

export default async function TimerLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.lang);

  return children;
}