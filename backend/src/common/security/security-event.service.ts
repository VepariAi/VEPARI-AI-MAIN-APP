// Security event logging — 5-layer security, Layer 5 (audit trail in MySQL).
//
// Records security-relevant events (auth failures, blocked requests, injection
// attempts, tenant-isolation violations) to the MySQL `security_events` table so
// they can be investigated and fed to the alerting engine. Logging must never
// throw into the request path — a failed write is swallowed after being noted,
// because losing a security log must not take down the operation being secured.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StructuredLogger } from '../observability/structured-logger.service';
import { MetricsService } from '../observability/metrics.service';

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_BLOCK'
  | 'INJECTION_ATTEMPT'
  | 'WEBHOOK_REJECTED'
  | 'UPLOAD_REJECTED'
  | 'TENANT_VIOLATION'
  | 'DECRYPTION_FAILURE'
  | 'SUSPICIOUS_REQUEST';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

export interface SecurityEventInput {
  type: SecurityEventType;
  severity: SecuritySeverity;
  businessId?: string;
  userId?: string;
  ipAddress?: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SecurityEventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: StructuredLogger,
    private readonly metrics: MetricsService,
  ) {}

  /** Persist a security event. Never throws into the caller's path. */
  async record(event: SecurityEventInput): Promise<void> {
    this.metrics.increment('security_events_total', { type: event.type, severity: event.severity });
    this.logger.warn(`security_event ${event.type} (${event.severity})`, 'Security');

    try {
      await this.prisma.securityEvent.create({
        data: {
          type: event.type,
          severity: event.severity,
          ...(event.businessId ? { businessId: event.businessId } : {}),
          ...(event.userId ? { userId: event.userId } : {}),
          ...(event.ipAddress ? { ipAddress: event.ipAddress } : {}),
          ...(event.detail ? { detail: event.detail } : {}),
          ...(event.metadata ? { metadata: event.metadata as object } : {}),
        },
      });
    } catch (err) {
      // A failed security-log write must not break the secured operation.
      this.logger.error(
        `Failed to persist security event ${event.type}: ${err instanceof Error ? err.message : String(err)}`,
        'Security',
      );
    }
  }

  /** Recent critical events for a business (investigation / dashboards). */
  async recentCritical(businessId: string, limit = 50) {
    return this.prisma.securityEvent.findMany({
      where: { businessId, severity: 'critical' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
  }
}
