import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

export interface CreatePurchaseDto {
  businessId: string;
  supplierId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCostInPaise: number;
  }>;
  paymentMethod?: PaymentMethod;
  notes?: string;
  date?: Date;
  totalInPaise?: number;
}

export interface PurchaseSummary {
  id: string;
  businessId: string;
  supplierId: string | null;
  supplierName: string | null;
  totalInPaise: number;
  paymentMethod: PaymentMethod;
  status: string;
  notes: string | null;
  date: Date;
  createdAt: Date;
  itemCount: number;
}

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async createPurchase(dto: CreatePurchaseDto): Promise<PurchaseSummary> {
    const { businessId, supplierId, items, paymentMethod, notes, date, totalInPaise } = dto;

    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    let supplierName: string | null = null;
    if (supplierId) {
      const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, businessId } });
      if (!supplier) throw new NotFoundException('Supplier not found');
      supplierName = supplier.name;
    }

    let computedTotal = 0;
    const purchaseItems = items.map(item => {
      if (item.quantity <= 0) throw new BadRequestException('Quantity must be positive');
      if (item.unitCostInPaise < 0) throw new BadRequestException('Cost must be non-negative');
      const lineTotal = Math.round(item.quantity * item.unitCostInPaise);
      computedTotal += lineTotal;
      return { ...item, totalInPaise: lineTotal };
    });

    const finalTotal = totalInPaise !== undefined ? totalInPaise : computedTotal;
    if (finalTotal < 0) throw new BadRequestException('Purchase total must be non-negative');

    const purchaseDate = date ?? new Date();

    const purchase = await this.prisma.$transaction(async (tx) => {
      const record = await tx.purchase.create({
        data: {
          businessId,
          ...(supplierId ? { supplierId } : {}),
          totalInPaise: finalTotal,
          taxInPaise: 0,
          paymentMethod: paymentMethod ?? 'CASH',
          status: 'completed',
          ...(notes ? { notes } : {}),
          date: purchaseDate,
          items: {
            create: purchaseItems.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              unitCostInPaise: i.unitCostInPaise,
              totalInPaise: i.totalInPaise,
            })),
          },
        },
        include: { items: true },
      });

      // Increment stock for each purchased product
      for (const item of purchaseItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // If purchase is on credit, add to supplier's payable balance
      if (supplierId && paymentMethod === PaymentMethod.CREDIT) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { payableBalance: { increment: finalTotal } },
        });
      }

      // Ledger entry
      await tx.transaction.create({
        data: {
          businessId,
          ...(supplierId ? { supplierId } : {}),
          type: 'PURCHASE',
          amountInPaise: finalTotal,
          paymentMethod: paymentMethod ?? 'CASH',
          date: purchaseDate,
          referenceId: record.id,
          ...(notes ? { description: notes } : {}),
        },
      });

      return record;
    });

    return {
      id: purchase.id,
      businessId: purchase.businessId,
      supplierId: purchase.supplierId,
      supplierName,
      totalInPaise: purchase.totalInPaise,
      paymentMethod: purchase.paymentMethod,
      status: purchase.status,
      notes: purchase.notes,
      date: purchase.date,
      createdAt: purchase.createdAt,
      itemCount: purchase.items.length,
    };
  }

  async listPurchases(businessId: string, limit = 50, offset = 0): Promise<PurchaseSummary[]> {
    const records = await this.prisma.purchase.findMany({
      where: { businessId },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      include: {
        items: { select: { id: true } },
        supplier: { select: { name: true } },
      },
    });

    return records.map(r => ({
      id: r.id,
      businessId: r.businessId,
      supplierId: r.supplierId,
      supplierName: r.supplier?.name ?? null,
      totalInPaise: r.totalInPaise,
      paymentMethod: r.paymentMethod,
      status: r.status,
      notes: r.notes,
      date: r.date,
      createdAt: r.createdAt,
      itemCount: r.items.length,
    }));
  }

  findAll(): unknown[] {
    return [];
  }
}
