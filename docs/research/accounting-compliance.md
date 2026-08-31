# Vepari AI — Accounting & Compliance Research

> **Document:** `docs/research/accounting-compliance.md`
> **Phase:** 1 — Research
> **Type:** RESEARCH — findings only, not product decisions
> **Produced by:** Prompt 9 audit (live research)
> **Research date:** 2026-08-31
> **Researcher:** Engineering (Prompt 9 audit)
> **Commissioned by:** Prompt 0 §0.7 — Ground accounting engine (TRD §28) before Phase 12
> **Status:** RESEARCH COMPLETE — Awaiting Phase 12 product decisions

**IMPORTANT:** Every figure in this document has a source citation. Nothing here is settled product behavior. The accounting engine design decisions happen in Phase 12. This document is the factual input to those decisions.

**Scope:** Indian GST structure, small-business GST compliance, TDS applicability, and bank reconciliation logic — specifically as they apply to micro and small MSMEs using Vepari AI.

**Note on GST 2.0:** A major GST reform (informally called "GST 2.0") was enacted and notified effective September–October 2025. Where this document cites rate structures, it reflects the post-reform position unless explicitly noted. Both the pre-reform and post-reform structures are documented in §1 for completeness.

---

## Table of Contents

1. [GST Structure and Rate Slabs](#1-gst-structure-and-rate-slabs)
2. [GST Registration Thresholds](#2-gst-registration-thresholds)
3. [GST Composition Scheme](#3-gst-composition-scheme)
4. [GST Invoice Requirements](#4-gst-invoice-requirements)
5. [E-Invoicing (IRP) Mandate](#5-e-invoicing-irp-mandate)
6. [GST Return Filing Requirements](#6-gst-return-filing-requirements)
7. [GST TDS — Section 51 of CGST Act](#7-gst-tds--section-51-of-cgst-act)
8. [Income Tax TDS — Relevant Sections](#8-income-tax-tds--relevant-sections)
9. [MSME Classification Thresholds (April 2025)](#9-msme-classification-thresholds-april-2025)
10. [Bank Reconciliation Statement (BRS) Logic](#10-bank-reconciliation-statement-brs-logic)
11. [Implications for Vepari AI Accounting Engine](#11-implications-for-vepari-ai-accounting-engine)
12. [Open Questions for Phase 12](#12-open-questions-for-phase-12)
13. [Sources](#13-sources)

---

## 1. GST Structure and Rate Slabs

### 1.1 Pre-Reform Structure (Pre September 22, 2025)

The original GST structure had five primary slabs:

| Slab | Description |
|---|---|
| 0% | Nil-rated essential goods and exempted supplies |
| 5% | Basic necessities, agriculture inputs |
| 12% | Mid-range goods and services |
| 18% | Standard goods and services |
| 28% | Luxury and sin goods |

Special rates: 3% (gold and precious metals), 0.25% (rough diamonds and precious stones).

**Source:** ClearTax — GST Rate Finder [cleartax.in/s/gst-rates]

---

### 1.2 Post-Reform Structure (Effective September 22–October 1, 2025)

GST 2.0 reforms enacted and notified effective September 22, 2025 (rate changes) and October 1, 2025 (procedural changes). The 12% and 28% slabs have been effectively subsumed.

| Slab | Description | What moved here |
|---|---|---|
| **0%** | Nil-rated / Exempt | Retained: fresh produce, unprocessed grains, basic dairy, specified medicines, educational materials, lifesaving drugs |
| **5%** | Daily essentials, agriculture | Retained: hair oil, toothpaste, butter, ghee, tractor parts, solar cookers. Added: most goods that were formerly at 12% |
| **18%** | Standard rate (main slab) | Retained: most manufactured goods, electronics, furniture, metals, cement, machinery, higher-value textiles (>₹2,500). Added: some former 28% goods that moved down |
| **40%** | Sin goods and luxury (new rate) | Pan masala, aerated/caffeinated/carbonated beverages, gambling services, certain luxury vehicles, yachts, high-performance motorcycles (>350cc) |
| **3%** | Special: precious metals | Gold jewelry, precious metals (unchanged) |
| **0.25%** | Special: rough stones | Rough diamonds and precious gemstones (unchanged) |

**Key movements:**
- Former **12% goods** → primarily moved to **5%**
- Former **28% goods** → moved to either **18%** (general luxury) or **40%** (sin goods and highest-luxury)
- Small cars: formerly 28%, now 18%

**Source:** TaxGuru — GST 2.0 Major Reforms effective October 1, 2025 [taxguru.in/goods-and-service-tax/gst-2-0-major-gst-reforms-1-october-2025.html]; ClearTax — GST Rates 2026 [cleartax.in/s/gst-rates]

---

### 1.3 How GST Splits Between Centre and State

For intra-state transactions (supplier and customer in the same state):
- CGST (Central GST) = half the applicable slab rate
- SGST (State GST) = half the applicable slab rate

For inter-state transactions:
- IGST (Integrated GST) = full slab rate (collected by Centre, shared with the destination state)

This split is mechanical and mandatory — it is not configurable by the taxpayer.

**Source:** ClearTax — GST Structure [cleartax.in/s/gst-structure-india]

---

## 2. GST Registration Thresholds

Registration is mandatory once a business's aggregate annual turnover (AATO) crosses the applicable threshold.

### 2.1 Normal Category States (Most of India)

| Supply type | Threshold |
|---|---|
| Supply of **goods** | ₹40 lakh AATO |
| Supply of **services** | ₹20 lakh AATO |

### 2.2 Special Category States

Applies to: Arunachal Pradesh, Mizoram, Nagaland, Sikkim, Manipur, Meghalaya, Tripura, Uttarakhand, Himachal Pradesh, J&K.

| Supply type | Threshold |
|---|---|
| Supply of **goods** | ₹20 lakh AATO |
| Supply of **services** | ₹10 lakh AATO |

### 2.3 Voluntary Registration

Any business may register voluntarily below these thresholds (for ITC benefits or business credibility reasons).

**Relevance to Vepari AI:** The accounting engine must know the registration status of the business. Unregistered businesses generate Bills of Supply, not tax invoices. Registration status is a mandatory onboarding field.

**Source:** ClearTax — GST Registration Limits [cleartax.in/s/gst-registration-limits-increased]; IndiaFilings — GST Exemption Limit [indiafilings.com/learn/gst-exemption-limit-in-india]

---

## 3. GST Composition Scheme

### 3.1 Eligibility

Any GST-registered business with AATO below ₹1.5 crore may opt into the composition scheme.

| Category | Turnover ceiling |
|---|---|
| Goods manufacturers and traders | ₹1.5 crore AATO |
| Goods/services mixed suppliers | ₹1.5 crore AATO |
| Service-only providers (Section 10(2A)) | ₹50 lakh AATO |
| **Special category states** | ₹75 lakh AATO |

**How to opt in:** File CMP-02 on the GST portal by March 31 of the financial year preceding the year of adoption.

### 3.2 Composition Scheme Tax Rates (Fixed % on turnover, not on each sale)

| Business type | CGST | SGST | Total GST |
|---|---|---|---|
| Manufacturers and traders (goods) | 0.5% | 0.5% | **1%** |
| Restaurants (excluding alcohol) | 2.5% | 2.5% | **5%** |
| Other service providers | 3.0% | 3.0% | **6%** |

These rates apply on total turnover (not on profit). No ITC is available to offset this.

### 3.3 Restrictions on Composition Dealers

A composition dealer **cannot**:
- Claim Input Tax Credit (ITC)
- Make inter-state supplies (must sell only within the state)
- Supply through e-commerce operators
- Supply non-taxable goods (e.g., alcohol)
- Issue a GST tax invoice (must issue a "Bill of Supply" instead — no tax is collected from customers)

Composition dealers must display "Composition Taxable Person, not eligible to collect tax on supplies" on invoices/signboards.

**Relevance to Vepari AI:** The composition scheme significantly changes how the accounting engine must behave. Composition dealers do not record GST per transaction; they pay a fixed % quarterly on aggregate turnover. The invoice format is also different. This is a critical onboarding distinction.

**Source:** ClearTax — Composition Scheme [cleartax.in/s/gst-composition-scheme]; IndiaFilings — GST Composition Scheme [indiafilings.com/learn/gst-composition-scheme]

---

## 4. GST Invoice Requirements

### 4.1 Mandatory Invoice Fields (Tax Invoice)

A valid GST tax invoice must contain all of the following:

| Field | Requirement |
|---|---|
| Invoice number | Sequential, financial-year reset; no special characters except `-` and `/` |
| Invoice date | Date of issue |
| Supplier name | Legal business name |
| Supplier address | Registered address |
| Supplier GSTIN | 15-digit GSTIN |
| Recipient name | Name of buyer |
| Recipient address | Buyer's address |
| Recipient GSTIN | Required for B2B; optional for B2C |
| Place of supply | State name and code (determines CGST+SGST vs IGST) |
| HSN/SAC code | See §4.2 |
| Description of goods/services | Clear description |
| Quantity (goods) | Unit of measurement and quantity |
| Unit value | Per-unit price before tax |
| Total taxable value | Aggregate before tax |
| Discount (if any) | |
| Applicable GST rate | The slab rate (5%, 18%, etc.) |
| CGST amount | Tax broken out |
| SGST amount | Or IGST for inter-state |
| Total invoice value | Including all taxes |
| Whether tax payable on reverse charge | Yes/No |
| Signature or digital signature of supplier | |

**Source:** ClearTax — GST Invoice [cleartax.in/s/gst-invoice]; IndiaFilings — GST Invoice Fields [indiafilings.com/learn/what-should-a-gst-invoice-contain]

### 4.2 HSN and SAC Code Requirements

HSN (Harmonized System of Nomenclature) for goods; SAC (Services Accounting Code) for services. Requirements vary by turnover:

| Annual Aggregate Turnover (AATO) | B2B invoices | B2C invoices |
|---|---|---|
| Up to ₹5 crore | 4-digit HSN/SAC **mandatory** | 4-digit optional |
| Above ₹5 crore | 6-digit HSN/SAC **mandatory** | 6-digit **mandatory** |

**Note (Phase 3 GSTR-1 change, effective May 2025):** Table 12 of GSTR-1/1A now requires HSN summary to be separately declared for B2B and B2C supplies — these are no longer combined. Minimum 4 or 6 digit codes apply as above.

**Non-compliance penalty:** Up to ₹50,000 (₹25,000 each under CGST and SGST) under Section 125, and potential reversal of ITC for the buyer.

**Source:** IndiaFilings — HSN Code Invoice [indiafilings.com/learn/hsn-code-invoice]; ClearTax — Mandatory HSN Reporting [cleartax.in/s/mandatory-hsn-code-reporting-gstr1-1a]

---

## 5. E-Invoicing (IRP) Mandate

### 5.1 What Is E-Invoicing

E-invoicing under GST is not an invoice format — it is a process of reporting B2B invoices to the government's Invoice Registration Portal (IRP) and receiving a unique Invoice Reference Number (IRN) and QR code. The business then attaches the IRN/QR to their own invoice format.

E-invoicing is **not** required for:
- B2C (business-to-consumer) supplies
- Nil-rated / exempt supplies
- Non-taxable supplies
- Composition dealers

### 5.2 Current Mandatory Threshold

| AATO | E-invoice required? |
|---|---|
| **≥ ₹5 crore** | **Yes — mandatory for B2B** (effective August 1, 2023 for this threshold) |
| < ₹5 crore | Not required |

**Implication for Vepari AI's primary MSME user:** Most micro enterprises (AATO < ₹10 crore, and certainly < ₹5 crore) are **exempt from e-invoicing**. Small enterprises approaching ₹5 crore need it.

### 5.3 Time Limit for IRP Reporting (April 2025 Change)

| AATO | Time limit to report to IRP |
|---|---|
| **≥ ₹10 crore** | **30 days from invoice date** (effective April 1, 2025) |
| ₹5–10 crore | No strict time limit (must report but no deadline specified) |
| < ₹5 crore | Not applicable |

**Source:** ClearTax — E-Invoicing [cleartax.in/s/e-invoicing-gst]; IndiaFilings — Mandatory E-Invoicing [indiafilings.com/learn/mandatory-gst-e-invoicing-for-taxpayers-exceeds-threshold-limit-of-inr-5-crore]; TaxGuru — E-invoice reporting deadline [taxguru.in/goods-and-service-tax/e-invoice-reporting-deadline-reduced-aato-rs-10-crores.html]

---

## 6. GST Return Filing Requirements

### 6.1 Regular GST Taxpayers (AATO > ₹5 crore, or chose monthly filing)

| Return | Purpose | Due date |
|---|---|---|
| **GSTR-1** | Outward supplies details (sales) | 11th of following month |
| **GSTR-3B** | Summary return + tax payment | 20th of following month |

### 6.2 QRMP Scheme (Quarterly Return Monthly Payment) — AATO ≤ ₹5 crore

Available to businesses with AATO up to ₹5 crore. Files GSTR-1 and GSTR-3B quarterly but pays tax monthly via challan.

| Action | Due date |
|---|---|
| Monthly tax payment (IFF) | 13th of month 1 and month 2 of each quarter |
| GSTR-1 (quarterly) | 13th of month following end of quarter |
| GSTR-3B (quarterly) | 22nd or 24th of month following end of quarter (state-dependent) |

### 6.3 Composition Dealers

| Return | Purpose | Due date |
|---|---|
| **CMP-08** | Quarterly tax payment challan | 18th of month following quarter |
| **GSTR-4** | Annual return | 30th April of the following FY |

**Late filing penalty:** ₹50 per day (₹20 per day for nil returns) under GSTR-3B.

**July 2025 change:** Auto-populated liability in GSTR-3B has been hard-locked from the July 2025 tax period — businesses can no longer manually alter system-populated values.

**Source:** ClearTax — GSTR-1 [cleartax.in/s/gstr-1]; ClearTax — GSTR-3B [cleartax.in/s/gstr-3b]; IndiaFilings — GST Return Due Dates [indiafilings.com/gst-return-filing/due-dates]

---

## 7. GST TDS — Section 51 of CGST Act

### 7.1 Who Is Required to Deduct GST TDS

GST TDS under Section 51 of the CGST Act is **not a general MSME obligation** — it applies only to specific categories of buyers (deductors):

- Central government departments and agencies
- State government departments and agencies
- Local authorities
- Governmental authorities
- Public sector undertakings (PSUs)
- Entities where Central or State Government holds ≥ 51% equity

**Implication for Vepari AI:** The vast majority of Vepari AI's users are MSMEs acting as **suppliers** to government entities, not as deductors. They will see GST TDS as a deduction from their receivable — not as a deduction obligation.

### 7.2 When GST TDS Applies

- Applicable when a deductor makes payment under a **contract exceeding ₹2.5 lakh** (taxable value, excluding GST)
- Does **not apply** to exempt, nil-rated, or non-taxable supplies
- Does **not apply** if the supplier and the place of supply are in the same state but the deductor is in a different state (ITC would be ineligible)

### 7.3 GST TDS Rates

| Tax component | Rate |
|---|---|
| IGST (inter-state contract) | **2%** of taxable value |
| CGST (intra-state contract) | **1%** of taxable value |
| SGST (intra-state contract) | **1%** of taxable value |

The total effective rate is always 2% (either as 2% IGST or 1% CGST + 1% SGST).

### 7.4 Compliance by the Deductor

- Must register on the GST portal with a TDS-specific GSTIN (different from the regular GSTIN)
- Must file **GSTR-7** by the 10th of the following month
- Must issue a TDS certificate to the supplier
- The deducted amount appears in the supplier's electronic cash ledger

**Source:** ClearTax — TDS under GST [cleartax.in/s/tds-under-goods-and-service-tax]; TaxGuru — Section 51 CGST [taxguru.in/goods-and-service-tax/section-51-gst-act-deduction-tds-specified-persons.html]; CBIC Tax Information Portal [taxinformation.cbic.gov.in]

---

## 8. Income Tax TDS — Relevant Sections

### 8.1 Who Is EXEMPT From Deducting Income Tax TDS

Individuals and HUFs (Hindu Undivided Families) whose preceding year's AATO does **not exceed**:
- ₹1 crore (if engaged in business)
- ₹50 lakh (if engaged in a profession)

…are **NOT required to deduct TDS** under Sections 194C, 194H, 194I, or 194J — **except** under:
- Section 194IB (individual/HUF paying rent > ₹50,000/month) — TDS required regardless of turnover
- Section 194M (individual/HUF paying contractor/professional fees > ₹50 lakh in a FY) — TDS required

**Implication for Vepari AI:** Most micro enterprises (turnover well under ₹1 crore) are **exempt from deducting TDS** on their business payments under the main sections. The accounting engine should flag Section 194IB (rent) and 194M (high-value contractor) as the only TDS touchpoints for micro businesses.

### 8.2 TDS Rate Chart — Key Sections (FY 2026-27)

Under the **Income Tax Act, 2025** (effective April 1, 2026), TDS sections are renumbered under consolidated Sections 392–394. Cross-references to both old and new section numbers are provided below. Rates are unchanged from prior year in most cases.

| Payment type | Old section | New section (ITA 2025) | Threshold | Rate (Individuals/HUF) | Rate (Companies/others) |
|---|---|---|---|---|---|
| Contractor / sub-contractor payments | 194C | 393(1)[SI.6(i)] | ₹30,000 per contract **or** ₹1,00,000 per FY (cumulative) | **1%** | **2%** |
| Commission and brokerage | 194H | 393(1)[SI.1(ii)] | ₹20,000 per FY *(raised from ₹15,000 effective April 1, 2025)* | **2%** | **2%** |
| Rent — land or building | 194I(b) | 393(1)[SI.2(ii).D(b)] | ₹50,000 per month | **10%** | **10%** |
| Rent — plant and machinery | 194I(a) | 393(1)[SI.2(ii).D(a)] | ₹50,000 per month | **2%** | **2%** |
| Professional fees | 194J | 393(1)[SI.6(iii).D(b)] | ₹50,000 per FY | **10%** | **10%** |
| Technical services fees | 194J | 393(1)[SI.6(iii).D(a)] | ₹50,000 per FY | **2%** | **2%** |
| Purchase of goods from seller | 194Q | 393(1)[SI.8(ii)] | ₹50 lakh per FY (buyer's responsibility) | **0.1%** | **0.1%** |
| Rent paid by individual/HUF (any turnover) | 194IB | — | > ₹50,000 per month | **5%** | N/A |
| High-value contractor/professional by individual/HUF | 194M | — | > ₹50 lakh per FY | **5%** | N/A |
| Interest (bank deposits — others) | 194A | 393(1)[SI.5(iii)] | ₹10,000 per FY | **10%** | **10%** |
| Interest (bank deposits — senior citizens) | 194A | 393(1)[SI.5(ii).D(a)] | ₹1,00,000 per FY | **10%** | N/A |

### 8.3 Key Change: Income Tax Act, 2025 Section Renumbering

From April 1, 2026, the old section numbers (193, 194, 194A, 194C, etc.) are replaced by entries under Sections 392, 393, 394 of the Income Tax Act, 2025. **TDS rates are unchanged for most categories.** The critical compliance change is that deductors must use the **new section code** when depositing TDS through challans and filing returns (Form 26Q, now replaced by updated forms; Form 16 is replaced by Form 130 for employees).

### 8.4 TDS Under GST vs TDS Under Income Tax

These are two completely separate systems:

| Dimension | GST TDS (Sec 51 CGST) | Income Tax TDS |
|---|---|---|
| Governing law | CGST Act, 2017 | Income Tax Act, 1961 (now restated as ITA, 2025) |
| Who deducts | Government entities / PSUs | Any eligible payer above turnover threshold |
| What it's applied on | GST taxable value of supply | Payment amount |
| Rate | 2% flat | 0.1% to 10% depending on nature |
| Filed via | GSTR-7 | 26Q (now revised) |
| Credit mechanism | Supplier's GST cash ledger | Form 26AS / AIS of deductee |

**Source:** TaxGuru — TDS Rates FY 2026-27 [taxguru.in/income-tax/tds-rates-thresholds-fy-2026-27-effective-01-04-2026-income-tax-act-2025.html]; IndiaFilings — TDS Rule Changes 2025 [indiafilings.com/learn/tds-rule-changes-from-1st-april-2025]; ClearTax — TDS Rate Chart FY 2026-27 [cleartax.in/s/tds-rate-chart]; ClearTax — TDS and TCS changes April 2025 [cleartax.in/s/tds-and-tcs-changes-from-april-2025]; Income Tax India — TDS Rates [incometaxindia.gov.in/w/tds-rates-1]

---

## 9. MSME Classification Thresholds (April 2025)

Effective April 1, 2025, MSME classification limits were revised upward significantly.

| Enterprise type | Investment ceiling | Turnover ceiling |
|---|---|---|
| **Micro** | ≤ ₹2.5 crore | ≤ ₹10 crore |
| **Small** | ≤ ₹25 crore | ≤ ₹100 crore |
| **Medium** | ≤ ₹125 crore | ≤ ₹500 crore |

*Both investment AND turnover criteria must be satisfied. Classification uses whichever criterion results in the higher classification.*

**Relevance to GST and TDS thresholds:**
- Micro enterprises (turnover ≤ ₹10 crore) are almost universally below the GST registration threshold (₹40L goods, ₹20L services) — some will be unregistered
- Micro enterprises approaching ₹10 crore are well below the e-invoicing threshold (₹5 crore) — wait, some micro enterprises can approach that threshold; e-invoicing kicks in at ₹5 crore AATO regardless of MSME classification
- Micro-enterprise owners (individual/proprietorship) are almost always exempt from TDS deduction obligations (business turnover < ₹1 crore)
- Section 194IB (rent) and 194M are the **only TDS obligations** most micro businesses face

**Source:** TaxGuru — MSME Threshold Limit from April 2025 [taxguru.in/corporate-law/msme-threshold-limit-effective-1st-april-2025.html]

---

## 10. Bank Reconciliation Statement (BRS) Logic

### 10.1 Definition

A Bank Reconciliation Statement (BRS) is a document prepared to reconcile the difference between:
- The **bank column of the cash book** (business's own records of bank transactions)
- The **bank passbook / bank statement** (the bank's records of the same account)

The two records should agree — differences arise from timing and recording differences, not from actual discrepancies in funds.

**Purpose:** Detect unrecorded transactions, timing mismatches, bank errors, and bookkeeping errors. Mandatory for audit-readiness and financial accuracy.

**Source:** ClearTax — Bank Reconciliation Statement [cleartax.in/s/bank-reconciliation-statement]

### 10.2 Standard Reconciling Items (Why Cash Book ≠ Bank Statement)

**Category A — Timing Differences (most common)**

| Item | Effect on cash book | Effect on bank statement |
|---|---|---|
| **Un-presented cheques** (issued and entered in cash book but not yet presented to the bank by the payee) | Cash book already shows the debit | Bank has not paid yet — still shows higher balance |
| **Un-credited deposits** (deposited by business but bank has not yet processed) | Cash book already shows the credit | Bank has not credited yet — still shows lower balance |
| **Standing orders / direct debits** (bank auto-debits for EMI, insurance, subscriptions — business hasn't recorded) | Not yet in cash book | Already on bank statement |
| **Direct credits** (customer payments received directly into account — business hasn't recorded) | Not yet in cash book | Already on bank statement |

**Category B — Bank-Initiated Entries (business must record)**

| Item | Description |
|---|---|
| Bank interest credited | Bank adds interest but business hasn't booked it |
| Bank charges / service fees | Bank debits fees but business hasn't recorded |
| Dishonored cheques | Bank reverses deposit that was previously booked by business |
| ECS/NACH debit | Auto-debit by bank not recorded by business |

**Category C — Errors**

| Item | Description |
|---|---|
| Cash book error | Business recorded wrong amount or wrong account |
| Bank error | Bank debited/credited wrong account (rare but happens) |

### 10.3 BRS Reconciliation Equation

Two valid starting-point formats; both reach the same result:

**Format 1: Start from Cash Book Balance**

```
Balance as per Cash Book (adjusted)
+ Cheques issued but not yet presented to bank (un-presented)
- Cheques deposited but not yet credited by bank (un-credited)
+ Bank charges not yet recorded in cash book
- Interest/direct credits not yet recorded in cash book
± Correction of errors
= Balance as per Bank Statement
```

**Format 2: Start from Bank Statement Balance**

```
Balance as per Bank Statement
+ Cheques deposited but not yet credited (un-credited)
- Cheques issued but not yet presented (un-presented)
- Bank charges not yet in cash book
+ Interest/direct credits not yet in cash book
± Correction of errors
= Balance as per Cash Book (adjusted)
```

### 10.4 Automated Matching Algorithm Requirements

For Vepari AI's BRS automation, industry practice across Zoho Books, Tally, and ClearTax identifies the following matching logic layers:

**Layer 1 — Exact Match**
- Match by: amount + date (same day or within a tolerance window)
- If unique exact match found → auto-reconcile with high confidence

**Layer 2 — Near Match (Tolerance Window)**
- Date tolerance: typically ±3 to ±7 days (covers banking processing delays)
- Amount tolerance: ₹1 flat tolerance for rounding differences (documented industry practice)
- Reference match: if bank narration contains invoice/cheque number, use it as a primary key

**Layer 3 — Fuzzy / Description Match**
- NLP or fuzzy string matching on bank narration against payee names in the ledger
- Handles abbreviated names, truncated NEFT/RTGS references (bank reference numbers in narrations)
- "1:many" matching — one bank statement entry may need to match multiple small ledger entries (or vice versa)

**Layer 4 — Human Review Queue**
- Un-matched entries after Layers 1–3 go to a review queue
- System should show "possible matches" ranked by confidence
- User confirms or rejects suggested match
- No auto-reconciliation for amounts above a configurable threshold without confirmation

**Specific handling for Indian banking context:**
- NEFT/RTGS/IMPS narrations contain reference numbers (UTR numbers) — extract and use as reconciliation keys
- UPI transactions carry a UPI transaction ID — primary matching key
- Cheque-based payments require: cheque number matching in narration, amount, date within clearing window (typically 3 business days)
- Bank charges often appear as: "NEFT charges," "RTGS charges," "SMS charges," "Min balance fee" — classify separately from business transactions
- Salary/payroll payments to multiple employees often appear as a single bank debit — requires splitting against individual salary records

**Source:** ClearTax — Bank Reconciliation Statement [cleartax.in/s/bank-reconciliation-statement]; Zoho Books — Bank Reconciliation [zoho.com/in/books/accounting-software/bank-reconciliation/]; TallyHelp — Account Reconciliation [help.tallysolutions.com/article/Tally.ERP9/Auditor_Edition/India/Statutory_Audit/Account_Reconciliation.htm]; ClearTax — AI in Invoice Reconciliation 2026 [cleartax.in/s/ai-invoice-reconciliation]

---

## 11. Implications for Vepari AI Accounting Engine

This section summarizes what the research findings mean for the accounting engine (TRD §28). These are research implications, not decisions. Decisions happen in Phase 12.

### 11.1 Required Business Profile Data (Onboarding)

The accounting engine requires the following business profile data before it can behave correctly:

| Data field | Why needed |
|---|---|
| GST registration status (registered / unregistered / composition) | Determines invoice type, rate display, ITC tracking |
| GSTIN | Required on every B2B invoice |
| State (registered address state) | Determines CGST+SGST vs IGST split; special category state threshold |
| Annual aggregate turnover band | Determines HSN digit requirement, e-invoicing obligation, QRMP eligibility |
| GST return filing frequency (monthly / quarterly / composition) | Drives return reminder calendar |
| Business type (goods / services / mixed) | Affects composition eligibility and rates |
| PAN | Required for TDS 194Q tracking (purchases > ₹50L) |

### 11.2 Accounting Behavior Branches

The engine will need to branch on at least four distinct operating modes:

| Mode | Trigger | Key difference |
|---|---|---|
| **Unregistered** | AATO < threshold, not registered | No GST on invoices, no GSTR filing, no ITC |
| **Regular GST** | AATO > threshold, not composition | Tax invoice with full GST breakout, ITC tracking, GSTR-1+3B |
| **Composition GST** | AATO < ₹1.5 crore, opted in | Bill of Supply only, no ITC, quarterly CMP-08 + annual GSTR-4 |
| **E-invoice required** | AATO ≥ ₹5 crore, regular taxpayer | B2B invoices must get IRN from IRP before sharing with customer |

### 11.3 GST 2.0 Rate Table (What the Engine Needs to Store)

After GST 2.0 (September 22, 2025), the applicable rates are: 0%, 5%, 18%, 40%, 3% (gold), 0.25% (diamonds). The 12% and 28% slabs no longer apply to new invoices. The engine must store the GST slab per product/service (linked to HSN/SAC code) and apply the correct rate.

### 11.4 TDS Applicability Logic

For most Vepari AI micro-business users (proprietorships, individuals, small firms with turnover < ₹1 crore):
- No TDS obligation on contractor, commission, rent (general), or professional fee payments
- **Exception 1 — Section 194IB (rent):** If paying rent > ₹50,000/month, 5% TDS is required even if under the turnover threshold
- **Exception 2 — Section 194M:** If paying contractor or professional fees > ₹50 lakh in a year, 5% TDS applies

For small businesses with turnover ≥ ₹1 crore: full TDS obligations apply on all relevant sections.

The engine must flag 194IB and 194M as triggered events rather than assume no TDS applies for all micro businesses.

### 11.5 BRS Engine Design Implications

- BRS must be a periodic operation (monthly is standard, but weekly or real-time could be offered)
- Input: bank statement (CSV/OFX/PDF — most Indian banks export in these formats) + accounting ledger
- Matching requires: exact-amount + near-date layer, then fuzzy narration layer
- Indian banking specifics: UTR numbers, UPI transaction IDs, cheque numbers are primary keys
- A "₹1 tolerance" for rounding is industry-standard and should be configurable
- Cheques: clearing window of 3 business days is the standard gap
- Unmatched entries must surface to the business owner for resolution — not auto-discarded

### 11.6 GST TDS (Section 51) — Supplier Side

When a Vepari AI user supplies goods/services to a government entity and has GST TDS deducted:
- The deduction appears in their GST electronic cash ledger
- The accounting engine must be able to record "GST TDS receivable" or "GST TDS credited" as a recognized accounting event
- The supplier does not file GSTR-7 — that is the deductor's obligation

---

## 12. Open Questions for Phase 12

The following questions are not answerable from publicly available rules alone and must be decided by the product team or legal/tax counsel before Phase 12 implementation:

| # | Question | Context |
|---|---|---|
| 12.1 | Should the engine fully implement ITC tracking for regular GST taxpayers, or provide a simplified view? | Full ITC (Input Tax Credit) tracking requires GSTR-2B matching — significant complexity |
| 12.2 | Which GST returns should the engine assist with filing? GSTR-1, GSTR-3B, GSTR-4, or summary only? | Full filing requires GST portal API integration (GSTN Sandbox) |
| 12.3 | What is the scope of TDS support? Log TDS deducted at source, or actively calculate/guide TDS obligations? | Full TDS support is a separate module; see TRD §28 scope |
| 12.4 | Should the accounting engine handle the 40% sin goods slab post-GST 2.0, or note it is out of scope for MSME users? | Likely out of scope — few MSMEs supply sin goods |
| 12.5 | What bank statement import formats will be supported at Phase 12 (CSV, OFX, PDF)? | PDF requires OCR; CSV/OFX are structured |
| 12.6 | Should the engine support e-invoicing (IRP API integration) for users crossing ₹5 crore? | This is a GSTN API integration — separate scope item |
| 12.7 | How will the engine handle businesses that transition from unregistered → composition → regular across their growth journey? | Migration of historical data and scheme changes |
| 12.8 | Will the engine support the new Income Tax Act 2025 section numbers from April 1, 2026, or will it use old section numbers? | Old sections are no longer valid from FY 2026-27 |
| 12.9 | What is the engine's GST TDS recording model — for sellers who have GST TDS deducted by their government buyers? | Must surface in reconciliation and cash flow views |

---

## 13. Sources

All research fetched or searched on **2026-08-31**.

| Area | Source | URL |
|---|---|---|
| GST Rate Structure (pre-reform) | ClearTax | https://cleartax.in/s/gst-rates |
| GST 2.0 reforms Oct 2025 | TaxGuru | https://taxguru.in/goods-and-service-tax/gst-2-0-major-gst-reforms-1-october-2025.html |
| GST 2.0 new slabs | TaxGuru | https://taxguru.in/goods-and-service-tax/gst-mega-reforms-india-rates-slabs-key-2025.html |
| GST Structure (CGST/SGST/IGST) | ClearTax | https://cleartax.in/s/gst-structure-india |
| GST Registration Limits | ClearTax | https://cleartax.in/s/gst-registration-limits-increased |
| GST Exemption Limit | IndiaFilings | https://www.indiafilings.com/learn/gst-exemption-limit-in-india |
| GST Composition Scheme | ClearTax | https://cleartax.in/s/gst-composition-scheme |
| Composition Scheme Rates | IndiaFilings | https://www.indiafilings.com/learn/gst-composition-scheme |
| GST Turnover Limits | IndiaFilings | https://www.indiafilings.com/learn/gst-turnover-limit |
| GST Invoice Mandatory Fields | ClearTax | https://cleartax.in/s/gst-invoice |
| HSN/SAC Code Invoice Requirements | IndiaFilings | https://www.indiafilings.com/learn/hsn-code-invoice |
| Mandatory HSN Reporting GSTR-1 Phase 3 | ClearTax | https://cleartax.in/s/mandatory-hsn-code-reporting-gstr1-1a |
| E-Invoicing Guide | ClearTax | https://cleartax.in/s/e-invoicing-gst |
| E-Invoicing (5 crore) | ClearTax | https://cleartax.in/s/e-invoicing-businesses-above-rs-5-crore-turnover |
| E-Invoicing (10 crore 30-day limit) | IndiaFilings | https://www.indiafilings.com/learn/gst-einvoice-30-day-rule-10crore-turnover |
| E-Invoice Reporting Deadline | TaxGuru | https://taxguru.in/goods-and-service-tax/e-invoice-reporting-deadline-reduced-aato-rs-10-crores.html |
| GSTR-1 | ClearTax | https://cleartax.in/s/gstr-1 |
| GSTR-3B | ClearTax | https://cleartax.in/s/gstr-3b |
| GST Return Due Dates | IndiaFilings | https://www.indiafilings.com/gst-return-filing/due-dates |
| GST Calendar 2026-27 | ClearTax | https://cleartax.in/s/gst-calendar |
| GST TDS Section 51 | ClearTax | https://cleartax.in/s/tds-under-goods-and-service-tax |
| GST TDS Section 51 | TaxGuru | https://taxguru.in/goods-and-service-tax/section-51-gst-act-deduction-tds-specified-persons.html |
| CBIC CGST Section 51 | CBIC | https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_CGST_act/active/chapter10/section51_v1.00.html |
| TDS Rates FY 2026-27 (ITA 2025) | TaxGuru | https://taxguru.in/income-tax/tds-rates-thresholds-fy-2026-27-effective-01-04-2026-income-tax-act-2025.html |
| TDS Rate Chart (FY 2026-27) | ClearTax | https://cleartax.in/s/tds-rate-chart |
| TDS Rule Changes April 2025 | IndiaFilings | https://www.indiafilings.com/learn/tds-rule-changes-from-1st-april-2025 |
| TDS Changes April 2025 | ClearTax | https://cleartax.in/s/tds-and-tcs-changes-from-april-2025 |
| Income Tax Act 2025 TDS Overview | TaxGuru | https://taxguru.in/income-tax/income-tax-act-2025-tds-rates-thresholds-compliance-ty-2026-27.html |
| Income Tax India — Official TDS Rates | Income Tax India | https://www.incometaxindia.gov.in/w/tds-rates-1 |
| Income Tax Act 2025 (Official) | Income Tax India | https://www.incometaxindia.gov.in/income-tax-act-2025 |
| Section 194H TDS Commission | IndiaFilings | https://www.indiafilings.com/learn/section-194h-tds-on-commission-and-brokerage |
| MSME Thresholds April 2025 | TaxGuru | https://taxguru.in/corporate-law/msme-threshold-limit-effective-1st-april-2025.html |
| BRS Definition and Logic | ClearTax | https://cleartax.in/s/bank-reconciliation-statement |
| BRS Automated Matching | Zoho Books | https://www.zoho.com/in/books/accounting-software/bank-reconciliation/ |
| BRS — Tally Account Reconciliation | TallyHelp | https://help.tallysolutions.com/article/Tally.ERP9/Auditor_Edition/India/Statutory_Audit/Account_Reconciliation.htm |
| AI Invoice Reconciliation 2026 | ClearTax | https://cleartax.in/s/ai-invoice-reconciliation |

---

*End of accounting compliance research. Document date: 2026-08-31. Not a product decision document. All figures subject to change if regulations are amended. Phase 12 product decisions take precedence.*
