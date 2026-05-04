import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import '../globals.css';
import { routing } from '@/i18n/routing';
import { getDictionary, Locale } from '@/dictionaries';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LanguageBanner from '@/components/LanguageBanner';
import { notFound } from 'next/navigation';

const { locales } = routing;

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#E0E5EC',
  viewportFit: 'cover',
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;

  if (!locales.includes(lang)) {
    return {};
  }

  const messages = await getMessages({ locale: lang });

  // For canonical and alternates
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://haveabreak.online';

  return {
    title: messages.title,
    description: messages.seoDesc,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}`])
      ),
    },
    icons: {
      icon: [
        { url: '/api/icon?size=32', sizes: '32x32', type: 'image/png' },
        { url: '/api/icon?size=192', sizes: '192x192', type: 'image/png' },
        { url: '/api/icon?size=512', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/api/icon?size=180', sizes: '180x180', type: 'image/png' },
      ]
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
      title: messages.title,
      description: messages.seoDesc,
      images: ['/api/icon?size=1200'],
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>
}) {
  const resolvedParams = await params;
  const { lang } = resolvedParams;

  // Validate that the incoming `lang` parameter is valid
  if (!locales.includes(lang as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={lang} className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning className="bg-[#E0E5EC] text-slate-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <LanguageBanner />
          <div className="fixed top-6 right-6 z-50">
            <LanguageSwitcher />
          </div>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
