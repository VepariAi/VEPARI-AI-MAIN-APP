import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsService } from '../../events/events.service';

export interface PaymentDto {
  amountInPaise: number;
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
  customerId?: string;
  supplierId?: string;
  description?: string;
  notes?: string;
  date?: string;
}

export interface PaymentRow {
  id: string;
  type: string;
  amountInPaise: number;
  paymentMethod: string;
  customerId: string | null;
  customerName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  description: string | null;
  notes: string | null;
  date: Date;
  createdAt: Date;
}

const PAYMENT_TYPES = ['PAYMENT', 'CREDIT_ISSUED', 'CREDIT_RECEIVED'] as const;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async listPayments(
    businessId: string,
    options?: { limit?: number; offset?: number; customerId?: string; supplierId?: string },
  ): Promise<PaymentRow[]> {
    const { limit = 50, offset = 0, customerId, supplierId } = options ?? {};

    const rows = await this.prisma.transaction.findMany({
      where: {
        businessId,
        type: { in: PAYMENT_TYPES as unknown as ('PAYMENT' | 'CREDIT_ISSUED' | 'CREDIT_RECEIVED')[] },
        ...(customerId ? { customerId } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      include: { customer: true, supplier: true },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    return rows.map(r => ({
      id: r.id,
      type: r.type,
      amountInPaise: r.amountInPaise,
      paymentMethod: r.paymentMethod,
      customerId: r.customerId,
      customerName: r.customer?.name ?? null,
      supplierId: r.supplierId,
      supplierName: r.supplier?.name ?? null,
      description: r.description,
      notes: r.notes,
      date: r.date,
      createdAt: r.createdAt,
    }));
  }

  async getPaymentById(businessId: string, paymentId: string): Promise<PaymentRow> {
    const row = await this.prisma.transaction.findFirst({
      where: {
        id: paymentId,
        businessId,
        type: { in: PAYMENT_TYPES as unknown as ('PAYMENT' | 'CREDIT_ISSUED' | 'CREDIT_RECEIVED')[] },
      },
      include: { customer: true, supplier: true },
    });
    if (!row) throw new NotFoundException('Payment not found');

    return {
      id: row.id,
      type: row.type,
      amountInPaise: row.amountInPaise,
      paymentMethod: row.paymentMethod,
      customerId: row.customerId,
      customerName: row.customer?.name ?? null,
      supplierId: row.supplierId,
      supplierName: row.supplier?.name ?? null,
      description: row.description,
      notes: row.notes,
      date: row.date,
      createdAt: row.createdAt,
    };
  }

  async recordPayment(businessId: string, dto: PaymentDto): Promise<PaymentRow> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const date = dto.date ? new Date(dto.date) : new Date();

    // Determine type based on context
    let type: 'PAYMENT' | 'CREDIT_ISSUED' | 'CREDIT_RECEIVED' = 'PAYMENT';
    if (dto.customerId) {
      // Payment from customer reduces their credit balance
      type = 'PAYMENT';
      await this.prisma.customer.updateMany({
        where: { id: dto.customerId, businessId },
        data: { creditBalance: { decrement: dto.amountInPaise } },
      });
    } else if (dto.supplierId) {
      // Payment to supplier reduces our payable balance
      type = 'PAYMENT';
      await this.prisma.supplier.updateMany({
        where: { id: dto.supplierId, businessId },
        data: { payableBalance: { decrement: dto.amountInPaise } },
      });
    }

    const row = await this.prisma.transaction.create({
      data: {
        businessId,
        type,
        amountInPaise: dto.amountInPaise,
        paymentMethod: dto.paymentMethod ?? 'CASH',
        date,
        ...(dto.customerId ? { customerId: dto.customerId } : {}),
        ...(dto.supplierId ? { supplierId: dto.supplierId } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.notes ? { notes: dto.notes } : {}),
      },
      include: { customer: true, supplier: true },
    });

    const result: PaymentRow = {
      id: row.id,
      type: row.type,
      amountInPaise: row.amountInPaise,
      paymentMethod: row.paymentMethod,
      customerId: row.customerId,
      customerName: row.customer?.name ?? null,
      supplierId: row.supplierId,
      supplierName: row.supplier?.name ?? null,
      description: row.description,
      notes: row.notes,
      date: row.date,
      createdAt: row.createdAt,
    };

    this.events.emit('payment.recorded', {
      businessId,
      paymentId: row.id,
      amountPaise: dto.amountInPaise,
      direction: dto.supplierId ? 'OUT' : 'IN',
      ...(row.customer?.name ? { party: row.customer.name } : row.supplier?.name ? { party: row.supplier.name } : {}),
    });

    return result;
  }

}
