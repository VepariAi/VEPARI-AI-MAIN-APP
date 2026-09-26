# Journey Map — Customers & Suppliers

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `App Flow.txt §39–41`; `UI-UX.txt §48–53`

---

## Purpose

This document maps the journeys for two symmetric contact modules — **Customers** and **Suppliers** — covering list/search, detail view, add, and edit flows. It gives special attention to:

- Credit limit and due-balance displays on detail screens
- How AI insights surface inside the detail screen without requiring a separate navigation step (UI-UX §51)

Customers and Suppliers share the same structural pattern. Section differences are noted inline.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `App Flow.txt` | §39 (Customer flow), §40 (Add Customer), §41 (Supplier flow) |
| `UI-UX.txt` | §48 (Customers — List), §49 (Customer — Detail), §50 (Add Customer), §51 (Customer AI), §52 (Suppliers — List), §53 (Supplier — Detail) |
| `docs/ux/screen-inventory.md` | Canonical screen IDs |
| `docs/ux/ai-action-confirmation-ux.md` | AI action card rules |
| `docs/ux/offline-sync-state-language.md` | Sync indicators |

---

## 1. Shared Navigation Path — Both Modules

```
Module entry (bottom tab: More → Customers / Suppliers)
  ↓
Customers.List  (or Suppliers.List)
  ↓
[Search / Filter]
  ↓
Customers.Detail  (or Suppliers.Detail)
  ↓
[Branch: Add / Edit / Transactions / Payments / AI insights (inline)]
```

---

## 2. Customers — List Screen (`Customers.List`)

### Entry points

| Source | How |
|--------|-----|
| More drawer | Tap "Customers" |
| Home AI card | AI briefing item links directly to customer |
| Push notification | Overdue payment alert → `Customers.Detail` |
| Search (global) | Customer name matched → `Customers.Detail` |

### Screen structure

```
┌─────────────────────────────────────────────────┐
│ ← Customers                        [+ Add]      │
│ ──────────────────────────────────────────────  │
│ 🔍  Search customers                            │
│ ──────────────────────────────────────────────  │
│ Filter: [All ▾]  [Outstanding ▾]  [Recent ▾]    │
│ ──────────────────────────────────────────────  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Priya Textiles                          [→] │ │
│ │ Last sale: 3 days ago · ₹2,400 outstanding  │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Sharma Traders                          [→] │ │
│ │ Last sale: today · ₹0 outstanding           │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Ramesh Kumar                            [→] │ │
│ │ New customer · ₹6,500 outstanding           │ │
│ └─────────────────────────────────────────────┘ │
│                         [+ Add customer]        │
└─────────────────────────────────────────────────┘
```

**Each row:**
- Customer name (primary)
- Last transaction date / "New customer" for first-purchase within 30 days
- Outstanding balance — ₹0 shown as "₹0 outstanding" (not hidden); red if overdue > 7 days

**Filter chips:**
- All / Outstanding / Recent activity / New customers / High value

**Empty state:** "No customers yet — add your first customer to start tracking sales."

**Search behavior:** Live filter on name, phone, GSTIN. Minimum 2 characters before results update.

---

## 3. Customer Detail Screen (`Customers.Detail`)

### Structure

```
┌──────────────────────────────────────────────────┐
│ ← Customers                    [Edit]  [⋮ More]  │
│                                                  │
│  [Avatar / initials]                             │
│  Priya Textiles                                  │
│  +91 98765 43210 · priya@textiles.in             │
│  GSTIN: 27AAAAA0000A1Z5 (if provided)            │
│                                                  │
│ ┌──────────────────┐  ┌────────────────────────┐ │
│ │  Outstanding     │  │  Credit Limit          │ │
│ │  ₹2,400          │  │  ₹10,000               │ │
│ │  (2 invoices)    │  │  24% used              │ │
│ └──────────────────┘  └────────────────────────┘ │
│                                                  │
│  [New Sale]  [Add Payment]  [Send Reminder]      │
│                                                  │
│ ──────────────── AI Insights ──────────────────  │
│  ┌──────────────────────────────────────────┐    │
│  │ 📊 Payment behavior                      │    │
│  │ Pays within 8 days on average.           │    │
│  │ Last 3 invoices: 5, 9, 10 days.          │    │
│  │                           [See details]  │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │ 🛒 Purchase pattern                      │    │
│  │ Buys Amul 5 kg every 10–12 days.         │    │
│  │ Last purchase: 11 days ago. Due soon?    │    │
│  │                       [Create sale →]   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│ ──────────────── Transactions ─────────────────  │
│  [Sale ₹2,400 · 3 days ago →]                   │
│  [Sale ₹1,800 · 10 days ago →]                  │
│  [See all transactions →]                       │
│                                                  │
│ ──────────────── Payments ─────────────────────  │
│  [Payment ₹4,000 · 15 days ago →]               │
│  [See all payments →]                           │
│                                                  │
│ ──────────────── Activity ─────────────────────  │
│  [Credit limit changed: ₹8,000 → ₹10,000 · you] │
│  [Sale recorded by Meena · 3 days ago]           │
└──────────────────────────────────────────────────┘
```

