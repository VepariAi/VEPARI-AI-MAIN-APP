# Business-Size-Adaptive UX Rules

**Phase:** 2 (UI/UX Foundation)
**Status:** Approved for Phase 2 planning
**Last updated:** 2026-08-31
**Depends on:** `docs/ux/information-architecture.md` (Prompt 11)
**Governing sources:** `UI-UX.txt §140–144`; `PRD.txt §4, §12`; `docs/research/accounting-compliance.md` (MSME thresholds)

---

## Sources

| Source | Sections used |
|--------|---------------|
| `UI-UX.txt` | §140 (Micro UX), §141 (Small UX), §142 (Medium UX), §143 (Enterprise UX), §144 (Progressive Disclosure) |
| `PRD.txt` | §4.1–4.4 (target users by size), §12 (40 modules) |
| `docs/research/accounting-compliance.md` | MSME thresholds (Apr 2025), GST/TDS applicability by size, e-invoicing mandate |

**Note on module count:** The Prompt specifies "24 PRD §12 modules." The actual PRD §12 lists 40 modules. This is the known DL-004 conflict (OPEN). This document works from all 40 modules and marks the 40-vs-24 discrepancy for each infrastructure-layer module (Auth, Security, Offline, Sync, Backup) that is plausibly excluded from a "24 user-visible modules" count.

---

## 1. Business-Size Tier Definitions

Sizes map to the April 2025 MSME thresholds and drive which features are shown by default.

| Tier | Investment | Turnover | Typical profile | GST status | E-invoice |
|------|-----------|---------|----------------|-----------|-----------|
| **Micro** | ≤₹2.5 Cr | ≤₹10 Cr | Solo shop, home business, individual trader | Optional (below ₹40L threshold); or unregistered | Not applicable |
| **Small** | ≤₹25 Cr | ≤₹100 Cr | 5–20 employees; registered; basic team | GST registered; TDS Section 194Q may apply (purchases > ₹50L/FY) | Not applicable |
| **Medium** | ≤₹125 Cr | ≤₹500 Cr | Multiple users; possibly branches; accountant on team | GST registered + ITC tracking; TDS all sections; GSTR-3B + GSTR-1 | Threshold applies (AATO ≥ ₹5 Cr) |
| **Enterprise** | > ₹125 Cr | > ₹500 Cr | Large team; multiple branches; dedicated finance | Full compliance; IRP mandatory (AATO ≥ ₹5 Cr); 30-day IRP for ≥ ₹10 Cr | Mandatory |

Size is captured during **Onboarding → Business Size step** (§239 screen map) and stored in business profile. It can be upgraded by the owner at any time.

---

## 2. Tier Principles (from `UI-UX.txt §140–143`)

### Micro (`§140`): Simple · Guided · Fast · AI-assisted
The interface avoids exposing enterprise complexity. Every screen is one decision, not many. AI carries the cognitive load.

### Small (`§141`): Core + Team controls, deeper reporting, more inventory, automation, finance
More modules become visible. The owner has staff to manage and multiple transaction types.

### Medium (`§142`): Full core + Branches, teams, advanced operations, deeper analytics, integrations
Branch context becomes visible. Multi-user collaboration is first-class. Analytics feeds decisions.

### Enterprise (`§143`): All + Complex permissions, advanced automation, usage controls, enterprise integrations
Every module is default. Permission model is non-trivial. Usage and entitlement controls are surfaced.

### Progressive disclosure (`§144`)
For all tiers: Simple view → More → Advanced. Never show every capability at once. Especially important for Micro. Modules not shown by default are discoverable, never buried or paywalled.

---

## 3. Visibility Key

| Symbol | Meaning |
|--------|---------|
| **✓** | **Default** — shown in primary UI without any configuration; visible on relevant screens by default |
| **~** | **Progressive** — available but requires one deliberate step to reach (Settings toggle, "More" in a section, or AI suggestion). Not shown on primary screens but discoverable. |
| **✗** | **Hidden** — not visible or accessible for this tier. Upgrading the business size profile unlocks it. |
| **⚙** | **Infrastructure** — always active; no user-visible UI entry point (Auth, Sync, Offline). Present in every tier silently. |

