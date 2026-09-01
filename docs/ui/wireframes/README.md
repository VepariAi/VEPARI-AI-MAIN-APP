# Phase 4 Wireframes — Vepari AI

Phase 4 of the governance prompts sequence. Six design canvas artifacts covering the primary mobile surfaces of Vepari AI (390×844 px, wireframe fidelity).

Each entry links to the published Claude Design canvas and lists its artboards.

---

## Prompt 33 — Security and Launch Flow

**Artifact:** https://claude.ai/code/artifact/a7ba0712-e752-416a-993b-eba3c1adbdca  
**Source:** `p33/`

Covers the complete security entry sequence including all failure states per UI-UX §16–18.

| Artboard | Description |
|---|---|
| `Main.dc.html` | App launch screen — logo, tagline, loading dots |
| `SessionCheck.dc.html` | Session gate — <15 min vs >15 min branching logic |
| `Biometric.dc.html` | Biometric happy path — fingerprint/face unlock |
| `BiometricFail.dc.html` | Biometric failure — attempt counter, fallback to PIN |
| `PIN.dc.html` | PIN entry — 6-dot indicator, 3×4 keypad |
| `PINLockout.dc.html` | 30-second cooldown after 5 wrong PINs |
| `PINAccountLocked.dc.html` | Account lock after 10 wrong PINs — OTP recovery |

---

## Prompt 34 — AI OS Home Surface

**Artifact:** https://claude.ai/code/artifact/6f567cb6-8c37-4dfc-8fdb-e8700c1c756d  
**Source:** `p34/`

Reduces 8-card marketing layout to one portrait phone screen with progressive disclosure (UI-UX §144).

| Artboard | Description |
|---|---|
| `Main.dc.html` | Home screen — AI state pill, briefing preview, KPIs, voice card, quick actions, 5-tab nav |
| `Decisions.dc.html` | What was kept above fold vs. deferred — decision rationale table |

---

## Prompt 35 — Briefing Screen

**Artifact:** https://claude.ai/code/artifact/c55a0da5-112b-4ab4-8575-74e54d294e11  
**Source:** `p35/`

"While you were away" briefing — 7-item structure across 4 priority tiers distinguished by color and left border (not just list order).

| Artboard | Description |
|---|---|
| `Main.dc.html` | Full briefing (390×1100) — Critical/Important/Actionable/Informational tiers |
| `Empty.dc.html` | "All caught up" empty state |

---

## Prompt 36 — Home Screen Components

**Artifact:** https://claude.ai/code/artifact/27374d19-a6d0-4695-83b9-44d49a6ef444  
**Source:** `p36/`

Today's KPIs, voice card, configurable Quick Actions (PRD §46), and 5-tab bottom nav specification.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Home screen with KPI chips, voice entry card, configurable quick actions |
| `QuickConfig.dc.html` | Quick Actions bottom sheet — drag-to-reorder, toggle switches, slot badges |
| `NavSpec.dc.html` | Bottom nav specification — Voice tab 56×56dp elevated 10dp, 3dp white ring |

---

## Prompt 37 — Finance Drill-down

**Artifact:** https://claude.ai/code/artifact/6c9a66a1-a53c-41aa-b692-8186ba6e252c  
**Source:** `p37/`

Finance Overview with full 5-level drill-down (UI-UX §74) plus Accounting journal view (UI-UX §73–75).

| Artboard | Description |
|---|---|
| `Summary.dc.html` | Finance Overview — period tabs, KPI chips, bar chart, category list (Level 1) |
| `Category.dc.html` | Category drill-down — Sales breakdown, donut chart, account list (Level 2) |
| `Account.dc.html` | Account detail — Priya Textiles, credit bar, transaction list (Level 3) |
| `Transaction.dc.html` | Transaction detail — Invoice #1042, action buttons, source link (Level 4) |
| `Source.dc.html` | Source record — receipt attachment, audit log (Level 5) |
| `Accounting.dc.html` | Accounting journal — P&L/Balance/Journal/GST tabs, double-entry view |

---

## Prompt 38 — Transactions List and Add Sale Flow

**Artifact:** https://claude.ai/code/artifact/569e8981-99d8-46a2-98d8-98babcb0cc7c  
**Source:** `p38/`

Transactions list grouped by day and complete Add Sale flow with all 4 payment options.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Transactions list — All/Sales/Expenses/Payments tabs, day-grouped rows |
| `Customer.dc.html` | Add Sale Step 1 — Walk-in or account selection |
| `Items.dc.html` | Add Sale Step 2 — Added items with edit/remove, sub-total |
| `ItemAdd.dc.html` | Add Item sub-flow — product search, stock levels, quantity stepper |
| `Pricing.dc.html` | Add Sale Step 3 — Order summary, discount toggle, GST note |
| `Payment.dc.html` | Add Sale Step 4 — Cash / UPI / Card / Credit (all 4 options shown) |
| `Confirm.dc.html` | Sale confirmed — Invoice number, summary, WhatsApp share, print receipt |

---

*Wireframe aesthetic: 390×844 px mobile, system-ui font, white/light-gray (#f5f5f5) backgrounds, blue (#2563eb) primary, red (#ef4444) error, green (#22c55e) success. No fake iOS chrome.*
