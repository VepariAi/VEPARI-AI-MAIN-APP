// TTS — calls backend /voice/tts (Sarvam Bulbul v1), decodes base64 audio.
// Audio keys never leave server; this module only receives PCM WAV base64.

import { Platform } from 'react-native';
import { getApiClient } from '@/services/api';

export type SupportedLanguage =
  | 'hi-IN' | 'bn-IN' | 'kn-IN' | 'ml-IN' | 'mr-IN' | 'od-IN'
  | 'pa-IN' | 'ta-IN' | 'te-IN' | 'gu-IN' | 'en-IN';

export interface TtsResult {
  audioBase64: string;
  durationSeconds: number;
}

type SoundCtor = new(
  b64: string,
  type: string,
  cb: (e: unknown) => void,
) => { play: (cb?: () => void) => void; release: () => void };

let Sound: SoundCtor | null = null;

// Lazy-load react-native-sound if present (optional peer dep for TTS playback).
// If absent, audio is returned as base64 for the caller to handle.
function tryLoadSound(): SoundCtor | null {
  if (Sound !== null) return Sound;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const mod: unknown = require('react-native-sound');
    if (mod != null && typeof mod === 'object' && 'default' in mod && typeof mod.default === 'function') {
      Sound = mod.default as SoundCtor;
    } else if (typeof mod === 'function') {
      Sound = mod as unknown as SoundCtor;
    }
  } catch {
    Sound = null;
  }
  return Sound;
}

export async function synthesise(
  text: string,
  languageCode: SupportedLanguage = 'hi-IN',
): Promise<TtsResult> {
  if (!text.trim()) throw new Error('text is required');

  const result = await getApiClient().synthesise(text, languageCode);
  return { audioBase64: result.audioBase64, durationSeconds: result.durationSeconds };
}

/**
 * Synthesise and play audio inline.
 * Returns after playback completes, or after synthesis if playback is unavailable.
 */
export async function speakText(
  text: string,
  languageCode: SupportedLanguage = 'hi-IN',
): Promise<void> {
  const { audioBase64 } = await synthesise(text, languageCode);
  if (!audioBase64) return;

  const SoundClass = tryLoadSound();
  if (!SoundClass) return; // playback not available; caller can use audioBase64 directly

  await new Promise<void>((resolve) => {
    const sound = new SoundClass(
      `data:audio/wav;base64,${audioBase64}`,
      // react-native-sound bundle type for inline data URIs
      Platform.OS === 'android' ? '' : 'Library',
      (err: unknown) => {
        if (err) { resolve(); return; }
        sound.play(() => { sound.release(); resolve(); });
      },
    );
  });
}
