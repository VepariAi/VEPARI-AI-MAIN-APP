// Unit tests for PrivacyService — PROMPT 207.
// PrismaService is fully mocked — no DB connection.

import { PrivacyService } from '../privacy.service';
import { NotFoundException } from '@nestjs/common';

const USER_ID = 'user-1';

function makePrisma() {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: USER_ID,
        phone: '+919999999999',
        name: 'Ramesh',
        language: 'hi',
        isActive: true,
        createdAt: new Date('2026-01-01'),
        businessMembers: [{ role: 'OWNER', business: { id: 'b1', name: 'Ramesh Traders', type: 'RETAIL' } }],
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    userMemory: {
      findUnique: jest.fn().mockResolvedValue({ userId: USER_ID, summary: 'prefers Hindi' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    voiceQuery: {
      findMany: jest.fn().mockResolvedValue([{ id: 'v1', transcript: 'aaj ka sale', language: 'hi', createdAt: new Date() }]),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    refreshToken: {
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    $transaction: jest.fn().mockImplementation(async (ops: unknown[]) => ops),
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new PrivacyService(prisma as unknown as ConstructorParameters<typeof PrivacyService>[0]);
}

describe('PrivacyService.exportUserData', () => {
  it('assembles a portable export with no secrets', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    const out = await svc.exportUserData(USER_ID);

    expect(out.exportedAt).toBeDefined();
    expect((out.user as { phone: string }).phone).toBe('+919999999999');
    expect(out.voiceQueries).toHaveLength(1);
    expect(out.businessMemberships).toHaveLength(1);
    // No tokens/secrets fields present
    expect(JSON.stringify(out)).not.toContain('refreshToken');
  });

  it('throws NotFoundException for unknown user', async () => {
    const prisma = makePrisma();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const svc = makeService(prisma);
    await expect(svc.exportUserData('nope')).rejects.toThrow(NotFoundException);
  });
});

describe('PrivacyService.eraseUser', () => {
  it('anonymizes PII, revokes tokens, and deletes personal content', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    const result = await svc.eraseUser(USER_ID);

    expect(result.anonymized).toBe(true);
    expect(result.userId).toBe(USER_ID);
    expect(result.retainedRecords).toContain('financial_transactions');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // The anonymizing user.update must set a non-identifying phone + inactive.
    const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.isActive).toBe(false);
    expect(updateCall.data.phone).toContain('deleted-');
    expect(updateCall.data.name).toBe('Deleted User');
  });

  it('throws NotFoundException when erasing an unknown user', async () => {
    const prisma = makePrisma();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const svc = makeService(prisma);
    await expect(svc.eraseUser('nope')).rejects.toThrow(NotFoundException);
  });
});

describe('PrivacyService.getRetentionPolicy', () => {
  it('returns a policy covering financial and personal data classes', () => {
    const svc = makeService(makePrisma());
    const policy = svc.getRetentionPolicy();
    const classes = policy.map(p => p.dataClass);
    expect(classes).toContain('financial_transactions');
    expect(classes).toContain('otp_codes');
    expect(classes).toContain('refresh_tokens');
    for (const rule of policy) {
      expect(rule.retention).toBeTruthy();
      expect(rule.basis).toBeTruthy();
    }
  });
});
