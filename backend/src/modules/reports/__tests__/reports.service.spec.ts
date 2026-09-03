// Unit tests for ReportsService — PROMPT 137.
//
// Covers all six report types from Prompt 41 wireframe:
//   P&L | Sales | Expense | Cash Flow | Customer | Inventory
// Each test verifies:
//   - Correct arithmetic from real data
//   - All monetary amounts are integer paise (never float)
//   - Drill-down fields are populated
//   - NotFoundException for unknown business

import { NotFoundException } from '@nestjs/common';
import { ReportsService } from '../reports.service';

const BIZ_ID = 'biz-1';
const RANGE = {
  from: new Date('2024-01-01T00:00:00Z'),
  to: new Date('2024-01-31T23:59:59Z'),
};

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    business: { findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID }) },
    saleOrder: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalInPaise: 0 } }),
    },
    saleOrderItem: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
    expense: { findMany: jest.fn().mockResolvedValue([]) },
    customer: { findMany: jest.fn().mockResolvedValue([]) },
    supplier: { findMany: jest.fn().mockResolvedValue([]) },
    product: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new ReportsService(prisma as unknown as ConstructorParameters<typeof ReportsService>[0]);
}

// ── P&L Report ─────────────────────────────────────────────────────────────────

describe('ReportsService — P&L report', () => {
  it('computes revenue, COGS, gross profit, operating expenses, net profit', async () => {
    const orders = [{
      totalInPaise: 100000,
      paymentMethod: 'CASH',
      items: [{ quantity: 2, unitPriceInPaise: 50000, totalInPaise: 100000, product: { costPriceInPaise: 20000 } }],
    }];
    const expenses = [{ amountInPaise: 15000, category: 'Rent', date: new Date('2024-01-05') }];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const report = await svc.getPLReport(BIZ_ID, RANGE);

    expect(report.revenueInPaise).toBe(100000);
    expect(report.costOfGoodsSoldInPaise).toBe(40000); // 2 × ₹200
    expect(report.grossProfitInPaise).toBe(60000);
    expect(report.operatingExpensesInPaise).toBe(15000);
    expect(report.netProfitInPaise).toBe(45000);
    expect(Number.isInteger(report.netProfitInPaise)).toBe(true);
    expect(Number.isInteger(report.grossMarginBps)).toBe(true);
    expect(Number.isInteger(report.netMarginBps)).toBe(true);
  });

  it('grossMarginBps = (grossProfit / revenue) × 10 000', async () => {
    const orders = [{
      totalInPaise: 200000,
      paymentMethod: 'CASH',
      items: [{ quantity: 1, unitPriceInPaise: 200000, totalInPaise: 200000, product: { costPriceInPaise: 100000 } }],
    }];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.getPLReport(BIZ_ID, RANGE);

    // Gross profit = 100 000; revenue = 200 000 → 50% = 5 000 bps
    expect(report.grossMarginBps).toBe(5000);
  });

  it('netMarginBps is 0 when revenue is 0', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    const report = await svc.getPLReport(BIZ_ID, RANGE);

    expect(report.netMarginBps).toBe(0);
    expect(report.grossMarginBps).toBe(0);
  });

  it('drill-down: revenueByPaymentMethod and expensesByCategory are populated', async () => {
    const orders = [
      { totalInPaise: 50000, paymentMethod: 'CASH', items: [] },
      { totalInPaise: 30000, paymentMethod: 'UPI', items: [] },
    ];
    const expenses = [
      { amountInPaise: 10000, category: 'Rent', date: new Date('2024-01-05') },
      { amountInPaise: 5000, category: 'Utilities', date: new Date('2024-01-06') },
    ];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const report = await svc.getPLReport(BIZ_ID, RANGE);

    expect(report.revenueByPaymentMethod['CASH']).toBe(50000);
    expect(report.revenueByPaymentMethod['UPI']).toBe(30000);
    expect(report.expensesByCategory['Rent']).toBe(10000);
    expect(report.expensesByCategory['Utilities']).toBe(5000);
  });

  it('throws NotFoundException for unknown business', async () => {
    const prisma = makePrisma();
    (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const svc = makeService(prisma);
    await expect(svc.getPLReport('bad-id', RANGE)).rejects.toThrow(NotFoundException);
  });
});

// ── Sales Report ───────────────────────────────────────────────────────────────

