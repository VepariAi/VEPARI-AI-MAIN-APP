// Unit tests for TDS utilities — PROMPT 129.
import { calculateTds, tdsRatePercent, listTdsSections } from '../tds.util';

describe('tds.util', () => {
  describe('calculateTds', () => {
    it('deducts 1% for 194C individual above threshold', () => {
      // Threshold is ₹30,000. Payment is ₹50,000 (5,000,000 paise)
      const result = calculateTds(5_000_000, '194C_individual', 0);
      expect(result.applicable).toBe(true);
      // taxable = 5,000,000 - 3,000,000 = 2,000,000; tds = 2,000,000 * 10000 / 10000000 = 2000
      expect(result.tdsInPaise).toBeGreaterThan(0);
      expect(result.netInPaise).toBe(result.paymentInPaise - result.tdsInPaise);
    });

    it('does not deduct when below threshold', () => {
      // Threshold ₹30,000 = 3,000,000 paise; pay ₹200 = 20,000 paise
      const result = calculateTds(20000, '194C_individual', 0);
      expect(result.applicable).toBe(false);
      expect(result.tdsInPaise).toBe(0);
      expect(result.netInPaise).toBe(20000);
    });

    it('deducts on full amount when prior already exceeded threshold', () => {
      // Prior ₹40,000 > threshold ₹30,000; current ₹10,000
      // All 10,000 (1,000,000 paise) is taxable at 1%
      const result = calculateTds(1_000_000, '194C_individual', 4_000_000);
      expect(result.applicable).toBe(true);
      // tds = 1,000,000 * 100bps / 10000 = 10000 paise (= ₹100 = 1% of ₹10,000)
      expect(result.tdsInPaise).toBe(10000);
    });

    it('deducts 10% for 194J professionals', () => {
      const result = calculateTds(10_000_000, '194J', 0); // ₹1 lakh above ₹30k threshold
      expect(result.applicable).toBe(true);
      expect(result.tdsInPaise).toBeGreaterThan(0);
    });

    it('returns correct section description', () => {
      const result = calculateTds(5_000_000, '194J', 0);
      expect(result.description).toContain('10%');
    });
  });

  describe('tdsRatePercent', () => {
    it('returns 1 for 194C individual', () => {
      expect(tdsRatePercent('194C_individual')).toBe(1);
    });

    it('returns 2 for 194C company', () => {
      expect(tdsRatePercent('194C_company')).toBe(2);
    });

    it('returns 10 for 194J', () => {
      expect(tdsRatePercent('194J')).toBe(10);
    });

    it('returns 5 for 194H', () => {
      expect(tdsRatePercent('194H')).toBe(5);
    });
  });

  describe('listTdsSections', () => {
    it('returns all 7 sections', () => {
      const sections = listTdsSections();
      expect(sections).toHaveLength(7);
    });

    it('each entry has section, description, rateBps', () => {
      const sections = listTdsSections();
      for (const s of sections) {
        expect(s.section).toBeTruthy();
        expect(s.description).toBeTruthy();
        expect(s.rateBps).toBeGreaterThan(0);
      }
    });
  });
});
