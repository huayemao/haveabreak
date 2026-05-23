import { getRequestConfig } from 'next-intl/server';
import { locales } from '../i18n';

async function loadAllMessages(locale: string) {
  const [webMessages, timerMessages, cardMessages, frameMessages] = await Promise.all([
    import(`../messages/${locale}.json`).catch(() => ({ default: {} })),
    import(`../../timer/messages/${locale}.json`).catch(() => ({ default: {} })),
    import(`../../card/messages/${locale}.json`).catch(() => ({ default: {} })),
    import(`../../frame/messages/${locale}.json`).catch(() => ({ default: {} }))
  ]);

  return {
    ...webMessages.default,
    timer: timerMessages.default,
    card: cardMessages.default,
    frame: frameMessages.default
  };
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as any)) {
    locale = 'en';
  }

  return {
    locale,
    messages: await loadAllMessages(locale)
  };
});