// Unit tests for InsightService — verifies all four detection types
// (AI OS.txt §43–46) produce distinctly-typed insights with real evidence,
// tested against a synthetic dataset that has known trends/anomalies planted.
//
// Synthetic dataset design:
//   Sales: 30 days of stable ~₹1 000/day, then last 3 days at ₹10 000 (anomaly spike)
//   Expenses: steadily rising from ₹200 → ₹600/day (rising trend)
//   Customers: one with ₹5 000 balance (high receivable → opportunity + risk)
//   Suppliers: one with ₹2 000 payable balance (risk)
//   Products: one at stock=0 (out-of-stock risk), one at stock=5 (low-stock opportunity)

import { NotFoundException } from '@nestjs/common';
import { InsightService } from '../insight.service';

const BIZ_ID = 'biz-1';

// Helper: generate N days of {totalInPaise, date, paymentMethod} sale records
// ending today.  salesFn(i) returns the amount for day i (0 = oldest).
function generateSaleOrders(
  n: number,
  salesFn: (i: number) => number,
): Array<{ totalInPaise: number; date: Date; paymentMethod: string }> {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const daysAgo = n - 1 - i;
    return {
      totalInPaise: salesFn(i),
      date: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      paymentMethod: 'CASH',
    };
  });
}

function generateExpenses(
  n: number,
  expFn: (i: number) => number,
): Array<{ amountInPaise: number; date: Date; category: string }> {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const daysAgo = n - 1 - i;
    return {
      amountInPaise: expFn(i),
      date: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      category: 'Rent',
    };
  });
}

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    business: { findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID }) },
    saleOrder: { findMany: jest.fn().mockResolvedValue([]) },
    expense: { findMany: jest.fn().mockResolvedValue([]) },
    customer: { findMany: jest.fn().mockResolvedValue([]) },
    supplier: { findMany: jest.fn().mockResolvedValue([]) },
    product: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new InsightService(prisma as unknown as ConstructorParameters<typeof InsightService>[0]);
}

// ── §43 Trend detection ────────────────────────────────────────────────────────

describe('InsightService — §43 Trend detection', () => {
  it('detects sales GROWTH trend when second half-month exceeds first by ≥ 5%', async () => {
    // First 15 days: ₹10 000/day; last 15 days: ₹15 000/day → +50% (5 000 bps)
    const orders = generateSaleOrders(30, i => (i < 15 ? 100000 : 150000));
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.generateInsights(BIZ_ID);

    expect(report.trends.length).toBeGreaterThan(0);
    const salesTrend = report.trends.find(t => t.title.toLowerCase().includes('growing'));
    expect(salesTrend).toBeDefined();
    expect(salesTrend?.type).toBe('trend');
    expect(salesTrend?.evidence).toHaveProperty('growthBps');
    expect(salesTrend?.evidence['growthBps'] as number).toBeGreaterThan(0);
  });

  it('detects sales DECLINE trend when first half exceeds second', async () => {
    // First 15 days: ₹15 000; last 15 days: ₹8 000 → ~−47%
    const orders = generateSaleOrders(30, i => (i < 15 ? 150000 : 80000));
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.generateInsights(BIZ_ID);

    const declineTrend = report.trends.find(t => t.title.toLowerCase().includes('declining'));
    expect(declineTrend).toBeDefined();
    expect(declineTrend?.type).toBe('trend');
    expect(declineTrend?.severity).toBe('warning');
    expect(declineTrend?.evidence['growthBps'] as number).toBeLessThan(0);
  });

  it('detects RISING EXPENSES trend when expenses grow > 10% half-over-half', async () => {
    // First 15 days avg ₹200; last 15 days avg ₹600 → +200% (20 000 bps)
    const expenses = generateExpenses(30, i => (i < 15 ? 20000 : 60000));
    const prisma = makePrisma();
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const report = await svc.generateInsights(BIZ_ID);

    const expTrend = report.trends.find(t => t.title.toLowerCase().includes('expenses'));
    expect(expTrend).toBeDefined();
    expect(expTrend?.type).toBe('trend');
    expect(expTrend?.severity).toBe('warning');
    expect(expTrend?.evidence['growthBps'] as number).toBeGreaterThan(0);
  });

  it('produces no trend when sales are stable (< 5% change)', async () => {
    // Flat ₹10 000/day all 30 days
    const orders = generateSaleOrders(30, () => 100000);
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.generateInsights(BIZ_ID);

    expect(report.trends).toHaveLength(0);
  });

  it('evidence fields are all integer paise (never float amounts)', async () => {
    const orders = generateSaleOrders(30, i => (i < 15 ? 100000 : 150000));
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const { trends } = await svc.generateInsights(BIZ_ID);

    for (const t of trends) {
      for (const [key, val] of Object.entries(t.evidence)) {
        if (key.toLowerCase().includes('paise')) {
          expect(Number.isInteger(val)).toBe(true);
        }
      }
    }
  });
});

