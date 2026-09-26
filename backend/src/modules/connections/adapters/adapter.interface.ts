// Connection provider adapter interface — PROMPT 231.
//
// Every external integration (accounting, payments, e-commerce, banking, …) is
// implemented as an adapter conforming to this interface. The Connection
// Portfolio (PROMPT 230) treats all providers uniformly through it: the sync
// engine, webhook processor, and health monitor never know provider specifics.
//
// Adapters are pure orchestration — they translate between the provider's shape
// and our domain, and never touch the database directly (they return normalized
// records for the caller to persist through domain services).

export type ProviderCategory =
  | 'ACCOUNTING' | 'PAYMENTS' | 'ECOMMERCE' | 'LOGISTICS' | 'BANKING' | 'COMMUNICATION';

export type AuthType = 'OAUTH' | 'API_KEY' | 'WEBHOOK';

/** A normalized record pulled from a provider — amounts always in integer paise. */
export interface NormalizedRecord {
  externalId: string;
  kind: 'payment' | 'order' | 'ledger_entry' | 'shipment' | 'statement_line';
  occurredAt: string;
  amountInPaise?: number;
  raw: Record<string, unknown>;
}

export interface SyncContext {
  businessId: string;
  connectionId: string;
  /** Opaque cursor from the previous successful sync, if any. */
  cursor?: string;
  credentials: Record<string, string>;
}

export interface SyncOutcome {
  records: NormalizedRecord[];
  /** Cursor to persist for the next incremental sync. */
  nextCursor?: string;
}

export interface WebhookContext {
  rawBody: string;
  headers: Record<string, string | undefined>;
  secret: string;
}

export interface WebhookOutcome {
  accepted: boolean;
  records: NormalizedRecord[];
  reason?: string;
}

export interface HealthResult {
  healthy: boolean;
  detail?: string;
}

export interface ConnectionAdapter {
  readonly providerId: string;
  readonly name: string;
  readonly category: ProviderCategory;
  readonly authType: AuthType;

  /** Pull new/changed records since `ctx.cursor`. */
  sync(ctx: SyncContext): Promise<SyncOutcome>;

  /**
   * Verify and parse an inbound webhook. Adapters that don't use webhooks
   * return { accepted: false, reason: 'webhooks_unsupported' }.
   */
  handleWebhook(ctx: WebhookContext): Promise<WebhookOutcome>;

  /** Lightweight reachability/credential check for health monitoring. */
  healthCheck(credentials: Record<string, string>): Promise<HealthResult>;
}
