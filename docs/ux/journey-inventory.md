# Journey Map — Inventory

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `App Flow.txt §43–45`; `UI-UX.txt §56–59`; `PRD.txt §16`

---

## Purpose

This document maps the Inventory module journeys:

1. Overview → Stock → Low Stock / Out of Stock
2. Stock Adjustment — a distinct write flow with reason capture
3. Stock Transfer — a distinct write flow with source/destination and reason

**PRD §16 key principle:** Inventory is based on **stock movements**, not simply an editable number. Every change to stock quantity is recorded as an immutable movement event with a reason. The running balance is derived from those movements.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `App Flow.txt` | §43 (Inventory flow), §44 (Stock Adjustment), §45 (Stock Transfer) |
| `UI-UX.txt` | §56 (Inventory Home), §57 (Low-Stock Experience), §58 (Stock Adjustment), §59 (Stock Transfer) |
| `PRD.txt` | §16 (Inventory features — movement-based stock) |
| `docs/ux/screen-inventory.md` | Canonical screen IDs |
| `docs/ux/briefing-prioritization.md` | Stock alert briefing categories |

---

## 1. Inventory Overview (`Inventory.Overview`)

### Entry points

| Source | How |
|--------|-----|
| More drawer | Tap "Inventory" |
| Home AI card | Low-stock or stock-out briefing item |
| AI briefing | "[3 products below reorder level] → View stock" |
| AI voice | "Show me my inventory" → `Inventory.Overview` |

### Screen structure

```
┌─────────────────────────────────────────────────┐
│ ← Inventory                      [+ Adjust]    │
│                                                 │
│ ── Stock Health ──────────────────────────────  │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │  In stock  │ │  Low stock │ │  Out of     │ │
│  │    142     │ │     7      │ │  stock  3   │ │
│  │  products  │ │  products  │ │  products   │ │
│  └────────────┘ └────────────┘ └─────────────┘ │
│                                                 │
│ [▶ 3 out-of-stock products need attention]      │
│                                                 │
│ ── Low Stock ─────────────────────────────────  │
│  Amul 5 kg          8 units · min 12 [Adjust→] │
│  Tata Salt          5 units · min 10 [Adjust→] │
│  Bournvita 500g     2 units · min 5  [Adjust→] │
│  [See all 7 low-stock products]                 │
│                                                 │
│ ── All Products ──────────────────────────────  │
│  [Search products]                              │
│  Amul 5 kg         8 units  [→]                │
│  Tata Salt         5 units  [→]                │
│  Rice (Basmati)   42 units  [→]                │
│                                                 │
│ ── Locations ─────────────────────────────────  │
│  Main Store · Warehouse A [Transfer →]          │
│                                                 │
│ ── Recent Activity ───────────────────────────  │
│  [Sale: Amul 5 kg × 2 · 2 hrs ago]             │
│  [Adjustment: +10 Tata Salt · yesterday]        │
│  [Transfer: 5 Bournvita → Warehouse A · today] │
└─────────────────────────────────────────────────┘
```

**Stock Health chips** are tappable — they navigate to a filtered `Inventory.Stock` list.

---

## 2. Stock List (`Inventory.Stock`)

**Filter context:** Arrived from Overview (All / Low Stock / Out of Stock chip).

```
┌────────────────────────────────────────────────┐
│ ← Stock                    [Filter ▾] [Sort ▾] │
│ 🔍  Search products                            │
│ ──────────────────────────────────────────────  │
│ [All]  [Low stock]  [Out of stock]  [In stock] │
│                                                │
│  Amul 5 kg            8 units  [Adjust] [→]   │
│  ⚠ Below reorder level (min: 12)              │
│                                                │
│  Tata Salt 1 kg       5 units  [Adjust] [→]   │
│  ⚠ Below reorder level (min: 10)              │
│                                                │
│  Basmati Rice 5 kg    0 units  [Adjust] [→]   │
│  🔴 Out of stock                              │
└────────────────────────────────────────────────┘
```

**Row anatomy:**
- Product name + variant (if any)
- Current quantity
- Status badge: "⚠ Below reorder level" / "🔴 Out of stock" / (none for healthy)
- [Adjust] shortcut → `Inventory.Adjustment` pre-filled for that product
- [→] arrow → `Inventory.ProductStock` (stock detail for that product)

---

## 3. Low-Stock / Out-of-Stock Experience (`Inventory.LowStock`)

```
Inventory.LowStock (reached via AI briefing or "See all low-stock products")
  ↓
Filter: low stock OR out of stock (tab switcher)
  ↓
For each product:
  · Product name
  · Current quantity
  · Preferred / minimum stock level
  · AI recommendation: "Reorder before [date] based on usage rate"
  · [Adjust stock] → Inventory.Adjustment
  · [Create purchase] → Purchases.NewPurchase (supplier + product pre-filled)
```

