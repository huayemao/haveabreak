import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Skip all internal paths (_next) and static files
    '/((?!_next|api|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt).*)',
  ],
}