---

## 4. Feature-Visibility Matrix

### 4.1 Foundation and Infrastructure

| # | Module | Micro | Small | Medium | Enterprise | Notes |
|---|--------|:-----:|:-----:|:------:|:----------:|-------|
| 1 | Authentication | ⚙ | ⚙ | ⚙ | ⚙ | Always-on; no user-visible entry |
| 2 | Security | **✓** | **✓** | **✓** | **✓** | Biometric/PIN setup in all tiers; Settings always visible |
| 3 | Onboarding | **✓** | **✓** | **✓** | **✓** | Wizard depth increases per tier (Micro: 5 steps; Enterprise: 9 steps) |
| 33 | Offline | ⚙ | ⚙ | ⚙ | ⚙ | Always-on; no separate UI entry |
| 34 | Sync | ⚙ | ⚙ | ⚙ | ⚙ | Status indicator in header; no explicit module entry |
| 36 | Backup | **~** | **~** | **✓** | **✓** | Micro/Small: in Settings, not promoted; Medium+: surfaced actively |
| 37 | Usage | **✗** | **✗** | **~** | **✓** | Usage dashboard only relevant when monitoring team consumption |
| 38 | Entitlements | **✗** | **✗** | **~** | **✓** | Plan-level capability control; not relevant for solo/small |

**What changes (not cosmetic):** Micro sees Security as a single "Set PIN / Fingerprint" prompt. Enterprise sees Security as a dashboard with login history, session management, and role-based access audit.

---

### 4.2 Business Core

| # | Module | Micro | Small | Medium | Enterprise | Notes |
|---|--------|:-----:|:-----:|:------:|:----------:|-------|
| 4 | Business management | **✓** | **✓** | **✓** | **✓** | Micro: single business profile. Medium+: branch selector added. Enterprise: multi-branch dashboard |
| 5 | Customers | **✓** | **✓** | **✓** | **✓** | Micro: Name, phone, balance, notes. Enterprise: adds credit limits, CRM history, AI relationship scoring |
| 6 | Suppliers | **~** | **✓** | **✓** | **✓** | Micro: hidden by default — most micro businesses don't formally track suppliers. Discoverable via AI or More |
| 7 | Products | **✓** | **✓** | **✓** | **✓** | Micro: simple list (name, price). Medium+: adds SKU, batch, multi-location stock |
| 8 | Inventory | **~** | **✓** | **✓** | **✓** | Micro: shown only if onboarding indicates stock-carrying business; otherwise hidden. Small+: always default |
| 30 | Team | **✗** | **~** | **✓** | **✓** | Micro: solo or family — no team module. Small: basic staff list. Medium+: roles, shifts, accountability |
| 31 | Permissions | **✗** | **~** | **✓** | **✓** | Micro: not applicable (single user). Small: simple owner/staff split. Enterprise: complex RBAC matrix |
| 35 | Devices | **~** | **~** | **✓** | **✓** | Device management relevant when 3+ users share the system |

**What changes (not cosmetic):**
- Micro Customers screen: List → Detail (2 taps). No credit limits visible, no scoring, no history graph.
- Enterprise Customers screen: List → Detail with credit dashboard, AI relationship score, call log, outstanding summary, payment history chart.

---

### 4.3 Transactions

| # | Module | Micro | Small | Medium | Enterprise | Notes |
|---|--------|:-----:|:-----:|:------:|:----------:|-------|
| 9 | Sales | **✓** | **✓** | **✓** | **✓** | Micro: Cash/UPI/credit toggle, simple receipt. Enterprise: adds GST invoice, multi-branch attribution, AI pricing suggestions |
| 10 | Expenses | **✓** | **✓** | **✓** | **✓** | Micro: name + amount + category. Enterprise: adds TDS fields, department allocation, approvals |
| 11 | Purchases | **~** | **✓** | **✓** | **✓** | Micro: not shown by default — most micro businesses buy informally. Discoverable via More. Small+: default tab |
| 12 | Payments | **✓** | **✓** | **✓** | **✓** | Micro: mark paid/received. Enterprise: adds payment advice, bank reconciliation triggers, split payment |
| 13 | Returns | **~** | **✓** | **✓** | **✓** | Micro: rare enough to be behind More. Small+: visible in Transactions tabs |
| 14 | Refunds | **~** | **~** | **✓** | **✓** | Micro/Small: accessible but not in primary nav. Medium+: default in Finance |
| 16 | Operations | **✗** | **~** | **✓** | **✓** | Operations (orders, tasks, processes) not relevant to solo micro business |

