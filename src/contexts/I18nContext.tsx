import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, createTranslator, detectLocale, setLocaleCookie, getLocaleMeta } from '../lib/i18n';
import { updateProfile } from '../lib/auth';
import { useAuth } from './AuthContext';

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  direction: 'ltr' | 'rtl';
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(() => {
    return detectLocale(user?.locale);
  });

  const t = createTranslator(locale);
  const direction = getLocaleMeta(locale).direction;

  useEffect(() => {
    if (user?.locale && user.locale !== locale) {
      setLocaleState(user.locale as Locale);
    }
  }, [user?.locale]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', locale);
  }, [locale, direction]);

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);

    if (user) {
      try {
        await updateProfile(user.id, { locale: newLocale });
      } catch (error) {
        console.error('Failed to update user locale:', error);
      }
    }
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, direction }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
