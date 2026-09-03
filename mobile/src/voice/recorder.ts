// Audio recorder — captures raw PCM for Sarvam STT processing on the backend.
// PCM 16kHz mono 16-bit is what Sarvam Saaras expects.

import AudioRecord from 'react-native-audio-record';
import { checkMicPermission, requestMicPermission } from './permissions';

export type RecorderState = 'idle' | 'recording' | 'stopped';

interface RecorderOptions {
  onChunk?: (base64Chunk: string) => void;
}

let _state: RecorderState = 'idle';

const AUDIO_OPTIONS = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6, // Android: MIC with voice processing
  wavFile: 'voice_capture.wav',
};

export async function startRecording(opts: RecorderOptions = {}): Promise<void> {
  if (_state === 'recording') return;

  let permission = await checkMicPermission();
  if (permission === 'denied') {
    permission = await requestMicPermission();
  }
  if (permission !== 'granted') {
    throw new Error(`Microphone permission ${permission}`);
  }

  AudioRecord.init(AUDIO_OPTIONS);
  if (opts.onChunk) {
    AudioRecord.on('data', opts.onChunk);
  }
  AudioRecord.start();
  _state = 'recording';
}

export async function stopRecording(): Promise<string> {
  if (_state !== 'recording') return '';
  const audioFile = await AudioRecord.stop();
  _state = 'stopped';
  return audioFile;
}

export function getRecorderState(): RecorderState {
  return _state;
}

export function resetRecorder(): void {
  _state = 'idle';
}
