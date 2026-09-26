// Unit tests for webhook signature verification — PROMPT 204.

import { verifyWebhookSignature, computeWebhookSignature } from '../webhook.security';

const SECRET = 'whsec_test_secret';
const BODY = JSON.stringify({ event: 'payment.captured', amountInPaise: 50000 });

function nowSeconds(): string {
  return String(Math.floor(Date.now() / 1000));
}

describe('verifyWebhookSignature', () => {
  it('accepts a correctly signed, fresh request', () => {
    const ts = nowSeconds();
    const sig = computeWebhookSignature(SECRET, ts, BODY);
    const r = verifyWebhookSignature({ rawBody: BODY, signatureHeader: sig, timestampHeader: ts, secret: SECRET });
    expect(r.valid).toBe(true);
  });

  it('rejects a tampered body', () => {
    const ts = nowSeconds();
    const sig = computeWebhookSignature(SECRET, ts, BODY);
    const r = verifyWebhookSignature({
      rawBody: JSON.stringify({ event: 'payment.captured', amountInPaise: 999999 }),
      signatureHeader: sig,
      timestampHeader: ts,
      secret: SECRET,
    });
    expect(r.valid).toBe(false);
    expect(r.reason).toBe('signature_mismatch');
  });

  it('rejects a wrong secret', () => {
    const ts = nowSeconds();
    const sig = computeWebhookSignature('other_secret', ts, BODY);
    const r = verifyWebhookSignature({ rawBody: BODY, signatureHeader: sig, timestampHeader: ts, secret: SECRET });
    expect(r.valid).toBe(false);
    expect(r.reason).toBe('signature_mismatch');
  });

  it('rejects a replayed (stale) request outside tolerance', () => {
    const oldTs = String(Math.floor(Date.now() / 1000) - 3600); // 1 hour old
    const sig = computeWebhookSignature(SECRET, oldTs, BODY);
    const r = verifyWebhookSignature({ rawBody: BODY, signatureHeader: sig, timestampHeader: oldTs, secret: SECRET });
    expect(r.valid).toBe(false);
    expect(r.reason).toBe('timestamp_out_of_tolerance');
  });

  it('accepts a request at the edge of tolerance', () => {
    const nowMs = 1_000_000_000_000;
    const ts = String(nowMs / 1000 - 299); // within 300s window
    const sig = computeWebhookSignature(SECRET, ts, BODY);
    const r = verifyWebhookSignature({ rawBody: BODY, signatureHeader: sig, timestampHeader: ts, secret: SECRET, nowMs });
    expect(r.valid).toBe(true);
  });

  it('rejects when signature header is missing', () => {
    expect(verifyWebhookSignature({ rawBody: BODY, signatureHeader: '', timestampHeader: nowSeconds(), secret: SECRET }).reason)
      .toBe('missing_signature');
  });

  it('rejects when timestamp header is missing', () => {
    expect(verifyWebhookSignature({ rawBody: BODY, signatureHeader: 'abc', timestampHeader: '', secret: SECRET }).reason)
      .toBe('missing_timestamp');
  });

  it('rejects an invalid timestamp', () => {
    expect(verifyWebhookSignature({ rawBody: BODY, signatureHeader: 'abc', timestampHeader: 'not-a-number', secret: SECRET }).reason)
      .toBe('invalid_timestamp');
  });

  it('rejects when no secret is configured', () => {
    expect(verifyWebhookSignature({ rawBody: BODY, signatureHeader: 'abc', timestampHeader: nowSeconds(), secret: '' }).reason)
      .toBe('no_secret_configured');
  });

  it('rejects a signature of wrong length without throwing', () => {
    const ts = nowSeconds();
    const r = verifyWebhookSignature({ rawBody: BODY, signatureHeader: 'deadbeef', timestampHeader: ts, secret: SECRET });
    expect(r.valid).toBe(false);
    expect(r.reason).toBe('signature_mismatch');
  });
});