**AI recommendation cards in Low-Stock view:**

```
┌─────────────────────────────────────────────────┐
│  Amul Gold 5 kg                                 │
│  Current: 8 units  ·  Minimum: 12               │
│                                                 │
│  📊 Usage: ~4 units/day (last 30 days)          │
│  ⏱  Runs out in ~2 days at current rate         │
│                                                 │
│  [Adjust stock]        [Create purchase order]  │
└─────────────────────────────────────────────────┘
```

The AI recommendation ("Runs out in ~2 days") is grounded in actual sales movement data from local SQLite. No estimated demand without real movement history.

---

## 4. Stock Adjustment Flow (`Inventory.Adjustment`)

### Entry points

| Source | Pre-fill |
|--------|----------|
| [Adjust] button in stock list | Product pre-filled |
| [+ Adjust] button in Overview header | No pre-fill |
| AI recommendation action card | Product pre-filled, reason pre-suggested |
| Voice: "Add 20 units of Amul to stock" | Product + quantity + reason pre-filled |

### Step-by-step journey

```
Inventory.Adjustment
  ↓
Step 1: Select Product
  · Search or browse product list
  · Barcode scanner available
  · Current stock shown immediately on selection: "Current: 8 units"
  ↓
Step 2: Adjustment Direction and Quantity
  ┌─────────────────────────────┐
  │  [+ Add stock]  [- Remove]  │
  │                             │
  │  Current stock: 8 units     │
  │  Adjustment:    +12         │
  │  New stock:     20 units    │
  └─────────────────────────────┘
  · Owner enters the adjustment amount (not the new total)
  · New total shown live as they type
  ↓
Step 3: Reason (required — distinct from Transfer)
  Reason categories:
  ┌─────────────────────────────────────────┐
  │  [New purchase received]                │
  │  [Damaged / expired]                    │
  │  [Stolen / lost]                        │
  │  [Counting correction]                  │
  │  [Returned by customer]                 │
  │  [Opening stock entry]                  │
  │  [Other]  ← free-text required if Other │
  └─────────────────────────────────────────┘
  · Reason is mandatory — Save is disabled until a reason is selected
  · "Other" requires minimum 5-character free-text description
  ↓
Step 4: Review
  ┌──────────────────────────────────────────┐
  │  Adjustment summary                      │
  │  Product:      Amul Gold 5 kg            │
  │  Direction:    +12 units added           │
  │  Reason:       New purchase received     │
  │  Previous:     8 units                   │
  │  New total:    20 units                  │
  │  Date/time:    Today, 10:42 AM (auto)    │
  └──────────────────────────────────────────┘
  ↓
  [Confirm adjustment]
  ↓
Step 5: Result
  · Stock movement written to local SQLite
  · Running stock balance updated (movement-based, PRD §16)
  · Sync queued
  · Receipt screen: "Stock updated — Amul 5 kg now 20 units"
  · Sync indicator: Synced / Saved locally
  ↓
Inventory.Overview (or back to caller screen)
```

### Reason capture rules (distinct from Transfer)

Adjustment reasons cover:
- **Quantity increases:** New purchase received, Returned by customer, Opening stock entry
- **Quantity decreases:** Damaged/expired, Stolen/lost, Counting correction, Sample/internal use
- **Neutral:** Correction (positive or negative)

These reason categories are distinct from Transfer reasons (§5 below), which cover location-movement only.

### Offline behavior

Adjustment is fully offline-capable:
- Record written to local SQLite immediately
- Movement recorded with `sync_status = "queued"`
- Sync indicator: "Saved locally — will sync when connected"
- Stock balance updated locally for immediate accuracy in subsequent operations

---

## 5. Stock Transfer Flow (`Inventory.Transfer`)

A stock transfer moves quantity between **locations** (branches or storage areas) without changing the total quantity. It is a distinct flow from Adjustment because:
- It has two parties (source and destination) instead of one
- The reasons cover movement/logistics, not damage/correction
- No net change to total inventory; location balances both update

### Entry points

| Source | Pre-fill |
|--------|----------|
| Inventory.Overview "Transfer →" | No pre-fill |
| Inventory.Stock product row (multi-location) | Product pre-filled |
| Voice: "Transfer 10 Amul from main store to warehouse" | All fields pre-filled |

### Step-by-step journey

