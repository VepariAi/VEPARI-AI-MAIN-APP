// Connection webhook processor — PROMPT 234.
//
// Single entry point for inbound provider webhooks. Resolves the provider's
// adapter and delegates verification + parsing to it (each provider signs
// differently). Rejected webhooks (bad signature, unknown provider) never reach
// domain logic. Accepted webhooks return normalized records for the caller to
// persist through domain services.

import { Injectable, Optional } from '@nestjs/common';
import { AdapterRegistry } from './adapters/adapter-registry.service';
import type { WebhookOutcome } from './adapters/adapter.interface';
import { MetricsService } from '../../common/observability/metrics.service';

export interface ProcessWebhookInput {
  providerId: string;
  rawBody: string;
  headers: Record<string, string | undefined>;
  secret: string;
}

@Injectable()
export class WebhookProcessorService {
  constructor(
    private readonly registry: AdapterRegistry,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async process(input: ProcessWebhookInput): Promise<WebhookOutcome> {
    if (!this.registry.has(input.providerId)) {
      this.metrics?.increment('webhook_rejected_total', { provider: input.providerId, reason: 'unknown_provider' });
      return { accepted: false, records: [], reason: 'unknown_provider' };
    }

    const adapter = this.registry.get(input.providerId);
    const outcome = await adapter.handleWebhook({
      rawBody: input.rawBody,
      headers: input.headers,
      secret: input.secret,
    });

    if (outcome.accepted) {
      this.metrics?.increment('webhook_accepted_total', { provider: input.providerId });
      this.metrics?.increment('webhook_records_total', { provider: input.providerId }, outcome.records.length);
    } else {
      this.metrics?.increment('webhook_rejected_total', {
        provider: input.providerId,
        reason: outcome.reason ?? 'unknown',
      });
    }
    return outcome;
  }
}
