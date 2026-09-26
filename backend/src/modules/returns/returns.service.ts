// Returns & Refunds — persisted in MySQL via Prisma (DL-011).

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type ReturnType = 'SALE_RETURN' | 'PURCHASE_RETURN';
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
export type ReturnReason = 'DEFECTIVE' | 'WRONG_ITEM' | 'NOT_NEEDED' | 'QUALITY_ISSUE' | 'OTHER';

export interface ReturnLineItem {
  productId: string;
  quantity: number;
  priceInPaise: number;
  reason: ReturnReason;
}

export interface CreateReturnDto {
  type: ReturnType;
  referenceId: string;        // saleOrderId or purchaseId
  customerId?: string;
  supplierId?: string;
  items: ReturnLineItem[];
  notes?: string;
}

export interface Return {
  id: string;
  businessId: string;
  type: ReturnType;
  status: ReturnStatus;
  referenceId: string;
  customerId: string | null;
  supplierId: string | null;
  items: ReturnLineItem[];
  totalRefundInPaise: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

interface ReturnRow {
  id: string;
  businessId: string;
  type: string;
  status: string;
  referenceId: string;
  customerId: string | null;
  supplierId: string | null;
  items: unknown;
  totalRefundInPaise: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

function toDomain(row: ReturnRow): Return {
  return {
    id: row.id,
    businessId: row.businessId,
    type: row.type as ReturnType,
    status: row.status as ReturnStatus,
    referenceId: row.referenceId,
    customerId: row.customerId,
    supplierId: row.supplierId,
    items: (row.items as ReturnLineItem[]) ?? [],
    totalRefundInPaise: row.totalRefundInPaise,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
  };
}

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessId: string, status?: ReturnStatus, type?: ReturnType): Promise<Return[]> {
    const rows = await this.prisma.return.findMany({
      where: {
        businessId,
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => toDomain(r as ReturnRow));
  }

  async create(businessId: string, dto: CreateReturnDto): Promise<Return> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one return item is required');
    }
    if (dto.type === 'SALE_RETURN' && !dto.customerId) {
      throw new BadRequestException('customerId required for sale returns');
    }
    if (dto.type === 'PURCHASE_RETURN' && !dto.supplierId) {
      throw new BadRequestException('supplierId required for purchase returns');
    }

    const totalRefundInPaise = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.priceInPaise,
      0,
    );

    const row = await this.prisma.return.create({
      data: {
        businessId,
        type: dto.type,
        status: 'PENDING',
        referenceId: dto.referenceId,
        customerId: dto.customerId ?? null,
        supplierId: dto.supplierId ?? null,
        items: dto.items as unknown as object,
        totalRefundInPaise,
        notes: dto.notes ?? null,
      },
    });
    return toDomain(row as ReturnRow);
  }

  async getById(businessId: string, returnId: string): Promise<Return> {
    const row = await this.prisma.return.findFirst({ where: { id: returnId, businessId } });
    if (!row) throw new NotFoundException('Return not found');
    return toDomain(row as ReturnRow);
  }

  async updateStatus(businessId: string, returnId: string, status: ReturnStatus): Promise<Return> {
    const existing = await this.getById(businessId, returnId);
    if (existing.status === 'REFUNDED') {
      throw new BadRequestException('Cannot change status of a completed refund');
    }
    const resolved = status === 'REFUNDED' || status === 'REJECTED';
    const row = await this.prisma.return.update({
      where: { id: returnId },
      data: {
        status,
        ...(resolved ? { resolvedAt: new Date() } : {}),
      },
    });
    return toDomain(row as ReturnRow);
  }

  async getSummary(businessId: string): Promise<{
    pendingCount: number;
    approvedCount: number;
    refundedCount: number;
    totalRefundedInPaise: number;
  }> {
    const [pendingCount, approvedCount, refundedCount, refundedAgg] = await Promise.all([
      this.prisma.return.count({ where: { businessId, status: 'PENDING' } }),
      this.prisma.return.count({ where: { businessId, status: 'APPROVED' } }),
      this.prisma.return.count({ where: { businessId, status: 'REFUNDED' } }),
      this.prisma.return.aggregate({
        where: { businessId, status: 'REFUNDED' },
        _sum: { totalRefundInPaise: true },
      }),
    ]);
    return {
      pendingCount,
      approvedCount,
      refundedCount,
      totalRefundedInPaise: refundedAgg._sum.totalRefundInPaise ?? 0,
    };
  }
}
