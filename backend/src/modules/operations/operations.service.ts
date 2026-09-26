// Operations: work orders and tasks for a business.
// Persisted in MySQL via Prisma (DL-011).

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

interface OperationRow {
  id: string;
  businessId: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  customerId: string | null;
  assignedToUserId: string | null;
  dueDate: Date | null;
  estimatedValueInPaise: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

function toDomain(row: OperationRow): Operation {
  return {
    ...row,
    type: row.type as OperationType,
    status: row.status as OperationStatus,
    priority: row.priority as OperationPriority,
  };
}

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessId: string, status?: OperationStatus): Promise<Operation[]> {
    const rows = await this.prisma.operation.findMany({
      where: { businessId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => toDomain(r as OperationRow));
  }

  async create(businessId: string, dto: CreateOperationDto): Promise<Operation> {
    const row = await this.prisma.operation.create({
      data: {
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
      },
    });
    return toDomain(row as OperationRow);
  }

  async getById(businessId: string, operationId: string): Promise<Operation> {
    const row = await this.prisma.operation.findFirst({ where: { id: operationId, businessId } });
    if (!row) throw new NotFoundException('Operation not found');
    return toDomain(row as OperationRow);
  }

  async updateStatus(businessId: string, operationId: string, status: OperationStatus): Promise<Operation> {
    await this.getById(businessId, operationId); // tenant-scoped existence check
    const row = await this.prisma.operation.update({
      where: { id: operationId },
      data: {
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
    return toDomain(row as OperationRow);
  }

  async update(businessId: string, operationId: string, dto: Partial<CreateOperationDto>): Promise<Operation> {
    await this.getById(businessId, operationId); // tenant-scoped existence check
    const row = await this.prisma.operation.update({
      where: { id: operationId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.customerId !== undefined ? { customerId: dto.customerId ?? null } : {}),
        ...(dto.assignedToUserId !== undefined ? { assignedToUserId: dto.assignedToUserId ?? null } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null } : {}),
        ...(dto.estimatedValueInPaise !== undefined ? { estimatedValueInPaise: dto.estimatedValueInPaise ?? null } : {}),
      },
    });
    return toDomain(row as OperationRow);
  }
}
