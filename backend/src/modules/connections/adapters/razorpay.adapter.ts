// Razorpay payments adapter — PROMPT 237 (first real provider integration).
//
// Implements the parts that are fully specified by Razorpay's public contract
// and verifiable without a live account:
//   - webhook signature verification per Razorpay's scheme
//     (HMAC-SHA256 of the *raw* body with the webhook secret, hex, in the
//      `x-razorpay-signature` header — note: no timestamp component)
//   - normalization of `payment.captured` events to our domain shape, with
//     amounts kept in integer paise (Razorpay already sends paise)
//
// `sync()` requires live API credentials; when none are configured it reports
// that cleanly rather than fabricating data (supports degraded-mode UX, 238).

import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  ConnectionAdapter,
  SyncContext,
  SyncOutcome,
  WebhookContext,
  WebhookOutcome,
  HealthResult,
  NormalizedRecord,
} from './adapter.interface';

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export class RazorpayAdapter implements ConnectionAdapter {
  readonly providerId = 'razorpay';
  readonly name = 'Razorpay';
  readonly category = 'PAYMENTS' as const;
  readonly authType = 'API_KEY' as const;

  async sync(ctx: SyncContext): Promise<SyncOutcome> {
    // A live pull requires key_id/key_secret. Without them we do not invent data.
    if (!ctx.credentials['key_id'] || !ctx.credentials['key_secret']) {
      throw new Error('razorpay_not_configured');
    }
    // Live REST pagination would go here (GET /v1/payments?from=cursor).
    // Returning an empty incremental result keeps the cursor stable until wired
    // to the live API — no fabricated records.
    return { records: [], ...(ctx.cursor ? { nextCursor: ctx.cursor } : {}) };
  }

  async handleWebhook(ctx: WebhookContext): Promise<WebhookOutcome> {
    const signature = ctx.headers['x-razorpay-signature'];
    if (!ctx.secret) return { accepted: false, records: [], reason: 'no_secret_configured' };
    if (!signature) return { accepted: false, records: [], reason: 'missing_signature' };

    const expected = createHmac('sha256', ctx.secret).update(ctx.rawBody).digest('hex');
    if (!safeEqualHex(expected, signature)) {
      return { accepted: false, records: [], reason: 'signature_mismatch' };
    }

    let payload: RazorpayWebhookBody;
    try {
      payload = JSON.parse(ctx.rawBody) as RazorpayWebhookBody;
    } catch {
      return { accepted: false, records: [], reason: 'invalid_json' };
    }

    const records: NormalizedRecord[] = [];
    if (payload.event === 'payment.captured') {
      const entity = payload.payload?.payment?.entity;
      if (entity && typeof entity.amount === 'number') {
        records.push({
          externalId: entity.id,
          kind: 'payment',
          occurredAt: new Date((entity.created_at ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
          amountInPaise: entity.amount, // Razorpay amounts are already in paise
          raw: entity as unknown as Record<string, unknown>,
        });
      }
    }

    return { accepted: true, records };
  }

  async healthCheck(credentials: Record<string, string>): Promise<HealthResult> {
    if (!credentials['key_id'] || !credentials['key_secret']) {
      return { healthy: false, detail: 'missing_credentials' };
    }
    // A live check would hit GET /v1/payments?count=1. Credentials present is
    // the best signal available without a live call.
    return { healthy: true };
  }
}

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id: string;
        amount: number;
        created_at?: number;
        [k: string]: unknown;
      };
    };
  };
}
