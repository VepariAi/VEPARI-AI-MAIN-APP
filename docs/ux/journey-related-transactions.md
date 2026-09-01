# Journey Map — Related Transaction Journeys

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/offline-sync-state-language.md` (Prompt 20), `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `App Flow.txt §49–53`

---

## Purpose

This document maps three transaction journeys that relate to and extend the core Sale journey (`docs/ux/journey-sale-transaction.md`): **Expense**, **Purchase**, and **Payment**. The Payment journey includes a dedicated section for **partial payment** — a distinct branch that is not a simplification of the full-payment path but a separate, intentional flow with its own downstream effects.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `App Flow.txt` | §49 (expense flow), §50 (purchase flow), §51 (purchase result), §52 (payment flow), §53 (partial payment) |
| `UI-UX.txt` | §65–66 (expenses UI), §67–68 (purchases UI) |
| `docs/ux/offline-sync-state-language.md` | Sync state indicators — same rules apply as sale |
| `docs/ux/journey-sale-transaction.md` | Reference patterns (cart, payment, review, receipt) — these journeys reuse those patterns where applicable |
| `docs/ux/screen-inventory.md` | Canonical screen IDs |

---

## Journey 1 — Expense

An expense records money the business has spent: rent, utilities, raw materials, petty cash, staff costs.

### 1.1 Entry Points

| Entry point | Path |
|---|---|
| Home Quick Action | `Home.Home` → [Add Expense] → `Expenses.Add` |
| Transactions tab | `Expenses.Overview` → [+ Add] → `Expenses.Add` |
| More drawer | More → Transactions section → Expenses → [+ Add] |
| AIOS voice | "Add an expense — ₹2,000 electricity bill" → AI pre-fills form |
| AIOS action card | AI-proposed expense from receipt photo or pattern |

### 1.2 Online-Success Path

```
Expenses.Add

Step 1 — Amount
  ₹ [amount field, autofocused]
  Currency: INR (fixed)

Step 2 — Category
  [Rent]  [Utilities]  [Raw Materials]  [Staff]  [Travel]  [Other]
  Sub-category (optional, e.g., "Electricity" within Utilities)

Step 3 — Vendor / Paid to
  [Search existing suppliers / vendors]
  [Or: type vendor name — saves as informal vendor, not a full Supplier record]
  [Walk-in / petty cash] ← option for cash expenses with no vendor

Step 4 — Payment method
  [Cash]  [UPI]  [Bank transfer]  [Card]

Step 5 — Attachment (optional)
  [Camera — capture receipt photo]
  [Gallery — attach existing image]
  [Skip]

Step 6 — Date
  Default: today
  [Change date] — for entering a past expense

Step 7 — Notes (optional)
  [Free text — 200 chars]

  ──────────────────────────────────────
  [Review →]
```

```
Expenses review panel (inline — no separate screen for Micro):
  Amount: ₹2,000
  Category: Utilities / Electricity
  Vendor: Chennai Electricity Board
  Payment: Cash
  Date: 1 Sep 2026

  [Save expense]
  ↓
[Write to local SQLite → background cloud write]
  ↓
Success: "Expense saved ✓"
  ↓
Expenses.Detail (or back to Expenses.List depending on entry point)
```

### 1.3 Offline Path

Identical to the sale offline path. The expense is written locally and queued:

```
[Save expense tapped — no network]
  ↓
Local SQLite write (immediate)
  ↓
State: QUEUED
InlineSyncBadge on Expenses.Detail: 🕐 "Queued"
  ↓
[Network restores] → sync queue → cloud write → SYNCED
```

### 1.4 System Updates After Save (`App Flow §49` analog)

- Expenses ledger (new expense record)
- Finance engine (expense reflected in P&L)
- Supplier balance if expense linked to a formal Supplier
- Cash position (if Cash payment method — reduces cash on hand)
- AI context (AI updates expense patterns)
- Audit log

### 1.5 GST on Expenses

If the business is GST-registered and the expense is GST-applicable, the expense form shows:
- GST type: Input credit eligible / Not eligible
- GST amount (calculated from total amount + rate)
- Vendor GSTIN (optional — required for ITC claim)

GST fields are hidden if the business is unregistered (set in Onboarding.Configuration).

### 1.6 Edge Cases

