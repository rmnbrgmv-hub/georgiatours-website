import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, localeNames } from '../translations';

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const s = localStorage.getItem('georgiatours-locale');
      return s && translations[s] ? s : 'en';
    } catch (_) {
      return 'en';
    }
  });

  const setLocale = useCallback((lang) => {
    if (translations[lang]) {
      setLocaleState(lang);
      try {
        localStorage.setItem('georgiatours-locale', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const t = useCallback(
    (key) => {
      const parts = key.split('.');
      let v = translations[locale];
      for (const p of parts) {
        v = v?.[p];
      }
      return v ?? key;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, localeNames }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
