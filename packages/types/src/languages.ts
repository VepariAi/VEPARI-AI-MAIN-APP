/**
 * @vepari/types — language definitions for all 23 supported languages.
 * English + 22 official Indian languages (8th Schedule of the Constitution of India).
 *
 * Rules:
 *  - When a language is selected, ALL UI, AI responses, and TTS output must be in that language.
 *  - Voice input may be in any language; TTS output is always in the selected language.
 *  - RTL layout is applied automatically for Urdu, Sindhi, and Kashmiri.
 */

export type LanguageCode =
  | 'en'   // English
  | 'hi'   // Hindi         — हिन्दी
  | 'bn'   // Bengali       — বাংলা
  | 'te'   // Telugu        — తెలుగు
  | 'mr'   // Marathi       — मराठी
  | 'ta'   // Tamil         — தமிழ்
  | 'gu'   // Gujarati      — ગુજરાતી
  | 'kn'   // Kannada       — ಕನ್ನಡ
  | 'ml'   // Malayalam     — മലയാളം
  | 'pa'   // Punjabi       — ਪੰਜਾਬੀ
  | 'or'   // Odia          — ଓଡ଼ିଆ
  | 'ur'   // Urdu          — اردو
  | 'as'   // Assamese      — অসমীয়া
  | 'mai'  // Maithili      — मैथिली
  | 'sa'   // Sanskrit      — संस्कृतम्
  | 'sat'  // Santali       — ᱥᱟᱱᱛᱟᱲᱤ
  | 'ks'   // Kashmiri      — کٲشُر
  | 'ne'   // Nepali        — नेपाली
  | 'sd'   // Sindhi        — سنڌي
  | 'kok'  // Konkani       — कोंकणी
  | 'mni'  // Manipuri      — মৈতৈলোন্
  | 'brx'  // Bodo          — बड़ो
  | 'doi'  // Dogri         — डोगरी

export interface LanguageDef {
  code: LanguageCode;
  name: string;          // Name in that language
  nameEn: string;        // Name in English
  script: string;        // Script name
  rtl: boolean;          // Right-to-left layout
  sarvamCode: string;    // Sarvam API language_code (STT/TTS)
  sarvamSupported: boolean; // Whether Sarvam natively supports TTS
  sarvamFallback: string;  // Fallback Sarvam code when not natively supported
}

