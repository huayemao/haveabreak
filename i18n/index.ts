
export const locales = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'pt', 'it'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

