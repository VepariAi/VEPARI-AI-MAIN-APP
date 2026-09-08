// Operations: work orders and tasks for a business.
// Stored in-memory for Phase 15; DB model added via migration in Phase 16.

import { Injectable, NotFoundException } from '@nestjs/common';

export type OperationType = 'ORDER' | 'TASK' | 'SERVICE_REQUEST' | 'REPAIR' | 'DELIVERY';
export type OperationStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type OperationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface CreateOperationDto {
  type: OperationType;
  title: string;
  description?: string;
  priority?: OperationPriority;
  customerId?: string;
  assignedToUserId?: string;
  dueDate?: string;  // ISO
  estimatedValueInPaise?: number;
}

export interface Operation {
  id: string;
  businessId: string;
  type: OperationType;
  title: string;
  description: string | null;
  status: OperationStatus;
  priority: OperationPriority;
  customerId: string | null;
  assignedToUserId: string | null;
  dueDate: Date | null;
  estimatedValueInPaise: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

const operationStore = new Map<string, Operation[]>();

function getList(businessId: string): Operation[] {
  if (!operationStore.has(businessId)) operationStore.set(businessId, []);
  return operationStore.get(businessId)!;
}

@Injectable()
export class OperationsService {
  findAll(businessId: string, status?: OperationStatus): Operation[] {
    const list = getList(businessId);
    return (status ? list.filter(o => o.status === status) : list)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  create(businessId: string, dto: CreateOperationDto): Operation {
    const op: Operation = {
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      businessId,
      type: dto.type,
      title: dto.title,
      description: dto.description ?? null,
      status: 'OPEN',
      priority: dto.priority ?? 'NORMAL',
      customerId: dto.customerId ?? null,
      assignedToUserId: dto.assignedToUserId ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      estimatedValueInPaise: dto.estimatedValueInPaise ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
    };
    getList(businessId).push(op);
    return op;
  }

  getById(businessId: string, operationId: string): Operation {
    const op = getList(businessId).find(o => o.id === operationId);
    if (!op) throw new NotFoundException('Operation not found');
    return op;
  }

  updateStatus(businessId: string, operationId: string, status: OperationStatus): Operation {
    const op = this.getById(businessId, operationId);
    op.status = status;
    op.updatedAt = new Date();
    if (status === 'COMPLETED') op.completedAt = new Date();
    return op;
  }

  update(businessId: string, operationId: string, dto: Partial<CreateOperationDto>): Operation {
    const op = this.getById(businessId, operationId);
    if (dto.title !== undefined) op.title = dto.title;
    if (dto.description !== undefined) op.description = dto.description ?? null;
    if (dto.priority !== undefined) op.priority = dto.priority;
    if (dto.customerId !== undefined) op.customerId = dto.customerId ?? null;
    if (dto.assignedToUserId !== undefined) op.assignedToUserId = dto.assignedToUserId ?? null;
    if (dto.dueDate !== undefined) op.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.estimatedValueInPaise !== undefined) op.estimatedValueInPaise = dto.estimatedValueInPaise ?? null;
    op.updatedAt = new Date();
    return op;
  }
}
