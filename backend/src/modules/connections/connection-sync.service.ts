// Connection sync engine + health monitor — PROMPTS 233, 235, 238.
//
// Orchestrates a sync run through the resolved adapter and evaluates connection
// health. Adapter failures are caught and mapped to a degraded status rather
// than thrown, so one failing provider never breaks the portfolio (238).

import { Injectable, Optional } from '@nestjs/common';
import { AdapterRegistry } from './adapters/adapter-registry.service';
import type { NormalizedRecord } from './adapters/adapter.interface';
import { MetricsService } from '../../common/observability/metrics.service';

export type SyncRunStatus = 'ok' | 'degraded' | 'failed';

export interface SyncRunResult {
  connectionId: string;
  providerId: string;
  status: SyncRunStatus;
  recordCount: number;
  records: NormalizedRecord[];
  nextCursor?: string;
  error?: string;
  ranAt: string;
}

export interface HealthReport {
  connectionId: string;
  providerId: string;
  healthy: boolean;
  degraded: boolean;
  detail?: string;
  checkedAt: string;
}

export interface SyncRunInput {
  businessId: string;
  connectionId: string;
  providerId: string;
  credentials: Record<string, string>;
  cursor?: string;
}

@Injectable()
export class ConnectionSyncService {
  constructor(
    private readonly registry: AdapterRegistry,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async runSync(input: SyncRunInput): Promise<SyncRunResult> {
    const ranAt = new Date().toISOString();
    const base = { connectionId: input.connectionId, providerId: input.providerId, ranAt };

    let adapter;
    try {
      adapter = this.registry.get(input.providerId);
    } catch {
      this.metrics?.increment('connection_sync_failures_total', { provider: input.providerId });
      return { ...base, status: 'failed', recordCount: 0, records: [], error: 'no_adapter' };
    }

    try {
      const outcome = await adapter.sync({
        businessId: input.businessId,
        connectionId: input.connectionId,
        credentials: input.credentials,
        ...(input.cursor ? { cursor: input.cursor } : {}),
      });
      this.metrics?.increment('connection_sync_total', { provider: input.providerId });
      this.metrics?.increment('connection_records_total', { provider: input.providerId }, outcome.records.length);
      return {
        ...base,
        status: 'ok',
        recordCount: outcome.records.length,
        records: outcome.records,
        ...(outcome.nextCursor ? { nextCursor: outcome.nextCursor } : {}),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.metrics?.increment('connection_sync_failures_total', { provider: input.providerId });
      // "not configured" is a benign degraded state, not a hard failure.
      const status: SyncRunStatus = message.endsWith('_not_configured') ? 'degraded' : 'failed';
      return { ...base, status, recordCount: 0, records: [], error: message };
    }
  }

  async checkHealth(
    providerId: string,
    connectionId: string,
    credentials: Record<string, string>,
  ): Promise<HealthReport> {
    const checkedAt = new Date().toISOString();
    let adapter;
    try {
      adapter = this.registry.get(providerId);
    } catch {
      return { connectionId, providerId, healthy: false, degraded: true, detail: 'no_adapter', checkedAt };
    }
    try {
      const result = await adapter.healthCheck(credentials);
      return {
        connectionId,
        providerId,
        healthy: result.healthy,
        degraded: !result.healthy,
        ...(result.detail ? { detail: result.detail } : {}),
        checkedAt,
      };
    } catch (err) {
      return {
        connectionId,
        providerId,
        healthy: false,
        degraded: true,
        detail: err instanceof Error ? err.message : String(err),
        checkedAt,
      };
    }
  }
}
