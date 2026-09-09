import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode, isValidLanguageCode, DEFAULT_LANGUAGE } from '@vepari/types';

const STORAGE_KEY = '@vepari_language';

type TranslationMap = Record<string, string>;

let currentLang: LanguageCode = DEFAULT_LANGUAGE;
let translations: TranslationMap = {};
let changeListeners: Array<(lang: LanguageCode) => void> = [];

const TRANSLATION_LOADERS: Record<LanguageCode, () => Promise<{ default: TranslationMap }>> = {
  en:  () => import('./translations/en.json'),
  hi:  () => import('./translations/hi.json'),
  bn:  () => import('./translations/bn.json'),
  te:  () => import('./translations/te.json'),
  mr:  () => import('./translations/mr.json'),
  ta:  () => import('./translations/ta.json'),
  gu:  () => import('./translations/gu.json'),
  kn:  () => import('./translations/kn.json'),
  ml:  () => import('./translations/ml.json'),
  pa:  () => import('./translations/pa.json'),
  or:  () => import('./translations/or.json'),
  ur:  () => import('./translations/ur.json'),
  as:  () => import('./translations/as.json'),
  mai: () => import('./translations/mai.json'),
  sa:  () => import('./translations/sa.json'),
  sat: () => import('./translations/sat.json'),
  ks:  () => import('./translations/ks.json'),
  ne:  () => import('./translations/ne.json'),
  sd:  () => import('./translations/sd.json'),
  kok: () => import('./translations/kok.json'),
  mni: () => import('./translations/mni.json'),
  brx: () => import('./translations/brx.json'),
  doi: () => import('./translations/doi.json'),
};

async function loadTranslations(lang: LanguageCode): Promise<TranslationMap> {
  const loader = TRANSLATION_LOADERS[lang];
  if (!loader) return {};
  const mod = await loader();
  return mod.default ?? (mod as unknown as TranslationMap);
}

export async function initI18n(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const lang = stored && isValidLanguageCode(stored) ? stored : DEFAULT_LANGUAGE;
    await setLanguage(lang);
  } catch {
    await setLanguage(DEFAULT_LANGUAGE);
  }
}

export async function setLanguage(lang: LanguageCode): Promise<void> {
  translations = await loadTranslations(lang);
  currentLang = lang;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage failure is non-fatal
  }
  changeListeners.forEach(fn => fn(lang));
}

export function getCurrentLanguage(): LanguageCode {
  return currentLang;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let value = translations[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    });
  }
  return value;
}

export function onLanguageChange(fn: (lang: LanguageCode) => void): () => void {
  changeListeners.push(fn);
  return () => {
    changeListeners = changeListeners.filter(l => l !== fn);
  };
}
