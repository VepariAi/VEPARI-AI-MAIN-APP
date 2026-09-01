# Briefing Content & Prioritization

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/ai-os-state-machine.md` (Prompt 16), `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `App Flow.txt §20–23`; `AI OS.txt §25–31`

---

## Purpose

This document defines how raw business events are ranked into the four priority tiers — **Critical / Important / Actionable / Informational** — and assembled into the daily briefing the AI OS delivers at `AIOS.Briefing`. It answers two questions:

1. Which events from which categories enter the briefing pipeline?
2. How does the AI rank and trim them into a concise, non-overwhelming summary?

---

## Sources

| Source | Sections used |
|--------|---------------|
| `AI OS.txt` | §25 (opening briefing purpose), §26 (briefing content categories), §27 (priority tiers), §28 (briefing example), §29 (factuality rules), §30 (data freshness), §31 (offline briefing) |
| `App Flow.txt` | §20 ("While You Were Away" event pool), §21 (ranking criteria), §22 (briefing structure), §23 (resource view) |
| `docs/ux/ai-os-state-machine.md` | ANALYZING state — the AI OS processes events during ANALYZING |
| `docs/ux/journey-returning-user.md` | Briefing placement in re-entry journey |

---

## 1. The Seven Briefing Categories

These are the exact event categories that feed the briefing pipeline, derived from `AI OS.txt §26` and confirmed in the visual briefing screen (`Screens.png`).

| # | Category | Raw event examples |
|---|---|---|
| 1 | **Sales** | New sale recorded, sale voided, daily total crossed threshold, unusually high or low activity |
| 2 | **Expenses** | New expense recorded, category spending up/down, recurring expense due |
| 3 | **Payments** | Payment received, payment overdue, partial payment, payment method changed |
| 4 | **Stock Alerts** | Product reached reorder level, stock-out (quantity = 0), unusual stock movement, inventory adjustment |
| 5 | **New Customers** | First purchase by new customer, inactive customer returned, customer milestone (e.g., 10th order) |
| 6 | **Opportunities** | AI-detected pattern (e.g., "Tuesday sales historically peak — stock Amul milk"), cross-sell signal, seasonal alert |
| 7 | **Finance / Cash Flow** | Receivable overdue, payable due, cash position crossed low threshold, GST filing date proximity |

**Factuality rule (`AI OS §29`):** Events are sourced exclusively from authoritative business data in the local SQLite store (which reflects the last successful cloud sync). The AI must not invent or extrapolate events. If a sale did not occur, it cannot appear in the briefing.

---

## 2. Priority Tier Definitions

Events are assigned one of four tiers before briefing assembly.

### Critical
**Definition:** Requires immediate owner awareness; delayed action causes financial loss, compliance risk, or operational failure.

**Examples:**
- GST filing due today or tomorrow
- Customer payment 7+ days overdue (amount > threshold)
- Stock-out on a high-velocity product (no stock, expected orders)
- Sync failure lasting > 4 hours (financial records may be unsynchronized)
- Suspicious transaction detected (amount outlier, unusual time)

**Briefing treatment:** Always shown first. Never suppressed. Shown regardless of briefing length. Uses alert styling. Owner must explicitly dismiss before moving to lower tiers.

---

### Important
**Definition:** Significant business event that the owner should act on today, but does not cause immediate harm if addressed within the session.