// ── §44 Anomaly detection ──────────────────────────────────────────────────────

describe('InsightService — §44 Anomaly detection', () => {
  it('detects a sales SPIKE when last 3 days are > 2 σ above baseline', async () => {
    // 27 days: ₹100/day; last 3 days: ₹50 000/day (enormous spike)
    const orders = generateSaleOrders(30, i => (i < 27 ? 10000 : 5000000));
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.generateInsights(BIZ_ID);

    expect(report.anomalies.length).toBeGreaterThan(0);
    const spike = report.anomalies.find(a => a.title.toLowerCase().includes('spike'));
    expect(spike).toBeDefined();
    expect(spike?.type).toBe('anomaly');
    expect(spike?.evidence).toHaveProperty('zScore');
    expect(spike?.evidence['zScore'] as number).toBeGreaterThanOrEqual(2);
  });

  it('detects a sales DROP when last 3 days are < −2 σ below baseline', async () => {
    // 27 days: ₹50 000/day; last 3 days: ₹100/day (sudden collapse)
    const orders = generateSaleOrders(30, i => (i < 27 ? 5000000 : 10000));
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const report = await svc.generateInsights(BIZ_ID);

    const drop = report.anomalies.find(a => a.title.toLowerCase().includes('drop'));
    expect(drop).toBeDefined();
    expect(drop?.type).toBe('anomaly');
    expect(drop?.evidence['zScore'] as number).toBeGreaterThanOrEqual(2);
  });

  it('severity is critical when z-score ≥ 3', async () => {
    const orders = generateSaleOrders(30, i => (i < 27 ? 10000 : 50000000));
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const { anomalies } = await svc.generateInsights(BIZ_ID);

    const critical = anomalies.find(a => a.severity === 'critical');
    expect(critical).toBeDefined();
  });

  it('produces no anomaly when all values are uniform', async () => {
    const orders = generateSaleOrders(30, () => 100000);
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const { anomalies } = await svc.generateInsights(BIZ_ID);

    expect(anomalies).toHaveLength(0);
  });

  it('anomaly evidence contains the date string', async () => {
    const orders = generateSaleOrders(30, i => (i < 27 ? 10000 : 5000000));
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);

    const svc = makeService(prisma);
    const { anomalies } = await svc.generateInsights(BIZ_ID);

    for (const a of anomalies) {
      expect(typeof a.evidence['date']).toBe('string');
      expect(a.evidence['date'] as string).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// ── §45 Opportunity detection ──────────────────────────────────────────────────

describe('InsightService — §45 Opportunity detection', () => {
  it('flags a high-value receivable as an opportunity', async () => {
    const customers = [{ id: 'c1', name: 'Ravi', creditBalance: 500000 }];
    const prisma = makePrisma();
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);

    const svc = makeService(prisma);
    const { opportunities } = await svc.generateInsights(BIZ_ID);

    const recv = opportunities.find(o => o.title.toLowerCase().includes('collect'));
    expect(recv).toBeDefined();
    expect(recv?.type).toBe('opportunity');
    expect(recv?.evidence['customerId']).toBe('c1');
    expect(recv?.evidence['creditBalanceInPaise']).toBe(500000);
  });

  it('flags a low-stock product as a restock opportunity', async () => {
    const products = [{ id: 'p1', name: 'Chai Masala', stock: 3, lowStockThreshold: 10 }];
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

    const svc = makeService(prisma);
    const { opportunities } = await svc.generateInsights(BIZ_ID);

    const restock = opportunities.find(o => o.title.toLowerCase().includes('restock'));
    expect(restock).toBeDefined();
    expect(restock?.type).toBe('opportunity');
    expect(restock?.evidence['productName']).toBe('Chai Masala');
    expect(restock?.evidence['currentStock']).toBe(3);
  });

  it('detects healthy profit margin as an opportunity', async () => {
    // 7 days: sales ₹5 000, expenses ₹1 000 → margin 80% (8 000 bps ≥ 2 000 bps)
    const orders = generateSaleOrders(30, () => 500000);
    const expenses = generateExpenses(30, () => 100000);
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const { opportunities } = await svc.generateInsights(BIZ_ID);

    const margin = opportunities.find(o => o.title.toLowerCase().includes('margin'));
    expect(margin).toBeDefined();
    expect(margin?.type).toBe('opportunity');
    expect(margin?.evidence['marginBps'] as number).toBeGreaterThanOrEqual(2000);
  });

  it('opportunity insight has type = "opportunity"', async () => {
    const customers = [{ id: 'c1', name: 'Asha', creditBalance: 500000 }];
    const prisma = makePrisma();
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);

    const svc = makeService(prisma);
    const { opportunities } = await svc.generateInsights(BIZ_ID);

    for (const o of opportunities) {
      expect(o.type).toBe('opportunity');
    }
  });
});

// ── §46 Risk detection ─────────────────────────────────────────────────────────

describe('InsightService — §46 Risk detection', () => {
  it('flags expenses > sales over last 7 days as a risk', async () => {
    // Sales ₹1 000/day, expenses ₹5 000/day
    const orders = generateSaleOrders(30, () => 100000);
    const expenses = generateExpenses(30, () => 500000);
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const { risks } = await svc.generateInsights(BIZ_ID);

    const cashRisk = risks.find(r => r.title.toLowerCase().includes('expenses exceed'));
    expect(cashRisk).toBeDefined();
    expect(cashRisk?.type).toBe('risk');
    expect(cashRisk?.evidence['netLossInPaise'] as number).toBeGreaterThan(0);
  });

  it('flags high total receivables (≥ ₹1 000) as a risk', async () => {
    const customers = [
      { id: 'c1', name: 'Ravi', creditBalance: 100000 },
      { id: 'c2', name: 'Asha', creditBalance: 50000 },
    ];
    const prisma = makePrisma();
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);

    const svc = makeService(prisma);
    const { risks } = await svc.generateInsights(BIZ_ID);

    const recvRisk = risks.find(r => r.title.toLowerCase().includes('receivable'));
    expect(recvRisk).toBeDefined();
    expect(recvRisk?.type).toBe('risk');
    expect(recvRisk?.evidence['totalReceivableInPaise']).toBe(150000);
  });

  it('flags out-of-stock products as critical risk', async () => {
    const products = [{ id: 'p1', name: 'Flour', stock: 0, lowStockThreshold: 5 }];
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

    const svc = makeService(prisma);
    const { risks } = await svc.generateInsights(BIZ_ID);

    const stockRisk = risks.find(r => r.title.toLowerCase().includes('out of stock'));
    expect(stockRisk).toBeDefined();
    expect(stockRisk?.type).toBe('risk');
    expect(stockRisk?.severity).toBe('critical');
    expect(stockRisk?.evidence['productCount']).toBe(1);
  });

  it('flags high supplier payables as a risk', async () => {
    const suppliers = [{ id: 's1', name: 'Shree Traders', payableBalance: 200000 }];
    const prisma = makePrisma();
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue(suppliers);

    const svc = makeService(prisma);
    const { risks } = await svc.generateInsights(BIZ_ID);

    const payableRisk = risks.find(r => r.title.toLowerCase().includes('owed to suppliers'));
    expect(payableRisk).toBeDefined();
    expect(payableRisk?.type).toBe('risk');
    expect(payableRisk?.evidence['totalPayableInPaise']).toBe(200000);
  });

  it('all risk insights have type = "risk"', async () => {
    const orders = generateSaleOrders(30, () => 100000);
    const expenses = generateExpenses(30, () => 500000);
    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);

    const svc = makeService(prisma);
    const { risks } = await svc.generateInsights(BIZ_ID);

    for (const r of risks) {
      expect(r.type).toBe('risk');
    }
  });
});

