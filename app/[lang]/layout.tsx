import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import '../globals.css';
import { locales, getDictionary, Locale } from '@/dictionaries';



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
  const dict = await getDictionary(lang);

  return {
    title: dict.title,
    description: dict.seoDesc,
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
      title: dict.title,
      description: dict.seoDesc,
      images: ['/api/icon?size=1200'],
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

export default function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning>{children}</body>
      <Analytics />
    </html>
  );
}
