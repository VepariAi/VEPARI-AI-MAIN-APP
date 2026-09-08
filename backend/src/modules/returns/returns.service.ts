// Returns & Refunds: in-memory for Phase 15; DB migration in Phase 16.

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

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

const returnStore = new Map<string, Return[]>();

function getList(businessId: string): Return[] {
  if (!returnStore.has(businessId)) returnStore.set(businessId, []);
  return returnStore.get(businessId)!;
}

@Injectable()
export class ReturnsService {
  findAll(businessId: string, status?: ReturnStatus, type?: ReturnType): Return[] {
    const list = getList(businessId);
    return list
      .filter(r => (!status || r.status === status) && (!type || r.type === type))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  create(businessId: string, dto: CreateReturnDto): Return {
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

    const ret: Return = {
      id: `ret_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      businessId,
      type: dto.type,
      status: 'PENDING',
      referenceId: dto.referenceId,
      customerId: dto.customerId ?? null,
      supplierId: dto.supplierId ?? null,
      items: dto.items,
      totalRefundInPaise,
      notes: dto.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
    };
    getList(businessId).push(ret);
    return ret;
  }

  getById(businessId: string, returnId: string): Return {
    const ret = getList(businessId).find(r => r.id === returnId);
    if (!ret) throw new NotFoundException('Return not found');
    return ret;
  }

  updateStatus(businessId: string, returnId: string, status: ReturnStatus): Return {
    const ret = this.getById(businessId, returnId);
    if (ret.status === 'REFUNDED') {
      throw new BadRequestException('Cannot change status of a completed refund');
    }
    ret.status = status;
    ret.updatedAt = new Date();
    if (status === 'REFUNDED' || status === 'REJECTED') {
      ret.resolvedAt = new Date();
    }
    return ret;
  }

  getSummary(businessId: string): {
    pendingCount: number;
    approvedCount: number;
    refundedCount: number;
    totalRefundedInPaise: number;
  } {
    const list = getList(businessId);
    return {
      pendingCount: list.filter(r => r.status === 'PENDING').length,
      approvedCount: list.filter(r => r.status === 'APPROVED').length,
      refundedCount: list.filter(r => r.status === 'REFUNDED').length,
      totalRefundedInPaise: list
        .filter(r => r.status === 'REFUNDED')
        .reduce((s, r) => s + r.totalRefundInPaise, 0),
    };
  }
}
