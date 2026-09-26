# Business-Size-Adaptive UX Rules

**Phase:** 2 (UI/UX Foundation)
**Status:** Approved for Phase 2 planning
**Last updated:** 2026-08-31
**Depends on:** `docs/ux/information-architecture.md` (Prompt 11)
**Governing sources:** `UI-UX.txt §140–144`; `PRD.txt §4, §12`; `docs/research/accounting-compliance.md`

---

## Sources

| Source | Sections used |
|--------|---------------|
| `UI-UX.txt` | §140 (Micro), §141 (Small), §142 (Medium), §143 (Enterprise), §144 (Progressive Disclosure) |
| `PRD.txt` | §4.1–4.4 (user profiles by size), §12 (module list) |
| `docs/research/accounting-compliance.md` | MSME thresholds (Apr 2025), GST/TDS applicability, e-invoicing mandate |

**Module scope:** This document uses modules 1–24 from `PRD.txt §12`, which are the 24 user-facing product modules. Modules 25–40 (infrastructure: AI memory, Voice, Search, Notifications, Alerts, Team, Permissions, Automation, Offline, Sync, Devices, Backup, Usage, Entitlements, Connection Portfolio, Integrations) are addressed in §4 below.

---

## 1. Tier Definitions

Size is captured during **Onboarding → Business Size step** and stored in the business profile. It can be upgraded at any time.

| Tier | MSME threshold (Apr 2025) | Typical profile | GST status |
|------|--------------------------|----------------|-----------|
| **Micro** | Invest ≤ ₹2.5 Cr · Turnover ≤ ₹10 Cr | Solo shop, home business, individual trader | Often unregistered (below ₹40L goods / ₹20L services threshold) |
| **Small** | Invest ≤ ₹25 Cr · Turnover ≤ ₹100 Cr | 5–20 employees; registered | GST registered; TDS §194Q may apply when purchases > ₹50L/FY |
| **Medium** | Invest ≤ ₹125 Cr · Turnover ≤ ₹500 Cr | Multiple users; branches; accountant | GST + ITC; all TDS sections; e-invoice if AATO ≥ ₹5 Cr |
| **Enterprise** | Above Medium | Large team; multiple branches; compliance team | Full compliance; IRP mandatory; 30-day IRP for AATO ≥ ₹10 Cr |

---

## 2. Visibility Key

| Symbol | Meaning |
|--------|---------|
| **D** | **Default** — shown in primary UI without any configuration |
| **P** | **Progressive** — available, but behind one deliberate step (More drawer, Settings toggle, or AI suggestion). Not on primary screens. |
| **—** | **Hidden** — not shown, not accessible for this tier. Upgrading business size unlocks it. |

Every **—** is reachable as a **P** via AI OS suggestion — no feature is permanently unavailable, and none is behind a paywall gate.

---

## 3. Feature-Visibility Matrix (PRD §12, Modules 1–24)

