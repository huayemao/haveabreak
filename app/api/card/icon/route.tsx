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
            borderRadius: '50%',
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
              borderRadius: '50%',
              backgroundColor: '#E0E5EC',
              boxShadow: `
                inset ${size * 0.03}px ${size * 0.03}px ${size * 0.06}px rgba(163, 177, 198, 0.7), 
                inset -${size * 0.03}px -${size * 0.03}px ${size * 0.06}px rgba(255, 255, 255, 0.6)
              `,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: size * 0.02,
              }}
            >
              <div
                style={{
                  width: size * 0.25,
                  height: size * 0.32,
                  borderRadius: size * 0.02,
                  backgroundColor: '#6C63FF',
                  boxShadow: `
                    inset ${size * 0.01}px ${size * 0.01}px ${size * 0.02}px rgba(0, 0, 0, 0.2), 
                    inset -${size * 0.01}px -${size * 0.01}px ${size * 0.02}px rgba(255, 255, 255, 0.2)
                  `,
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: size * 0.03,
                  top: size * 0.03,
                  width: size * 0.04,
                  height: size * 0.04,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />
                <div style={{
                  position: 'absolute',
                  left: size * 0.03,
                  top: size * 0.1,
                  width: size * 0.15,
                  height: size * 0.015,
                  borderRadius: size * 0.005,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />
                <div style={{
                  position: 'absolute',
                  left: size * 0.03,
                  top: size * 0.13,
                  width: size * 0.12,
                  height: size * 0.015,
                  borderRadius: size * 0.005,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />
                <div style={{
                  position: 'absolute',
                  left: size * 0.03,
                  top: size * 0.16,
                  width: size * 0.14,
                  height: size * 0.015,
                  borderRadius: size * 0.005,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />
              </div>
              <div
                style={{
                  width: size * 0.25,
                  height: size * 0.32,
                  borderRadius: size * 0.02,
                  backgroundColor: '#6C63FF',
                  boxShadow: `
                    inset ${size * 0.01}px ${size * 0.01}px ${size * 0.02}px rgba(0, 0, 0, 0.2), 
                    inset -${size * 0.01}px -${size * 0.01}px ${size * 0.02}px rgba(255, 255, 255, 0.2)
                  `,
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: size * 0.03,
                  top: size * 0.03,
                  width: size * 0.04,
                  height: size * 0.04,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />
                <div style={{
                  position: 'absolute',
                  left: size * 0.03,
                  top: size * 0.1,
                  width: size * 0.15,
                  height: size * 0.015,
                  borderRadius: size * 0.005,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />
                <div style={{
                  position: 'absolute',
                  left: size * 0.03,
                  top: size * 0.13,
                  width: size * 0.12,
                  height: size * 0.015,
                  borderRadius: size * 0.005,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />
                <div style={{
                  position: 'absolute',
                  left: size * 0.03,
                  top: size * 0.16,
                  width: size * 0.14,
                  height: size * 0.015,
                  borderRadius: size * 0.005,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />
              </div>
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