describe('ReportsService — Sales report', () => {
  it('sums total sales, order count, average order value', async () => {
    const date = new Date('2024-01-05');
    const orders = [
      { totalInPaise: 60000, paymentMethod: 'CASH', date, customerId: 'c1', customer: { id: 'c1', name: 'Ravi' } },
      { totalInPaise: 40000, paymentMethod: 'UPI', date, customerId: null, customer: null },
    ];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.getSalesReport(BIZ_ID, RANGE);

    expect(report.totalSalesInPaise).toBe(100000);
    expect(report.totalOrderCount).toBe(2);
    expect(report.averageOrderValueInPaise).toBe(50000);
    expect(Number.isInteger(report.averageOrderValueInPaise)).toBe(true);
  });

  it('drill-down: dailySeries buckets by date', async () => {
    const orders = [
      { totalInPaise: 30000, paymentMethod: 'CASH', date: new Date('2024-01-03'), customerId: null, customer: null },
      { totalInPaise: 20000, paymentMethod: 'CASH', date: new Date('2024-01-03'), customerId: null, customer: null },
      { totalInPaise: 50000, paymentMethod: 'CASH', date: new Date('2024-01-10'), customerId: null, customer: null },
    ];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.getSalesReport(BIZ_ID, RANGE);

    expect(report.dailySeries).toHaveLength(2);
    const jan3 = report.dailySeries.find(d => d.date === '2024-01-03');
    expect(jan3?.salesInPaise).toBe(50000);
    expect(jan3?.orderCount).toBe(2);
  });

  it('topCustomers lists top spender first', async () => {
    const date = new Date('2024-01-05');
    const orders = [
      { totalInPaise: 100000, paymentMethod: 'CASH', date, customerId: 'c1', customer: { id: 'c1', name: 'Asha' } },
      { totalInPaise: 200000, paymentMethod: 'CASH', date, customerId: 'c2', customer: { id: 'c2', name: 'Mohan' } },
    ];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.getSalesReport(BIZ_ID, RANGE);

    expect(report.topCustomers[0]?.customerName).toBe('Mohan');
    expect(report.topCustomers[0]?.totalInPaise).toBe(200000);
  });
});

// ── Expense Report ─────────────────────────────────────────────────────────────

describe('ReportsService — Expense report', () => {
  it('sums total expenses and groups by category', async () => {
    const expenses = [
      { amountInPaise: 30000, category: 'Rent', date: new Date('2024-01-01') },
      { amountInPaise: 10000, category: 'Utilities', date: new Date('2024-01-02') },
      { amountInPaise: 10000, category: 'Rent', date: new Date('2024-01-03') },
    ];
    const prisma = makePrisma();
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const report = await svc.getExpenseReport(BIZ_ID, RANGE);

    expect(report.totalExpensesInPaise).toBe(50000);
    expect(report.expenseCount).toBe(3);
    expect(report.byCategory['Rent']).toBe(40000);
    expect(report.byCategory['Utilities']).toBe(10000);
    expect(Number.isInteger(report.totalExpensesInPaise)).toBe(true);
  });

  it('topCategories shareBps sums to 10 000 when there are two categories with all expenses', async () => {
    const expenses = [
      { amountInPaise: 60000, category: 'Rent', date: new Date('2024-01-01') },
      { amountInPaise: 40000, category: 'Utilities', date: new Date('2024-01-02') },
    ];
    const prisma = makePrisma();
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const report = await svc.getExpenseReport(BIZ_ID, RANGE);

    const totalShare = report.topCategories.reduce((s, c) => s + c.shareBps, 0);
    expect(totalShare).toBe(10000);
  });
});

// ── Cash Flow Report ───────────────────────────────────────────────────────────

describe('ReportsService — Cash Flow report', () => {
  it('computes inflow, outflow, net, and running balance series', async () => {
    const orders = [
      { totalInPaise: 50000, date: new Date('2024-01-05') },
      { totalInPaise: 30000, date: new Date('2024-01-06') },
    ];
    const expenses = [
      { amountInPaise: 20000, date: new Date('2024-01-05') },
    ];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const report = await svc.getCashFlowReport(BIZ_ID, RANGE);

    expect(report.totalInflowInPaise).toBe(80000);
    expect(report.totalOutflowInPaise).toBe(20000);
    expect(report.netCashFlowInPaise).toBe(60000);
    expect(Number.isInteger(report.netCashFlowInPaise)).toBe(true);
  });

  it('running balance accumulates correctly across days', async () => {
    const orders = [
      { totalInPaise: 10000, date: new Date('2024-01-01') },
      { totalInPaise: 20000, date: new Date('2024-01-02') },
    ];
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.getCashFlowReport(BIZ_ID, RANGE);

    const day1 = report.dailySeries.find(d => d.date === '2024-01-01');
    const day2 = report.dailySeries.find(d => d.date === '2024-01-02');
    expect(day1?.runningBalanceInPaise).toBe(10000);
    expect(day2?.runningBalanceInPaise).toBe(30000);
  });

  it('excludes CREDIT payment method from inflow (only cash-equivalent methods)', async () => {
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue([]);

    const svc = makeService(prisma);
    await svc.getCashFlowReport(BIZ_ID, RANGE);

    const callArgs = (prisma.saleOrder.findMany as jest.Mock).mock.calls[0][0] as {
      where: { paymentMethod?: { in: string[] } };
    };
    expect(callArgs.where.paymentMethod?.in).not.toContain('CREDIT');
    expect(callArgs.where.paymentMethod?.in).toContain('CASH');
  });
});

