// Unit tests for GST utilities — PROMPT 128.
import {
  calculateGstFromBase,
  calculateGstFromTotal,
  isValidGstSlab,
  aggregateGst,
} from '../gst.util';

describe('gst.util', () => {
  describe('calculateGstFromBase', () => {
    it('calculates 18% GST intra-state from base amount', () => {
      const result = calculateGstFromBase(10000, 18);
      expect(result.baseInPaise).toBe(10000);
      expect(result.gstInPaise).toBe(1800);
      expect(result.cgstInPaise).toBe(900);
      expect(result.sgstInPaise).toBe(900);
      expect(result.igstInPaise).toBe(0);
      expect(result.totalInPaise).toBe(11800);
    });

    it('calculates 18% GST inter-state (IGST)', () => {
      const result = calculateGstFromBase(10000, 18, true);
      expect(result.igstInPaise).toBe(1800);
      expect(result.cgstInPaise).toBe(0);
      expect(result.sgstInPaise).toBe(0);
    });

    it('handles 5% GST correctly', () => {
      const result = calculateGstFromBase(50000, 5);
      expect(result.gstInPaise).toBe(2500);
      expect(result.cgstInPaise).toBe(1250);
      expect(result.sgstInPaise).toBe(1250);
    });

    it('returns zero GST for 0% slab', () => {
      const result = calculateGstFromBase(100000, 0);
      expect(result.gstInPaise).toBe(0);
      expect(result.totalInPaise).toBe(100000);
    });

    it('handles odd paise with CGST getting extra paise', () => {
      // ₹3 at 18% = 54 paise; 54/2 = 27 exactly, no odd case
      // ₹1 at 5% = 5 paise (odd); CGST=3, SGST=2
      const result = calculateGstFromBase(100, 5); // ₹1 base
      expect(result.gstInPaise).toBe(5);
      expect(result.cgstInPaise).toBe(3);
      expect(result.sgstInPaise).toBe(2);
      expect(result.cgstInPaise + result.sgstInPaise).toBe(result.gstInPaise);
    });
  });

  describe('calculateGstFromTotal', () => {
    it('extracts 18% GST from inclusive total', () => {
      // ₹118 inclusive of 18% GST → base = ₹100, GST = ₹18
      const result = calculateGstFromTotal(11800, 18);
      expect(result.baseInPaise).toBe(10000);
      expect(result.gstInPaise).toBe(1800);
      expect(result.totalInPaise).toBe(11800);
    });

    it('extracts 5% GST correctly', () => {
      const result = calculateGstFromTotal(10500, 5);
      expect(result.baseInPaise).toBe(10000);
      expect(result.gstInPaise).toBe(500);
    });

    it('handles 28% slab', () => {
      const result = calculateGstFromTotal(12800, 28);
      expect(result.baseInPaise).toBe(10000);
      expect(result.gstInPaise).toBe(2800);
    });
  });

  describe('isValidGstSlab', () => {
    it.each([[0], [5], [12], [18], [28]])('accepts valid slab %d', rate => {
      expect(isValidGstSlab(rate)).toBe(true);
    });

    it.each([[1], [3], [10], [15], [25]])('rejects invalid slab %d', rate => {
      expect(isValidGstSlab(rate)).toBe(false);
    });
  });

  describe('aggregateGst', () => {
    it('sums multiple breakdowns correctly', () => {
      const b1 = calculateGstFromBase(10000, 18);
      const b2 = calculateGstFromBase(5000, 12);
      const agg = aggregateGst([b1, b2]);
      expect(agg.baseInPaise).toBe(15000);
      expect(agg.gstInPaise).toBe(1800 + 600);
      expect(agg.totalInPaise).toBe(17400);
    });

    it('returns zero for empty array', () => {
      const agg = aggregateGst([]);
      expect(agg.gstInPaise).toBe(0);
      expect(agg.totalInPaise).toBe(0);
    });
  });
});
