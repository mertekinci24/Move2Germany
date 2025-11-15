import enTranslations from '../locales/en.json';
import trTranslations from '../locales/tr.json';
import arTranslations from '../locales/ar.json';
import deTranslations from '../locales/de.json';

export const SUPPORTED_LOCALES = ['en', 'tr', 'ar', 'de'] as const;
export const VISIBLE_LOCALES = ['en', 'tr', 'ar'] as const;

export type Locale = typeof SUPPORTED_LOCALES[number];
export type VisibleLocale = typeof VISIBLE_LOCALES[number];

export type LocaleMeta = {
  code: Locale;
  label: string;
  nativeLabel: string;
  direction: 'ltr' | 'rtl';
};

const translations: Record<Locale, Record<string, unknown>> = {
  en: enTranslations,
  tr: trTranslations,
  ar: arTranslations,
  de: deTranslations
};

const localeMeta: Record<Locale, LocaleMeta> = {
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    direction: 'ltr'
  },
  tr: {
    code: 'tr',
    label: 'Turkish',
    nativeLabel: 'Türkçe',
    direction: 'ltr'
  },
  ar: {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    direction: 'rtl'
  },
  de: {
    code: 'de',
    label: 'German',
    nativeLabel: 'Deutsch',
    direction: 'ltr'
  }
};

export function getSupportedLocales(): Locale[] {
  return [...SUPPORTED_LOCALES];
}

export function getVisibleLocales(): VisibleLocale[] {
  return [...VISIBLE_LOCALES];
}

export function getLocaleMeta(locale: Locale): LocaleMeta {
  return localeMeta[locale];
}

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export function normalizeLocale(locale: string | null | undefined): Locale {
  if (!locale) return 'en';

  const normalized = locale.toLowerCase().split('-')[0];

  if (normalized === 'tr' || normalized === 'tur') return 'tr';
  if (normalized === 'ar' || normalized === 'ara') return 'ar';
  if (normalized === 'de' || normalized === 'deu' || normalized === 'ger') return 'de';

  return 'en';
}

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (typeof current === 'object' && current !== null && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}

export function createTranslator(locale: Locale) {
  const localeTranslations = translations[locale];
  const fallbackTranslations = translations['en'];

  return function t(path: string): string {
    const value = getNestedValue(localeTranslations, path);

    if (value !== path) {
      return value;
    }

    if (locale !== 'en') {
      const fallbackValue = getNestedValue(fallbackTranslations, path);
      if (fallbackValue !== path) {
        return fallbackValue;
      }
    }

    return path;
  };
}

export function getLocaleFromCookie(): Locale | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const langCookie = cookies.find(c => c.trim().startsWith('lang='));

  if (langCookie) {
    const locale = langCookie.split('=')[1].trim();
    return isValidLocale(locale) ? locale : null;
  }

  return null;
}

export function setLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return;

  document.cookie = `lang=${locale}; path=/; max-age=31536000`;
}

export function getLocaleFromBrowser(): Locale {
  if (typeof navigator === 'undefined') return 'en';

  const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage;
  return normalizeLocale(browserLang);
}

export function detectLocale(userLocale?: string | null): Locale {
  if (userLocale && isValidLocale(userLocale)) {
    return userLocale;
  }

  const cookieLocale = getLocaleFromCookie();
  if (cookieLocale) {
    return cookieLocale;
  }

  return getLocaleFromBrowser();
}
