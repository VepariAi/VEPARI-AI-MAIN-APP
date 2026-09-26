// PIN management — hashes stored in SecureStorage, never in SQLite rows.
// Uses SHA-256 with a fixed app-level salt. The raw PIN is never persisted.

import { secureRead, secureWrite, secureDelete, StorageKey } from './secureStorage';

const SALT = 'vepari-pin-v1:';

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(SALT + pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function setPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await secureWrite(StorageKey.SECURITY_PIN_HASH, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await secureRead(StorageKey.SECURITY_PIN_HASH);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export async function hasPin(): Promise<boolean> {
  const stored = await secureRead(StorageKey.SECURITY_PIN_HASH);
  return stored !== null;
}

export async function clearPin(): Promise<void> {
  await secureDelete(StorageKey.SECURITY_PIN_HASH);
}