| Scenario | Handling |
|---|---|
| Duplicate expense (same amount + vendor + date within 5 min) | "You recorded ₹2,000 to this vendor today. Is this a new expense?" [Yes, new] [Cancel] |
| Amount is 3× or more above category average | Inline note: "This is higher than your usual [Utilities] expense — is that right?" (not a blocker) |
| Attachment upload fails (offline) | Photo stored locally, uploaded when online; detail shows "Receipt pending upload" |
| Date set in future | Validation: "Expense date cannot be in the future" |

---

## Journey 2 — Purchase

A purchase records goods or services bought from a supplier, typically updating inventory.

### 2.1 Entry Points

| Entry point | Path |
|---|---|
| Purchases.Overview → [+ New] | Standard path |
| Inventory.LowStock → [Reorder action] | Pre-fills supplier + product from low-stock item |
| More drawer | More → Transactions → Purchases → [+ New] |
| AIOS voice | "Record a purchase — 50 kg rice from Kumar Traders for ₹4,500" |
| Supplier.Detail → [+ New Purchase] | Pre-fills supplier; user selects products |

### 2.2 Online-Success Path

```
Purchases.NewPurchase

Step 1 — Supplier
  [Search suppliers]
  [+ Add new supplier] ← inline, minimum: name + phone
  Selected: Kumar Traders

Step 2 — Items purchased
  [Add items] → opens Products.List in selection mode
  Per item:
    Product: Basmati Rice 25kg sack
    Quantity: 2 sacks
    Cost price: ₹2,250 per sack
    GST: 5%
    Line total: ₹4,500 + ₹225 GST = ₹4,725
  [Add another item]

Step 3 — Total review
  Items: 2 × Basmati Rice 25kg          ₹4,500.00
  GST:                                    ₹225.00
  ─────────────────────────────────────
  Total:                                ₹4,725.00

Step 4 — Payment
  [Pay now: Cash / UPI / Bank]  [Pay later: Credit / Partial]

Step 5 — Date and reference
  Invoice / Bill date: [today default]
  Supplier invoice number: [optional — for bill matching]

  ──────────────────────────────────────
  [Review →]
```

```
Purchases.Review (inline for Small tier, standalone for Medium+):
  Supplier: Kumar Traders
  Items: 2 items
  Total: ₹4,725.00
  Payment: Cash

  [Confirm purchase]
  ↓
[Local SQLite write → background cloud write]
  ↓
Success: "Purchase saved ✓"
  ↓
Purchases.Detail
```

### 2.3 System Updates After Save (`App Flow §51`)

- Purchase record in purchases ledger
- Inventory: stock quantities increased by purchased quantities
- Cost price updated (weighted average or FIFO, per configuration)
- Supplier balance updated
- Finance engine (expense/COGS reflected)
- AI context (purchase patterns updated)
- Audit log

### 2.4 Offline Path

Same pattern as Sale offline path. Key difference: inventory update happens locally immediately. When cloud sync completes, the authoritative stock level is reconciled. If a conflict exists (stock was modified both locally and by a team member), the Conflict state appears on Inventory.Stock per `docs/ux/offline-sync-state-language.md`.

### 2.5 Generate Purchase Order (PO)

A purchase can optionally generate a Purchase Order before the goods arrive:

```
Purchases.NewPurchase → [Generate PO instead]
  ↓
PO created (Documents.PurchaseOrders)
  ↓
[Goods received later] → PO → [Convert to Purchase] → Purchases.Detail
```

The PO → Purchase conversion pre-fills all fields from the PO; the owner confirms receipt and payment.

### 2.6 Edge Cases

| Scenario | Handling |
|---|---|
| Product in purchase not in Products list | "This product isn't in your list — add it?" [Add + continue] [Cancel] |
| Purchase quantity reduces existing negative stock | System corrects stock to 0 + net received; note shown in Inventory.History |
| Supplier not in Suppliers list | Inline "Add supplier" with minimum fields; full profile can be completed later |

---

## Journey 3 — Payment

A payment records money received from a customer (receivable) or paid to a supplier (payable). It may be linked to one or more existing transactions (invoices, sales) or recorded as a standalone advance.

### 3.1 Entry Points

| Entry point | Path |
|---|---|
| Payments.List → [+ Add] | Generic payment — user selects customer or supplier |
| Customers.Detail → [Record payment] | Pre-filled with customer; outstanding invoices shown |
| Suppliers.Detail → [Record payment] | Pre-filled with supplier; outstanding bills shown |
| Sales.Receipt → outstanding balance link | Customer and sale pre-filled |
| AIOS voice | "Ramesh paid ₹5,000 — mark it" → AI identifies customer, pre-fills |
| AIOS action card | AI-suggested follow-up on overdue payment |

