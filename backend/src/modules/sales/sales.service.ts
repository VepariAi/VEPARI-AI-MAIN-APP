import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

export interface CreateSaleDto {
  businessId: string;
  customerId?: string;
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPriceInPaise: number;
  }>;
  paymentMethod?: PaymentMethod;
  notes?: string;
  date?: Date;
  // Allow direct total when items come from voice without product IDs
  totalInPaise?: number;
}

export interface SaleSummary {
  id: string;
  businessId: string;
  customerId: string | null;
  totalInPaise: number;
  taxInPaise: number;
  discountInPaise: number;
  paymentMethod: PaymentMethod;
  status: string;
  notes: string | null;
  date: Date;
  createdAt: Date;
  itemCount: number;
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async createSale(dto: CreateSaleDto): Promise<SaleSummary> {
    const { businessId, customerId, items, paymentMethod, notes, date, totalInPaise } = dto;

    // Verify business exists
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    // Verify customer if provided
    if (customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, businessId },
      });
      if (!customer) throw new NotFoundException('Customer not found');
    }

    // Calculate total from items if not provided directly
    let computedTotal = 0;
    const saleItems = items.map(item => {
      if (item.quantity <= 0) throw new BadRequestException('Quantity must be positive');
      if (item.unitPriceInPaise < 0) throw new BadRequestException('Price must be non-negative');
      const lineTotal = Math.round(item.quantity * item.unitPriceInPaise);
      computedTotal += lineTotal;
      return { ...item, totalInPaise: lineTotal };
    });

    const finalTotal = totalInPaise !== undefined ? totalInPaise : computedTotal;
    if (finalTotal < 0) throw new BadRequestException('Sale total must be non-negative');

    const saleDate = date ?? new Date();

    // All writes in a single Prisma interactive transaction — fully atomic.
    // A failure in any step rolls back the entire set of changes.
    const saleOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.saleOrder.create({
        data: {
          businessId,
          ...(customerId ? { customerId } : {}),
          totalInPaise: finalTotal,
          taxInPaise: 0,
          discountInPaise: 0,
          paymentMethod: paymentMethod ?? 'CASH',
          status: 'completed',
          ...(notes ? { notes } : {}),
          date: saleDate,
          items: {
            create: saleItems
              .filter(i => Boolean(i.productId))
              .map(i => ({
                productId: i.productId as string,
                quantity: i.quantity,
                unitPriceInPaise: i.unitPriceInPaise,
                totalInPaise: i.totalInPaise,
              })),
          },
        },
        include: { items: true },
      });

      // Decrement stock for each product item
      for (const item of saleItems.filter(i => Boolean(i.productId))) {
        await tx.product.update({
          where: { id: item.productId as string },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // If sale is on credit, add to customer's credit balance
      if (customerId && paymentMethod === PaymentMethod.CREDIT) {
        await tx.customer.update({
          where: { id: customerId },
          data: { creditBalance: { increment: finalTotal } },
        });
      }

      // Ledger entry
      await tx.transaction.create({
        data: {
          businessId,
          ...(customerId ? { customerId } : {}),
          type: 'SALE',
          amountInPaise: finalTotal,
          paymentMethod: paymentMethod ?? 'CASH',
          date: saleDate,
          referenceId: order.id,
          ...(notes ? { description: notes } : {}),
        },
      });

      return order;
    });

    return {
      id: saleOrder.id,
      businessId: saleOrder.businessId,
      customerId: saleOrder.customerId,
      totalInPaise: saleOrder.totalInPaise,
      taxInPaise: saleOrder.taxInPaise,
      discountInPaise: saleOrder.discountInPaise,
      paymentMethod: saleOrder.paymentMethod,
      status: saleOrder.status,
      notes: saleOrder.notes,
      date: saleOrder.date,
      createdAt: saleOrder.createdAt,
      itemCount: saleOrder.items.length,
    };
  }

  async listSales(businessId: string, limit = 50, offset = 0, customerId?: string): Promise<SaleSummary[]> {
    const orders = await this.prisma.saleOrder.findMany({
      where: { businessId, ...(customerId ? { customerId } : {}) },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      include: { items: { select: { id: true } } },
    });

    return orders.map(o => ({
      id: o.id,
      businessId: o.businessId,
      customerId: o.customerId,
      totalInPaise: o.totalInPaise,
      taxInPaise: o.taxInPaise,
      discountInPaise: o.discountInPaise,
      paymentMethod: o.paymentMethod,
      status: o.status,
      notes: o.notes,
      date: o.date,
      createdAt: o.createdAt,
      itemCount: o.items.length,
    }));
  }

  async getSalesTodayTotal(businessId: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const result = await this.prisma.saleOrder.aggregate({
      where: { businessId, date: { gte: start, lte: end } },
      _sum: { totalInPaise: true },
    });
    return result._sum.totalInPaise ?? 0;
  }
}
