# Journey Map — Sale Transaction

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/offline-sync-state-language.md` (Prompt 20), `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `App Flow.txt §46–48`; `UI-UX.txt §61–64`

---

## Purpose

This document maps the complete journey for recording a sale — from customer selection through cart, pricing, payment, review, confirmation, and receipt. Both the **online-success path** and the **offline-queued path** are fully specified. A sale is the highest-frequency transaction in the application; every step must be optimized for speed and reliability regardless of connectivity.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `App Flow.txt` | §46 (sales flow), §47 (sale result — what updates), §48 (sale offline) |
| `UI-UX.txt` | §61 (New Sale UI — step sequence), §62 (cart content spec), §63 (payment screen), §64 (sale completion) |
| `docs/ux/offline-sync-state-language.md` | Sync state indicators at each post-save step |
| `docs/ux/ai-action-confirmation-ux.md` | Confirmation pattern for AI-initiated sales |
| `docs/ux/screen-inventory.md` | Canonical screen IDs |

---

## 1. Entry Points

A new sale can be started from five locations:

| Entry point | Screen | Path |
|---|---|---|
| Home Quick Action | `Home.Home` → [Add Sale] | Skips Sales.Overview and Sales.List |
| Transactions tab | `Sales.Overview` → [+ New Sale] | Standard path |
| More drawer Quick Action | More drawer header → [Add Sale] | Same as Home Quick Action |
| AIOS voice command | `AIOS.Voice` → "Add a sale" / "New sale" | AI extracts customer + items from voice; pre-fills cart |
| AIOS action card | `AIOS.Actions` → AI-proposed sale | Pre-filled from AI recommendation; follows confirmation pattern |

All entry points converge on `Sales.NewSale` as the first distinct screen.

---

## 2. Complete Journey — Online-Success Path

```
[Entry point]
  ↓
Sales.NewSale                          [Step 1: Customer selection]
  ↓
Sales.Cart                             [Step 2: Products + quantities]
  ↓
Sales.Payment                          [Step 3: Payment method + amount]
  ↓
Sales.Review                           [Step 4: Full review before confirm]
  ↓
[Confirm]
  ↓
[Cloud write — sale record created]    [Loading state ≤ 2 s]
  ↓
Sales.Receipt                          [Step 5: Confirmation + receipt]
  ↓
[Optional: Share / New Sale / Done]
```

---

## 3. Step-by-Step Detail — Online Path

### Step 1 — Sales.NewSale: Customer Selection

```
Screen: Sales.NewSale

Layout:
  Search bar (autofocused)
  ↓
  [Recent customers — scrollable row]
    [Ravi Kumar]  [Sharma Traders]  [Priya Stores]  [+ more]
  ↓
  [All customers — scrollable list]
    [Amit Singh]       Last sale 3 days ago · ₹4,200 outstanding
    [Balu Medical]     Last sale today
    [+ Add new customer]   ← inline shortcut
```

**Customer selection variants:**

| Selection | Behavior |
|---|---|
| Tap a customer from list | Customer pre-selected; proceed to Sales.Cart |
| Search by name/phone | Filtered list; tap to select |
| Tap "+ Add new customer" | Inline customer creation (name + phone minimum) → auto-selected → proceed to cart |
| Skip customer ("Walk-in sale") | Customer = anonymous walk-in; no credit tracking for this sale |

**Walk-in sale note:** The "Walk-in / Cash customer" option allows recording a sale without a linked customer profile. Tax, payment, and receipt features all work identically; the sale appears in reports under "Walk-in" and cannot be tracked against a customer's history.

---

### Step 2 — Sales.Cart: Products and Quantities

```
Screen: Sales.Cart

Header:
  Customer: [Ravi Kumar]  [Change]
  [Add Product]  [Scan Barcode]  [Search]

Cart line items (dynamic):
  ┌─────────────────────────────────────────────────────────┐
  │ Amul Butter 500g                                        │
  │ ₹280.00 × [2] = ₹560.00        [−] [qty field] [+]    │
  │ Discount: ₹0  Tax: 5% GST = ₹28.00                     │
  ├─────────────────────────────────────────────────────────┤
  │ Tata Salt 1kg                                           │
  │ ₹22.00 × [5] = ₹110.00         [−] [qty field] [+]    │
  │ Discount: ₹0  Tax: 0% (exempted)                        │
  └─────────────────────────────────────────────────────────┘

  Subtotal:     ₹670.00
  Discount:     ₹0
  Tax (GST):    ₹28.00
  ─────────────────────
  Total:        ₹698.00

Footer CTA: [Proceed to Payment →]
```

