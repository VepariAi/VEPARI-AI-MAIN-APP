# Information Architecture — Top-Level

**Phase:** 2 (UI/UX Foundation)
**Status:** Approved for Phase 2 planning
**Last updated:** 2026-08-31
**Governing decisions:** DL-006 (engine taxonomy), DL-009 (Sarvam language support)

---

## Sources

| Source | Sections used |
|--------|---------------|
| `UI-UX.txt` | §41 (Home screen hierarchy), §125 (motion accessibility), §163 (AI OS overlay), §238 (master navigation flow), §239 (complete screen map) |
| `App Flow.txt` | §3 (Owner Workspace split: AI OS branch vs Business branch) |
| `PRD.txt` | §12 (module list — 40 modules; see note below) |
| `docs/decisions/decision-log.md` | DL-006 (three-layer engine taxonomy — single source of truth) |

**Note on module count:** The Prompt 11 specification references "24 core modules." The actual `PRD.txt §12` lists 40 modules. This is the known DL-004 conflict (OPEN). This document works from the authoritative 40-module list in `PRD.txt §12`, with MVP status tracked separately. DL-004 must be resolved before Phase 5 scoping.

---

## Positioning Principle: AI OS as Connective Layer

The AI OS is **not a menu item**. It is the connective intelligence layer that wraps every business screen.

Three rules derived from `UI-UX.txt §125, §163`:

1. **Overlay, not destination.** The AI OS floats over business screens where appropriate; it never permanently obscures critical controls (§163).
2. **Context inheritance.** When AI OS is invoked from a business screen (e.g. Inventory), it inherits that screen's context automatically — the user does not repeat themselves (§166).
3. **Accessible without animation.** The AI OS must remain fully functional under reduced-motion preferences; the visual layer is decorative, not structural (§125).

This means the IA tree is not `Home → AI OS → [modules]` (siloed navigation) but rather:

```
AI OS
 │   [connective layer — always reachable, context-aware]
 ├── overlays Home
 ├── overlays every Business screen
 └── overlays Settings
```

---

## Top-Level IA Tree

### Master Navigation Flow (`UI-UX.txt §238`)

```
                         AI OS  ← connective layer
                           │
              ┌────────────┼────────────┐
              │            │            │
             AI         Business      Alerts
              │            │
              │      ┌─────┼─────────┐
              │      │     │         │
              │    CRM   Commerce   Finance
              │
              ├── Voice
              ├── Chat
              ├── Memory
              ├── Insights
              └── Actions
```

### Owner Workspace Split (`App Flow.txt §3`)

```
OWNER WORKSPACE
│
├── AI OS BRANCH               ├── BUSINESS BRANCH
│   ├── Voice                  │   ├── Customers
│   ├── Chat                   │   ├── Suppliers
│   ├── Insights               │   ├── Products
│   ├── Actions                │   ├── Inventory
│   └── Memory                 │   ├── Sales
│                              │   ├── Expenses
│                              │   ├── Purchases
│                              │   ├── Payments
│                              │   ├── Finance
│                              │   ├── Operations
│                              │   ├── Documents
│                              │   └── Reports
```

### Home Screen Hierarchy (`UI-UX.txt §41`)

```
Home
 ├── Header
 ├── AI OS  [state: DORMANT → AWAKENING → READY]
 ├── Business Health
 ├── Key Metrics
 ├── Alerts
 ├── Quick Actions
 └── Recent Activity
```

---

## Complete Screen Map (`UI-UX.txt §239`)

