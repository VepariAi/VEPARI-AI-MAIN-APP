// Local SQLite database using op-sqlite with encryption.
//
// RULE: secrets, JWTs, and session tokens are NEVER stored in SQLite rows.
// They belong exclusively in SecureStorage (react-native-keychain).
// The encryption key itself is fetched from SecureStorage, not hardcoded.

import { open, type DB } from '@op-engineering/op-sqlite';
import { secureRead, secureWrite, StorageKey } from '@/security/secureStorage';

let _db: DB | null = null;

async function getEncryptionKey(): Promise<string> {
  let key = await secureRead(StorageKey.DB_ENCRYPTION_KEY);
  if (!key) {
    // Generate a random 32-byte hex key on first run.
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    key = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    await secureWrite(StorageKey.DB_ENCRYPTION_KEY, key);
  }
  return key;
}

export async function initDb(): Promise<void> {
  if (_db) return;
  const encryptionKey = await getEncryptionKey();
  _db = open({ name: 'vepari.db', encryptionKey });
  _db.executeSync(`PRAGMA journal_mode=WAL;`);
  _db.executeSync(`PRAGMA foreign_keys=ON;`);
  runMigrations(_db);
}

export function getDb(): DB {
  if (!_db) {
    throw new Error('Database not initialised. Call initDb() first.');
  }
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

function runMigrations(db: DB): void {
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS sync_checkpoints (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      last_synced_at INTEGER NOT NULL,
      server_version INTEGER NOT NULL DEFAULT 0
    );
  `);
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS pending_mutations (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0
    );
  `);
}
