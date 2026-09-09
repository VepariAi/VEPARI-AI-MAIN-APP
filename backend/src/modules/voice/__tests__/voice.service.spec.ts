// Unit tests for VoiceService — validates Sarvam STT/TTS wiring.
// fetch is mocked so no real Sarvam API calls are made.
// SARVAM_API_KEY is set in process.env for each test.

import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { VoiceService } from '../voice.service';

function mockFetch(ok: boolean, body: unknown, statusText = 'OK') {
  const response = {
    ok,
    status: ok ? 200 : 500,
    statusText,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
  return jest.fn().mockResolvedValue(response);
}

describe('VoiceService', () => {
  let service: VoiceService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    process.env['SARVAM_API_KEY'] = 'test-key-never-send-to-client';
    originalFetch = global.fetch;
    service = new VoiceService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env['SARVAM_API_KEY'];
  });

  // ── transcribe (STT) ───────────────────────────────────────────────────────

  describe('transcribe', () => {
    it('throws BadRequestException when audioBase64 is empty', async () => {
      await expect(service.transcribe('')).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException when SARVAM_API_KEY is missing', async () => {
      delete process.env['SARVAM_API_KEY'];
      global.fetch = mockFetch(true, { transcript: 'hello', language_code: 'en-IN' });
      await expect(service.transcribe('base64audio==')).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when Sarvam returns non-2xx', async () => {
      global.fetch = mockFetch(false, { error: 'Unauthorized' });
      await expect(service.transcribe('base64audio==')).rejects.toThrow(InternalServerErrorException);
    });

    it('returns transcript and languageCode from Sarvam response', async () => {
      global.fetch = mockFetch(true, { transcript: 'आज मुझे चावल मिला', language_code: 'hi-IN', confidence: 0.97 });
      const result = await service.transcribe('base64audio==');
      expect(result.transcript).toBe('आज मुझे चावल मिला');
      expect(result.languageCode).toBe('hi-IN');
      expect(result.confidence).toBe(0.97);
    });

    it('defaults languageCode to en-IN when Sarvam omits it', async () => {
      global.fetch = mockFetch(true, { transcript: 'hello world' });
      const result = await service.transcribe('base64audio==');
      expect(result.languageCode).toBe('en-IN');
    });

    it('sends language_code in request body when provided', async () => {
      const fakeFetch = mockFetch(true, { transcript: 'வணக்கம்', language_code: 'ta-IN' });
      global.fetch = fakeFetch;
      await service.transcribe('audio==', 'ta-IN');
      const body = JSON.parse(fakeFetch.mock.calls[0][1].body as string) as Record<string, unknown>;
      expect(body['language_code']).toBe('ta-IN');
    });

    it('does NOT include language_code in request when not provided (auto-detect)', async () => {
      const fakeFetch = mockFetch(true, { transcript: 'hello', language_code: 'en-IN' });
      global.fetch = fakeFetch;
      await service.transcribe('audio==');
      const body = JSON.parse(fakeFetch.mock.calls[0][1].body as string) as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(body, 'language_code')).toBe(false);
    });

    it('includes the API key as API-Subscription-Key header (never sends key in body)', async () => {
      const fakeFetch = mockFetch(true, { transcript: 'ok', language_code: 'en-IN' });
      global.fetch = fakeFetch;
      await service.transcribe('audio==');
      const headers = fakeFetch.mock.calls[0][1].headers as Record<string, string>;
      expect(headers['API-Subscription-Key']).toBe('test-key-never-send-to-client');
      const body = JSON.parse(fakeFetch.mock.calls[0][1].body as string) as Record<string, unknown>;
      expect(Object.values(body).join()).not.toContain('test-key');
    });
  });

  // ── synthesise (TTS) ───────────────────────────────────────────────────────

  describe('synthesise', () => {
    it('throws BadRequestException when text is empty', async () => {
      await expect(service.synthesise('')).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException when Sarvam TTS returns non-2xx', async () => {
      global.fetch = mockFetch(false, { error: 'quota exceeded' });
      await expect(service.synthesise('नमस्ते')).rejects.toThrow(InternalServerErrorException);
    });

    it('returns audioBase64 from Sarvam TTS response', async () => {
      global.fetch = mockFetch(true, { audios: ['AAEC/w=='] });
      const result = await service.synthesise('नमस्ते');
      expect(result.audioBase64).toBe('AAEC/w==');
    });

    it('defaults to hi-IN when languageCode not provided', async () => {
      const fakeFetch = mockFetch(true, { audios: ['audio=='] });
      global.fetch = fakeFetch;
      await service.synthesise('hello');
      const body = JSON.parse(fakeFetch.mock.calls[0][1].body as string) as Record<string, unknown>;
      expect(body['target_language_code']).toBe('hi-IN');
    });

    it('passes provided languageCode to Sarvam', async () => {
      const fakeFetch = mockFetch(true, { audios: ['audio=='] });
      global.fetch = fakeFetch;
      await service.synthesise('hello', 'ta-IN');
      const body = JSON.parse(fakeFetch.mock.calls[0][1].body as string) as Record<string, unknown>;
      expect(body['target_language_code']).toBe('ta-IN');
    });

    it('API key is sent as header, never embedded in body', async () => {
      const fakeFetch = mockFetch(true, { audios: ['audio=='] });
      global.fetch = fakeFetch;
      await service.synthesise('hello');
      const headers = fakeFetch.mock.calls[0][1].headers as Record<string, string>;
      expect(headers['API-Subscription-Key']).toBe('test-key-never-send-to-client');
      const bodyStr = fakeFetch.mock.calls[0][1].body as string;
      expect(bodyStr).not.toContain('test-key');
    });

    it('returns empty audioBase64 when Sarvam omits audios array', async () => {
      global.fetch = mockFetch(true, {});
      const result = await service.synthesise('hello');
      expect(result.audioBase64).toBe('');
    });
  });
});