// ── NotFoundException ──────────────────────────────────────────────────────────

describe('InsightService — NotFoundException', () => {
  it('throws for unknown businessId', async () => {
    const prisma = makePrisma();
    (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);

    const svc = makeService(prisma);
    await expect(svc.generateInsights('bad-id')).rejects.toThrow(NotFoundException);
  });
});

// ── Distinct types ─────────────────────────────────────────────────────────────

describe('InsightService — each insight has a distinct type from the four', () => {
  it('all returned insights carry one of the four InsightType values', async () => {
    const validTypes = new Set(['trend', 'anomaly', 'opportunity', 'risk']);

    const orders = generateSaleOrders(30, i => (i < 15 ? 100000 : 200000));
    const expenses = generateExpenses(30, i => (i < 27 ? 10000 : 500000));
    const customers = [{ id: 'c1', name: 'Ravi', creditBalance: 200000 }];
    const suppliers = [{ id: 's1', name: 'Mohan', payableBalance: 150000 }];
    const products = [{ id: 'p1', name: 'Oil', stock: 0, lowStockThreshold: 5 }];

    const prisma = makePrisma();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);
    (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue(suppliers);
    (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

    const svc = makeService(prisma);
    const report = await svc.generateInsights(BIZ_ID);
    const allInsights = [
      ...report.trends,
      ...report.anomalies,
      ...report.opportunities,
      ...report.risks,
    ];

    expect(allInsights.length).toBeGreaterThan(0);
    for (const insight of allInsights) {
      expect(validTypes.has(insight.type)).toBe(true);
    }
  });
});

// ── Alert dedup / cooldown (AI OS.txt §198) ────────────────────────────────

describe('InsightService — alert dedup/cooldown (§198)', () => {
  function makeRichPrisma() {
    const prisma = makePrisma();
    const orders = generateSaleOrders(30, i => (i < 15 ? 100000 : 200000));
    const expenses = generateExpenses(30, i => (i < 27 ? 10000 : 500000));
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue(orders);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue(expenses);
    (prisma.customer.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Ravi', creditBalance: 200000 }]);
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue([{ id: 's1', name: 'Mohan', payableBalance: 150000 }]);
    (prisma.product.findMany as jest.Mock).mockResolvedValue([{ id: 'p1', name: 'Oil', stock: 0, lowStockThreshold: 5 }]);
    return prisma;
  }

  it('suppresses the same insight on a second call within the cooldown window', async () => {
    const svc = makeService(makeRichPrisma());

    const first = await svc.generateInsights(BIZ_ID);
    const firstAll = [...first.trends, ...first.anomalies, ...first.opportunities, ...first.risks];
    expect(firstAll.length).toBeGreaterThan(0);

    // Second call — same business, same signal — should be suppressed within cooldown
    const second = await svc.generateInsights(BIZ_ID);
    const secondAll = [...second.trends, ...second.anomalies, ...second.opportunities, ...second.risks];
    expect(secondAll.length).toBe(0);
  });

  it('fires again for a different business even within cooldown', async () => {
    const svc = makeService(makeRichPrisma());

    const first = await svc.generateInsights(BIZ_ID);
    const firstAll = [...first.trends, ...first.anomalies, ...first.opportunities, ...first.risks];
    expect(firstAll.length).toBeGreaterThan(0);

    // Different business — cooldown map key is business-scoped, so it fires again
    const second = await svc.generateInsights('biz-OTHER');
    const secondAll = [...second.trends, ...second.anomalies, ...second.opportunities, ...second.risks];
    expect(secondAll.length).toBeGreaterThan(0);
  });

  it('fires again after the cooldown window expires', async () => {
    jest.useFakeTimers();
    const svc = makeService(makeRichPrisma());

    const first = await svc.generateInsights(BIZ_ID);
    const firstAll = [...first.trends, ...first.anomalies, ...first.opportunities, ...first.risks];
    expect(firstAll.length).toBeGreaterThan(0);

    // Advance past the longest cooldown (24 h for 'info')
    jest.advanceTimersByTime(25 * 60 * 60 * 1000);

    const third = await svc.generateInsights(BIZ_ID);
    const thirdAll = [...third.trends, ...third.anomalies, ...third.opportunities, ...third.risks];
    expect(thirdAll.length).toBeGreaterThan(0);

    jest.useRealTimers();
  });
});
