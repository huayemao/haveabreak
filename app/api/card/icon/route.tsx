import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sizeParam = searchParams.get('size');
  const size = sizeParam ? parseInt(sizeParam, 10) : 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#E0E5EC',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: '20%',
            backgroundColor: '#E0E5EC',
            boxShadow: `
              ${size * 0.035}px ${size * 0.035}px ${size * 0.06}px rgba(163, 177, 198, 0.6), 
              -${size * 0.035}px -${size * 0.035}px ${size * 0.06}px rgba(255, 255, 255, 0.5)
            `,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: '20%',
              backgroundColor: '#E0E5EC',
              color: '#6C63FF',
              boxShadow: `
                inset ${size * 0.03}px ${size * 0.03}px ${size * 0.06}px rgba(163, 177, 198, 0.7), 
                inset -${size * 0.03}px -${size * 0.03}px ${size * 0.06}px rgba(255, 255, 255, 0.6)
              `,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-scroll-text-icon lucide-scroll-text"><path d="M15 12h-5" /><path d="M15 8h-5" /><path d="M19 17V5a2 2 0 0 0-2-2H4" /><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" /></svg>
          </div>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