```
Inventory.Transfer
  ↓
Step 1: Source Location
  · List of locations/branches this user has access to
  · Select source: e.g., "Main Store"
  ↓
Step 2: Destination Location
  · Same list minus source location
  · Select destination: e.g., "Warehouse A"
  ↓
Step 3: Products and Quantities
  · Add one or more products to transfer
  · For each product:
    - Current stock at source location shown
    - Quantity field (cannot exceed stock at source)
  · Can add multiple products in a single transfer
  ↓
Step 4: Reason (required — distinct from Adjustment)
  Reason categories:
  ┌──────────────────────────────────────────┐
  │  [Restocking branch]                     │
  │  [Seasonal redistribution]               │
  │  [Branch opening / closing]              │
  │  [Customer order fulfillment]            │
  │  [Return to main warehouse]              │
  │  [Other]  ← free-text required           │
  └──────────────────────────────────────────┘
  · Reason is mandatory — same discipline as Adjustment
  ↓
Step 5: Review
  ┌──────────────────────────────────────────────┐
  │  Transfer summary                            │
  │  From:  Main Store                           │
  │  To:    Warehouse A                          │
  │  ──────────────────────────────────────────  │
  │  Amul 5 kg          × 10 units               │
  │  Bournvita 500g     × 5 units                │
  │  ──────────────────────────────────────────  │
  │  Reason: Restocking branch                   │
  │  Date/time: Today, 11:15 AM (auto)           │
  └──────────────────────────────────────────────┘
  ↓
  [Confirm transfer]
  ↓
Step 6: Result
  · Two stock movements recorded: -10 at Main Store, +10 at Warehouse A
  · Net total inventory unchanged (PRD §16 — movement-based)
  · Sync queued
  · "Transfer complete — 2 products moved to Warehouse A"
  · Sync indicator: Synced / Saved locally
  ↓
Inventory.Overview (or caller screen)
```

### Transfer-specific rules

- Transfer quantity cannot exceed available stock at source (hard validation, not just warning)
- Zero-quantity transfer blocked (UI disables Confirm if any line has 0)
- Both source and destination must be distinct locations (same location → not allowed)
- Multi-location is only available to businesses with more than one location configured

---

## 6. Adjustment vs. Transfer — Distinction Summary

| Dimension | Adjustment | Transfer |
|-----------|-----------|---------|
| Purpose | Change total inventory for a reason | Move stock between locations |
| Net stock effect | Net change (+ or –) | Zero (location balances shift) |
| Parties | One product, one location | Source + destination + products |
| Reason categories | Purchase / Damage / Loss / Correction / Return / Opening | Restocking / Seasonal / Branch / Fulfillment / Other |
| Reason mandatory | ✓ | ✓ |
| Offline capable | ✓ | ✓ |
| Audit trail | Immutable movement record | Two linked movement records |
| Screen ID | `Inventory.Adjustment` | `Inventory.Transfer` |

---

## 7. Stock Movement History (`Inventory.MovementHistory`)

Every adjustment and transfer produces a permanent, immutable movement record. The owner can view the history for:
- A specific product (from `Inventory.ProductStock`)
- An entire location (from location detail)
- The full business (from Inventory.Overview → History tab)

Each movement record shows:
- Date / time
- Type: Sale / Purchase / Adjustment / Transfer / Return
- Reason (for Adjustment and Transfer)
- Quantity change (+/–)
- Running balance after movement
- Who performed it
- Sync status

---

## 8. Universal States Applied

| Screen | Loading | Empty | Error | Offline |
|--------|:-------:|:-----:|:-----:|:-------:|
| `Inventory.Overview` | ✓ | ✓ ("No products tracked yet") | ✓ | ✓ |
| `Inventory.Stock` | ✓ | ✓ ("No products in this filter") | ✓ | ✓ |
| `Inventory.LowStock` | ✓ | ✓ ("No low-stock products — all healthy") | ✓ | ✓ |
| `Inventory.Adjustment` | — | — | ✓ | ✓ (saved locally) |
| `Inventory.Transfer` | — | — | ✓ | ✓ (saved locally) |
| `Inventory.MovementHistory` | ✓ | ✓ ("No movements recorded yet") | ✓ | ✓ |

---

## 9. Acceptance Criteria Verification

| Criterion (Prompt 28) | Met? | Evidence |
|---|:---:|---|
| Overview → Stock → Low Stock flow | ✓ | §1, §2, §3 |
| Out-of-stock state shown | ✓ | §2, §3 |
| Adjustment as distinct flow | ✓ | §4 |
| Transfer as distinct flow | ✓ | §5 |
| Distinct reason-capture for each | ✓ | §4 (Adjustment reasons), §5 (Transfer reasons), §6 |
| Movement-based stock (PRD §16) | ✓ | §4 Step 5, §5 Step 6, §7 |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Stock alerts in daily briefing | `docs/ux/briefing-prioritization.md` §1 |
| Purchase flow (receiving stock) | `docs/ux/journey-related-transactions.md` §2 |
| AI opportunity signals (restock) | `docs/ux/briefing-prioritization.md` §2 (Actionable) |
| Screen canonical IDs | `docs/ux/screen-inventory.md` |
