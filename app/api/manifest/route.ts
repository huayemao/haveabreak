import { NextResponse, NextRequest } from 'next/server';
import { getMessages } from 'next-intl/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';
  
  // Fetch messages for the specific language
  const messages: any = await getMessages({ locale: lang });

  const manifest = {
    id: 'haveabreak-timer',
    name: messages.title || 'haveabreak',
    short_name: 'haveabreak',
    description: messages.seoDesc || 'A mindful PWA timer application.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#E0E5EC',
    theme_color: '#E0E5EC',
    icons: [
      {
        src: '/api/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/api/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/api/icon?size=512',
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
