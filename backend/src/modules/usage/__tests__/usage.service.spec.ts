// Unit tests for UsageService (Prisma/MySQL-backed) — PROMPT 124, DL-011.
// PrismaService fully mocked. Cost is integer paise.

import { UsageService } from '../usage.service';

function makePrisma() {
  return {
    usageCounter: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new UsageService(prisma as unknown as ConstructorParameters<typeof UsageService>[0]);
}

describe('UsageService.record', () => {
  it('computes AI cost with integer arithmetic (anthropic 2000in/500out = 113 paise)', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    await svc.record({ businessId: 'b2', type: 'ai_chat', provider: 'anthropic', inputTokens: 2000, outputTokens: 500 });
    // 2000*25/1000 + 500*126/1000 = 50 + 63 = 113
    const arg = (prisma.usageCounter.upsert as jest.Mock).mock.calls[0][0];
    expect(arg.create.estimatedAiCostInPaise).toBe(113);
    expect(arg.create.inputTokens).toBe(2000);
    expect(arg.create.outputTokens).toBe(500);
    expect(Number.isInteger(arg.create.estimatedAiCostInPaise)).toBe(true);
  });

  it('uses atomic increments on the update path', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    await svc.record({ businessId: 'b1', type: 'ai_chat', provider: 'openai', inputTokens: 1000, outputTokens: 1000 });
    const arg = (prisma.usageCounter.upsert as jest.Mock).mock.calls[0][0];
    // openai: 1000*1/1000 + 1000*5/1000 = 1 + 5 = 6
    expect(arg.update.estimatedAiCostInPaise).toEqual({ increment: 6 });
    expect(arg.update.totalApiCalls).toEqual({ increment: 1 });
    expect(arg.update.aiChatRequests).toEqual({ increment: 1 });
  });

  it('counts stt/tts/api without token cost', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    await svc.record({ businessId: 'b3', type: 'stt' });
    const arg = (prisma.usageCounter.upsert as jest.Mock).mock.calls[0][0];
    expect(arg.create.sttRequests).toBe(1);
    expect(arg.create.aiChatRequests).toBe(0);
    expect(arg.create.estimatedAiCostInPaise).toBe(0);
    expect(arg.create.totalApiCalls).toBe(1);
  });

  it('scopes the upsert to businessId + current period', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    await svc.record({ businessId: 'b4', type: 'api' });
    const arg = (prisma.usageCounter.upsert as jest.Mock).mock.calls[0][0];
    expect(arg.where.businessId_periodStart.businessId).toBe('b4');
    expect(arg.where.businessId_periodStart.periodStart).toBeInstanceOf(Date);
  });

  it('never throws when the DB write fails', async () => {
    const prisma = makePrisma();
    (prisma.usageCounter.upsert as jest.Mock).mockRejectedValue(new Error('db down'));
    const svc = makeService(prisma);
    await expect(svc.record({ businessId: 'b5', type: 'ai_chat', inputTokens: 10, outputTokens: 10 }))
      .resolves.toBeUndefined();
  });
});

describe('UsageService.getUsage', () => {
  it('returns a zeroed counter when no row exists for the period', async () => {
    const svc = makeService(makePrisma());
    const usage = await svc.getUsage('bX');
    expect(usage.totalApiCalls).toBe(0);
    expect(usage.estimatedAiCostInPaise).toBe(0);
    expect(usage.resetAt).toBeInstanceOf(Date);
  });

  it('maps a stored row to the UsageCounter shape', async () => {
    const prisma = makePrisma();
    (prisma.usageCounter.findUnique as jest.Mock).mockResolvedValue({
      businessId: 'b6', periodStart: new Date('2026-09-01'),
      aiChatRequests: 3, sttRequests: 1, ttsRequests: 2, totalApiCalls: 6,
      inputTokens: 500, outputTokens: 200, estimatedAiCostInPaise: 37,
    });
    const svc = makeService(prisma);
    const usage = await svc.getUsage('b6');
    expect(usage.aiChatRequests).toBe(3);
    expect(usage.estimatedAiCostInPaise).toBe(37);
    expect(usage.resetAt).toEqual(new Date('2026-09-01'));
  });
});
