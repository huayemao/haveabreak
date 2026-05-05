import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sizeParam = searchParams.get('size');
  const size = sizeParam ? parseInt(sizeParam, 10) : 512;

  // The neumorphic icon logic for Frame App
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
        {/* Outer extruded circle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: '24%', // More like a rounded square/frame
            backgroundColor: '#E0E5EC',
            boxShadow: `
              ${size * 0.035}px ${size * 0.035}px ${size * 0.06}px rgba(163, 177, 198, 0.6), 
              -${size * 0.035}px -${size * 0.035}px ${size * 0.06}px rgba(255, 255, 255, 0.5)
            `,
          }}
        >
          {/* Inner inset circle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: '20%',
              backgroundColor: '#E0E5EC',
              boxShadow: `
                inset ${size * 0.03}px ${size * 0.03}px ${size * 0.06}px rgba(163, 177, 198, 0.7), 
                inset -${size * 0.03}px -${size * 0.03}px ${size * 0.06}px rgba(255, 255, 255, 0.6)
              `,
            }}
          >
            {/* Frame / Picture symbol */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: size * 0.3,
                height: size * 0.25,
                border: `${size * 0.04}px solid #6C63FF`,
                borderRadius: size * 0.04,
                position: 'relative',
              }}
            >
               <div style={{
                 position: 'absolute',
                 bottom: size * 0.03,
                 right: size * 0.03,
                 width: size * 0.05,
                 height: size * 0.05,
                 borderRadius: '50%',
                 backgroundColor: '#6C63FF',
               }} />
            </div>
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