| # | Module | Micro | Small | Medium | Enterprise | What structurally changes across tiers |
|---|--------|:-----:|:-----:|:------:|:----------:|----------------------------------------|
| 1 | Authentication | D | D | D | D | Same login flow for all tiers; Enterprise adds SSO / session audit |
| 2 | Security | D | D | D | D | Micro: PIN + biometric only. Enterprise: session management, login history, role audit |
| 3 | Onboarding | D | D | D | D | Micro: 5-step wizard. Enterprise: 9-step wizard including branch, team, and permission setup |
| 4 | Business management | D | D | D | D | Micro: single profile. Medium+: branch selector in header. Enterprise: multi-branch dashboard |
| 5 | Customers | D | D | D | D | Micro: name, phone, balance. Enterprise: credit limits, AI relationship score, payment history chart |
| 6 | Suppliers | P | D | D | D | Micro: hidden — most micro businesses buy informally. Small+: default tab in Business |
| 7 | Products | D | D | D | D | Micro: name + price list. Medium+: SKU, batch tracking, multi-location stock |
| 8 | Inventory | P | D | D | D | Micro: enabled only if onboarding indicates stock-carrying business. Small+: always default |
| 9 | Sales | D | D | D | D | Micro: cash/UPI/credit, simple receipt. Enterprise: GST invoice, multi-branch attribution, AI pricing |
| 10 | Expenses | D | D | D | D | Micro: name + amount + category. Enterprise: TDS fields, department allocation, approvals workflow |
| 11 | Purchases | P | D | D | D | Micro: informal buying not tracked. Small+: Purchases tab default in Transactions |
| 12 | Payments | D | D | D | D | Micro: mark paid/received. Enterprise: bank reconciliation trigger, payment advice, split payment |
| 13 | Returns | P | D | D | D | Micro: rare at this scale, behind More. Small+: visible in Transactions tabs |
| 14 | Refunds | P | P | D | D | Not prominent until Medium where formal refund workflows are needed |
| 15 | Finance | P | D | D | D | Micro: 3-number cash summary only. Small+: full Finance dashboard. Enterprise: multi-branch P&L + TDS dashboard + IRP status |
| 16 | Operations | — | P | D | D | Not relevant to solo Micro. Small: discoverable. Medium+: Orders, tasks, assignments default |
| 17 | Documents | P | D | D | D | Micro: invoice only (via AI share). Small+: Documents hub (Bills, Quotations, POs) |
| 18 | Invoices | D | D | D | D | Micro: cash memo. Medium+: 15-field GST invoice. Enterprise: IRP submission |
| 19 | Quotations | — | P | D | D | Micro/Small informal businesses don't quote. Medium+: quotation-to-invoice pipeline |
| 20 | Reports | P | D | D | D | Micro: AI-narrated weekly summary, no dedicated tab. Small+: Reports tab, full hub with date-range filters |
| 21 | Analytics | — | P | D | D | Micro: data set too small for meaningful analytics. Medium+: default |
| 22 | AI OS | D | D | D | D | Micro: simple daily briefing. Enterprise: multi-branch intelligence, cross-team insights |
| 23 | AI insights | P | D | D | D | Micro: AI narrates in chat; no dedicated Insights screen. Small+: Insights tab |
| 24 | AI actions | D | D | D | D | Scope of available actions differs — see §3.1 below |

### 3.1 AI Actions Scope by Tier

| Action type | Micro | Small | Medium | Enterprise |
|-------------|:-----:|:-----:|:------:|:----------:|
| Record sale by voice | D | D | D | D |
| Record expense by voice | D | D | D | D |
| Add customer | D | D | D | D |
| Mark payment received | D | D | D | D |
| Generate invoice | D | D | D | D |
| Add / adjust inventory | P | D | D | D |
| Assign task to staff member | — | P | D | D |
| Trigger automation rule | — | P | D | D |
| Multi-branch operation | — | — | D | D |
| Generate GST compliance report | — | P | D | D |
| Submit IRP e-invoice | — | — | P | D |

---

## 4. Infrastructure Modules (PRD §12, Modules 25–40)

These modules sit below the user-visible product surface. Visibility rules are included for completeness.