**Cart contents (per `UI-UX §62`):**
- Product name
- Unit price (editable — owner can override for this sale)
- Quantity (integer; fractional for weight-based products)
- Line discount (amount or %)
- GST rate and calculated amount per line
- Line subtotal

**Adding products:**
- Tap "Add Product" → opens Products.List in selection mode
- Scan barcode → matches product (or shows "Product not found — add it?")
- AI voice: "Add 5 kg rice at ₹60 per kg" → AI adds line item; owner confirms

**Editing quantities:**
- Tap [−] / [+] buttons or tap the quantity field to type directly
- Setting quantity to 0 removes the item (with a brief undo snack: "Item removed — Undo")

**Cart-level discount:**
- Optional; applied after line discounts
- Amount or percentage; displayed separately from line discounts

---

### Step 3 — Sales.Payment: Payment Method and Amount

```
Screen: Sales.Payment

Total due: ₹698.00

Payment method (select one or split):
  [● Cash]   [○ UPI]   [○ Card]   [○ Credit]   [○ Cheque]

Amount received:
  ₹ [698] (pre-filled to exact total)

  [If Cash] Change: ₹0.00
  [If Credit / partial] Remaining balance: ₹0

Confirm: [Next — Review →]
```

**Payment method variants:**

| Method | Fields shown |
|---|---|
| Cash | Amount received (editable); Change = received − total |
| UPI | UPI reference / transaction ID (optional; for audit) |
| Card | Amount only (no POS integration in MVP) |
| Credit | Amount partially or fully on credit; remaining added to customer's outstanding |
| Cheque | Cheque number + bank (for audit) |
| Split payment | Two methods simultaneously (e.g., ₹500 Cash + ₹198 UPI) |

**Partial payment (credit):**
```
Total: ₹698
Amount received: ₹500 [edited]
Remaining on credit: ₹198   [shown in real-time]

Customer's new outstanding: ₹4,200 + ₹198 = ₹4,398
```
Partial payment is not an error state — it is a valid, intentional selection. The remaining amount is added to the customer's outstanding receivable.

---

### Step 4 — Sales.Review: Full Review Before Confirm

```
Screen: Sales.Review

REVIEW YOUR SALE

Customer:         Ravi Kumar
Items:            2 items (Amul Butter 500g × 2, Tata Salt 1kg × 5)
Subtotal:         ₹670.00
Discount:         ₹0
GST:              ₹28.00
Total:            ₹698.00
Payment:          Cash — ₹698.00
Change:           ₹0.00

[Edit sale ←]                     [Confirm sale →]
```

This screen is read-only. Every field is visible before the write happens. The owner can tap "Edit sale" to return to any previous step.

**Rule:** No database write occurs until the owner taps "Confirm sale." This is the AI action confirmation principle from `docs/ux/ai-action-confirmation-ux.md` applied to manual sales: the record is never written before explicit confirmation.

---

### Step 5 — Confirmation and Sale.Receipt (Online)

```
[Owner taps "Confirm sale"]
  ↓
Loading state: "Saving your sale…" (spinner — ≤ 2 s)
  ↓
[Write to local SQLite first — immediate]
  ↓
[Write to cloud via API — background]
  ↓
Success state: "Sale saved ✓"
  ↓
Sales.Receipt
```

**Sales.Receipt content:**

```
Screen: Sales.Receipt

  SALE COMPLETE  ✓

  Receipt #: VPR-2026-00142
  Date: 1 Sep 2026, 11:42 AM
  Customer: Ravi Kumar

  Amul Butter 500g × 2          ₹560.00
  Tata Salt 1kg × 5             ₹110.00
  ─────────────────────────────
  Subtotal                      ₹670.00
  GST (5%)                       ₹28.00
  Total                         ₹698.00
  Cash paid                     ₹698.00
  Change                          ₹0.00

  Sync status: Synced ✓         [shown for 3 s, then hides]

  [Share receipt]  [New sale]  [Done]
```

**Post-confirmation system updates (App Flow §47):**

