import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export type MicPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export async function checkMicPermission(): Promise<MicPermissionStatus> {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO;

  const result = await check(permission);
  switch (result) {
    case RESULTS.GRANTED: return 'granted';
    case RESULTS.DENIED: return 'denied';
    case RESULTS.BLOCKED: return 'blocked';
    default: return 'unavailable';
  }
}

export async function requestMicPermission(): Promise<MicPermissionStatus> {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO;

  const result = await request(permission);
  switch (result) {
    case RESULTS.GRANTED: return 'granted';
    case RESULTS.DENIED: return 'denied';
    case RESULTS.BLOCKED: return 'blocked';
    default: return 'unavailable';
  }
}
