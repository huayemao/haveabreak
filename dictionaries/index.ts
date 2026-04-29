import { en } from './en';
import { zh } from './zh';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { ja } from './ja';
import { ko } from './ko';
import { ru } from './ru';
import { pt } from './pt';
import { it } from './it';

export const locales = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'pt', 'it'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

const dictionaries = {
  en: () => Promise.resolve(en),
  zh: () => Promise.resolve(zh),
  es: () => Promise.resolve(es),
  fr: () => Promise.resolve(fr),
  de: () => Promise.resolve(de),
  ja: () => Promise.resolve(ja),
  ko: () => Promise.resolve(ko),
  ru: () => Promise.resolve(ru),
  pt: () => Promise.resolve(pt),
  it: () => Promise.resolve(it),
};

export const getDictionary = async (locale: Locale) => dictionaries[locale]();
export type Dictionary = typeof en;