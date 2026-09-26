// STT client — sends captured audio to the backend AI Gateway (Sarvam Saaras).
// Audio never goes directly to Sarvam from the mobile app.

import { Platform } from 'react-native';
import { getApiClient } from '@/services/api';

export interface TranscriptResult {
  transcript: string;
  languageCode: string;
}

export async function transcribeAudioFile(filePath: string, languageCode?: string): Promise<TranscriptResult> {
  // Read the file as base64 for transport.
  // react-native-audio-record returns a local file path.
  const base64 = await readFileAsBase64(filePath);
  const api = getApiClient();
  return api.transcribe(base64, languageCode);
}

async function readFileAsBase64(path: string): Promise<string> {
  // React Native's fetch can read file:// URIs on both platforms.
  const uri = Platform.OS === 'android' ? `file://${path}` : path;
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URI prefix to get plain base64.
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
