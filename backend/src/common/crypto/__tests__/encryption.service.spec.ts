// Unit tests for EncryptionService (AES-256-GCM at-rest) — 5-layer security, Layer 5.

import { EncryptionService } from '../encryption.service';
import { InternalServerErrorException } from '@nestjs/common';

const KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex

describe('EncryptionService', () => {
  const origEnv = process.env['DATA_ENCRYPTION_KEY'];

  afterEach(() => {
    if (origEnv === undefined) delete process.env['DATA_ENCRYPTION_KEY'];
    else process.env['DATA_ENCRYPTION_KEY'] = origEnv;
  });

  function make(key?: string): EncryptionService {
    if (key === undefined) delete process.env['DATA_ENCRYPTION_KEY'];
    else process.env['DATA_ENCRYPTION_KEY'] = key;
    return new EncryptionService();
  }

  it('round-trips plaintext', () => {
    const svc = make(KEY);
    const secret = 'razorpay_key_secret_abc123';
    const enc = svc.encrypt(secret);
    expect(enc).not.toContain(secret);          // ciphertext must not leak plaintext
    expect(svc.decrypt(enc)).toBe(secret);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const svc = make(KEY);
    const a = svc.encrypt('same');
    const b = svc.encrypt('same');
    expect(a).not.toBe(b);
    expect(svc.decrypt(a)).toBe('same');
    expect(svc.decrypt(b)).toBe('same');
  });

  it('emits versioned self-describing format v1:iv:tag:data', () => {
    const svc = make(KEY);
    const parts = svc.encrypt('x').split(':');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('v1');
  });

  it('fails to decrypt tampered ciphertext (GCM integrity)', () => {
    const svc = make(KEY);
    const enc = svc.encrypt('secret');
    const parts = enc.split(':');
    // Flip a character in the ciphertext segment.
    parts[3] = parts[3]!.slice(0, -1) + (parts[3]!.endsWith('A') ? 'B' : 'A');
    expect(() => svc.decrypt(parts.join(':'))).toThrow(InternalServerErrorException);
  });

  it('fails to decrypt with a different key', () => {
    const enc = make(KEY).encrypt('secret');
    const other = make('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    expect(() => other.decrypt(enc)).toThrow(InternalServerErrorException);
  });

  it('rejects malformed ciphertext', () => {
    const svc = make(KEY);
    expect(() => svc.decrypt('not-valid')).toThrow(InternalServerErrorException);
    expect(() => svc.decrypt('v2:a:b:c')).toThrow(InternalServerErrorException);
  });

  it('throws a clear error when the key is missing or wrong length', () => {
    const svc = make(undefined);
    expect(svc.isConfigured).toBe(false);
    expect(() => svc.encrypt('x')).toThrow(/DATA_ENCRYPTION_KEY/);
    const shortKey = make('abcd');
    expect(() => shortKey.encrypt('x')).toThrow(/DATA_ENCRYPTION_KEY/);
  });

  it('encryptMap keeps keys clear and protects values', () => {
    const svc = make(KEY);
    const enc = svc.encryptMap({ key_id: 'k1', key_secret: 's1' });
    expect(Object.keys(enc)).toEqual(['key_id', 'key_secret']);
    expect(enc['key_secret']).not.toContain('s1');
    expect(svc.decryptMap(enc)).toEqual({ key_id: 'k1', key_secret: 's1' });
  });
});
