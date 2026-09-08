import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogInput {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export interface AuditLogDto {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    const data: Parameters<typeof this.prisma.auditLog.create>[0]['data'] = {
      action: input.action,
      resource: input.resource,
    };
    if (input.userId !== undefined) data['userId'] = input.userId;
    if (input.resourceId !== undefined) data['resourceId'] = input.resourceId;
    if (input.metadata !== undefined) data['metadata'] = input.metadata as object;
    if (input.ipAddress !== undefined) data['ipAddress'] = input.ipAddress;
    await this.prisma.auditLog.create({ data });
  }

  async findByUser(userId: string, limit = 50): Promise<AuditLogDto[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
    return rows.map(r => this.toDto(r));
  }

  async findByResource(resource: string, resourceId?: string, limit = 50): Promise<AuditLogDto[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { resource, ...(resourceId ? { resourceId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
    return rows.map(r => this.toDto(r));
  }

  async findAll(limit = 100): Promise<AuditLogDto[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
    return rows.map(r => this.toDto(r));
  }

  private toDto(row: {
    id: string; userId: string | null; action: string; resource: string;
    resourceId: string | null; metadata: unknown; ipAddress: string | null; createdAt: Date;
  }): AuditLogDto {
    return {
      id: row.id,
      userId: row.userId,
      action: row.action,
      resource: row.resource,
      resourceId: row.resourceId,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
    };
  }
}
