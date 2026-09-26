// Correlation-ID propagation — PROMPT 213 (distributed tracing).
//
// A per-request correlation id lets a single logical operation be traced
// across the HTTP layer, domain services, and downstream calls. We store it
// in AsyncLocalStorage so any code in the request's async call tree can read
// it without threading it through every function signature.

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface RequestContext {
  correlationId: string;
  startTime: number;
  method?: string;
  path?: string;
  businessId?: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Run `fn` within a fresh request context. */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Read the current request context, if any. */
export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Read just the correlation id, generating a fallback when outside a request. */
export function getCorrelationId(): string {
  return storage.getStore()?.correlationId ?? 'no-context';
}

/** Generate a new correlation id (RFC 4122 v4 UUID). */
export function newCorrelationId(): string {
  return randomUUID();
}

/** Header clients may send to propagate an upstream correlation id. */
export const CORRELATION_HEADER = 'x-correlation-id';
