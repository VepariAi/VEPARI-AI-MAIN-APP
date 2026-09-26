// SecureStorage — wraps react-native-keychain for secrets and session material.
//
// RULE: Session tokens, JWTs, refresh tokens, and encryption keys
// MUST use SecureStorage. They must NEVER be written to SQLite rows
// or AsyncStorage. These two storage paths are architecturally separate:
// code review must treat any write to SQLite that carries a token as a bug.
//
// Access is synchronous in intent but async in implementation because the
// OS Keystore/Keychain may require biometric confirmation in the future.

import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.vepari.ai';

// Keys used by the app — enumerate here to avoid string typos elsewhere.
export const StorageKey = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  DB_ENCRYPTION_KEY: 'db_enc_key',
  SECURITY_PIN_HASH: 'security_pin_hash',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

export async function secureWrite(key: StorageKey, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, { service: `${SERVICE}.${key}` });
}

export async function secureRead(key: StorageKey): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: `${SERVICE}.${key}` });
  if (result === false) return null;
  return result.password;
}

export async function secureDelete(key: StorageKey): Promise<void> {
  await Keychain.resetGenericPassword({ service: `${SERVICE}.${key}` });
}

export async function clearAllSecrets(): Promise<void> {
  const keys = Object.values(StorageKey) as StorageKey[];
  await Promise.all(keys.map(k => secureDelete(k)));
}
