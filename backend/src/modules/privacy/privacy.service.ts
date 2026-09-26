// Privacy controls — PROMPT 207 (export / delete / retention).
//
// Implements the user's data-subject rights:
//   - export:  assemble everything we hold about a user into a portable object
//   - erase:   right-to-erasure via PII anonymization (financial/business
//              records are retained per statutory accounting-retention rules,
//              but personal identifiers are stripped and access is revoked)
//   - retention: the declarative policy that governs how long data is kept
//
// AI never touches this path; it operates only on the authoritative database.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RetentionRule {
  dataClass: string;
  retention: string;
  basis: string;
}

export interface DataExport {
  exportedAt: string;
  user: unknown;
  memory: unknown;
  voiceQueries: unknown;
  businessMemberships: unknown;
}

export interface ErasureResult {
  userId: string;
  anonymized: true;
  retainedRecords: string[];
  erasedAt: string;
}

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assemble a portable export of everything tied to this user.
   * Excludes secrets/tokens — those are never part of a data-subject export.
   */
  async exportUserData(userId: string): Promise<DataExport> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        language: true,
        isActive: true,
        createdAt: true,
        businessMembers: {
          select: { role: true, business: { select: { id: true, name: true, type: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [memory, voiceQueries] = await Promise.all([
      this.prisma.userMemory.findUnique({ where: { userId } }),
      this.prisma.voiceQuery.findMany({
        where: { userId },
        select: { id: true, transcript: true, language: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      memory: memory ?? null,
      voiceQueries,
      businessMemberships: user.businessMembers,
    };
  }

  /**
   * Right to erasure. We anonymize PII rather than hard-deleting, because
   * financial transactions the user created must be retained for statutory
   * accounting periods. After this runs the account cannot be identified or
   * signed into.
   */
  async eraseUser(userId: string): Promise<ErasureResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const anonPhone = `deleted-${userId}`;

    await this.prisma.$transaction([
      // Strip identifiers and deactivate the account.
      this.prisma.user.update({
        where: { id: userId },
        data: { phone: anonPhone, name: 'Deleted User', isActive: false },
      }),
      // Revoke all sessions.
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      // Remove personal AI memory and voice transcripts (personal content).
      this.prisma.userMemory.deleteMany({ where: { userId } }),
      this.prisma.voiceQuery.deleteMany({ where: { userId } }),
    ]);

    return {
      userId,
      anonymized: true,
      // Records kept for legal/accounting retention, now with no PII linkage.
      retainedRecords: ['financial_transactions', 'audit_logs'],
      erasedAt: new Date().toISOString(),
    };
  }

  /** Declarative retention policy — the single source of truth for data lifetimes. */
  getRetentionPolicy(): RetentionRule[] {
    return [
      { dataClass: 'financial_transactions', retention: '8 years', basis: 'Income Tax Act / GST record-keeping' },
      { dataClass: 'audit_logs', retention: '3 years', basis: 'Security & dispute investigation' },
      { dataClass: 'voice_transcripts', retention: 'until account deletion', basis: 'User-controlled personal content' },
      { dataClass: 'ai_memory', retention: 'until account deletion', basis: 'User-controlled personal content' },
      { dataClass: 'otp_codes', retention: '15 minutes', basis: 'One-time authentication only' },
      { dataClass: 'refresh_tokens', retention: '90 days', basis: 'Session lifetime; revoked on deletion' },
    ];
  }
}
