import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSerwist } from '@serwist/turbopack';

const withNextIntl = createNextIntlPlugin();

const isTauriBuild = process.env.TAURI_BUILD === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_TAURI_BUILD: isTauriBuild ? 'true' : '',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: isTauriBuild ? true : undefined,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sns-img-hw.xhscdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sns-bak-v1.xhscdn.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: isTauriBuild ? 'export' : 'standalone',
  trailingSlash: isTauriBuild ? true : undefined,
  pageExtensions: isTauriBuild ? ['tsx', 'jsx'] : undefined,
  transpilePackages: ['motion', '@haveabreak/card', '@haveabreak/frame', '@haveabreak/maoji', '@haveabreak/ui', '@haveabreak/utils'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default isTauriBuild
  ? withNextIntl(nextConfig)
  : withSerwist(withNextIntl(nextConfig));
