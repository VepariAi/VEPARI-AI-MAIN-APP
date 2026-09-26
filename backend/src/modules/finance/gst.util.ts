// GST calculation utilities — PROMPT 128.
// All amounts in paise (integer). Never use float for INR.
//
// GST slabs: 0%, 5%, 12%, 18%, 28%
// Intra-state: CGST + SGST (split equally)
// Inter-state: IGST (full rate)

export type GstSlab = 0 | 5 | 12 | 18 | 28;

export interface GstBreakdown {
  /** Base amount before tax, paise */
  baseInPaise: number;
  /** Rate applied, in percent (0, 5, 12, 18, 28) */
  ratePercent: GstSlab;
  /** Total GST amount, paise */
  gstInPaise: number;
  /** CGST component (intra-state only), paise */
  cgstInPaise: number;
  /** SGST component (intra-state only), paise */
  sgstInPaise: number;
  /** IGST component (inter-state only), paise */
  igstInPaise: number;
  /** Total inclusive amount (base + gst), paise */
  totalInPaise: number;
}

/**
 * Calculate GST from an exclusive (pre-tax) base amount.
 * @param baseInPaise Pre-tax amount in paise
 * @param rate GST slab %
 * @param interState true = IGST; false = CGST+SGST
 */
export function calculateGstFromBase(
  baseInPaise: number,
  rate: GstSlab,
  interState = false,
): GstBreakdown {
  const gstInPaise = Math.round((baseInPaise * rate) / 100);
  return splitComponents(baseInPaise, gstInPaise, rate, interState);
}

/**
 * Calculate GST from an inclusive (with-tax) total amount.
 * @param totalInPaise Inclusive total in paise
 * @param rate GST slab %
 * @param interState true = IGST; false = CGST+SGST
 */
export function calculateGstFromTotal(
  totalInPaise: number,
  rate: GstSlab,
  interState = false,
): GstBreakdown {
  // base = total * 100 / (100 + rate)
  const baseInPaise = Math.round((totalInPaise * 100) / (100 + rate));
  const gstInPaise = totalInPaise - baseInPaise;
  return splitComponents(baseInPaise, gstInPaise, rate, interState);
}

function splitComponents(
  baseInPaise: number,
  gstInPaise: number,
  rate: GstSlab,
  interState: boolean,
): GstBreakdown {
  let cgstInPaise = 0;
  let sgstInPaise = 0;
  let igstInPaise = 0;

  if (interState) {
    igstInPaise = gstInPaise;
  } else {
    // Split evenly; if odd paise, CGST gets the extra
    cgstInPaise = Math.ceil(gstInPaise / 2);
    sgstInPaise = gstInPaise - cgstInPaise;
  }

  return {
    baseInPaise,
    ratePercent: rate,
    gstInPaise,
    cgstInPaise,
    sgstInPaise,
    igstInPaise,
    totalInPaise: baseInPaise + gstInPaise,
  };
}

/** Validate that a number is a valid GST slab. */
export function isValidGstSlab(rate: number): rate is GstSlab {
  return [0, 5, 12, 18, 28].includes(rate);
}

/** Aggregate multiple GST breakdowns (e.g. for an invoice with mixed HSN items). */
export function aggregateGst(breakdowns: GstBreakdown[]): GstBreakdown {
  const base = breakdowns.reduce((s, b) => s + b.baseInPaise, 0);
  const gst = breakdowns.reduce((s, b) => s + b.gstInPaise, 0);
  const cgst = breakdowns.reduce((s, b) => s + b.cgstInPaise, 0);
  const sgst = breakdowns.reduce((s, b) => s + b.sgstInPaise, 0);
  const igst = breakdowns.reduce((s, b) => s + b.igstInPaise, 0);
  return {
    baseInPaise: base,
    ratePercent: 0, // mixed — callers should not rely on this for mixed slabs
    gstInPaise: gst,
    cgstInPaise: cgst,
    sgstInPaise: sgst,
    igstInPaise: igst,
    totalInPaise: base + gst,
  };
}