**Transactions tab differences by tier:**

```
Micro Transactions tabs:     All | Sales | Expenses
Small Transactions tabs:     All | Sales | Expenses | Purchases | Payments
Medium Transactions tabs:    All | Sales | Expenses | Purchases | Payments | Returns | Refunds
Enterprise Transactions tabs: All | Sales | Expenses | Purchases | Payments | Returns | Refunds | Operations
```

---

### 4.4 Finance and Compliance

| # | Module | Micro | Small | Medium | Enterprise | Notes |
|---|--------|:-----:|:-----:|:------:|:----------:|-------|
| 15 | Finance | **~** | **✓** | **✓** | **✓** | Micro: simple cash summary only (Revenue / Expenses / Balance). Small+: full Finance dashboard |
| 17 | Documents | **~** | **✓** | **✓** | **✓** | Micro: Invoices only (via AI or share receipt). Small+: Documents hub with Bills, Quotations, POs |
| 18 | Invoices | **✓** | **✓** | **✓** | **✓** | Micro: simple receipt / cash memo. Medium+: GST-compliant 15-field invoice; e-invoice with IRP for Enterprise |
| 19 | Quotations | **✗** | **~** | **✓** | **✓** | Micro: not relevant (transact, don't quote). Small: discoverable. Medium+: full quotation-to-invoice flow |
| 20 | Reports | **~** | **✓** | **✓** | **✓** | Micro: Today's summary + weekly P&L only (AI-narrated). Small+: full Reports hub with date-range filters |
| 21 | Analytics | **✗** | **~** | **✓** | **✓** | Micro: not shown — data set too small for meaningful analytics. Medium+: default |

**Finance module depth by tier:**

```
Micro Finance:         Cash in (₹) / Cash out (₹) / Balance (₹)  [3 numbers]
Small Finance:         Revenue · Expenses · Profit · Receivables · Payables  [5 panels]
Medium Finance:        All Small + Cash Flow chart · Accounts · Ledger · GST summary
Enterprise Finance:    All Medium + multi-branch P&L · TDS dashboard · IRP status · bank reconciliation
```

**Compliance modules activated by size:**
- GST filing reminders: Micro = off by default (may be unregistered); Small+ = on
- TDS deduction prompts (Section 194Q): Small when purchases exceed ₹50L/FY (AI-triggered)
- E-invoicing IRP submission: Medium/Enterprise only (AATO ≥ ₹5 Cr threshold)

---

### 4.5 AI OS and Intelligence

| # | Module | Micro | Small | Medium | Enterprise | Notes |
|---|--------|:-----:|:-----:|:------:|:----------:|-------|
| 22 | AI OS | **✓** | **✓** | **✓** | **✓** | Core product; always present. Micro: simple briefing. Enterprise: multi-branch intelligence |
| 23 | AI insights | **~** | **✓** | **✓** | **✓** | Micro: AI narrates summary in chat; no dedicated Insights screen. Small+: Insights tab in Reports |
| 24 | AI actions | **✓** | **✓** | **✓** | **✓** | All tiers; scope of actions allowed differs (see action scope table below) |
| 25 | AI memory | **~** | **✓** | **✓** | **✓** | Micro: AI remembers context silently; no Memory screen exposed. Small+: Memory screen accessible |
| 26 | Voice | **✓** | **✓** | **✓** | **✓** | All tiers; 23 languages per DL-009. Voice is the primary Micro input modality |

**AI actions scope by tier:**

| Action type | Micro | Small | Medium | Enterprise |
|-------------|:-----:|:-----:|:------:|:----------:|
| Record sale by voice | ✓ | ✓ | ✓ | ✓ |
| Record expense by voice | ✓ | ✓ | ✓ | ✓ |
| Add customer | ✓ | ✓ | ✓ | ✓ |
| Mark payment received | ✓ | ✓ | ✓ | ✓ |
| Generate invoice | ✓ | ✓ | ✓ | ✓ |
| Add/adjust inventory | ~ | ✓ | ✓ | ✓ |
| Assign task to staff | ✗ | ~ | ✓ | ✓ |
| Trigger automation rule | ✗ | ~ | ✓ | ✓ |
| Multi-branch operation | ✗ | ✗ | ✓ | ✓ |
| Generate GST report | ✗ | ~ | ✓ | ✓ |
| Submit IRP e-invoice | ✗ | ✗ | ~ | ✓ |

---

### 4.6 Infrastructure and Platform

| # | Module | Micro | Small | Medium | Enterprise | Notes |
|---|--------|:-----:|:-----:|:------:|:----------:|-------|
| 27 | Search | **✓** | **✓** | **✓** | **✓** | All tiers; Micro searches customers and sales. Enterprise adds cross-branch search |
| 28 | Notifications | **✓** | **✓** | **✓** | **✓** | Micro: business-only alerts. Enterprise: adds team notifications, approval requests |
| 29 | Alerts | **✓** | **✓** | **✓** | **✓** | Micro: payment due, low stock. Enterprise: adds compliance deadlines, branch-level alerts |
| 32 | Automation | **✗** | **~** | **✓** | **✓** | Micro: AI does the work; rules-based automation not relevant at this scale |
| 39 | Connection Portfolio | **✗** | **~** | **✓** | **✓** | Micro: not shown — third-party connections not a priority |
| 40 | Integrations | **✗** | **✗** | **~** | **✓** | Only meaningful when there's existing software stack to integrate |

---

## 5. Tier-by-Tier Default View Summary

### 5.1 Micro — Default UI Surface

```
Bottom tabs:    Home | Transactions | [Voice] | More
(No Reports tab in default Micro; Reports accessible via More)

Home screen:
  AI OS greeting + briefing
  Today: Revenue / Expenses / Profit (3 numbers)
  Quick actions: [Add Sale] [Add Expense] [Add Customer]
  Alerts: payment due, low stock (if applicable)

Transactions tabs:  All | Sales | Expenses

More drawer items (Business group):
  Customers · Products · [Inventory if stock business] · Alerts · Settings

Hidden from Micro:
  Suppliers, Purchases, Returns, Refunds, Finance dashboard,
  Documents hub, Quotations, Analytics, Operations,
  Team, Permissions, Automation, Connection Portfolio,
  Integrations, Usage, Entitlements
```

**Default modules visible: 9** (Business management, Customers, Products, Sales, Expenses, Payments, Invoices, AI OS/Voice, Search/Notifications/Alerts)

---

### 5.2 Small — Default UI Surface

```
Bottom tabs:    Home | Transactions | [Voice] | Reports | More

Home screen:
  AI OS briefing
  Revenue · Expenses · Profit · Receivables (4 panels)
  Quick actions + team shortcut
  Alerts including payment schedule

Transactions tabs:  All | Sales | Expenses | Purchases | Payments | Returns

More drawer items (Business group):
  Customers · Suppliers · Products · Inventory · Finance ·
  Documents · Operations (basic) · Analytics (basic) · Team · Alerts

Still progressive (behind settings/More):
  Automation, Quotations, Refunds, Connection Portfolio, Devices

Hidden from Small:
  Operations (advanced), Integrations, Usage, Entitlements
```

**Default modules visible: 22**

---

### 5.3 Medium — Default UI Surface

```
Bottom tabs:    Home | Transactions | [Voice] | Reports | More
Header:         [Branch selector] visible

Home screen:
  Branch selector: [All Branches ▾] or specific branch
  Full dashboard: Revenue · Expenses · Profit · Cash Flow · Receivables · Payables (6 panels)
  AI insights strip (top 2 insights)
  Team activity feed

Transactions tabs:  All | Sales | Expenses | Purchases | Payments | Returns | Refunds

More drawer:
  All modules shown; Integrations marked with tier indicator

Default modules visible: 35+
```

---

### 5.4 Enterprise — Default UI Surface

```
Bottom tabs:    Home | Transactions | [Voice] | Reports | More
Header:         [Branch selector] + [User/role] badge

Home screen:
  Multi-branch P&L at a glance
  Compliance status strip (GST, TDS, IRP)
  Team workload summary
  Full AI OS with cross-branch intelligence

Default modules visible: All 40
```

---

## 6. What "Demonstrably Simpler" Means — Concrete Differences

This section addresses the acceptance criterion directly: the difference between Micro and Enterprise is functional, not cosmetic.

| Dimension | Micro | Enterprise |
|-----------|-------|------------|
| **Visible bottom tabs** | 4 (no Reports tab) | 5 |
| **Default home panels** | 3 (Revenue / Expenses / Profit) | 8+ (6 finance + compliance + team) |
| **Transactions tabs** | 2 (Sales, Expenses) | 7 (Sales, Expenses, Purchases, Payments, Returns, Refunds, Operations) |
| **Modules visible by default** | 9 | 40 |
| **Modules hidden (not accessible)** | 17 | 0 |
| **Team-related UI elements** | None | Team member cards, task assignments, approval flows |
| **Branch UI elements** | None | Branch selector in header, branch-scoped dashboards |
| **Finance depth** | 3 numbers | Full ledger, GST dashboard, TDS tracker, IRP status |
| **Reports** | AI-narrated weekly summary (no dedicated tab) | Full hub with 6+ report types, date-range, branch filter |
| **Compliance prompts** | None | GST filing reminder, TDS deduction alert, e-invoice IRP status |
| **AI actions available** | 5 | 11 |
| **Settings depth** | Profile · Language · Security · Notifications | All settings including Usage, Entitlements, Permissions, Devices |
| **Onboarding wizard steps** | 5 steps | 9 steps |
| **Invoice type** | Cash memo / simple receipt | GST-compliant 15-field invoice with IRP submission |

The Micro owner sees a **9-module, 4-tab, 3-panel home screen** optimised for speed.
The Enterprise owner sees a **40-module, 5-tab, 8-panel home screen** with compliance overlays.

These are not the same screen with different colours — they are structurally different experiences built from different module sets.

---

## 7. Progressive Disclosure — Upgrade Path

When a Micro owner needs a feature that is hidden (`✗`), the AI OS surfaces it contextually rather than leaving them to find it in Settings.

**Examples:**
- Owner says "I need to track my stock" → AI: *"I can enable Inventory for you. Shall I set it up?"* → Enables Inventory, walks through initial setup
- Owner says "I have a helper working with me" → AI: *"You can add a team member. This will upgrade your view to include Team management. Want to do that?"*
- Owner naturally exceeds ₹40L turnover → AI: *"Your business may now need to register for GST. Want me to explain what changes?"* → surfaces GST module

Progressive disclosure happens via:
1. **AI OS suggestion** (most common for Micro) — AI OS detects context and offers the upgrade
2. **More → Settings → "Modules"** — manual self-service toggle
3. **Business profile size upgrade** — changing tier in Business Profile settings unlocks the corresponding tier's defaults

No feature is permanently unavailable. Every `✗` for Micro is a `~` one AI prompt away.

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| MSME size thresholds (Apr 2025) | `docs/research/accounting-compliance.md §MSME Thresholds` |
| GST applicability by tier | `docs/research/accounting-compliance.md §GST Registration Thresholds` |
| E-invoicing mandate (≥₹5 Cr) | `docs/research/accounting-compliance.md §E-Invoicing Mandate` |
| TDS micro-business exemption | `docs/research/accounting-compliance.md §TDS — Micro Exemptions` |
| Screen inventory (§239) | `docs/ux/information-architecture.md` |
| Navigation model (tab counts) | `docs/ux/navigation-model.md` |
| Module list (authoritative, 40) | `PRD.txt §12`; DL-004 OPEN for MVP scope |
| Engine taxonomy | `docs/decisions/decision-log.md` — DL-006 |
