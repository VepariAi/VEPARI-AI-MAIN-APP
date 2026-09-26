// Localization test suite — PROMPT 191 (all 23 languages).
// Validates the language configuration's completeness and internal consistency,
// and the Sarvam voice-code resolution + RTL rules that the voice pipeline relies on.

import {
  LANGUAGE_CONFIG,
  ALL_LANGUAGES,
  DEFAULT_LANGUAGE,
  isRTL,
  getSarvamVoiceCode,
  isValidLanguageCode,
  type LanguageCode,
} from '@vepari/types';

const RTL_LANGUAGES: LanguageCode[] = ['ur', 'ks', 'sd'];

describe('Localization — coverage', () => {
  it('supports exactly 23 languages (English + 22 scheduled)', () => {
    expect(ALL_LANGUAGES).toHaveLength(23);
    expect(Object.keys(LANGUAGE_CONFIG)).toHaveLength(23);
  });

  it('includes English and Hindi', () => {
    expect(isValidLanguageCode('en')).toBe(true);
    expect(isValidLanguageCode('hi')).toBe(true);
  });

  it('defaults to Hindi', () => {
    expect(DEFAULT_LANGUAGE).toBe('hi');
    expect(isValidLanguageCode(DEFAULT_LANGUAGE)).toBe(true);
  });

  it('rejects an unknown language code', () => {
    expect(isValidLanguageCode('xx')).toBe(false);
    expect(isValidLanguageCode('')).toBe(false);
  });
});

describe('Localization — per-language config integrity', () => {
  for (const def of ALL_LANGUAGES) {
    describe(`${def.nameEn} (${def.code})`, () => {
      it('has all required fields populated', () => {
        expect(def.code).toBeTruthy();
        expect(def.name).toBeTruthy();       // native name
        expect(def.nameEn).toBeTruthy();     // English name
        expect(def.script).toBeTruthy();
        expect(typeof def.rtl).toBe('boolean');
        expect(def.sarvamCode).toMatch(/-IN$/); // Indian locale
        expect(typeof def.sarvamSupported).toBe('boolean');
        expect(def.sarvamFallback).toMatch(/-IN$/);
      });

      it('key matches its own code field', () => {
        expect(LANGUAGE_CONFIG[def.code].code).toBe(def.code);
      });

      it('resolves to a natively-supported Sarvam voice code', () => {
        const voice = getSarvamVoiceCode(def.code);
        expect(voice).toMatch(/-IN$/);
        // The resolved code must itself be a natively-supported language's code.
        const resolvedDef = ALL_LANGUAGES.find(l => l.sarvamCode === voice);
        expect(resolvedDef).toBeDefined();
        expect(resolvedDef!.sarvamSupported).toBe(true);
      });
    });
  }
});

describe('Localization — RTL rules', () => {
  it('marks exactly Urdu, Kashmiri, and Sindhi as RTL', () => {
    const rtl = ALL_LANGUAGES.filter(l => l.rtl).map(l => l.code).sort();
    expect(rtl).toEqual([...RTL_LANGUAGES].sort());
  });

  for (const code of RTL_LANGUAGES) {
    it(`isRTL('${code}') is true`, () => {
      expect(isRTL(code)).toBe(true);
    });
  }

  it('isRTL is false for LTR languages', () => {
    expect(isRTL('hi')).toBe(false);
    expect(isRTL('en')).toBe(false);
    expect(isRTL('ta')).toBe(false);
  });
});

describe('Localization — Sarvam fallback chains terminate', () => {
  it('every fallback points at a natively-supported language', () => {
    for (const def of ALL_LANGUAGES) {
      if (!def.sarvamSupported) {
        const fallbackDef = ALL_LANGUAGES.find(l => l.sarvamCode === def.sarvamFallback);
        expect(fallbackDef).toBeDefined();
        expect(fallbackDef!.sarvamSupported).toBe(true);
      }
    }
  });

  it('native names are distinct across languages', () => {
    const names = ALL_LANGUAGES.map(l => l.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