### 3.2 Full-Payment Path (Online)

```
Payments.Add

Step 1 — Direction
  [Received from customer ↓]   [Paid to supplier ↑]

Step 2 — Party
  [Search customers / suppliers]
  Selected: Amit Singh (customer)
  Outstanding: ₹8,400 across 3 invoices

Step 3 — Amount received
  ₹ [8,400 — pre-filled to full outstanding]

Step 4 — Payment method
  [Cash]  [UPI]  [Bank transfer]  [Cheque]

Step 5 — Allocation (applies to outstanding invoices)
  Invoice #VPR-142  ₹3,200  →  ₹3,200 allocated  ✓
  Invoice #VPR-138  ₹3,000  →  ₹3,000 allocated  ✓
  Invoice #VPR-131  ₹2,200  →  ₹2,200 allocated  ✓
  ─────────────────────────────────────────
  Total:  ₹8,400  (fully covers all outstanding)

Step 6 — Date and reference
  Date: [today]
  UPI reference: [optional]

  ──────────────────────────────────────
  [Confirm payment]
  ↓
[Local write → cloud write]
  ↓
"Payment recorded ✓ — Amit Singh: ₹0 outstanding"
  ↓
Payments.Detail
```

### 3.3 Partial-Payment Path (Distinct Branch)

Partial payment is not a simplified version of full payment — it is a distinct flow with its own allocation logic and downstream tracking. `App Flow §53` mandates that partial payment handling is shown explicitly.

```
Payments.Add

Step 1–2: Same as full-payment path (direction + party)

Step 3 — Amount received: PARTIAL
  Outstanding: ₹8,400
  ₹ [5,000] ← owner enters a partial amount

  Remaining after payment: ₹3,400
  ← displayed in real-time as user types

Step 4 — Payment method: same

Step 5 — Allocation (partial: must decide how to apply ₹5,000)

  [Auto-allocate: oldest first]   [Manual allocation]

  === If auto-allocate chosen ===
  Invoice #VPR-131  ₹2,200  →  ₹2,200 fully paid  ✓
  Invoice #VPR-138  ₹3,000  →  ₹2,800 partial (₹200 remaining on this invoice)
  Invoice #VPR-142  ₹3,200  →  ₹0 (unpaid — no payment left to allocate)
  Total allocated: ₹5,000

  === If manual allocation chosen ===
  Owner enters how much to apply to each invoice:
  Invoice #VPR-142  ₹3,200  →  ₹ [3,200]  fully paid
  Invoice #VPR-138  ₹3,000  →  ₹ [1,800]  partial
  Invoice #VPR-131  ₹2,200  →  ₹ [0]      unpaid
  Remaining balance:              ₹3,400

Step 6 — Date and reference: same

  ──────────────────────────────────────
  [Confirm partial payment]
  ↓
[Local write → cloud write]
  ↓
"₹5,000 payment recorded — ₹3,400 still outstanding from Amit Singh"
  ↓
Payments.Detail (shows allocation + remaining)
```

**Downstream effects of partial payment:**

```
After partial payment saved:
  Invoice #VPR-142: status → PAID ✓
  Invoice #VPR-138: status → PARTIALLY PAID (₹200 remaining)
  Invoice #VPR-131: status → UNPAID (unchanged)

Customer balance: ₹8,400 → ₹3,400 outstanding

Finance.Receivables: updated (Amit Singh: ₹3,400 due)
AI briefing next session: "Amit Singh — ₹3,400 still outstanding"
```

**Overpayment handling:**

```
Amount received: ₹9,000  (> outstanding of ₹8,400)
  ↓
"This payment is ₹600 more than the outstanding balance."
  ┌─────────────────────────────┬──────────────────────────────┐
  │ Record as advance           │ Record exact outstanding only │
  │ (₹600 credited to           │ (return ₹600 to customer)    │
  │ customer account)           │                               │
  └─────────────────────────────┴──────────────────────────────┘
```

### 3.4 Supplier Payment Path

Recording a payment to a supplier follows the same structure with direction reversed:

```
Direction: [Paid to supplier ↑]
Party: Kumar Traders
Outstanding bills: ₹4,725 (Purchase #P-0041)
Amount paid: ₹4,725 (full)
Payment method: Bank transfer
Reference: NEFT ref number (optional)

[Confirm payment]
  ↓
"₹4,725 payment recorded — Kumar Traders: ₹0 outstanding"
```