After a successful save, the following records are updated:
- Sales ledger (new sale record)
- Inventory (stock reduced by sold quantities)
- Customer balance (outstanding updated for credit sales)
- Finance engine (revenue reflected)
- Analytics context (AI updates business understanding)
- Audit log (full audit trail per `docs/ux/ai-action-confirmation-ux.md §16-field audit trail`)

**Sync status on receipt:**
- If cloud write completed: shows "Synced ✓" for 3 seconds, then hides
- If cloud write pending: shows "Syncing…" (animated icon)
- If offline: shows "Saved locally — will sync when online"

---

## 4. Offline-Queued Path

When the device has no network at the moment of sale confirmation, the offline path kicks in. The sale is recorded locally and queued for cloud sync. The user experience must be indistinguishable from the online path except for the sync indicator.

### Offline path sequence

```
[Owner taps "Confirm sale"]
  ↓
[Network unavailable — detected before write attempt]
  ↓
Write to local SQLite — immediate (same as online)
  ↓
Mark sale for sync: state = QUEUED
  ↓
Success state: "Sale saved ✓"  ← identical wording; no error shown
  ↓
Sales.Receipt (offline variant)
```

### Sales.Receipt — Offline variant

```
Screen: Sales.Receipt (offline)

  SALE COMPLETE  ✓

  Receipt #: VPR-2026-00142
  [same receipt content as online variant]

  Sync status: 🕐 Saved locally — will sync when connected
               [clock-outline icon, colors.warning]

  [Share receipt]  [New sale]  [Done]
```

The key rule from `docs/ux/offline-sync-state-language.md` Rule F5: for financial records, "Synced" state is never shown until the cloud write is confirmed. The offline receipt shows "Saved locally" and will not show "Synced" until the sync queue processes this record and the cloud acknowledges it.

### Offline path — what still works

| Feature | Offline behavior |
|---|---|
| Recording the sale | Works — saved to local SQLite |
| Inventory deduction | Works — local SQLite updated immediately |
| Customer balance update | Works — local SQLite updated; synced later |
| Receipt display | Works — generated from local data |
| Receipt sharing (WhatsApp/email) | Requires connectivity — button is active but send fails gracefully: "Will send when connected" option shown |
| GST invoice generation | Works — generated locally; transmitted when online |

### Offline sync resolution

When connectivity returns, the background sync queue processes the queued sale:

```
Network restored
  ↓
Sync queue worker processes QUEUED sale
  ↓
Cloud write attempt
  ↓
  [Success]                            [Failure]
       ↓                                    ↓
  State: SYNCED                      State: FAILED
  SyncIndicator: "Synced ✓" (3 s)    SyncIndicator: "Sync failed — tap to retry"
  InlineSyncBadge: hidden             InlineSyncBadge: ⚠ "Failed" (persistent)
```

If the user has the Sales.Receipt open when sync resolves, the sync badge updates in place — no reload required.

---

## 5. AI-Initiated Sale (Voice / AIOS.Actions)

When the AI initiates a sale via voice command or recommendation, the same journey applies with these differences:

### Voice-initiated sale

```
AIOS.Voice — user says:
  "Sell 3 kg sugar and 2 litres mustard oil to Priya Stores"
  ↓
AI extracts:
  Customer: Priya Stores (matched to existing customer)
  Items: Sugar 3 kg (matched to product) + Mustard Oil 2L (matched)
  ↓
AI OS state: THINKING → RESPONDING → ACTION_REQUIRED
  ↓
AI presents pre-filled Sales.Cart for review:
  Customer: Priya Stores ✓
  Sugar 3kg × 1     ₹180.00  [AI assumed 3 kg as one 3-kg unit — verify]
  Mustard Oil 2L × 2  ₹240.00
  Total: ₹420.00
  ↓
"Does this look right?"
  [Edit]   [Yes, continue →]
  ↓
[Owner taps "Yes"] → Sales.Payment (continues normal path)
```

**AI extraction failures:**
- Product not found: "I couldn't find 'refined oil' — which one did you mean?" [dropdown from matching products]
- Customer ambiguous: "I found 3 customers named Priya — which one?" [short list]
- Quantity unclear: "How many kg of sugar?" [voice or type]

### AI action card (AIOS.Actions)

The AI action confirmation pattern from `docs/ux/ai-action-confirmation-ux.md` applies:
- Action card shown with: action_type_label = "Record sale", affected_records, expected_result, impact_level = "ROUTINE" (for standard sales amounts) or "SIGNIFICANT" (for amounts ≥ ₹10,000)
- Owner approves → AI OS state: EXECUTING → COMPLETED → Sales.Receipt