```
APP
│
├── Launch
├── Security
│
├── Onboarding
│   ├── Language
│   ├── Account
│   ├── Business
│   ├── Industry
│   ├── Size
│   ├── Location
│   ├── Configuration
│   ├── AI
│   └── Security
│
├── AI OS  [connective layer — accessible from any screen]
│   ├── Awakening
│   ├── Briefing  ["While You Were Away" screen]
│   ├── Resources
│   ├── Insights
│   ├── Voice
│   ├── Chat
│   ├── Evidence
│   ├── Recommendations
│   ├── Actions
│   └── Results
│
├── Home
│
├── Customers
│   ├── List
│   ├── Search
│   ├── Detail
│   ├── Add
│   └── Edit
│
├── Suppliers
│   ├── List
│   ├── Detail
│   ├── Add
│   └── Edit
│
├── Products
│   ├── List
│   ├── Detail
│   ├── Add
│   └── Edit
│
├── Inventory
│   ├── Overview
│   ├── Stock
│   ├── Low Stock
│   ├── Locations
│   ├── Transfers
│   ├── Adjustments
│   └── History
│
├── Sales
│   ├── Overview
│   ├── List
│   ├── New Sale
│   ├── Cart
│   ├── Payment
│   ├── Review
│   └── Receipt
│
├── Expenses
│   ├── Overview
│   ├── List
│   ├── Add
│   └── Detail
│
├── Purchases
│   ├── Overview
│   ├── List
│   ├── New Purchase
│   └── Detail
│
├── Payments
│   ├── List
│   ├── Add
│   └── Detail
│
├── Returns
├── Refunds
│
├── Finance
│   ├── Overview
│   ├── Revenue
│   ├── Expenses
│   ├── Profit
│   ├── Cash Flow
│   ├── Receivables
│   ├── Payables
│   ├── Accounts
│   └── Ledger
│
├── Operations
│   ├── Orders
│   ├── Tasks
│   ├── Processes
│   ├── Assignments
│   └── Activity
│
├── Documents
│   ├── Invoices
│   ├── Receipts
│   ├── Bills
│   ├── Quotations
│   └── Purchase Orders
│
├── Reports
│
├── Analytics
│
├── Search
│
├── Notifications
├── Alerts
│
├── Team
│   ├── Members
│   ├── Invitations
│   ├── Roles
│   └── Permissions
│
├── Automation
│
├── Connection Portfolio  [renamed per DL-005 resolution]
│   ├── Available
│   ├── Connected
│   ├── Setup
│   ├── Sync
│   └── Health
│
└── Settings
    ├── Profile
    ├── Business
    ├── Language
    ├── AI
    ├── Voice
    ├── Security
    ├── Notifications
    ├── Team
    ├── Devices
    ├── Connections
    ├── Data
    ├── Storage
    └── About
```

---

## DL-006 Engine Mapping Reconciliation

DL-006 defines a three-layer taxonomy. The table below maps each screen group from §239 to the canonical engine layers. DL-006 is the single source of truth for Phase 5/6/13 feature scoping.

| Screen Group (§239) | Architectural Engine (Layer 1) | Problem-Led Domain (Layer 2) |
|---------------------|-------------------------------|------------------------------|
| AI OS (all sub-screens), Voice, Chat, Memory, Insights, Actions | Business Brain | Business Memory (AI/memory sub-domain) |
| Customers, Suppliers, Products | Business Brain | Business Memory |
| Analytics (market intelligence) | Growth Engine | Customer & Market Intelligence |
| Sales, Expenses, Purchases, Payments, Returns, Refunds, Operations | Finance Engine | Financial |
| Finance (Receivables, Payables, Accounts, Ledger) | Finance Engine | Financial + Credit |
| Inventory | Finance Engine | Inventory |
| Reports, Analytics (GST/TDS) | Finance Engine | Scheme & Compliance |
| Documents (Invoices, Quotations, POs) | Finance Engine | Financial |
| Launch, Security, Onboarding | Access Engine | _(cross-cutting delivery)_ |
| Team, Permissions, Devices | Access Engine | _(cross-cutting delivery)_ |
| Sync, Offline, Backup, Usage, Entitlements | Access Engine | _(cross-cutting delivery)_ |
| Connection Portfolio, Integrations | Access Engine | _(cross-cutting delivery)_ |
| Settings | Access Engine | _(cross-cutting delivery)_ |
| Automation | Access Engine | _(cross-cutting delivery)_ |
| Search, Notifications, Alerts | Access Engine | _(cross-cutting delivery)_ |

**Note:** The 10 pitch icons (from marketing materials) are **not** canonical feature names and do not appear in this document. See DL-006 for their mapping.

---

## PRD Module Classification (40 modules, `PRD.txt §12`)

The 40 PRD modules mapped to engine domains and rough MVP status (subject to DL-004 resolution):

