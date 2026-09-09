// TDS (Tax Deducted at Source) utilities — PROMPT 129.
// All amounts in paise (integer). Rates stored as basis points (1/100 of 1%).
//
// Common TDS sections per Income Tax Act:
//   194C  Contractors: 10000 bps (1%) individuals, 20000 bps (2%) companies
//   194J  Professionals: 100000 bps (10%)
//   194I  Rent: 100000 bps (10%)
//   194H  Commission/Brokerage: 50000 bps (5%)
//   194A  Interest (non-bank): 100000 bps (10%)
//   194M  Payments by individuals >50L: 50000 bps (5%)
//
// Threshold limits apply per section — deduction only when cumulative
// exceeds threshold in a financial year.

export type TdsSection =
  | '194C_individual'
  | '194C_company'
  | '194J'
  | '194I'
  | '194H'
  | '194A'
  | '194M';

interface SectionConfig {
  /** TDS rate in basis points (1 bps = 0.01%) */
  rateBps: number;
  /** Annual threshold in paise; deduct only when cumulative > threshold */
  thresholdInPaise: number;
  description: string;
}

const SECTION_CONFIG: Record<TdsSection, SectionConfig> = {
  '194C_individual': { rateBps: 10000, thresholdInPaise: 3000000, description: 'Contractor (individual) — 1%' },
  '194C_company':    { rateBps: 20000, thresholdInPaise: 3000000, description: 'Contractor (company) — 2%' },
  '194J':            { rateBps: 100000, thresholdInPaise: 3000000, description: 'Professional/Technical — 10%' },
  '194I':            { rateBps: 100000, thresholdInPaise: 24000000, description: 'Rent — 10%' },
  '194H':            { rateBps: 50000, thresholdInPaise: 1500000, description: 'Commission/Brokerage — 5%' },
  '194A':            { rateBps: 100000, thresholdInPaise: 4000000, description: 'Interest — 10%' },
  '194M':            { rateBps: 50000, thresholdInPaise: 5000000000, description: 'Payments by individuals — 5%' },
};

export interface TdsCalculation {
  section: TdsSection;
  /** Payment amount in paise */
  paymentInPaise: number;
  /** TDS deducted in paise (0 if below threshold) */
  tdsInPaise: number;
  /** Net amount after TDS deduction in paise */
  netInPaise: number;
  /** Whether TDS was applicable (cumulative > threshold) */
  applicable: boolean;
  description: string;
}

/**
 * Calculate TDS on a single payment.
 * @param paymentInPaise  Current payment amount in paise
 * @param section         Applicable TDS section
 * @param cumulativePriorInPaise  Total payments made under this section in the FY before this payment (paise)
 */
export function calculateTds(
  paymentInPaise: number,
  section: TdsSection,
  cumulativePriorInPaise = 0,
): TdsCalculation {
  const config = SECTION_CONFIG[section];
  const cumulativeAfter = cumulativePriorInPaise + paymentInPaise;
  const applicable = cumulativeAfter > config.thresholdInPaise;

  let tdsInPaise = 0;
  if (applicable) {
    // Deduct TDS only on the portion that exceeds the threshold, if not already exceeded
    const taxableBase = cumulativePriorInPaise >= config.thresholdInPaise
      ? paymentInPaise
      : cumulativeAfter - config.thresholdInPaise;
    tdsInPaise = Math.round((taxableBase * config.rateBps) / 10000000); // bps * 100 = percent, /100 = fraction
  }

  return {
    section,
    paymentInPaise,
    tdsInPaise,
    netInPaise: paymentInPaise - tdsInPaise,
    applicable,
    description: config.description,
  };
}

/** Get TDS rate percentage (integer) for display */
export function tdsRatePercent(section: TdsSection): number {
  return SECTION_CONFIG[section]!.rateBps / 100000;
}

/** Get threshold in paise for a section */
export function tdsThresholdInPaise(section: TdsSection): number {
  return SECTION_CONFIG[section]!.thresholdInPaise;
}

/** List all sections with their descriptions */
export function listTdsSections(): Array<{ section: TdsSection; description: string; rateBps: number }> {
  return (Object.entries(SECTION_CONFIG) as Array<[TdsSection, SectionConfig]>).map(([section, cfg]) => ({
    section,
    description: cfg.description,
    rateBps: cfg.rateBps,
  }));
}
