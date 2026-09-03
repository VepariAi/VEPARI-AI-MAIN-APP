import * as Keychain from 'react-native-keychain';

export type BiometricType = 'TouchID' | 'FaceID' | 'Fingerprint' | 'none';

export async function getBiometricType(): Promise<BiometricType> {
  const supported = await Keychain.getSupportedBiometryType();
  if (!supported) return 'none';
  if (supported === Keychain.BIOMETRY_TYPE.TOUCH_ID) return 'TouchID';
  if (supported === Keychain.BIOMETRY_TYPE.FACE_ID) return 'FaceID';
  return 'Fingerprint';
}

export async function authenticateWithBiometric(reason: string): Promise<boolean> {
  try {
    const result = await Keychain.getGenericPassword({
      service: 'com.vepari.ai.biometric',
      authenticationPrompt: { title: reason },
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    });
    return result !== false;
  } catch {
    return false;
  }
}

export async function storeBiometricSentinel(): Promise<void> {
  await Keychain.setGenericPassword('biometric', 'enabled', {
    service: 'com.vepari.ai.biometric',
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });
}
