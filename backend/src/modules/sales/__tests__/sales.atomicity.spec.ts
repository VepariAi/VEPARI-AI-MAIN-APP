// Unit tests for SalesService — verifies that createSale is fully atomic.
// A failure partway through (simulated by throwing inside $transaction) must
// not leave a half-committed sale in the database.
// PrismaService is fully mocked — no DB connection required.

import { NotFoundException } from '@nestjs/common';
import { SalesService, CreateSaleDto } from '../sales.service';
import { PaymentMethod } from '@prisma/client';

const BIZ_ID = 'biz-1';
const CUST_ID = 'cust-1';
const PROD_ID = 'prod-1';

const BASE_DTO: CreateSaleDto = {
  businessId: BIZ_ID,
  items: [
    { productId: PROD_ID, description: 'Widget', quantity: 2, unitPriceInPaise: 5000 },
  ],
  paymentMethod: PaymentMethod.CASH,
};

// Helper that creates a tx object whose internal methods are all Jest mocks.
function makeTxMock() {
  return {
    saleOrder: { create: jest.fn() },
    product: { update: jest.fn() },
    customer: { update: jest.fn() },
    transaction: { create: jest.fn() },
  };
}

function makePrisma(txMock: ReturnType<typeof makeTxMock>, transactionImpl?: (fn: (tx: unknown) => unknown) => Promise<unknown>) {
  return {
    business: {
      findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID }),
    },
    customer: {
      findFirst: jest.fn().mockResolvedValue({ id: CUST_ID }),
    },
    $transaction: jest.fn().mockImplementation(
      transactionImpl ?? ((fn: (tx: unknown) => unknown) => fn(txMock)),
    ),
  };
}

describe('SalesService — createSale atomicity', () => {
  it('executes all writes inside a single $transaction call', async () => {
    const txMock = makeTxMock();
    const createdOrder = { id: 'order-1', businessId: BIZ_ID, customerId: null, totalInPaise: 10000, taxInPaise: 0, discountInPaise: 0, paymentMethod: PaymentMethod.CASH, status: 'completed', notes: null, date: new Date(), createdAt: new Date(), items: [] };
    txMock.saleOrder.create.mockResolvedValue(createdOrder);
    txMock.product.update.mockResolvedValue({});
    txMock.transaction.create.mockResolvedValue({});

    const prisma = makePrisma(txMock);
    const service = new SalesService(prisma as unknown as ConstructorParameters<typeof SalesService>[0]);

    await service.createSale(BASE_DTO);

    // $transaction must be called exactly once
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    // All sub-writes happen inside it
    expect(txMock.saleOrder.create).toHaveBeenCalledTimes(1);
    expect(txMock.product.update).toHaveBeenCalledTimes(1);
    expect(txMock.transaction.create).toHaveBeenCalledTimes(1);

    // stock decremented correctly (integer arithmetic)
    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: PROD_ID },
      data: { stock: { decrement: 2 } },
    });
  });

  it('propagates an error thrown by the ledger write, simulating mid-transaction failure', async () => {
    const txMock = makeTxMock();
    const createdOrder = { id: 'order-1', businessId: BIZ_ID, customerId: null, totalInPaise: 10000, taxInPaise: 0, discountInPaise: 0, paymentMethod: PaymentMethod.CASH, status: 'completed', notes: null, date: new Date(), createdAt: new Date(), items: [] };
    txMock.saleOrder.create.mockResolvedValue(createdOrder);
    txMock.product.update.mockResolvedValue({});
    // Simulate failure after order + stock writes, during ledger entry
    txMock.transaction.create.mockRejectedValue(new Error('DB constraint violation'));

    const prisma = makePrisma(txMock);
    const service = new SalesService(prisma as unknown as ConstructorParameters<typeof SalesService>[0]);

    // The error must propagate so Prisma can roll back the entire transaction
    await expect(service.createSale(BASE_DTO)).rejects.toThrow('DB constraint violation');

    // $transaction was entered
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // The failing step was reached
    expect(txMock.transaction.create).toHaveBeenCalledTimes(1);
  });

  it('updates customer creditBalance when paymentMethod is CREDIT', async () => {
    const txMock = makeTxMock();
    const createdOrder = { id: 'order-1', businessId: BIZ_ID, customerId: CUST_ID, totalInPaise: 10000, taxInPaise: 0, discountInPaise: 0, paymentMethod: PaymentMethod.CREDIT, status: 'completed', notes: null, date: new Date(), createdAt: new Date(), items: [] };
    txMock.saleOrder.create.mockResolvedValue(createdOrder);
    txMock.product.update.mockResolvedValue({});
    txMock.customer.update.mockResolvedValue({});
    txMock.transaction.create.mockResolvedValue({});

    const prisma = makePrisma(txMock);
    const service = new SalesService(prisma as unknown as ConstructorParameters<typeof SalesService>[0]);

    await service.createSale({ ...BASE_DTO, customerId: CUST_ID, paymentMethod: PaymentMethod.CREDIT });

    expect(txMock.customer.update).toHaveBeenCalledWith({
      where: { id: CUST_ID },
      data: { creditBalance: { increment: 10000 } },
    });
  });

  it('does NOT update customer creditBalance for non-credit payment', async () => {
    const txMock = makeTxMock();
    const createdOrder = { id: 'order-1', businessId: BIZ_ID, customerId: CUST_ID, totalInPaise: 10000, taxInPaise: 0, discountInPaise: 0, paymentMethod: PaymentMethod.CASH, status: 'completed', notes: null, date: new Date(), createdAt: new Date(), items: [] };
    txMock.saleOrder.create.mockResolvedValue(createdOrder);
    txMock.product.update.mockResolvedValue({});
    txMock.transaction.create.mockResolvedValue({});

    const prisma = makePrisma(txMock);
    const service = new SalesService(prisma as unknown as ConstructorParameters<typeof SalesService>[0]);

    await service.createSale({ ...BASE_DTO, customerId: CUST_ID, paymentMethod: PaymentMethod.CASH });

    expect(txMock.customer.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when business does not exist', async () => {
    const txMock = makeTxMock();
    const prisma = makePrisma(txMock);
    (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);

    const service = new SalesService(prisma as unknown as ConstructorParameters<typeof SalesService>[0]);

    await expect(service.createSale(BASE_DTO)).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('computes total in paise (integer) from item quantities and prices', async () => {
    const txMock = makeTxMock();
    let capturedTotal = 0;
    txMock.saleOrder.create.mockImplementation(async (args: { data: { totalInPaise: number } }) => {
      capturedTotal = args.data.totalInPaise;
      return { id: 'o1', businessId: BIZ_ID, customerId: null, totalInPaise: capturedTotal, taxInPaise: 0, discountInPaise: 0, paymentMethod: 'CASH', status: 'completed', notes: null, date: new Date(), createdAt: new Date(), items: [] };
    });
    txMock.product.update.mockResolvedValue({});
    txMock.transaction.create.mockResolvedValue({});

    const prisma = makePrisma(txMock);
    const service = new SalesService(prisma as unknown as ConstructorParameters<typeof SalesService>[0]);

    await service.createSale({
      businessId: BIZ_ID,
      items: [
        { productId: PROD_ID, description: 'A', quantity: 3, unitPriceInPaise: 33333 },
      ],
    });

    // 3 × 33333 = 99999 paise — no float rounding
    expect(capturedTotal).toBe(99999);
    expect(Number.isInteger(capturedTotal)).toBe(true);
  });
});
