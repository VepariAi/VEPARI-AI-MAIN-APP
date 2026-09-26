import { useState, useEffect, useCallback } from 'react';
import { LanguageCode, ALL_LANGUAGES, isRTL } from '@vepari/types';
import { t, getCurrentLanguage, setLanguage, onLanguageChange } from '../localization';

export interface UseLanguageReturn {
  language: LanguageCode;
  isRTL: boolean;
  t: typeof t;
  changeLanguage: (lang: LanguageCode) => Promise<void>;
  languages: typeof ALL_LANGUAGES;
}

export function useLanguage(): UseLanguageReturn {
  const [language, setLang] = useState<LanguageCode>(getCurrentLanguage);

  useEffect(() => {
    return onLanguageChange(setLang);
  }, []);

  const changeLanguage = useCallback(async (lang: LanguageCode) => {
    await setLanguage(lang);
  }, []);

  return {
    language,
    isRTL: isRTL(language),
    t,
    changeLanguage,
    languages: ALL_LANGUAGES,
  };
}

export function useT(): typeof t {
  const [, setLang] = useState<LanguageCode>(getCurrentLanguage);

  useEffect(() => {
    return onLanguageChange(setLang);
  }, []);

  return t;
}
