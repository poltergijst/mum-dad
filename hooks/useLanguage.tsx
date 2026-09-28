import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TRANSLATIONS,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  type LanguageCode,
} from '@/constants/translations';

const LANGUAGE_KEY = '@mumdad_language';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored && stored in TRANSLATIONS) {
          setLanguageState(stored as LanguageCode);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
      let value = dict[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? key;
      if (params) {
        const stringParams: Record<string, string> = {};
        for (const [param, replacement] of Object.entries(params)) {
          stringParams[param] = String(replacement);
        }
        for (const [param, replacement] of Object.entries(stringParams)) {
          value = value.split(`{${param}}`).join(replacement);
        }
      }
      return value;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export { LANGUAGES, DEFAULT_LANGUAGE };
export type { LanguageCode };