// ── Customer Report ────────────────────────────────────────────────────────────

describe('ReportsService — Customer report', () => {
  it('sums receivables and counts customers with balance', async () => {
    const customers = [
      { id: 'c1', name: 'Ravi', creditBalance: 50000 },
      { id: 'c2', name: 'Asha', creditBalance: 75000 },
    ];
    const prisma = makePrisma();
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue([]);

    const svc = makeService(prisma);
    const report = await svc.getCustomerReport(BIZ_ID, RANGE);

    expect(report.totalReceivablesInPaise).toBe(125000);
    expect(report.customersWithBalance).toBe(2);
    expect(Number.isInteger(report.totalReceivablesInPaise)).toBe(true);
  });

  it('drill-down: totalPurchasedInPaise and orderCount per customer', async () => {
    const customers = [{ id: 'c1', name: 'Ravi', creditBalance: 50000 }];
    const orders = [
      { customerId: 'c1', totalInPaise: 30000 },
      { customerId: 'c1', totalInPaise: 20000 },
    ];
    const prisma = makePrisma();
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.getCustomerReport(BIZ_ID, RANGE);

    const ravi = report.topReceivables.find(r => r.customerName === 'Ravi');
    expect(ravi?.totalPurchasedInPaise).toBe(50000);
    expect(ravi?.orderCount).toBe(2);
    expect(Number.isInteger(ravi?.totalPurchasedInPaise)).toBe(true);
  });
});

// ── Inventory Report ───────────────────────────────────────────────────────────

describe('ReportsService — Inventory report', () => {
  it('counts products, low-stock, and out-of-stock correctly', async () => {
    const products = [
      { id: 'p1', name: 'Salt', sku: null, stock: 0, lowStockThreshold: 5, priceInPaise: 1000 },
      { id: 'p2', name: 'Sugar', sku: 'S-001', stock: 3, lowStockThreshold: 10, priceInPaise: 2000 },
      { id: 'p3', name: 'Oil', sku: null, stock: 100, lowStockThreshold: null, priceInPaise: 5000 },
    ];
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

    const svc = makeService(prisma);
    const report = await svc.getInventoryReport(BIZ_ID, RANGE);

    expect(report.totalProducts).toBe(3);
    expect(report.outOfStockCount).toBe(1);
    expect(report.lowStockCount).toBe(2); // Salt (0 ≤ 5) + Sugar (3 ≤ 10)
  });

  it('stockValueInPaise = stock × priceInPaise (integer)', async () => {
    const products = [
      { id: 'p1', name: 'Salt', sku: null, stock: 50, lowStockThreshold: null, priceInPaise: 300 },
    ];
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

    const svc = makeService(prisma);
    const report = await svc.getInventoryReport(BIZ_ID, RANGE);

    const saltRow = report.products.find(p => p.name === 'Salt');
    expect(saltRow?.stockValueInPaise).toBe(15000); // 50 × 300 paise
    expect(Number.isInteger(saltRow?.stockValueInPaise)).toBe(true);
  });

  it('drill-down: salesMovement shows units sold per product', async () => {
    const products = [
      { id: 'p1', name: 'Chai Masala', sku: null, stock: 20, lowStockThreshold: 5, priceInPaise: 500 },
    ];
    const soldItems = [{ productId: 'p1', _sum: { quantity: 30 } }];
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);
    (prisma.saleOrderItem.groupBy as jest.Mock).mockResolvedValue(soldItems);

    const svc = makeService(prisma);
    const report = await svc.getInventoryReport(BIZ_ID, RANGE);

    const mov = report.salesMovement.find(m => m.productId === 'p1');
    expect(mov?.unitsSold).toBe(30);
    expect(mov?.name).toBe('Chai Masala');
  });

  it('throws NotFoundException for unknown business', async () => {
    const prisma = makePrisma();
    (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const svc = makeService(prisma);
    await expect(svc.getInventoryReport('bad-id', RANGE)).rejects.toThrow(NotFoundException);
  });
});
