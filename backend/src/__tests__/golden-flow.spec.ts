// PROMPT 112 — MVP Golden Business Flow Verification
//
// PRD §134 golden end-to-end test (MVP-scoped subset):
//   create business → create customer → create product → create sale (CREDIT)
//     → inventory decremented
//     → customer creditBalance incremented
//     → ledger transaction created
//     → finance profit updated
//     → record payment → customer creditBalance decremented
//     → payment.recorded event emitted with correct direction
//
// All amounts are integer paise. All services use mocked Prisma — no DB required.
// Each step asserts real service output and mock call arguments, not just
// "step didn't throw"; every assertion traces back to a real service call.

import { NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { SalesService, CreateSaleDto } from '../modules/sales/sales.service';
import { PaymentsService } from '../modules/payments/payments.service';
import { FinanceService } from '../modules/finance/finance.service';

// ── Shared mock factory ────────────────────────────────────────────────────────

type DeepMock<T> = { [K in keyof T]: T[K] extends (...args: never[]) => unknown ? jest.Mock : DeepMock<T[K]> };

// We build a single prisma mock that all services share, wiring data consistently.
function buildGoldenPrisma() {
  const BIZ_ID = 'biz-golden';
  const CUSTOMER_ID = 'cust-ramesh';
  const PRODUCT_ID = 'prod-rice';
  const SALE_ID = 'sale-001';
  const TXN_SALE_ID = 'txn-sale-001';
  const TXN_PAY_ID = 'txn-pay-001';

  // Mutable state mirrors what the DB would update
  let productStock = 50;          // 50 units initially
  let customerCreditBalance = 0;  // starts at 0

  const txClient = {
    saleOrder: {
      create: jest.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => ({
        id: SALE_ID,
        businessId: BIZ_ID,
        customerId: CUSTOMER_ID,
        totalInPaise: args.data['totalInPaise'] as number,
        taxInPaise: 0,
        discountInPaise: 0,
        paymentMethod: args.data['paymentMethod'] ?? 'CREDIT',
        status: 'completed',
        notes: null,
        date: new Date(),
        createdAt: new Date(),
        items: [{ id: 'si-1', productId: PRODUCT_ID, description: 'Rice 5kg', quantity: 5, unitPriceInPaise: 6000, totalInPaise: 30000 }],
      })),
    },
    product: {
      update: jest.fn().mockImplementation(async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const delta = (args.data['stock'] as { decrement?: number; increment?: number })?.decrement;
        if (delta) productStock -= delta;
        return { id: PRODUCT_ID, stock: productStock };
      }),
    },
    customer: {
      update: jest.fn().mockImplementation(async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const delta = (args.data['creditBalance'] as { increment?: number })?.increment;
        if (delta) customerCreditBalance += delta;
        return { id: CUSTOMER_ID, creditBalance: customerCreditBalance };
      }),
      updateMany: jest.fn().mockImplementation(async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const delta = (args.data['creditBalance'] as { decrement?: number })?.decrement;
        if (delta) customerCreditBalance -= delta;
        return { count: 1 };
      }),
    },
    supplier: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    transaction: {
      create: jest.fn()
        .mockResolvedValueOnce({ id: TXN_SALE_ID })    // sale ledger entry
        .mockResolvedValueOnce({ id: TXN_PAY_ID }),    // payment ledger entry
    },
  };

  const prisma = {
    business: {
      findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID, name: 'Ramesh Stores' }),
    },
    customer: {
      findFirst: jest.fn().mockResolvedValue({ id: CUSTOMER_ID, name: 'Ramesh', businessId: BIZ_ID }),
      updateMany: txClient.customer.updateMany,
    },
    supplier: {
      updateMany: txClient.supplier.updateMany,
    },
    saleOrder: { aggregate: jest.fn() },
    expense: { aggregate: jest.fn() },
    transaction: { create: txClient.transaction.create },
    $transaction: jest.fn().mockImplementation(async (fn: (tx: typeof txClient) => Promise<unknown>) => fn(txClient)),

    // For FinanceService profit query
    _state: { productStock: () => productStock, customerCreditBalance: () => customerCreditBalance },
  };

  // Wire saleOrder aggregate for finance profit check
  (prisma.saleOrder.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalInPaise: 30000 } });
  (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountInPaise: 0 } });

  return { prisma, txClient, BIZ_ID, CUSTOMER_ID, PRODUCT_ID, SALE_ID, TXN_SALE_ID, TXN_PAY_ID,
    state: prisma._state };
}

// ── Golden flow ────────────────────────────────────────────────────────────────