### 3.1 Outstanding Balance Display

| Field | Content | Notes |
|-------|---------|-------|
| Outstanding | Total receivable across all open invoices | Red if any invoice overdue ≥ 7 days |
| Invoice count | "(N invoices)" beneath amount | Tapping navigates to filtered Transactions list |
| Credit Limit | Credit limit set on customer profile | "Not set" if no limit configured |
| Usage bar | Percentage of credit limit consumed | Shown only if credit limit is set; orange >75%, red >100% |
| Over-limit warning | "Over credit limit by ₹X" | Banner above actions if outstanding > credit limit |

**Credit limit exceeded state:**

```
⚠ Over credit limit by ₹400
   Outstanding: ₹10,400 · Limit: ₹10,000
   [Record payment]  [Adjust limit]
```

### 3.2 AI Insights — Inline (No Separate Navigation)

AI insights appear as an expandable card section inside `Customers.Detail`. The owner never navigates away to see them — they are embedded in the same screen.

**What the AI surfaces (UI-UX §51):**

| Insight type | Example | Source |
|---|---|---|
| Payment behavior | "Pays within 8 days on average — last 3 invoices: 5, 9, 10 days" | Payment records in local SQLite |
| Purchase pattern | "Buys Amul 5 kg every 10–12 days. Last purchase 11 days ago" | Sales records, recurring pattern detection |
| Outstanding balance | Displayed as a data field (not an AI insight card) | Ledger total |
| Important activity | "2nd-largest customer by revenue this quarter" | Analytics comparison |

**Fact vs. recommendation rule (UI-UX §51):** The AI must clearly distinguish facts from recommendations:

- **Fact** (grey card, no action shortcut): "Pays within 8 days on average."
- **Recommendation** (accent card, action shortcut): "Due for a purchase — last bought 11 days ago. Create sale?" + `[Create sale →]`

A recommendation with no supporting evidence from real data must not appear (Rule B3 from `briefing-prioritization.md`).

**AI insight card anatomy:**
```
┌─────────────────────────────────────────────┐
│ [icon] [Insight type label]                 │
│ [One-sentence fact]                         │
│ [Supporting detail, ≤ 2 lines]              │
│ [Action shortcut, if recommendation]  [→]  │
└─────────────────────────────────────────────┘
```

**Collapsed/expanded behavior:**
- Default: top 2 insights visible; "See N more insights" expands inline
- No navigation away from `Customers.Detail` to see any insight
- Tapping an action shortcut (e.g. "Create sale") navigates to `Sales.NewSale` with customer pre-filled

### 3.3 Action Buttons

| Button | Action | AI OS state triggered |
|--------|--------|----------------------|
| New Sale | Navigate to `Sales.NewSale` (customer pre-filled) | None |
| Add Payment | Navigate to `Payments.AddPayment` (customer pre-filled) | None |
| Send Reminder | AI action card: "Send payment reminder to Priya Textiles for ₹2,400?" | ROUTINE → single confirm |
| Edit | Navigate to `Customers.Edit` | None |
| More (⋮) | Delete customer / Export / Merge | DESTRUCTIVE for delete |

---

## 4. Add Customer (`Customers.Add`)

### Journey

```
[+ Add customer] (FAB or header button)
  ↓
Customers.Add
  Step 1: Basic information
    · Name (required)
    · Business type (Individual / Company)
    · GSTIN (optional — validated format)
  ↓
  Step 2: Contact details
    · Phone (required for WhatsApp reminders)
    · Email (optional)
    · WhatsApp number (pre-filled from phone; editable)
  ↓
  Step 3: Address
    · Street, City, State, PIN code
    · State used for GST (CGST+SGST vs IGST)
  ↓
  Step 4: Additional information
    · Credit limit (₹ amount; "No limit" if left blank)
    · Default discount %
    · Tags / Group (e.g., "Wholesale", "Retail")
    · Notes
  ↓
  [Save]
  ↓
Customers.Detail (newly created)
  · Success toast: "Customer added"
  · Sync indicator: Synced / Saved locally (offline)
```

**Offline behavior:** Form is fully usable offline. On Save, record writes to local SQLite and enters the sync queue. The new customer is immediately visible in `Customers.List` with a "Saved locally" indicator.

**Voice / AI pre-fill:** If the user says "Add Priya Textiles, phone 9876543210" in the Voice tab, the AI pre-fills name and phone. The owner reviews and edits before saving.

---

## 5. Edit Customer (`Customers.Edit`)

**Entry:** Tap [Edit] in `Customers.Detail`.

**Same form as Add Customer** with fields pre-populated from the existing record. All fields are editable.

**Constraints:**
- GSTIN change is logged in the Activity section (audit trail)
- Credit limit reduction below current outstanding shows a warning: "Outstanding balance (₹2,400) exceeds new limit (₹2,000). Proceed?"
- Deleting a customer with an open outstanding balance requires the owner to first record a zero-out payment or mark it as a write-off

**Sync on save:** Follows local-first pattern — writes to SQLite immediately, queues cloud sync. If a conflict is detected (another device edited the same customer), Financial Rule F2 applies: the owner must review the conflict. Non-financial field conflicts (address, notes) can be auto-merged.

