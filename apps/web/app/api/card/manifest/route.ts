import { NextResponse, NextRequest } from 'next/server';
import { getMessages } from 'next-intl/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';
  
  const messages: any = await getMessages({ locale: lang });
  const cardMessages = messages.card || {};

  const manifest = {
    id: 'quotelite',
    name: cardMessages.pageTitle || 'Book Excerpts',
    short_name: 'Excerpts',
    description: cardMessages.pageSubtitle || 'Swipe up or down to explore beautiful passages',
    start_url: `/${lang}/card`,
    scope: `/${lang}/card`,
    display: 'standalone',
    background_color: '#E0E5EC',
    theme_color: '#E0E5EC',
    icons: [
      {
        src: '/api/card/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/api/card/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/api/card/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}