export const LANGUAGE_CONFIG: Record<LanguageCode, LanguageDef> = {
  en:  { code: 'en',  name: 'English',       nameEn: 'English',    script: 'Latin',      rtl: false, sarvamCode: 'en-IN',  sarvamSupported: true,  sarvamFallback: 'en-IN' },
  hi:  { code: 'hi',  name: 'हिन्दी',          nameEn: 'Hindi',      script: 'Devanagari', rtl: false, sarvamCode: 'hi-IN',  sarvamSupported: true,  sarvamFallback: 'hi-IN' },
  bn:  { code: 'bn',  name: 'বাংলা',           nameEn: 'Bengali',    script: 'Bengali',    rtl: false, sarvamCode: 'bn-IN',  sarvamSupported: true,  sarvamFallback: 'bn-IN' },
  te:  { code: 'te',  name: 'తెలుగు',          nameEn: 'Telugu',     script: 'Telugu',     rtl: false, sarvamCode: 'te-IN',  sarvamSupported: true,  sarvamFallback: 'te-IN' },
  mr:  { code: 'mr',  name: 'मराठी',           nameEn: 'Marathi',    script: 'Devanagari', rtl: false, sarvamCode: 'mr-IN',  sarvamSupported: true,  sarvamFallback: 'mr-IN' },
  ta:  { code: 'ta',  name: 'தமிழ்',           nameEn: 'Tamil',      script: 'Tamil',      rtl: false, sarvamCode: 'ta-IN',  sarvamSupported: true,  sarvamFallback: 'ta-IN' },
  gu:  { code: 'gu',  name: 'ગુજરાતી',         nameEn: 'Gujarati',   script: 'Gujarati',   rtl: false, sarvamCode: 'gu-IN',  sarvamSupported: true,  sarvamFallback: 'gu-IN' },
  kn:  { code: 'kn',  name: 'ಕನ್ನಡ',           nameEn: 'Kannada',    script: 'Kannada',    rtl: false, sarvamCode: 'kn-IN',  sarvamSupported: true,  sarvamFallback: 'kn-IN' },
  ml:  { code: 'ml',  name: 'മലയാളം',          nameEn: 'Malayalam',  script: 'Malayalam',  rtl: false, sarvamCode: 'ml-IN',  sarvamSupported: true,  sarvamFallback: 'ml-IN' },
  pa:  { code: 'pa',  name: 'ਪੰਜਾਬੀ',          nameEn: 'Punjabi',    script: 'Gurmukhi',   rtl: false, sarvamCode: 'pa-IN',  sarvamSupported: true,  sarvamFallback: 'pa-IN' },
  or:  { code: 'or',  name: 'ଓଡ଼ିଆ',            nameEn: 'Odia',       script: 'Odia',       rtl: false, sarvamCode: 'od-IN',  sarvamSupported: true,  sarvamFallback: 'od-IN' },
  ur:  { code: 'ur',  name: 'اردو',             nameEn: 'Urdu',       script: 'Nastaliq',   rtl: true,  sarvamCode: 'ur-IN',  sarvamSupported: true,  sarvamFallback: 'ur-IN' },
  as:  { code: 'as',  name: 'অসমীয়া',          nameEn: 'Assamese',   script: 'Bengali',    rtl: false, sarvamCode: 'as-IN',  sarvamSupported: false, sarvamFallback: 'bn-IN' },
  mai: { code: 'mai', name: 'मैथिली',           nameEn: 'Maithili',   script: 'Devanagari', rtl: false, sarvamCode: 'mai-IN', sarvamSupported: false, sarvamFallback: 'hi-IN' },
  sa:  { code: 'sa',  name: 'संस्कृतम्',         nameEn: 'Sanskrit',   script: 'Devanagari', rtl: false, sarvamCode: 'sa-IN',  sarvamSupported: false, sarvamFallback: 'hi-IN' },
  sat: { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ',         nameEn: 'Santali',    script: 'Ol Chiki',   rtl: false, sarvamCode: 'sat-IN', sarvamSupported: false, sarvamFallback: 'hi-IN' },
  ks:  { code: 'ks',  name: 'کٲشُر',            nameEn: 'Kashmiri',   script: 'Nastaliq',   rtl: true,  sarvamCode: 'ks-IN',  sarvamSupported: false, sarvamFallback: 'ur-IN' },
  ne:  { code: 'ne',  name: 'नेपाली',           nameEn: 'Nepali',     script: 'Devanagari', rtl: false, sarvamCode: 'ne-IN',  sarvamSupported: false, sarvamFallback: 'hi-IN' },
  sd:  { code: 'sd',  name: 'سنڌي',             nameEn: 'Sindhi',     script: 'Arabic',     rtl: true,  sarvamCode: 'sd-IN',  sarvamSupported: false, sarvamFallback: 'ur-IN' },
  kok: { code: 'kok', name: 'कोंकणी',           nameEn: 'Konkani',    script: 'Devanagari', rtl: false, sarvamCode: 'kok-IN', sarvamSupported: false, sarvamFallback: 'mr-IN' },
  mni: { code: 'mni', name: 'মৈতৈলোন্',         nameEn: 'Manipuri',   script: 'Bengali',    rtl: false, sarvamCode: 'mni-IN', sarvamSupported: false, sarvamFallback: 'bn-IN' },
  brx: { code: 'brx', name: 'बड़ो',              nameEn: 'Bodo',       script: 'Devanagari', rtl: false, sarvamCode: 'brx-IN', sarvamSupported: false, sarvamFallback: 'hi-IN' },
  doi: { code: 'doi', name: 'डोगरी',            nameEn: 'Dogri',      script: 'Devanagari', rtl: false, sarvamCode: 'doi-IN', sarvamSupported: false, sarvamFallback: 'hi-IN' },
};

export const ALL_LANGUAGES: LanguageDef[] = Object.values(LANGUAGE_CONFIG);

export const DEFAULT_LANGUAGE: LanguageCode = 'hi';

export function isRTL(code: LanguageCode): boolean {
  return LANGUAGE_CONFIG[code]?.rtl ?? false;
}

export function getSarvamVoiceCode(code: LanguageCode): string {
  const def = LANGUAGE_CONFIG[code];
  if (!def) return 'hi-IN';
  return def.sarvamSupported ? def.sarvamCode : def.sarvamFallback;
}

export function isValidLanguageCode(code: string): code is LanguageCode {
  return Object.prototype.hasOwnProperty.call(LANGUAGE_CONFIG, code);
}
