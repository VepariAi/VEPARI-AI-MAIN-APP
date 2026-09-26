// Unit tests for SchemeMatchingService — Prompt 141.
// PrismaService is fully mocked — no DB connection required.

import { SchemeMatchingService } from '../scheme-matching.service';

const BIZ_ID = 'biz-scheme-test';

function makePrisma(businessType = 'RETAIL', annualTurnoverPaise = 0) {
  return {
    business: {
      findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID, name: 'Sharma Kirana Store', type: businessType }),
    },
    saleOrder: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalInPaise: annualTurnoverPaise } }),
    },
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new SchemeMatchingService(prisma as unknown as ConstructorParameters<typeof SchemeMatchingService>[0]);
}

describe('SchemeMatchingService', () => {
  describe('matchSchemesForBusiness', () => {
    it('returns empty when business not found', async () => {
      const prisma = makePrisma();
      (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      const service = makeService(prisma);
      const result = await service.matchSchemesForBusiness(BIZ_ID);
      expect(result).toEqual([]);
    });

    it('returns schemes sorted by match score descending', async () => {
      const prisma = makePrisma('RETAIL', 10_00_00000); // ₹10 lakh turnover
      const service = makeService(prisma);
      const matches = await service.matchSchemesForBusiness(BIZ_ID);
      expect(matches.length).toBeGreaterThan(0);

      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i]!.matchScore).toBeGreaterThanOrEqual(matches[i + 1]!.matchScore);
      }
    });

    it('excludes schemes where turnover exceeds the max limit', async () => {
      // PM Mudra Shishu max is ₹50 lakh — set turnover to ₹1 crore
      const prisma = makePrisma('RETAIL', 100_00_00000);
      const service = makeService(prisma);
      const matches = await service.matchSchemesForBusiness(BIZ_ID);

      const mudraShishu = matches.find(m => m.scheme.id === 'mudra_shishu');
      expect(mudraShishu).toBeUndefined();
    });

    it('includes PM Mudra Shishu for very small turnover (₹1 lakh)', async () => {
      const prisma = makePrisma('RETAIL', 1_00_00000); // ₹1 lakh
      const service = makeService(prisma);
      const matches = await service.matchSchemesForBusiness(BIZ_ID);

      const shishu = matches.find(m => m.scheme.id === 'mudra_shishu');
      expect(shishu).toBeDefined();
      expect(shishu!.matchScore).toBeGreaterThan(0);
    });

    it('includes finance category bonus for small businesses', async () => {
      const prisma = makePrisma('RETAIL', 10_00_00000); // ₹10 lakh < ₹50 lakh threshold
      const service = makeService(prisma);
      const matches = await service.matchSchemesForBusiness(BIZ_ID);

      const financeSchemes = matches.filter(m => m.scheme.category === 'finance');
      expect(financeSchemes.length).toBeGreaterThan(0);
      financeSchemes.forEach(m => {
        const hasFinanceBonus = m.matchReasons.some(r => r.toLowerCase().includes('financ') || r.toLowerCase().includes('support'));
        expect(hasFinanceBonus).toBe(true);
      });
    });

    it('excludes CLCSS (manufacturing scheme) for RETAIL businesses', async () => {
      const prisma = makePrisma('RETAIL', 50_00_00000);
      const service = makeService(prisma);
      const matches = await service.matchSchemesForBusiness(BIZ_ID);

      const clcss = matches.find(m => m.scheme.id === 'clcss');
      expect(clcss).toBeUndefined();
    });

    it('includes CLCSS for MANUFACTURING businesses', async () => {
      const prisma = makePrisma('MANUFACTURING', 50_00_00000); // ₹5 crore
      const service = makeService(prisma);
      const matches = await service.matchSchemesForBusiness(BIZ_ID);

      const clcss = matches.find(m => m.scheme.id === 'clcss');
      expect(clcss).toBeDefined();
      expect(clcss!.matchScore).toBeGreaterThan(0);
    });

    it('each match has at least one matchReason and valid score', async () => {
      const prisma = makePrisma('RETAIL', 20_00_00000);
      const service = makeService(prisma);
      const matches = await service.matchSchemesForBusiness(BIZ_ID);

      for (const m of matches) {
        expect(m.matchScore).toBeGreaterThan(0);
        expect(m.matchScore).toBeLessThanOrEqual(100);
        expect(m.matchReasons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getCatalogue', () => {
    it('returns all schemes in the static catalogue', () => {
      const prisma = makePrisma();
      const service = makeService(prisma);
      const catalogue = service.getCatalogue();
      expect(catalogue.length).toBeGreaterThan(0);
      for (const scheme of catalogue) {
        expect(scheme.id).toBeTruthy();
        expect(scheme.name).toBeTruthy();
        expect(['central', 'state']).toContain(scheme.authority);
      }
    });
  });
});