Supplier payments follow the same partial-payment logic when paying less than the outstanding bill.

### 3.5 Standalone Advance Payment

An advance (no linked invoice) is allowed:

```
Direction: Received from customer
Party: Priya Textiles (new customer — no existing invoices)
Outstanding: ₹0

"No outstanding invoices for Priya Textiles.
 Recording as advance payment."

Amount: ₹10,000 (advance)
  ↓
[Confirm]
  ↓
Customer balance: −₹10,000 (credit — customer is in advance)
  ↓
When future sale is invoiced, advance is auto-allocated as partial payment
```

### 3.6 Offline Path for Payments

```
[Confirm payment — no network]
  ↓
Local write (immediate)
  ↓
State: QUEUED
Customer outstanding: updated locally (₹8,400 → ₹3,400 in local SQLite)
  ↓
[Network restores] → cloud sync
  ↓
Conflict possible: if the same customer's balance was updated by a team
member or from another device between the offline save and the cloud sync.
  ↓
[Conflict state] → Payments.Detail shows:
  "This payment conflicts with a recent change — tap to review"
  (Per Rule F2 from docs/ux/offline-sync-state-language.md:
   financial conflicts never auto-resolved; owner must review)
```

---

## Journey 4 — Returns and Refunds

Returns and refunds are not part of `App Flow §49–53` but are listed in §239 as top-level screens. They are documented here for completeness.

### 4.1 Returns

```
Sales.Receipt (historical sale)
  ↓
  [Return items]

Returns.Returns
  Step 1: Select sale
  Step 2: Select items to return (all or partial)
  Step 3: Quantity returned
  Step 4: Reason (required: Defective / Wrong item / Customer changed mind / Other)
  Step 5: Review
  Step 6: Confirm
  ↓
Return approved:
  Inventory: returned items added back to stock
  Customer balance: credit note issued or refund process begins
```

### 4.2 Refunds

```
Returns.Returns (return approved)
  ↓
Refunds.Refunds
  Refund amount: ₹[calculated from returned items]
  Refund method:
    [Same as original payment]  [Cash]  [Credit to account]
  ↓
Confirm refund
  ↓
Finance: refund recorded
Customer balance: updated
Inventory: updated
Audit: logged
```

---

## Summary: Shared Patterns Across All Three Journeys

| Pattern | Sale | Expense | Purchase | Payment |
|---|:---:|:---:|:---:|:---:|
| Write local first | ✓ | ✓ | ✓ | ✓ |
| Offline-queued fallback | ✓ | ✓ | ✓ | ✓ |
| No write before confirm | ✓ | ✓ | ✓ | ✓ |
| Sync status on completion screen | ✓ | ✓ | ✓ | ✓ |
| Duplicate detection | ✓ | ✓ | ✓ | ✓ |
| AI voice pre-fill | ✓ | ✓ | ✓ | ✓ |
| Audit log entry | ✓ | ✓ | ✓ | ✓ |
| Partial / split variant | Partial payment only | — | Pay later only | ✓ (core branch) |
| Conflict on sync | — | — | Inventory conflict possible | ✓ (financial conflict — manual only) |

---

## Acceptance Criteria Verification

| Criterion (Prompt 26) | Met? | Evidence |
|---|:---:|---|
| Expense flow detailed | ✓ | Journey 1 (§1.1–1.6) |
| Purchase flow detailed | ✓ | Journey 2 (§2.1–2.6) |
| Payment flow detailed | ✓ | Journey 3 (§3.1–3.4) |
| Partial payment as distinct branch | ✓ | §3.3 — full path separate from §3.2 |
| Partial payment downstream effects shown | ✓ | §3.3 (invoice status + customer balance + Finance.Receivables + AI briefing) |
| Offline path covered for all three | ✓ | §1.3, §2.4, §3.6 |
| App Flow §49–53 covered | ✓ | All sections |
| Partial payment not folded into happy path | ✓ | §3.3 is its own subsection |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Sale transaction journey | `docs/ux/journey-sale-transaction.md` (Prompt 25) |
| Sync state indicators | `docs/ux/offline-sync-state-language.md` (Prompt 20) — Rule F2 (financial conflicts manual-only) |
| AI action confirmation pattern | `docs/ux/ai-action-confirmation-ux.md` (Prompt 19) |
| Screen canonical IDs | `docs/ux/screen-inventory.md` (Prompt 21) |
| Finance.Receivables / Finance.Payables | `docs/ux/screen-inventory.md §15` |
