import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SearchEntityType = 'customer' | 'supplier' | 'product' | 'sale' | 'expense';

export interface SearchHit {
  type: SearchEntityType;
  id: string;
  title: string;
  subtitle: string;
  amountInPaise?: number;
}

const MAX_RESULTS = 20;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(businessId: string, query: string): Promise<SearchHit[]> {
    const q = query.trim();
    if (!q || q.length < 2) return [];

    const [customers, suppliers, products, sales, expenses] = await Promise.all([
      this.prisma.customer.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, name: true, phone: true, creditBalance: true },
      }),
      this.prisma.supplier.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, name: true, phone: true, payableBalance: true },
      }),
      this.prisma.product.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, sku: true, priceInPaise: true, stock: true },
      }),
      this.prisma.saleOrder.findMany({
        where: {
          businessId,
          notes: { contains: q, mode: 'insensitive' },
        },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, totalInPaise: true, date: true, notes: true, paymentMethod: true },
      }),
      this.prisma.expense.findMany({
        where: {
          businessId,
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, amountInPaise: true, category: true, description: true, date: true },
      }),
    ]);

    const hits: SearchHit[] = [];

    for (const c of customers) {
      hits.push({
        type: 'customer',
        id: c.id,
        title: c.name,
        subtitle: c.phone ? c.phone : 'Customer',
        amountInPaise: c.creditBalance,
      });
    }

    for (const s of suppliers) {
      hits.push({
        type: 'supplier',
        id: s.id,
        title: s.name,
        subtitle: s.phone ? s.phone : 'Supplier',
        amountInPaise: s.payableBalance,
      });
    }

    for (const p of products) {
      hits.push({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: p.sku ? `SKU: ${p.sku} · Stock: ${p.stock}` : `Stock: ${p.stock}`,
        amountInPaise: p.priceInPaise,
      });
    }

    for (const sale of sales) {
      hits.push({
        type: 'sale',
        id: sale.id,
        title: `Sale — ${sale.paymentMethod}`,
        subtitle: sale.date.toISOString().slice(0, 10),
        amountInPaise: sale.totalInPaise,
      });
    }

    for (const exp of expenses) {
      hits.push({
        type: 'expense',
        id: exp.id,
        title: exp.description ?? exp.category,
        subtitle: `${exp.category} · ${exp.date.toISOString().slice(0, 10)}`,
        amountInPaise: exp.amountInPaise,
      });
    }

    return hits.slice(0, MAX_RESULTS);
  }
}