---

## 6. GST Handling

GST rates are applied per product line based on the product's HSN/SAC code:

| GST slab | Applied to |
|---|---|
| 0% | Essential goods (flour, rice, pulses, etc.) — exempt |
| 5% | Common goods (edible oils, tea, coffee, etc.) |
| 18% | Most manufactured goods, services |
| 40% | Luxury / sin goods (tobacco, luxury items) |

**GST calculation in cart:**
- Applied per line item (not on the total)
- Intra-state: CGST 50% + SGST 50% of GST rate
- Inter-state: IGST = full GST rate
- State determination: from owner's registered state (set in Onboarding.Location) vs customer's state (from Customers.Detail address)

**GST display in cart:** Tax is shown as a line item per product and as a total at the bottom. The cart never hides tax inside the price ("₹280 + ₹14 GST" — not "₹294 inclusive").

**GSTIN field on receipt:**
- If owner is GST-registered: receipt shows owner's GSTIN, state code, and "Tax Invoice" heading
- If owner is unregistered: receipt is a "Bill of Supply" (no GSTIN on receipt)

---

## 7. Edge Cases and Error Handling

| Scenario | Handling |
|---|---|
| Product out of stock during sale | Warning shown at cart: "Basmati Rice: 0 in stock — proceed anyway?" (sale still recordable; inventory will go negative, flagged for correction) |
| Price override below cost price | Warning: "This price is below your cost price. Continue?" (allowed, but noted) |
| Sale amount ≥ ₹10,000 (SIGNIFICANT) | If triggered via AI, confirmation uses two-step pattern per `docs/ux/ai-action-confirmation-ux.md` |
| Confirm tapped twice (double-tap) | Second tap ignored — idempotent submit; UI shows "Saving…" after first tap |
| App backgrounded during Review | Draft preserved; on return "Resume your sale?" prompt shown; "Sales.Review" restored |
| App backgrounded during Loading (saving) | Write completes in background; on return app checks if write succeeded and shows receipt or error |
| Cloud write fails (online) | Automatic retry (3× at 2s/4s/8s); on 3 failures: falls back to offline-queued path silently; sync indicator shows "Queued" |
| Duplicate sale detection | If identical (same customer + same items + same total) within 2 minutes: "You recorded an identical sale 1 minute ago. Is this a new sale?" [Yes, new sale] [No, cancel] |

---

## 8. Screen × Step Mapping

| Step | Screen canonical ID | Online path | Offline path |
|---|---|:---:|:---:|
| Customer selection | `Sales.NewSale` | ✓ | ✓ |
| Cart (products + qty + discount + tax) | `Sales.Cart` | ✓ | ✓ |
| Payment method + amount | `Sales.Payment` | ✓ | ✓ |
| Review | `Sales.Review` | ✓ | ✓ |
| Confirm + save | _(loading state on Review)_ | ✓ | ✓ (local only) |
| Receipt | `Sales.Receipt` | ✓ (Synced) | ✓ (Queued/Saved locally) |

---

## 9. Acceptance Criteria Verification

| Criterion (Prompt 25) | Met? | Evidence |
|---|:---:|---|
| Customer → Products → Cart → Pricing → Discount → Tax → Payment → Review → Confirm → Receipt | ✓ | §3 (steps 1–5) |
| App Flow §46–48 covered | ✓ | §2–5 |
| UI-UX §61–64 covered | ✓ | §3 (steps 1–5) |
| Offline branch fully specified | ✓ | §4 |
| Online-success path fully specified | ✓ | §2–3 |
| Offline-queued path fully specified | ✓ | §4 |
| Matches Screens.png "Add Sale" content | ✓ | §3 (customer, cart, payment, receipt structure) |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Related transaction journeys (Expense, Purchase, Payment, partial payment) | `docs/ux/journey-related-transactions.md` (Prompt 26) |
| Sync state indicators (Saved locally / Queued / Syncing / Synced / Failed) | `docs/ux/offline-sync-state-language.md` (Prompt 20) |
| AI action confirmation pattern | `docs/ux/ai-action-confirmation-ux.md` (Prompt 19) |
| Screen canonical IDs | `docs/ux/screen-inventory.md` (Prompt 21) |
| GST slabs and compliance | `docs/research/accounting-compliance.md` |
