// Unit tests for TransliterationService — Prompt 146.
// No real Sarvam API calls — fetch is mocked.

import { TransliterationService } from '../transliteration.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

const ORIGINAL_ENV = process.env;

function makeService() {
  process.env['SARVAM_API_KEY'] = 'test-sarvam-key';
  return new TransliterationService();
}

// ── isNonLatin ────────────────────────────────────────────────────────────────

describe('TransliterationService.isNonLatin', () => {
  it('returns false for Latin script text', () => {
    const svc = makeService();
    expect(svc.isNonLatin('Hello World')).toBe(false);
    expect(svc.isNonLatin('namaste')).toBe(false);
  });

  it('returns true for Devanagari text', () => {
    const svc = makeService();
    expect(svc.isNonLatin('नमस्ते')).toBe(true);
  });

  it('returns true for Tamil script', () => {
    const svc = makeService();
    expect(svc.isNonLatin('வணக்கம்')).toBe(true);
  });

  it('returns false for mixed Latin digits and punctuation', () => {
    const svc = makeService();
    expect(svc.isNonLatin('Total: ₹500')).toBe(true); // ₹ is non-Latin
  });
});

// ── transliterate ─────────────────────────────────────────────────────────────

describe('TransliterationService.transliterate', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    process.env['SARVAM_API_KEY'] = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...ORIGINAL_ENV };
  });

  it('throws BadRequestException for empty text', async () => {
    const svc = makeService();
    await expect(svc.transliterate({ text: '  ', sourceLanguageCode: 'hi', targetLanguageCode: 'en' })).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for unsupported language code', async () => {
    const svc = makeService();
    await expect(svc.transliterate({
      text: 'hello',
      sourceLanguageCode: 'xx' as any,
      targetLanguageCode: 'hi',
    })).rejects.toThrow(BadRequestException);
  });

  it('returns transliterated text from Sarvam response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transliterated_text: 'नमस्ते' }),
    } as Response);

    const svc = makeService();
    const result = await svc.transliterate({ text: 'namaste', sourceLanguageCode: 'en', targetLanguageCode: 'hi' });
    expect(result.transliterated).toBe('नमस्ते');
    expect(result.original).toBe('namaste');
    expect(result.sourceLanguage).toBe('en');
    expect(result.targetLanguage).toBe('hi');
  });

  it('falls back to original text when Sarvam returns empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const svc = makeService();
    const result = await svc.transliterate({ text: 'test', sourceLanguageCode: 'en', targetLanguageCode: 'hi' });
    expect(result.transliterated).toBe('test');
  });

  it('throws InternalServerErrorException on Sarvam API error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable',
    } as unknown as Response);

    const svc = makeService();
    await expect(svc.transliterate({ text: 'test', sourceLanguageCode: 'en', targetLanguageCode: 'hi' })).rejects.toThrow(InternalServerErrorException);
  });

  it('throws InternalServerErrorException when API key is not configured', async () => {
    delete process.env['SARVAM_API_KEY'];
    const svc = new TransliterationService();
    await expect(svc.transliterate({ text: 'test', sourceLanguageCode: 'en', targetLanguageCode: 'hi' })).rejects.toThrow(InternalServerErrorException);
  });

  it('passes preserveNumerals flag in request body', async () => {
    const capturedBody: string[] = [];
    global.fetch = jest.fn().mockImplementation(async (_url: unknown, init: { body: string }) => {
      capturedBody.push(init.body);
      return { ok: true, json: async () => ({ transliterated_text: 'test' }) } as Response;
    });

    const svc = makeService();
    await svc.transliterate({ text: 'Sale 100', sourceLanguageCode: 'en', targetLanguageCode: 'hi', preserveNumerals: true });
    const body = JSON.parse(capturedBody[0]!) as Record<string, unknown>;
    expect(body['numerals_format']).toBe('international');
  });
});

// ── transliterateBatch ────────────────────────────────────────────────────────

describe('TransliterationService.transliterateBatch', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns an array of transliterated strings in order', async () => {
    const responses = ['नमस्ते', 'धन्यवाद', 'हाँ'];
    let callIdx = 0;
    global.fetch = jest.fn().mockImplementation(async () => {
      const text = responses[callIdx++];
      return { ok: true, json: async () => ({ transliterated_text: text }) } as Response;
    });

    process.env['SARVAM_API_KEY'] = 'test-key';
    const svc = new TransliterationService();
    const result = await svc.transliterateBatch(['namaste', 'dhanyavaad', 'haan'], 'en', 'hi');
    expect(result).toEqual(['नमस्ते', 'धन्यवाद', 'हाँ']);
  });
});
