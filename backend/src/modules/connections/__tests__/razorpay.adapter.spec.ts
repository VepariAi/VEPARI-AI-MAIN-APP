// Unit tests for RazorpayAdapter — PROMPT 237.

import { createHmac } from 'node:crypto';
import { RazorpayAdapter } from '../adapters/razorpay.adapter';

const SECRET = 'whsec_razorpay';

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

describe('RazorpayAdapter.handleWebhook', () => {
  const adapter = new RazorpayAdapter();

  it('accepts and normalizes a payment.captured event (amount stays in paise)', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_123', amount: 50000, created_at: 1_700_000_000 } } },
    });
    const outcome = await adapter.handleWebhook({
      rawBody: body,
      headers: { 'x-razorpay-signature': sign(body) },
      secret: SECRET,
    });
    expect(outcome.accepted).toBe(true);
    expect(outcome.records).toHaveLength(1);
    expect(outcome.records[0]!.kind).toBe('payment');
    expect(outcome.records[0]!.amountInPaise).toBe(50000);
    expect(outcome.records[0]!.externalId).toBe('pay_123');
  });

  it('rejects a tampered body', async () => {
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'p', amount: 1 } } } });
    const outcome = await adapter.handleWebhook({
      rawBody: JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'p', amount: 999 } } } }),
      headers: { 'x-razorpay-signature': sign(body) },
      secret: SECRET,
    });
    expect(outcome.accepted).toBe(false);
    expect(outcome.reason).toBe('signature_mismatch');
  });

  it('rejects a missing signature', async () => {
    const outcome = await adapter.handleWebhook({ rawBody: '{}', headers: {}, secret: SECRET });
    expect(outcome.accepted).toBe(false);
    expect(outcome.reason).toBe('missing_signature');
  });

  it('accepts but yields no records for unhandled events', async () => {
    const body = JSON.stringify({ event: 'refund.created', payload: {} });
    const outcome = await adapter.handleWebhook({
      rawBody: body,
      headers: { 'x-razorpay-signature': sign(body) },
      secret: SECRET,
    });
    expect(outcome.accepted).toBe(true);
    expect(outcome.records).toHaveLength(0);
  });

  it('rejects invalid JSON even with a valid signature', async () => {
    const body = 'not-json';
    const outcome = await adapter.handleWebhook({
      rawBody: body,
      headers: { 'x-razorpay-signature': sign(body) },
      secret: SECRET,
    });
    expect(outcome.accepted).toBe(false);
    expect(outcome.reason).toBe('invalid_json');
  });
});

describe('RazorpayAdapter.sync & healthCheck', () => {
  const adapter = new RazorpayAdapter();

  it('throws not_configured without credentials', async () => {
    await expect(adapter.sync({ businessId: 'b', connectionId: 'c', credentials: {} }))
      .rejects.toThrow('razorpay_not_configured');
  });

  it('reports unhealthy without credentials', async () => {
    const h = await adapter.healthCheck({});
    expect(h.healthy).toBe(false);
    expect(h.detail).toBe('missing_credentials');
  });

  it('reports healthy with credentials', async () => {
    const h = await adapter.healthCheck({ key_id: 'k', key_secret: 's' });
    expect(h.healthy).toBe(true);
  });
});
