// Supplier ledger — payableBalance in paise (positive = we owe supplier).

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SupplierDto {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface PayableAdjustmentDto {
  amountInPaise: number;   // positive = we owe more; negative = we paid
  description?: string;
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
}

export interface SupplierWithBalance {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  payableBalance: number; // paise — positive = we owe them
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: SupplierDto): Promise<SupplierWithBalance> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const data: Parameters<typeof this.prisma.supplier.create>[0]['data'] = {
      businessId,
      name: dto.name,
    };
    if (dto.phone !== undefined) data['phone'] = dto.phone;
    if (dto.email !== undefined) data['email'] = dto.email;
    if (dto.notes !== undefined) data['notes'] = dto.notes;

    const supplier = await this.prisma.supplier.create({ data });
    return this.toDto(supplier);
  }

  async list(businessId: string): Promise<SupplierWithBalance[]> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return suppliers.map(s => this.toDto(s));
  }

  async getById(businessId: string, supplierId: string): Promise<SupplierWithBalance> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return this.toDto(supplier);
  }

  async adjustPayable(
    businessId: string,
    supplierId: string,
    dto: PayableAdjustmentDto,
  ): Promise<SupplierWithBalance> {
    if (dto.amountInPaise === 0) {
      throw new BadRequestException('Payable adjustment amount cannot be zero');
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const [updated] = await this.prisma.$transaction([
      this.prisma.supplier.update({
        where: { id: supplierId },
        data: { payableBalance: { increment: dto.amountInPaise } },
      }),
      this.prisma.transaction.create({
        data: {
          businessId,
          supplierId,
          type: dto.amountInPaise > 0 ? 'CREDIT_RECEIVED' : 'PAYMENT',
          amountInPaise: Math.abs(dto.amountInPaise),
          paymentMethod: dto.paymentMethod ?? 'CASH',
          date: new Date(),
          ...(dto.description ? { description: dto.description } : {}),
        },
      }),
    ]);

    return this.toDto(updated);
  }

  async update(businessId: string, supplierId: string, dto: Partial<SupplierDto>): Promise<SupplierWithBalance> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const data: Parameters<typeof this.prisma.supplier.update>[0]['data'] = {};
    if (dto.name !== undefined) data['name'] = dto.name;
    if (dto.phone !== undefined) data['phone'] = dto.phone;
    if (dto.email !== undefined) data['email'] = dto.email;
    if (dto.notes !== undefined) data['notes'] = dto.notes;

    const updated = await this.prisma.supplier.update({ where: { id: supplierId }, data });
    return this.toDto(updated);
  }

  async getTotalPayable(businessId: string): Promise<number> {
    const result = await this.prisma.supplier.aggregate({
      where: { businessId, isActive: true, payableBalance: { gt: 0 } },
      _sum: { payableBalance: true },
    });
    return result._sum.payableBalance ?? 0;
  }

  async getTopCreditors(businessId: string, limit = 10): Promise<SupplierWithBalance[]> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { businessId, isActive: true, payableBalance: { gt: 0 } },
      orderBy: { payableBalance: 'desc' },
      take: limit,
    });
    return suppliers.map(s => this.toDto(s));
  }

  async getHistory(businessId: string, supplierId: string, limit = 50): Promise<{
    purchases: Array<{ id: string; totalInPaise: number; date: Date; notes: string | null }>;
    totalPurchasedInPaise: number;
  }> {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, businessId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const purchases = await this.prisma.purchase.findMany({
      where: { businessId, supplierId },
      orderBy: { date: 'desc' },
      take: limit,
      select: { id: true, totalInPaise: true, date: true, notes: true },
    });

    const totalPurchased = purchases.reduce((sum, p) => sum + p.totalInPaise, 0);
    return { purchases, totalPurchasedInPaise: totalPurchased };
  }

  async deactivate(businessId: string, supplierId: string): Promise<SupplierWithBalance> {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, businessId } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    const updated = await this.prisma.supplier.update({ where: { id: supplierId }, data: { isActive: false } });
    return this.toDto(updated);
  }

  private toDto(s: {
    id: string;
    businessId: string;
    name: string;
    phone: string | null;
    email: string | null;
    payableBalance: number;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SupplierWithBalance {
    return {
      id: s.id,
      businessId: s.businessId,
      name: s.name,
      phone: s.phone,
      email: s.email,
      payableBalance: s.payableBalance,
      notes: s.notes,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
