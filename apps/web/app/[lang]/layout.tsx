import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SerwistProvider } from '@serwist/turbopack/react';
import { ServiceWorkerUpdate } from '@/components/ServiceWorkerUpdate';
import '../globals.css';
import { routing } from '@/i18n/routing';
import { Locale } from '@/i18n';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Navbar from '@/components/Navbar';
import LanguageBanner from '@/components/LanguageBanner';
import { NavbarProvider } from '@/context/NavbarContext';
import LayoutContent from '@/components/LayoutContent';
import { notFound } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
const isTauriBuild = process.env.NEXT_PUBLIC_TAURI_BUILD === 'true';

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

  setRequestLocale(lang);

  if (!locales.includes(lang as any)) {
    notFound();
  }

  const messages = await getMessages({ locale: lang });

  return (
    <html lang={lang} className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/satouriko/LxgwWenKai_Webfonts@v1.101/dist/LXGWWenKai-Regular.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/satouriko/LxgwWenKai_Webfonts@v1.101/dist/LXGWWenKai-Bold.css" />
        <link rel="preconnect" href="https://fonts.loli.net" />
        <link href="https://fonts.loli.net/css2?family=Noto+Serif+SC:wght@200..900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
          if (typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__)) {
            document.documentElement.classList.add('is-tauri');
          }
        `}} />
      </head>
      <body suppressHydrationWarning className="bg-[#E0E5EC] text-slate-900 antialiased">
        <SerwistProvider swUrl="/serwist/sw.js">
          <NextIntlClientProvider messages={messages}>
            {!isTauriBuild && (
              <ServiceWorkerUpdate />
            )}
            <NavbarProvider>
              <LanguageBanner />
              {!isTauriBuild && (
                <Navbar />
              )}
              <LayoutContent safeAreaTop className={isTauriBuild ? "flex-1 justify-center" : "justify-center"}>
                {children}
              </LayoutContent>
            </NavbarProvider>
          </NextIntlClientProvider>
        </SerwistProvider>
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
