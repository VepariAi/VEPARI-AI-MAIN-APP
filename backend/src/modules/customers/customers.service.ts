// Customer credit balance uses integer paise throughout.
// Positive creditBalance = customer owes us; negative = we owe them.

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CustomerDto {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreditAdjustmentDto {
  amountInPaise: number;   // positive = customer owes more; negative = customer paid
  description?: string;
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
}

export interface CustomerWithCredit {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  creditBalance: number; // paise — positive means customer owes us
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CustomerDto): Promise<CustomerWithCredit> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const data: Parameters<typeof this.prisma.customer.create>[0]['data'] = {
      businessId,
      name: dto.name,
    };
    if (dto.phone !== undefined) data['phone'] = dto.phone;
    if (dto.email !== undefined) data['email'] = dto.email;
    if (dto.notes !== undefined) data['notes'] = dto.notes;

    const customer = await this.prisma.customer.create({ data });
    return this.toDto(customer);
  }

  async list(businessId: string): Promise<CustomerWithCredit[]> {
    const customers = await this.prisma.customer.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return customers.map(c => this.toDto(c));
  }

  async getById(businessId: string, customerId: string): Promise<CustomerWithCredit> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.toDto(customer);
  }

  async adjustCredit(
    businessId: string,
    customerId: string,
    dto: CreditAdjustmentDto,
  ): Promise<CustomerWithCredit> {
    if (dto.amountInPaise === 0) {
      throw new BadRequestException('Credit adjustment amount cannot be zero');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // Atomically update credit balance and create a transaction record
    const [updated] = await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id: customerId },
        data: { creditBalance: { increment: dto.amountInPaise } },
      }),
      this.prisma.transaction.create({
        data: {
          businessId,
          customerId,
          type: dto.amountInPaise > 0 ? 'CREDIT_ISSUED' : 'PAYMENT',
          amountInPaise: Math.abs(dto.amountInPaise),
          paymentMethod: dto.paymentMethod ?? 'CASH',
          date: new Date(),
          ...(dto.description ? { description: dto.description } : {}),
        },
      }),
    ]);

    return this.toDto(updated);
  }

  async getTopDebtors(businessId: string, limit = 10): Promise<CustomerWithCredit[]> {
    const customers = await this.prisma.customer.findMany({
      where: { businessId, isActive: true, creditBalance: { gt: 0 } },
      orderBy: { creditBalance: 'desc' },
      take: limit,
    });
    return customers.map(c => this.toDto(c));
  }

  async getTotalReceivable(businessId: string): Promise<number> {
    const result = await this.prisma.customer.aggregate({
      where: { businessId, isActive: true, creditBalance: { gt: 0 } },
      _sum: { creditBalance: true },
    });
    return result._sum.creditBalance ?? 0;
  }

  private toDto(c: {
    id: string;
    businessId: string;
    name: string;
    phone: string | null;
    email: string | null;
    creditBalance: number;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CustomerWithCredit {
    return {
      id: c.id,
      businessId: c.businessId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      creditBalance: c.creditBalance,
      notes: c.notes,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
