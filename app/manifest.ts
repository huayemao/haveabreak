import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'haveabreak - Mindful Rest Timer',
    short_name: 'haveabreak',
    description: 'A mindful PWA timer application that encourages genuine rest. Any movement resets the timer.',
    start_url: '/',
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
  }
}
