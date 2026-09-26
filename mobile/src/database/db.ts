// Local SQLite database using op-sqlite with encryption.
//
// RULE: secrets, JWTs, and session tokens are NEVER stored in SQLite rows.
// They belong exclusively in SecureStorage (react-native-keychain).
// The encryption key itself is fetched from SecureStorage, not hardcoded.
//
// op-sqlite 9.3.0 is pinned for React Native 0.73.6 compatibility. This version
// exposes an async execute() API only (there is no synchronous variant), so
// initialisation and migrations are awaited. Encryption at rest uses SQLCipher,
// enabled by the "op-sqlite": { "sqlcipher": true } block in package.json;
// passing an encryptionKey to open() transparently encrypts the database file.

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
  const db = open({ name: 'vepari.db', encryptionKey });
  await db.execute(`PRAGMA journal_mode=WAL;`);
  await db.execute(`PRAGMA foreign_keys=ON;`);
  await runMigrations(db);
  // Only publish the handle once migrations have succeeded, so a failed
  // init leaves _db null and can be retried cleanly.
  _db = db;
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

async function runMigrations(db: DB): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_checkpoints (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      last_synced_at INTEGER NOT NULL,
      server_version INTEGER NOT NULL DEFAULT 0
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pending_mutations (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount_paise INTEGER,
      description TEXT,
      party TEXT,
      item_name TEXT,
      quantity REAL,
      raw_transcript TEXT NOT NULL,
      confidence REAL NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_memories_business_id
      ON memories (business_id, created_at DESC);
  `);
}