**Examples:**
- Product approaching reorder level (stock < 20% of usual quantity)
- Large sale completed (above business's own average — AI-calibrated)
- New customer made their first purchase
- Payment received for a previously overdue invoice
- Expense significantly above the category average
- Payable due in 1–3 days

**Briefing treatment:** Shown after Critical items. Maximum 3 Important items in a single briefing to avoid overwhelm. If > 3 exist, the top 3 by impact score are shown; the rest appear in a "3 more important items" expansion link.

---

### Actionable
**Definition:** Events that represent an opportunity or pending item — acting now produces a positive outcome, but inaction does not cause immediate harm.

**Examples:**
- Customer who hasn't purchased in 30 days
- AI opportunity signal (e.g., pattern-based restock suggestion)
- Pending quotation has not been followed up for 2+ days
- Low-activity product in high-demand season
- Incomplete purchase order awaiting confirmation

**Briefing treatment:** Shown after Important items. Maximum 2 Actionable items unless the briefing has no Critical or Important items. Presented as suggestions, not alerts. Each carries a one-tap action shortcut.

---

### Informational
**Definition:** Background context that enriches business understanding but requires no action.

**Examples:**
- Today's sales are 12% above last Tuesday
- Month-to-date revenue has crossed ₹1 lakh
- Best-selling product this week: Tata Salt (5 kg)
- 3 new customers added this month

**Briefing treatment:** Shown only if the total briefing has fewer than 3 higher-priority items. Never shown in mid-day or late-night contexts. Framed as positive context, not a notification.

---

## 3. Priority Scoring Formula

Within each tier, events are ranked by an impact score:

```
impact_score = (financial_value × 0.4)
             + (urgency_factor × 0.35)
             + (novelty_factor × 0.15)
             + (business_relevance × 0.10)
```

Where:
- **financial_value**: normalized 0–1 relative to the business's own recent averages (not absolute rupee amount — a ₹500 stock alert in a Micro business weighs as much as a ₹50,000 alert in a Medium business)
- **urgency_factor**: days until harm occurs (0 = today, 1 = 1 day, etc.) — inverted so sooner = higher score
- **novelty_factor**: whether this is a new pattern vs. recurring — new patterns score higher
- **business_relevance**: whether the event type is in the owner's actively used modules (e.g., a stock alert is irrelevant if inventory tracking is off)

**Calibration:** The AI calibrates all weights against the business's own 90-day baseline, not industry averages. A business that averages ₹200/day in sales treats ₹400 as "unusually high." A business that averages ₹20,000/day does not.

---

## 4. Event Pool Construction (ANALYZING Phase)

During `AIOS.Awakening` → `ANALYZING`, the AI OS queries the local SQLite store:

```
Event pool query:
  SELECT events WHERE timestamp > last_session_checkpoint
  ORDER BY event_type, timestamp DESC

Event types checked (in order):
  1. GST/compliance dates (Critical if ≤ 2 days)
  2. Sync failures (Critical if > 4 hours)
  3. Overdue payments (Critical if ≥ 7 days; Important if 1–6 days)
  4. Stock-outs (Critical if high-velocity product)
  5. New sales (Important if above average; Informational otherwise)
  6. New expenses (Important if above average; Informational otherwise)
  7. Payments received (Important)
  8. Low stock (Important/Actionable based on severity)
  9. New customers (Important — always first purchase of new customer)
 10. AI opportunity signals (Actionable)
 11. Aggregate stats (Informational)
```

**Session checkpoint:** The AI uses the timestamp of the last session in which the user actively dismissed the briefing (tapped "Let's go" or equivalent). Brief sessions < 2 minutes are not checkpointed — they do not reset the "since you were away" window.

---

## 5. Briefing Assembly Rules

### Length limits by context

| Context | Critical | Important | Actionable | Informational | Max total items |
|---------|:--------:|:---------:|:----------:|:-------------:|:---------------:|
| Morning | All | ≤ 3 | ≤ 2 | ≤ 1 | 7 |
| Mid-day | All | ≤ 2 | ≤ 1 | 0 | 4 |
| End-of-day | All | ≤ 3 | ≤ 2 | ≤ 1 | 7 |
| Late night (11 PM–5 AM) | All | 0 | 0 | 0 | Critical only |

### Overflow handling

When the event pool exceeds the assembly limit:

```
Events in pool: 12 (2 Critical, 6 Important, 4 Actionable)
Assembly limit for morning: 7 items

Assembled briefing:
  [Critical] GST filing due tomorrow
  [Critical] Amit Singh — ₹8,400 overdue (8 days)
  [Important] 3 products below reorder level    ← rolled up: 3 items → 1 line
  [Important] ₹24,200 in sales since yesterday ← aggregate
  [Important] New customer: Priya Textiles      ← highest-impact of 3 Important
  [Actionable] Restock Amul 5kg before weekend  ← AI opportunity
  [Actionable] Follow up: Sharma Traders quotation (3 days pending)
  ──────────────────────────────────────────
  "4 more items — tap to see all"
```

**Roll-up rule:** Multiple events of the same type (e.g., 3 stock-low alerts) are always rolled into a single line ("3 products below reorder level") rather than shown as 3 separate items, unless one is Critical (stock-out) — in that case the Critical one is expanded and the others are rolled up.

---

## 6. Briefing Structure — Screen Layout

The `AIOS.Briefing` screen assembles events into a structured card:

```
┌─────────────────────────────────────────────────────────┐
│ [time-of-day greeting]                                  │
│ Good morning, Rajesh.                                   │
│                                                         │
│ [business status line]                                  │
│ Yesterday: ₹18,200 sales · ₹4,400 expenses             │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━ WHILE YOU WERE AWAY ━━━━━━━━│
│                                                         │
│ 🔴 CRITICAL                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ GST filing due tomorrow                             │ │
│ │ [File now →]                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ⚠ IMPORTANT                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Amit Singh — ₹8,400 payment overdue (8 days)       │ │
│ │ [Send reminder →]                              [→]  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 3 products below reorder level                      │ │
│ │ Amul 5kg · Tata Salt · Bournvita                   │ │
│ │ [View stock →]                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ → ACTIONABLE                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Restock before weekend — high weekend demand pattern│ │
│ │ [Create purchase →]                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ℹ  Today so far: ₹6,400 in 4 sales since 9:30 AM     │
│                                                         │
│ 2 more items  ↓                     [Let's go →]       │
└─────────────────────────────────────────────────────────┘
```

**Card components:**
- Tier label (CRITICAL / IMPORTANT / ACTIONABLE — Informational has no label)
- One-line event description (max 60 characters; localized)
- Affected record identifier (customer name, product name, amount)
- One-tap action shortcut (verb-specific label per `docs/ux/ai-action-confirmation-ux.md`)
- Drill-down arrow → linked screen
- Overflow link: "N more items" → expands inline (does not navigate away)

---

## 7. Factuality and Data Freshness Rules

### Rule B1 — Ground in data only

The briefing contains only events that exist in the local SQLite store. The AI never synthesizes, extrapolates, or infers events that are not recorded. If a sale did not happen, it cannot be mentioned.

### Rule B2 — State data freshness

When local data may be behind cloud state (offline or sync gap), every briefing item that could be stale carries a freshness indicator:

| Data state (from `AI OS §30`) | Indicator shown |
|---|---|
| Real-time (synced within 5 min) | No indicator |
| Recently synchronized (< 4 hours) | No indicator |
| Cached (4–24 hours old) | Small "as of [time]" suffix |
| Offline / local only | Offline banner at top of briefing |
| Potentially stale (> 24 hours, no sync) | "⚠ Data may be outdated" warning on affected items |

### Rule B3 — Never invent recommendations

AI recommendations in the Actionable tier must be grounded in a detected pattern from real data. The pattern source must be available for evidence drilling ("Why did you suggest this?"). A recommendation with no supporting evidence from actual business data must not appear.

### Rule B4 — Distinguish local from cloud

When offline, the briefing must state: "Showing local data — updates pending." Items from the sync queue (recorded locally but not yet confirmed cloud) are shown with the "Saved locally" or "Queued" sync indicator (`docs/ux/offline-sync-state-language.md`).

---

## 8. AI Action Cards in Briefing

When the AI identifies an action that the owner can take directly from the briefing (e.g., "Send payment reminder"), an AI action card is presented using the full confirmation pattern defined in `docs/ux/ai-action-confirmation-ux.md`.

**Briefing-level action card rules:**
- Only ROUTINE actions are offered directly in the briefing (single confirm)
- SIGNIFICANT and DESTRUCTIVE actions are linked to their destination screen — they are not executed from the briefing card
- Maximum 2 action cards per briefing (any more, and additional actions are "View all →" linked)
- An action card tapped triggers AI OS state: READY → ACTION_REQUIRED → EXECUTING → COMPLETED

**Example:**
```
"Send payment reminder to Amit Singh for ₹8,400?"
[Send reminder]    [Not now]

Classification: ROUTINE (a reminder message, no financial write)
Approve label: "Send reminder"
Cancel label: "Not now"
```

---

## 9. Empty Briefing State

If no events occurred since the last session checkpoint (quiet period):

```
AIOS.Briefing — Empty state
  ↓
Greeting: "Good morning, Rajesh."
Business status: "Yesterday: ₹14,200 in sales"
  ↓
"Quiet since yesterday afternoon — no new alerts."
  ↓
[Optional Informational item if available]
  ↓
CTA: "Let's go →"
```

**The AI never fabricates events to fill an empty briefing.** An honest "quiet" message is preferable to manufactured urgency.

---

## 10. Acceptance Criteria Verification

| Criterion (Prompt 24) | Met? | Evidence |
|---|:---:|---|
| 7 briefing categories named | ✓ | §1 |
| Critical/Important/Actionable/Informational defined | ✓ | §2 |
| How events get ranked (scoring formula) | ✓ | §3 |
| Event pool construction (ANALYZING phase) | ✓ | §4 |
| Briefing length limits and overflow handling | ✓ | §5 |
| Screen layout structure | ✓ | §6 |
| Factuality and freshness rules | ✓ | §7 |
| AI action cards in briefing | ✓ | §8 |
| Empty state | ✓ | §9 |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Returning-user re-entry journey | `docs/ux/journey-returning-user.md` (Prompt 23) |
| AI OS state machine (ANALYZING) | `docs/ux/ai-os-state-machine.md` |
| AI action confirmation pattern | `docs/ux/ai-action-confirmation-ux.md` (Prompt 19) |
| Sync state indicators in briefing items | `docs/ux/offline-sync-state-language.md` (Prompt 20) |
| Screen `AIOS.Briefing` | `docs/ux/screen-inventory.md` (Prompt 21) |