| # | Module | Micro | Small | Medium | Enterprise | Notes |
|---|--------|:-----:|:-----:|:------:|:----------:|-------|
| 25 | AI memory | P | D | D | D | Micro: AI remembers silently; no Memory screen exposed |
| 26 | Voice | D | D | D | D | All tiers; 23 languages per DL-009 |
| 27 | Search | D | D | D | D | Micro: customers + sales. Enterprise: cross-branch search |
| 28 | Notifications | D | D | D | D | Micro: business alerts only. Enterprise: team notifications + approvals |
| 29 | Alerts | D | D | D | D | Micro: payment due, low stock. Enterprise: compliance deadlines, branch alerts |
| 30 | Team | — | P | D | D | Not applicable to solo Micro |
| 31 | Permissions | — | P | D | D | Micro: single user, no permissions model |
| 32 | Automation | — | P | D | D | AI handles the work for Micro; rules-based automation not needed at this scale |
| 33 | Offline | Always-on | Always-on | Always-on | Always-on | No UI entry point; operates silently |
| 34 | Sync | Always-on | Always-on | Always-on | Always-on | Status indicator in header only |
| 35 | Devices | P | P | D | D | Only relevant when 3+ users share the system |
| 36 | Backup | P | P | D | D | Micro/Small: in Settings, not promoted |
| 37 | Usage | — | — | P | D | Only relevant when monitoring team consumption |
| 38 | Entitlements | — | — | P | D | Plan-level capability control; not relevant for solo/small |
| 39 | Connection Portfolio | — | P | D | D | Third-party connections not a priority for Micro |
| 40 | Integrations | — | — | P | D | Only meaningful with an existing software stack to integrate |

---

## 5. Demonstrably Simpler — Structural Proof

The difference between Micro and Enterprise is functional and structural, not cosmetic. Counting what each tier sees by default:

| Structural dimension | Micro | Small | Medium | Enterprise |
|----------------------|------:|------:|-------:|----------:|
| Bottom navigation tabs | 4 | 5 | 5 | 5 |
| Home screen panels | 3 | 5 | 7 | 9+ |
| Transactions tabs | 2 | 5 | 7 | 7 |
| Modules 1–24: Default (D) | 10 | 17 | 22 | 24 |
| Modules 1–24: Progressive (P) | 7 | 6 | 2 | 0 |
| Modules 1–24: Hidden (—) | 7 | 1 | 0 | 0 |
| AI actions available by default | 5 | 8 | 10 | 11 |
| Compliance UI elements shown | 0 | 0–1 | 3 | 5+ |

```
Micro home screen (3 panels):           Enterprise home screen (9+ panels):
┌───────────────────────┐               ┌───────────────────────────────────┐
│ Revenue  ₹12,450      │               │ [All Branches ▾]  [Arun ▾]        │
│ Expenses ₹3,200       │               │ Revenue · Expenses · Profit       │
│ Profit   ₹9,250       │               │ Cash Flow · Receivables · Payables│
│                       │               │ Team workload  AI insights strip  │
│ [Add Sale][Add Expense]│               │ Compliance: GST ✓  TDS ✓  IRP ✓  │
│ [Add Customer]        │               │ [Full quick-action bar]           │
└───────────────────────┘               └───────────────────────────────────┘
```

The Micro owner makes one decision per screen. The Enterprise owner sees a cross-branch operating dashboard. Same product, structurally different experiences.

---

## 6. Progressive Disclosure in Practice (`UI-UX.txt §144`)

Hidden modules (`—`) are surfaced by the AI OS contextually, not left for the owner to discover in Settings.

| Trigger | AI OS response | Module unlocked |
|---------|---------------|-----------------|
| "I need to track my stock" | "I can enable Inventory. Want me to set it up?" | Inventory (8) |
| "I have a helper working with me" | "You can add your team. This upgrades your view — shall I show you?" | Team (30) |
| Business passes ₹40L turnover | "Your turnover may now require GST registration. Want me to explain what changes?" | Finance (15), Compliance features |
| "Can I see my quotes?" | "Quotations isn't active for your profile. Enable it?" | Quotations (19) |

Progressive disclosure path per `§144`: Simple view → More → Advanced. The AI OS shortcut collapses "More → Advanced" into a single prompt.

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| MSME thresholds and GST/TDS rules | `docs/research/accounting-compliance.md` |
| Full module list (40 modules) | `PRD.txt §12`; DL-004 (OPEN) |
| Screen inventory by size | `docs/ux/information-architecture.md §239` |
| Navigation (tab count per tier) | `docs/ux/navigation-model.md` |
| Engine taxonomy | `docs/decisions/decision-log.md` — DL-006 |