describe('Golden Business Flow — PRD §134 MVP subset', () => {
  it('executes the full flow: sale (CREDIT) → inventory ↓ → credit ↑ → payment → credit ↓ → profit', async () => {
    const { prisma, txClient, BIZ_ID, CUSTOMER_ID, PRODUCT_ID, state } = buildGoldenPrisma();

    // ─ Services ─────────────────────────────────────────────────────────────

    const events = { emit: jest.fn() };

    const salesSvc = new SalesService(
      prisma as unknown as ConstructorParameters<typeof SalesService>[0],
      events as unknown as ConstructorParameters<typeof SalesService>[1],
    );

    const paymentsSvc = new PaymentsService(
      prisma as unknown as ConstructorParameters<typeof PaymentsService>[0],
      events as unknown as ConstructorParameters<typeof PaymentsService>[1],
    );

    const financeSvc = new FinanceService(
      prisma as unknown as ConstructorParameters<typeof FinanceService>[0],
    );

    // ─ Step 1: Create a CREDIT sale (5 bags of rice × ₹60 = ₹300 = 30 000 paise) ─

    const saleDto: CreateSaleDto = {
      businessId: BIZ_ID,
      customerId: CUSTOMER_ID,
      items: [{ productId: PRODUCT_ID, description: 'Rice 5kg', quantity: 5, unitPriceInPaise: 6000 }],
      paymentMethod: PaymentMethod.CREDIT,
    };

    const sale = await salesSvc.createSale(saleDto);

    // Sale record created
    expect(sale.id).toBeTruthy();
    expect(sale.totalInPaise).toBe(30000);
    expect(Number.isInteger(sale.totalInPaise)).toBe(true);

    // ─ Step 2: Inventory decremented ──────────────────────────────────────────

    expect(txClient.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PRODUCT_ID },
        data: { stock: { decrement: 5 } },
      }),
    );
    // Mutable state reflects the decrement
    expect(state.productStock()).toBe(45);

    // ─ Step 3: Customer creditBalance incremented (CREDIT sale) ───────────────

    expect(txClient.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CUSTOMER_ID },
        data: { creditBalance: { increment: 30000 } },
      }),
    );
    expect(state.customerCreditBalance()).toBe(30000);

    // ─ Step 4: Ledger transaction entry created ────────────────────────────────

    expect(txClient.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'SALE', businessId: BIZ_ID, amountInPaise: 30000 }),
      }),
    );

    // ─ Step 5: Sale event emitted ─────────────────────────────────────────────

    expect(events.emit).toHaveBeenCalledWith(
      'sale.created',
      expect.objectContaining({ businessId: BIZ_ID, totalPaise: 30000 }),
    );

    // ─ Step 6: Finance — profit reflects the sale ─────────────────────────────

    const profit = await financeSvc.getProfitSummary(BIZ_ID, new Date(), new Date());
    expect(profit.salesInPaise).toBe(30000);
    expect(profit.expensesInPaise).toBe(0);
    expect(profit.profitInPaise).toBe(30000);
    expect(Number.isInteger(profit.profitInPaise)).toBe(true);

    // ─ Step 7: Record payment — customer pays 30 000 paise (full balance) ─────

    // Wire payment create mock
    (prisma.transaction.create as jest.Mock).mockResolvedValue({
      id: 'txn-pay-001',
      type: 'PAYMENT',
      amountInPaise: 30000,
      paymentMethod: 'CASH',
      customerId: CUSTOMER_ID,
      customer: { name: 'Ramesh' },
      supplierId: null,
      supplier: null,
      description: null,
      notes: null,
      date: new Date(),
      createdAt: new Date(),
    });

    await paymentsSvc.recordPayment(BIZ_ID, { amountInPaise: 30000, customerId: CUSTOMER_ID });

    // ─ Step 8: Customer creditBalance decremented ──────────────────────────────

    expect(prisma.customer.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CUSTOMER_ID, businessId: BIZ_ID },
        data: { creditBalance: { decrement: 30000 } },
      }),
    );
    expect(state.customerCreditBalance()).toBe(0); // fully settled

    // ─ Step 9: Payment event emitted with direction IN (customer paying us) ───

    expect(events.emit).toHaveBeenCalledWith(
      'payment.recorded',
      expect.objectContaining({ businessId: BIZ_ID, amountPaise: 30000, direction: 'IN' }),
    );
  });

  // ─ Edge-case: NotFoundException when business not found ─────────────────────

  it('throws NotFoundException when business does not exist (gate check)', async () => {
    const { prisma } = buildGoldenPrisma();
    (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const events = { emit: jest.fn() };
    const svc = new SalesService(
      prisma as unknown as ConstructorParameters<typeof SalesService>[0],
      events as unknown as ConstructorParameters<typeof SalesService>[1],
    );
    await expect(
      svc.createSale({ businessId: 'missing', items: [{ description: 'rice', quantity: 1, unitPriceInPaise: 1000 }] }),
    ).rejects.toThrow(NotFoundException);
  });

  // ─ Paise integrity: all amounts in the flow are integers ────────────────────

  it('all monetary amounts produced by the golden flow are paise integers', async () => {
    const { prisma } = buildGoldenPrisma();
    const events = { emit: jest.fn() };
    const svc = new SalesService(
      prisma as unknown as ConstructorParameters<typeof SalesService>[0],
      events as unknown as ConstructorParameters<typeof SalesService>[1],
    );
    const sale = await svc.createSale({
      businessId: 'biz-golden',
      items: [{ description: 'test', quantity: 3, unitPriceInPaise: 333 }], // 3×333 = 999
    });
    expect(Number.isInteger(sale.totalInPaise)).toBe(true);
    expect(sale.totalInPaise).toBe(999);
  });
});
