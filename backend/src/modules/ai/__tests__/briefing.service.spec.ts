// Unit tests for BriefingService (PROMPT 135 — AI OS briefing engine, TRD §13–14).
//
// Verifies:
// 1. Output categories match the exact set from Screens.png (sales, expenses,
//    new_customers, payments, supplier_bills, stock_alerts, opportunities)
// 2. Priority ordering is always Critical → Important → Actionable → Informational
// 3. No event is fabricated — all items are backed by real database data
// 4. All monetary amounts are integer paise (never float)

import { NotFoundException } from '@nestjs/common';
import { BriefingService } from '../briefing.service';

const BIZ_ID = 'biz-1';
const CHECKPOINT = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    business: { findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID }) },
    saleOrder: { findMany: jest.fn().mockResolvedValue([]) },
    expense: { findMany: jest.fn().mockResolvedValue([]) },
    customer: { findMany: jest.fn().mockResolvedValue([]) },
    product: { findMany: jest.fn().mockResolvedValue([]) },
    supplier: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new BriefingService(prisma as unknown as ConstructorParameters<typeof BriefingService>[0]);
}

// ── Basic structure ────────────────────────────────────────────────────────────

describe('BriefingService — basic structure', () => {
  it('returns a Briefing object with businessId, since, generatedAt, items, summary', async () => {
    const svc = makeService(makePrisma());
    const briefing = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    expect(briefing.businessId).toBe(BIZ_ID);
    expect(briefing.since).toEqual(CHECKPOINT);
    expect(briefing.generatedAt).toBeInstanceOf(Date);
    expect(Array.isArray(briefing.items)).toBe(true);
    expect(briefing.summary).toHaveProperty('totalItems');
    expect(briefing.summary).toHaveProperty('criticalCount');
    expect(briefing.summary).toHaveProperty('importantCount');
    expect(briefing.summary).toHaveProperty('actionableCount');
    expect(briefing.summary).toHaveProperty('informationalCount');
  });

  it('throws NotFoundException for unknown businessId', async () => {
    const prisma = makePrisma();
    (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const svc = makeService(prisma);
    await expect(svc.generateBriefing('bad-id', CHECKPOINT)).rejects.toThrow(NotFoundException);
  });

  it('returns empty items when nothing happened since checkpoint', async () => {
    const svc = makeService(makePrisma());
    const briefing = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    expect(briefing.items).toHaveLength(0);
    expect(briefing.summary.totalItems).toBe(0);
  });
});

// ── Sales category ─────────────────────────────────────────────────────────────

describe('BriefingService — sales category', () => {
  it('produces a sales summary item when new orders exist', async () => {
    const orders = [
      { id: 'o1', totalInPaise: 50000, paymentMethod: 'CASH', createdAt: new Date(), customer: null },
    ];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const salesItem = items.find(i => i.category === 'sales');
    expect(salesItem).toBeDefined();
    expect(salesItem?.evidence['totalInPaise']).toBe(50000);
    expect(Number.isInteger(salesItem?.evidence['totalInPaise'])).toBe(true);
  });

  it('flags large orders (≥ ₹1 000) as important priority', async () => {
    const orders = [
      { id: 'o1', totalInPaise: 200000, paymentMethod: 'UPI', createdAt: new Date(), customer: { id: 'c1', name: 'Ravi' } },
    ];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const important = items.find(i => i.category === 'sales' && i.priority === 'important');
    expect(important).toBeDefined();
    expect(important?.title.toLowerCase()).toContain('ravi');
    expect(important?.evidence['orderId']).toBe('o1');
  });
});

// ── Expenses category ──────────────────────────────────────────────────────────

describe('BriefingService — expenses category', () => {
  it('produces an expenses summary item when new expenses exist', async () => {
    const expenses = [
      { id: 'e1', amountInPaise: 30000, category: 'Rent', createdAt: new Date() },
      { id: 'e2', amountInPaise: 10000, category: 'Utilities', createdAt: new Date() },
    ];
    const prisma = makePrisma();
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const expenseItem = items.find(i => i.category === 'expenses');
    expect(expenseItem).toBeDefined();
    expect(expenseItem?.evidence['expenseCount']).toBe(2);
    expect(expenseItem?.evidence['totalInPaise']).toBe(40000);
    expect(Number.isInteger(expenseItem?.evidence['totalInPaise'])).toBe(true);
  });
});

// ── New customers category ─────────────────────────────────────────────────────

describe('BriefingService — new_customers category', () => {
  it('creates one item per new customer, all with important priority', async () => {
    const customers = [
      { id: 'c1', name: 'Asha', createdAt: new Date() },
      { id: 'c2', name: 'Mohan', createdAt: new Date() },
    ];
    const prisma = makePrisma();
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const customerItems = items.filter(i => i.category === 'new_customers');
    expect(customerItems).toHaveLength(2);
    for (const item of customerItems) {
      expect(item.priority).toBe('important');
      expect(item.evidence).toHaveProperty('customerId');
    }
  });
});

// ── Stock alerts category ──────────────────────────────────────────────────────

describe('BriefingService — stock_alerts category', () => {
  it('marks out-of-stock products as critical priority', async () => {
    const products = [{ id: 'p1', name: 'Salt', stock: 0, lowStockThreshold: 5 }];
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const stockAlert = items.find(i => i.category === 'stock_alerts');
    expect(stockAlert).toBeDefined();
    expect(stockAlert?.priority).toBe('critical');
    expect(stockAlert?.title.toLowerCase()).toContain('stock out');
  });

  it('marks low-stock (but not zero) as actionable priority', async () => {
    const products = [{ id: 'p2', name: 'Sugar', stock: 3, lowStockThreshold: 10 }];
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const alert = items.find(i => i.category === 'stock_alerts');
    expect(alert?.priority).toBe('actionable');
    expect(alert?.evidence['currentStock']).toBe(3);
  });
});

// ── Supplier bills category ────────────────────────────────────────────────────

describe('BriefingService — supplier_bills category', () => {
  it('creates supplier_bills item for balance ≥ ₹500 (5 000 paise)', async () => {
    const suppliers = [{ id: 's1', name: 'Shree Traders', payableBalance: 100000 }];
    const prisma = makePrisma();
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue(suppliers);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const bill = items.find(i => i.category === 'supplier_bills');
    expect(bill).toBeDefined();
    expect(bill?.evidence['supplierId']).toBe('s1');
    expect(bill?.evidence['payableBalanceInPaise']).toBe(100000);
    expect(Number.isInteger(bill?.evidence['payableBalanceInPaise'])).toBe(true);
  });

  it('marks very large payable (≥ ₹5 000) as critical priority', async () => {
    const suppliers = [{ id: 's1', name: 'Mega Supplier', payableBalance: 500000 }];
    const prisma = makePrisma();
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue(suppliers);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const bill = items.find(i => i.category === 'supplier_bills');
    expect(bill?.priority).toBe('critical');
  });
});

// ── Opportunities category ─────────────────────────────────────────────────────

describe('BriefingService — opportunities category', () => {
  it('creates an opportunity when new customers and sales both occurred', async () => {
    const customers = [{ id: 'c1', name: 'Asha', createdAt: new Date() }];
    const orders = [
      { id: 'o1', totalInPaise: 50000, paymentMethod: 'CASH', createdAt: new Date(), customer: null },
    ];
    const prisma = makePrisma();
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const opp = items.find(i => i.category === 'opportunities');
    expect(opp).toBeDefined();
    expect(opp?.priority).toBe('actionable');
    expect(opp?.evidence['newCustomerCount']).toBe(1);
  });
});

// ── Priority ordering ──────────────────────────────────────────────────────────

describe('BriefingService — priority ordering', () => {
  it('orders items Critical → Important → Actionable → Informational', async () => {
    const orders = [
      { id: 'o1', totalInPaise: 200000, paymentMethod: 'CASH', createdAt: new Date(), customer: null },
    ];
    const customers = [{ id: 'c1', name: 'Ravi', createdAt: new Date() }];
    const products = [
      { id: 'p1', name: 'Salt', stock: 0, lowStockThreshold: 5 },
      { id: 'p2', name: 'Sugar', stock: 3, lowStockThreshold: 10 },
    ];
    const suppliers = [{ id: 's1', name: 'Shree', payableBalance: 500000 }];

    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue(suppliers);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const priorityOrder = { critical: 0, important: 1, actionable: 2, informational: 3 };
    for (let i = 0; i < items.length - 1; i++) {
      const a = priorityOrder[items[i]!.priority];
      const b = priorityOrder[items[i + 1]!.priority];
      expect(a).toBeLessThanOrEqual(b);
    }
  });

  it('summary counts match the items', async () => {
    const products = [{ id: 'p1', name: 'Salt', stock: 0, lowStockThreshold: 5 }];
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

    const svc = makeService(prisma);
    const briefing = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    const { items, summary } = briefing;
    expect(summary.totalItems).toBe(items.length);
    expect(summary.criticalCount).toBe(items.filter(i => i.priority === 'critical').length);
    expect(summary.importantCount).toBe(items.filter(i => i.priority === 'important').length);
    expect(summary.actionableCount).toBe(items.filter(i => i.priority === 'actionable').length);
    expect(summary.informationalCount).toBe(items.filter(i => i.priority === 'informational').length);
  });
});

// ── No fabrication — evidence must be traceable ────────────────────────────────

describe('BriefingService — no fabricated events', () => {
  it('every item has a non-empty evidence object', async () => {
    const orders = [
      { id: 'o1', totalInPaise: 50000, paymentMethod: 'CASH', createdAt: new Date(), customer: null },
    ];
    const customers = [{ id: 'c1', name: 'Asha', createdAt: new Date() }];
    const products = [{ id: 'p1', name: 'Salt', stock: 0, lowStockThreshold: 5 }];
    const suppliers = [{ id: 's1', name: 'Shree', payableBalance: 100000 }];

    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue(suppliers);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    for (const item of items) {
      expect(typeof item.evidence).toBe('object');
      expect(Object.keys(item.evidence).length).toBeGreaterThan(0);
    }
  });

  it('all category values are within the allowed set from Screens.png', async () => {
    const allowedCategories = new Set([
      'sales', 'expenses', 'new_customers', 'payments',
      'supplier_bills', 'stock_alerts', 'opportunities',
    ]);
    const orders = [{ id: 'o1', totalInPaise: 50000, paymentMethod: 'CASH', createdAt: new Date(), customer: null }];
    const customers = [{ id: 'c1', name: 'X', createdAt: new Date() }];
    const products = [{ id: 'p1', name: 'Y', stock: 0, lowStockThreshold: 1 }];
    const suppliers = [{ id: 's1', name: 'Z', payableBalance: 100000 }];

    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue(suppliers);

    const svc = makeService(prisma);
    const { items } = await svc.generateBriefing(BIZ_ID, CHECKPOINT);

    for (const item of items) {
      expect(allowedCategories.has(item.category)).toBe(true);
    }
  });
});
