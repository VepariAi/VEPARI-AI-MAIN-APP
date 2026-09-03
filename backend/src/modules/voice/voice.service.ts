// Voice service — Sarvam AI STT (Saaras) and TTS (Bulbul) integration.
// Sarvam API keys are loaded from process.env and NEVER sent to the client.
// All Sarvam network calls happen here, server-side only.

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';

const SARVAM_API_BASE = 'https://api.sarvam.ai';
const STT_MODEL = 'saaras:v2';  // Sarvam Saaras v2 — multilingual STT
const TTS_MODEL = 'bulbul:v1';  // Sarvam Bulbul v1 — multilingual TTS

export type SupportedLanguage =
  | 'hi-IN' | 'bn-IN' | 'kn-IN' | 'ml-IN' | 'mr-IN' | 'od-IN'
  | 'pa-IN' | 'ta-IN' | 'te-IN' | 'gu-IN' | 'en-IN';

export interface SttResult {
  transcript: string;
  languageCode: string;
  confidence?: number;
}

export interface TtsResult {
  audioBase64: string; // PCM WAV base64 — played by mobile
  durationSeconds: number;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  private get apiKey(): string {
    const key = process.env['SARVAM_API_KEY'];
    if (!key) throw new InternalServerErrorException('Sarvam API key not configured');
    return key;
  }

  async transcribe(audioBase64: string, languageCode?: string): Promise<SttResult> {
    if (!audioBase64) throw new BadRequestException('audioBase64 is required');

    const payload = {
      model: STT_MODEL,
      audio: audioBase64,
      ...(languageCode ? { language_code: languageCode } : {}),
    };

    const response = await fetch(`${SARVAM_API_BASE}/speech-to-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Subscription-Key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Sarvam STT error ${response.status}: ${body}`);
      throw new InternalServerErrorException('Speech-to-text service error');
    }

    const data = await response.json() as {
      transcript?: string;
      language_code?: string;
      confidence?: number;
    };

    const result: SttResult = {
      transcript: data.transcript ?? '',
      languageCode: data.language_code ?? 'en-IN',
    };
    if (data.confidence !== undefined) result.confidence = data.confidence;
    return result;
  }

  async synthesise(text: string, languageCode: SupportedLanguage = 'hi-IN'): Promise<TtsResult> {
    if (!text) throw new BadRequestException('text is required');

    const payload = {
      inputs: [text],
      target_language_code: languageCode,
      model: TTS_MODEL,
      pitch: 0,
      pace: 1.0,
      loudness: 1.5,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
    };

    const response = await fetch(`${SARVAM_API_BASE}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Subscription-Key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Sarvam TTS error ${response.status}: ${body}`);
      throw new InternalServerErrorException('Text-to-speech service error');
    }

    const data = await response.json() as { audios?: string[] };
    const audioBase64 = data.audios?.[0] ?? '';

    return { audioBase64, durationSeconds: 0 };
  }
}
