// Unit tests for BRS (Bank Reconciliation Statement) logic in FinanceService.
// PrismaService is fully mocked — no DB connection required.

import { FinanceService } from '../finance.service';

const IMPORT_ID = 'import-1';
const BIZ_ID = 'biz-1';

function makeBrsEntry(overrides: Partial<{
  id: string;
  importId: string;
  date: Date;
  amountInPaise: number;
  description: string | null;
  reference: string | null;
  matchedTransactionId: string | null;
  matchedAt: Date | null;
}> = {}) {
  return {
    id: 'entry-1',
    importId: IMPORT_ID,
    date: new Date('2024-07-15'),
    amountInPaise: 50000,
    description: 'UPI payment',
    reference: 'UPI/12345',
    matchedTransactionId: null,
    matchedAt: null,
    ...overrides,
  };
}

function makeTx(overrides: Partial<{
  id: string;
  amountInPaise: number;
  date: Date;
}> = {}) {
  return {
    id: 'tx-1',
    amountInPaise: 50000,
    date: new Date('2024-07-15'),
    ...overrides,
  };
}

function makeMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    business: {
      findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID }),
    },
    saleOrder: { aggregate: jest.fn() },
    expense: { aggregate: jest.fn() },
    bankStatementImport: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    bankStatementEntry: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    ...overrides,
  };
}

function makeService(prisma: ReturnType<typeof makeMockPrisma>) {
  return new FinanceService(prisma as unknown as ConstructorParameters<typeof FinanceService>[0]);
}

describe('FinanceService — BRS reconciliation', () => {
  it('marks an entry as matched when a transaction has same amount within ±1 day', async () => {
    const prisma = makeMockPrisma();
    const entry = makeBrsEntry();
    const tx = makeTx();

    prisma.bankStatementImport.findFirst.mockResolvedValue({ id: IMPORT_ID, businessId: BIZ_ID, label: 'Test' });
    prisma.bankStatementEntry.findMany.mockResolvedValue([entry]);
    prisma.transaction.findMany.mockResolvedValue([tx]);
    prisma.bankStatementEntry.update.mockResolvedValue({});

    const service = makeService(prisma);
    const result = await service.reconcileImport(BIZ_ID, IMPORT_ID);

    expect(result.matchedCount).toBe(1);
    expect(result.unmatchedCount).toBe(0);
    const matched = result.entries[0];
    expect(matched?.status).toBe('matched');
    expect(matched?.matchedTransactionId).toBe(tx.id);
    expect(prisma.bankStatementEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: entry.id },
        data: expect.objectContaining({ matchedTransactionId: tx.id }),
      }),
    );
  });

  it('marks an entry as unmatched when no transaction exists for that amount', async () => {
    const prisma = makeMockPrisma();
    const entry = makeBrsEntry({ amountInPaise: 99900 });
    const tx = makeTx({ amountInPaise: 50000 });

    prisma.bankStatementImport.findFirst.mockResolvedValue({ id: IMPORT_ID, businessId: BIZ_ID, label: 'Test' });
    prisma.bankStatementEntry.findMany.mockResolvedValue([entry]);
    prisma.transaction.findMany.mockResolvedValue([tx]);

    const service = makeService(prisma);
    const result = await service.reconcileImport(BIZ_ID, IMPORT_ID);

    expect(result.matchedCount).toBe(0);
    expect(result.unmatchedCount).toBe(1);
    expect(result.entries[0]?.status).toBe('unmatched');
    expect(prisma.bankStatementEntry.update).not.toHaveBeenCalled();
  });

  it('does not match the same transaction to two entries', async () => {
    const prisma = makeMockPrisma();
    const entry1 = makeBrsEntry({ id: 'entry-1', amountInPaise: 50000 });
    const entry2 = makeBrsEntry({ id: 'entry-2', amountInPaise: 50000 });
    const tx = makeTx({ id: 'tx-1', amountInPaise: 50000 });

    prisma.bankStatementImport.findFirst.mockResolvedValue({ id: IMPORT_ID, businessId: BIZ_ID, label: 'Test' });
    prisma.bankStatementEntry.findMany.mockResolvedValue([entry1, entry2]);
    prisma.transaction.findMany.mockResolvedValue([tx]);
    prisma.bankStatementEntry.update.mockResolvedValue({});

    const service = makeService(prisma);
    const result = await service.reconcileImport(BIZ_ID, IMPORT_ID);

    expect(result.matchedCount).toBe(1);
    expect(result.unmatchedCount).toBe(1);
    // Only one update call
    expect(prisma.bankStatementEntry.update).toHaveBeenCalledTimes(1);
  });

  it('skips matching for entries that are already matched', async () => {
    const prisma = makeMockPrisma();
    const entry = makeBrsEntry({
      matchedTransactionId: 'tx-already',
      matchedAt: new Date('2024-07-16'),
    });

    prisma.bankStatementImport.findFirst.mockResolvedValue({ id: IMPORT_ID, businessId: BIZ_ID, label: 'Test' });
    prisma.bankStatementEntry.findMany.mockResolvedValue([entry]);
    prisma.transaction.findMany.mockResolvedValue([]);

    const service = makeService(prisma);
    const result = await service.reconcileImport(BIZ_ID, IMPORT_ID);

    expect(result.matchedCount).toBe(1);
    expect(prisma.bankStatementEntry.update).not.toHaveBeenCalled();
  });

  it('returns empty result when statement has no entries', async () => {
    const prisma = makeMockPrisma();

    prisma.bankStatementImport.findFirst.mockResolvedValue({ id: IMPORT_ID, businessId: BIZ_ID, label: 'Empty' });
    prisma.bankStatementEntry.findMany.mockResolvedValue([]);

    const service = makeService(prisma);
    const result = await service.reconcileImport(BIZ_ID, IMPORT_ID);

    expect(result.totalEntries).toBe(0);
    expect(result.matchedCount).toBe(0);
    expect(result.unmatchedCount).toBe(0);
    expect(result.entries).toHaveLength(0);
    expect(prisma.transaction.findMany).not.toHaveBeenCalled();
  });

  it('matches using absolute value of amount (handles credit vs debit sign difference)', async () => {
    const prisma = makeMockPrisma();
    // Bank statement shows debit of 50000; transaction recorded as positive 50000
    const entry = makeBrsEntry({ amountInPaise: -50000 });
    const tx = makeTx({ amountInPaise: 50000 });

    prisma.bankStatementImport.findFirst.mockResolvedValue({ id: IMPORT_ID, businessId: BIZ_ID, label: 'Test' });
    prisma.bankStatementEntry.findMany.mockResolvedValue([entry]);
    prisma.transaction.findMany.mockResolvedValue([tx]);
    prisma.bankStatementEntry.update.mockResolvedValue({});

    const service = makeService(prisma);
    const result = await service.reconcileImport(BIZ_ID, IMPORT_ID);

    expect(result.matchedCount).toBe(1);
    expect(result.entries[0]?.status).toBe('matched');
  });

  it('throws NotFoundException for unknown import', async () => {
    const prisma = makeMockPrisma();
    prisma.bankStatementImport.findFirst.mockResolvedValue(null);

    const service = makeService(prisma);
    await expect(service.reconcileImport(BIZ_ID, 'bad-id')).rejects.toThrow('Bank statement import not found');
  });
});