---

## 6. Suppliers — List Screen (`Suppliers.List`)

Structure mirrors `Customers.List`. Differences:

| Element | Customers | Suppliers |
|---------|-----------|-----------|
| Balance shown | Outstanding receivable | Outstanding payable |
| Color cue | Red for overdue receivable | Amber for payable due soon |
| Secondary info | "Last sale · ₹X outstanding" | "Last purchase · ₹X payable" |
| Filters | Outstanding / Recent / New | Payable / Recent / High-spend |

---

## 7. Supplier Detail Screen (`Suppliers.Detail`)

Structure mirrors `Customers.Detail`. Differences:

### Key information block

```
┌──────────────────┐  ┌──────────────────────────┐
│  Payable         │  │  Credit (from supplier)  │
│  ₹8,400          │  │  ₹25,000 limit           │
│  (1 invoice)     │  │  34% used                │
└──────────────────┘  └──────────────────────────┘
```

- **Payable:** Total amount owed to the supplier (sum of open purchase invoices)
- **Supplier credit:** Credit extended by the supplier — mirrors the customer credit-limit concept in reverse
- **Overdue payable:** Amber banner if payable is past due date

### Action buttons

| Button | Action |
|--------|--------|
| New Purchase | Navigate to `Purchases.NewPurchase` (supplier pre-filled) |
| Add Payment | Navigate to `Payments.AddPayment` (supplier pre-filled, direction = outgoing) |
| Call / WhatsApp | Initiate call or WhatsApp with supplier contact |

### AI Insights — Inline

Same inline pattern as `Customers.Detail`. Supplier-specific insight types:

| Insight type | Example |
|---|---|
| Purchase pattern | "You purchase Amul 5 kg from this supplier every 12–15 days. Last order: 13 days ago." |
| Price trend | "Tata Salt 5 kg price has increased 3% over the last 4 purchases." |
| Payment behavior | "You typically pay this supplier within 5 days. Current invoice is 3 days old." |
| Outstanding activity | "2 invoices totalling ₹8,400 have been open for more than 7 days." |

---

## 8. Add / Edit Supplier (`Suppliers.Add`, `Suppliers.Edit`)

Same flow as Add/Edit Customer. Supplier-specific fields:

| Field | Notes |
|-------|-------|
| Supplier type | Manufacturer / Distributor / Retailer / Service |
| GSTIN | Required for GST input credit |
| Supplier credit limit | Credit extended to this business by the supplier |
| Payment terms | Net 15 / Net 30 / Cash on delivery / Custom days |
| Bank details | For NEFT/RTGS payments |

---

## 9. Shared Patterns

| Pattern | Customers | Suppliers |
|---------|-----------|-----------|
| Write-local-first | ✓ | ✓ |
| Offline add/edit | ✓ | ✓ |
| AI voice pre-fill | ✓ | ✓ |
| AI insights inline | ✓ | ✓ |
| Fact vs. recommendation distinction | ✓ | ✓ |
| Sync status on save | ✓ | ✓ |
| Financial conflict → owner review | ✓ | ✓ |
| Audit trail on sensitive changes | ✓ | ✓ |
| Permission-aware action buttons | ✓ | ✓ |

---

## 10. Universal States Applied

| Screen | Loading | Empty | Error | Offline | Conflict |
|--------|:-------:|:-----:|:-----:|:-------:|:--------:|
| `Customers.List` | ✓ (initial load) | ✓ ("No customers yet") | ✓ | ✓ | — |
| `Customers.Detail` | ✓ | — | ✓ | ✓ | ✓ (credit limit edited on two devices) |
| `Customers.Add` | — | — | ✓ | ✓ (save locally) | — |
| `Customers.Edit` | ✓ | — | ✓ | ✓ | ✓ |
| `Suppliers.List` | ✓ | ✓ | ✓ | ✓ | — |
| `Suppliers.Detail` | ✓ | — | ✓ | ✓ | ✓ |
| `Suppliers.Add` | — | — | ✓ | ✓ | — |
| `Suppliers.Edit` | ✓ | — | ✓ | ✓ | ✓ |

---

## 11. Acceptance Criteria Verification

| Criterion (Prompt 27) | Met? | Evidence |
|---|:---:|---|
| List/search/detail/add/edit for Customers | ✓ | §2, §3, §4, §5 |
| List/search/detail/add/edit for Suppliers | ✓ | §6, §7, §8 |
| Credit-limit display | ✓ | §3.1, §7 |
| Due-balance display | ✓ | §3.1, §7 |
| AI insights inside detail without separate navigation | ✓ | §3.2, §7 |
| Fact vs. recommendation distinction (UI-UX §51) | ✓ | §3.2 |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Payment recording journey | `docs/ux/journey-related-transactions.md` §3 |
| Sale transaction journey | `docs/ux/journey-sale-transaction.md` |
| AI action confirmation pattern | `docs/ux/ai-action-confirmation-ux.md` |
| Offline sync state language | `docs/ux/offline-sync-state-language.md` |
| Screen canonical IDs | `docs/ux/screen-inventory.md` |