| # | Module | Engine Domain | MVP Candidate |
|---|--------|--------------|---------------|
| 1 | Authentication | Access Engine | Yes |
| 2 | Security | Access Engine | Yes |
| 3 | Onboarding | Access Engine | Yes |
| 4 | Business management | Access Engine | Yes |
| 5 | Customers | Business Memory | Yes |
| 6 | Suppliers | Business Memory | Yes |
| 7 | Products | Business Memory | Yes |
| 8 | Inventory | Inventory | Yes |
| 9 | Sales | Financial | Yes |
| 10 | Expenses | Financial | Yes |
| 11 | Purchases | Financial | Yes |
| 12 | Payments | Financial | Yes |
| 13 | Returns | Financial | Yes |
| 14 | Refunds | Financial | Yes |
| 15 | Finance | Financial + Credit | Yes |
| 16 | Operations | Financial | Phase 2+ |
| 17 | Documents | Financial | Yes |
| 18 | Invoices | Financial | Yes |
| 19 | Quotations | Financial | Yes |
| 20 | Reports | Scheme & Compliance | Yes |
| 21 | Analytics | Customer & Market Intelligence | Phase 2+ |
| 22 | AI OS | Business Brain | Yes |
| 23 | AI insights | Business Brain | Yes |
| 24 | AI actions | Business Brain | Yes |
| 25 | AI memory | Business Memory | Yes |
| 26 | Voice | Business Brain | Yes |
| 27 | Search | Access Engine | Yes |
| 28 | Notifications | Access Engine | Yes |
| 29 | Alerts | Access Engine | Yes |
| 30 | Team | Access Engine | Phase 2+ |
| 31 | Permissions | Access Engine | Phase 2+ |
| 32 | Automation | Access Engine | Phase 2+ |
| 33 | Offline | Access Engine | Yes |
| 34 | Sync | Access Engine | Yes |
| 35 | Devices | Access Engine | Phase 2+ |
| 36 | Backup | Access Engine | Phase 2+ |
| 37 | Usage | Access Engine | Phase 2+ |
| 38 | Entitlements | Access Engine | Phase 2+ |
| 39 | Connection Portfolio | Access Engine | Phase 2+ |
| 40 | Integrations | Access Engine | Phase 2+ |

**Open issue (DL-004):** Prompt 11 spec references "24 core modules." PRD §12 lists 40. DL-004 is OPEN — team/product owner input required to lock the MVP set before Phase 5 scoping begins. The "MVP Candidate" column above is indicative only.

---

## First-Launch and Returning-User Flows

### First-Launch (`UI-UX.txt §240`)

```
Launch → Welcome → Language → Login/Create → Verification
  → Security → Business Setup → Business Size → Industry
  → Configuration → Optional Import → AI Setup → Voice Setup
  → AI OS Introduction → Home
```

### Returning User

```
Launch → Security → AI OS Awakening → Briefing ("While You Were Away") → Home
```

The "While You Were Away" briefing screen is the **signature post-security screen**: the AI OS summarizes business events since the last session before the user reaches any business module.

---

## Navigation Design Rules (derived from UI-UX.txt)

1. **AI OS is always reachable** — from any business screen via dedicated control, voice, or gesture (§165). It is not buried behind a navigation stack.
2. **AI OS is dismissible** — the user can minimize it and continue normal business operations (§164).
3. **Context flows down** — AI OS opened from a specific business screen inherits that screen's context (§166–167). No re-statement of context required.
4. **Reduced motion supported** — all AI OS states must be navigable without animation. The 13 AI OS states (DORMANT → INITIALIZING → SECURITY_VERIFIED → AWAKENING → ANALYZING → READY → LISTENING → THINKING → RESPONDING → ACTION_REQUIRED → EXECUTING → COMPLETED → ERROR) must communicate via text/haptic fallback, not animation alone (§125).
5. **RTL readiness** — screens that will render in Urdu (Nastaliq script, RTL) must mirror navigation chrome directionally. Planned for Phase 13 (DL-010).

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Engine taxonomy (authoritative) | `docs/decisions/decision-log.md` — DL-006 |
| Language/font strategy | `docs/decisions/decision-log.md` — DL-001, DL-010 |
| Sarvam language coverage (STT/TTS) | `docs/research/sarvam-language-coverage.md` — DL-009 |
| GST/TDS/BRS compliance rules | `docs/research/accounting-compliance.md` |
| Database schema / data isolation | `docs/database/README.md` — DL-002 |
| Module detail specs | `PRD.txt §12` (authoritative); DL-004 MVP scope (OPEN) |
| Screen design specs | `UI-UX.txt` (full document); `AI OS.txt` |
| Backend API routes | `docs/api/README.md` (population begins Phase 9) |
