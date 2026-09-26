// Webhook signature verification — PROMPT 204.
//
// Inbound webhooks (payment providers, connection integrations) must be proven
// to come from the expected sender before we act on them. We verify an
// HMAC-SHA256 signature over `timestamp.rawBody` using a shared secret, with:
//   - constant-time comparison (no early-exit timing leak)
//   - a timestamp tolerance window to block replay of captured requests
// The raw request body (bytes, pre-JSON-parse) must be signed — re-serializing
// parsed JSON can change bytes and break the signature.

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface WebhookVerifyInput {
  rawBody: string;
  signatureHeader: string; // hex HMAC provided by the sender
  timestampHeader: string; // unix seconds provided by the sender
  secret: string;
  /** Max allowed age of the request, seconds. Default 300 (5 min). */
  toleranceSeconds?: number;
  /** Injectable clock for tests; defaults to Date.now(). */
  nowMs?: number;
}

export interface WebhookVerifyResult {
  valid: boolean;
  reason?: string;
}

const DEFAULT_TOLERANCE_SECONDS = 300;

export function computeWebhookSignature(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

function timingSafeHexEqual(a: string, b: string): boolean {
  // Length check first is safe: it reveals only length, not content, and unequal
  // lengths can never be equal. timingSafeEqual requires equal-length buffers.
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(input: WebhookVerifyInput): WebhookVerifyResult {
  const {
    rawBody,
    signatureHeader,
    timestampHeader,
    secret,
    toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
    nowMs = Date.now(),
  } = input;

  if (!secret) return { valid: false, reason: 'no_secret_configured' };
  if (!signatureHeader) return { valid: false, reason: 'missing_signature' };
  if (!timestampHeader) return { valid: false, reason: 'missing_timestamp' };

  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts) || ts <= 0) {
    return { valid: false, reason: 'invalid_timestamp' };
  }

  const ageSeconds = Math.abs(nowMs / 1000 - ts);
  if (ageSeconds > toleranceSeconds) {
    return { valid: false, reason: 'timestamp_out_of_tolerance' };
  }

  const expected = computeWebhookSignature(secret, timestampHeader, rawBody);
  if (!timingSafeHexEqual(expected, signatureHeader)) {
    return { valid: false, reason: 'signature_mismatch' };
  }

  return { valid: true };
}
