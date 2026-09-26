// At-rest encryption service — 5-layer security, Layer 5 (data at rest).
//
// AES-256-GCM authenticated encryption for secrets stored in MySQL (integration
// credentials, OAuth tokens, API keys). GCM provides confidentiality AND
// integrity: any tampering with the ciphertext fails decryption. A fresh random
// 96-bit IV is generated per encryption, so encrypting the same plaintext twice
// yields different ciphertexts (no deterministic leakage).
//
// The master key comes from DATA_ENCRYPTION_KEY (64 hex chars = 32 bytes). It is
// never stored in the database or source — only in the environment/secret store.
// Stored format:  v1:<iv b64>:<authTag b64>:<ciphertext b64>

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;       // 96-bit nonce, recommended for GCM
const KEY_BYTES = 32;      // AES-256
const VERSION = 'v1';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const hex = process.env['DATA_ENCRYPTION_KEY'] ?? '';
    // Only enforce a valid key when something actually calls encrypt/decrypt;
    // constructing the service must not crash boot in environments that never
    // touch encrypted data. We validate lazily in getKey().
    this.key = /^[0-9a-fA-F]{64}$/.test(hex) ? Buffer.from(hex, 'hex') : Buffer.alloc(0);
  }

  private getKey(): Buffer {
    if (this.key.length !== KEY_BYTES) {
      throw new InternalServerErrorException(
        'DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes) for AES-256-GCM',
      );
    }
    return this.key;
  }

  get isConfigured(): boolean {
    return this.key.length === KEY_BYTES;
  }

  /** Encrypt UTF-8 plaintext → versioned, self-describing ciphertext string. */
  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGO, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${VERSION}:${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
  }

  /** Decrypt a string produced by encrypt(). Throws if tampered or malformed. */
  decrypt(payload: string): string {
    const key = this.getKey();
    const parts = payload.split(':');
    if (parts.length !== 4 || parts[0] !== VERSION) {
      throw new InternalServerErrorException('Malformed ciphertext');
    }
    const [, ivB64, tagB64, dataB64] = parts as [string, string, string, string];
    try {
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(tagB64, 'base64');
      const data = Buffer.from(dataB64, 'base64');
      const decipher = createDecipheriv(ALGO, key, iv);
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
      return plaintext.toString('utf8');
    } catch {
      // Wrong key or tampered ciphertext — GCM auth check failed.
      throw new InternalServerErrorException('Decryption failed');
    }
  }

  /**
   * Encrypt each value of a credentials map (keys stay clear so callers can see
   * WHICH credentials exist without decrypting; values are protected).
   */
  encryptMap(values: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) out[k] = this.encrypt(v);
    return out;
  }

  decryptMap(values: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) out[k] = this.decrypt(v);
    return out;
  }
}
