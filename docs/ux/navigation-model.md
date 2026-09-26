# Navigation Model — Primary Navigation

**Phase:** 2 (UI/UX Foundation)
**Status:** Approved for Phase 2 planning
**Last updated:** 2026-08-31
**Depends on:** `docs/ux/information-architecture.md` (Prompt 11)
**Governing decisions:** DL-006 (engine taxonomy)

---

## Sources

| Source | Sections used |
|--------|---------------|
| `Screens.png` | Direct visual inspection — 5-tab bottom nav confirmed |
| `UI-UX.txt` | §157 (global action access), §158 (navigation principle), §159 (navigation depth), §160 (back navigation), §161 (deep linking), §162 (app state restoration), §163–165 (AI OS overlay/dismissal/re-entry) |
| `Implementation Plan.txt` | Phase 3–9 screen inventory |
| `docs/ux/information-architecture.md` | §239 complete screen map |

---

## 1. Primary Navigation: 5-Tab Bottom Bar

### Tab Order and Purpose

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    [Home]  [Trans]  [ ● Voice ]  [Reports]  [More]      │
│      1        2        3 ↑           4         5        │
└─────────────────────────────────────────────────────────┘
```

| Position | Tab | Icon | Primary destination | Access shortcut |
|----------|-----|------|---------------------|-----------------|
| 1 (left) | **Home** | House | Home screen (business overview, AI OS entry point) | Always re-entrant; tapping while on Home scrolls to top |
| 2 | **Transactions** | Receipt | Transactions list (All / Sales / Expenses / Payments tabs) | Most frequent daily action |
| 3 (center, elevated) | **Voice** | Microphone ● | Launches AI OS Voice mode directly | Physical centre of thumb reach; elevated above bar |
| 4 | **Reports** | Bar chart | Reports hub (P&L, Sales, Expenses, Cash Flow, Customer, Inventory) | Also shows AI Insights |
| 5 (right) | **More** | Grid (···) | More drawer/overlay — all modules not in tabs 1–4 | Catch-all; see §3 below |

**Rationale (§158):** Frequency → Transactions is the highest-frequency daily action; Context → Voice sits at centre because it is cross-contextual; Speed → Reports is the second most time-sensitive view; Discoverability → More is last but always visible.

---

## 2. Voice Tab — Elevated Center Button Treatment

### Visual Spec (derived from Screens.png)

```
Normal tabs (height H):
  ┌──────┬──────┬──────────┬──────────┬──────┐
  │ Home │Trans │          │ Reports  │ More │
  │  ⌂   │ ≡    │          │  ▦      │ ···  │
  └──────┴──────┤  ● Mic   ├──────────┴──────┘
                │  ↑ +8dp  │   elevated, circular
                └──────────┘
```

- **Shape:** Circle, ~56dp diameter (matches FAB convention)
- **Elevation:** Raised 8dp above the tab bar baseline; drops a subtle shadow
- **Fill:** AI color token (`colors.ai`) — matches the "Talk to Vepari" call-to-action on Home
- **Icon:** Microphone, white/light on AI-colored fill
- **Active state:** Pulsing ring animation when AI OS is LISTENING or THINKING (reduced-motion: ring becomes static border, §125)
- **Inactive state:** No animation; mic icon at rest
- **Label:** Omitted (icon is self-explanatory at center position) — or "Voice" at reduced size below if accessibility audit requires it

### Behavior

| User action | Result |
|-------------|--------|
| Tap (any screen) | Opens AI OS in LISTENING state; microphone hot immediately |
| Long-press | Opens AI OS Chat mode instead of Voice |
| Tap while AI OS LISTENING | Stops listening; returns to previous screen |
| Tap while AI OS THINKING/RESPONDING | Interrupts and returns to previous screen |

The Voice button does **not** navigate to a new stack screen — it **overlays** the current screen (§163). The user's current position (tab and screen) is preserved behind the overlay. Dismissing the AI OS (§164) returns the user to exactly where they were.

---

## 3. "More" Tab — Expansion Contents

"More" opens a **bottom sheet drawer** listing all modules not covered by tabs 1–4. It is not a full-screen page — it slides up from the bottom bar and is dismissible by swipe-down or tapping outside.

### More Drawer Structure

```
┌─────────────────────────────────────────────────────┐
│  ───  (drag handle)                                 │
│                                                     │
│  BUSINESS                                           │
│  ┌─────────┬─────────┬─────────┬─────────┐         │
│  │Customers│Suppliers│Products │Inventory│         │
│  └─────────┴─────────┴─────────┴─────────┘         │
│  ┌─────────┬─────────┬─────────┬─────────┐         │
│  │Finance  │Documents│Operations│Analytics│        │
│  └─────────┴─────────┴─────────┴─────────┘         │
│                                                     │
│  MANAGEMENT                                         │
│  ┌─────────┬─────────┬─────────┬─────────┐         │
│  │  Team   │ Alerts  │Automation│Devices │         │
│  └─────────┴─────────┴─────────┴─────────┘         │
│                                                     │
│  ACCOUNT                                            │
│  ┌─────────┬─────────┐                             │
│  │Settings │Connection│                            │
│  │         │Portfolio │                            │
│  └─────────┴─────────┘                             │
└─────────────────────────────────────────────────────┘
```

### More Drawer Item Inventory

**Business group:**

| Item | Destination | PRD module # |
|------|-------------|--------------|
| Customers | Customers list | 5 |
| Suppliers | Suppliers list | 6 |
| Products | Products list | 7 |
| Inventory | Inventory overview | 8 |
| Finance | Finance overview | 15 |
| Documents | Documents hub (Invoices, Quotations, POs) | 17–19 |
| Operations | Operations overview | 16 |
| Analytics | Analytics / AI Insights | 21, 23 |

**Management group:**

| Item | Destination | PRD module # |
|------|-------------|--------------|
| Team | Team members | 30 |
| Alerts | Alerts list | 29 |
| Automation | Automation rules | 32 |
| Devices | Device management | 35 |

**Account group:**

| Item | Destination | PRD module # |
|------|-------------|--------------|
| Settings | Settings hub | — |
| Connection Portfolio | Connection Portfolio overview | 39–40 |

**Quick actions in More drawer header:**
A "Quick Actions" row at the top of More mirrors the Home screen shortcuts (Add Sale, Add Expense, Add Customer) so frequent actions remain accessible without closing the drawer and navigating.

---

## 4. Navigation Depth Model

### Governing Principle (`UI-UX.txt §159`)

```
Home  (tap 0)
  ↓
Module List  (tap 1)
  ↓
Record Detail  (tap 2)
  ↓
Action / Edit  (tap 3)
```

**Maximum depth target: 3 taps from Home for any record-level action.**
**Maximum 4 taps** is the hard budget for any screen reachable via the bottom tab bar (§159 mandate, Prompt 12 acceptance criteria).

### Tap Budget by Screen (Phase 3–6 Screen Inventory)

"Taps from Home" counts discrete navigation pushes from the Home tab, not counting the initial tap on a bottom tab (which is always tap 1).

| Screen | Path | Taps from Home |
|--------|------|----------------|
| **Home** | — (is Home) | 0 |
| AI OS Awakening/Briefing | Home → AI OS overlay | 1 (overlay, not push) |
| AI OS Voice | Voice tab tap | 1 (overlay) |
| AI OS Chat | Voice tab long-press | 1 (overlay) |
| Transactions list | Transactions tab | 1 |
| Transactions — Sales filter | Transactions → Sales tab | 1 |
| Transactions — Add Transaction | Transactions → + Add | 2 |
| Reports hub | Reports tab | 1 |
| P&L Report detail | Reports → P&L | 2 |
| Sales Report detail | Reports → Sales | 2 |
| Expense Report detail | Reports → Expenses | 2 |
| Cash Flow Report | Reports → Cash Flow | 2 |
| Customer Report | Reports → Customer | 2 |
| Inventory Report | Reports → Inventory | 2 |
| AI Insights | Reports → Insights tab | 2 |
| Customers list | More → Customers | 2 |
| Customer detail | More → Customers → Detail | 3 |
| Add Customer | More → Customers → + Add | 3 |
| Edit Customer | More → Customers → Detail → Edit | 4 ✓ |
| Suppliers list | More → Suppliers | 2 |
| Supplier detail | More → Suppliers → Detail | 3 |
| Add Supplier | More → Suppliers → + Add | 3 |
| Products list | More → Products | 2 |
| Product detail | More → Products → Detail | 3 |
| Add Product | More → Products → + Add | 3 |
| Inventory overview | More → Inventory | 2 |
| Inventory — Low Stock | More → Inventory → Low Stock tab | 2 |
| Add Inventory Item | More → Inventory → + Add Item | 3 |
| Finance overview | More → Finance | 2 |
| Finance — Receivables | More → Finance → Receivables | 3 |
| Finance — Ledger | More → Finance → Ledger | 3 |
| Documents hub | More → Documents | 2 |
| Invoice detail | More → Documents → Invoices → Detail | 4 ✓ |
| New Invoice | More → Documents → Invoices → New | 4 ✓ |
| Quotation detail | More → Documents → Quotations → Detail | 4 ✓ |
| Operations overview | More → Operations | 2 |
| Analytics | More → Analytics | 2 |
| Alerts | More → Alerts | 2 |
| Team | More → Team | 2 |
| Settings | More → Settings | 2 |
| Settings — Business Profile | More → Settings → Business | 3 |
| Settings — Language | More → Settings → Language | 3 |
| Settings — Security & PIN | More → Settings → Security | 3 |
| Settings — Notifications | More → Settings → Notifications | 3 |
| Connection Portfolio | More → Connection Portfolio | 2 |

**Multi-step flows (legitimately > 4 taps):**

| Flow | Steps | Tap count | Justification |
|------|-------|-----------|---------------|
| New Sale | Transactions → + Add → Select Customer → Add Items → Choose Payment → Review → Save | 5–6 | Transaction completion; each step is a distinct decision gate |
| New Purchase | Purchases → + New → Supplier → Items → Save | 4–5 | Same pattern as sale |
| New Sale via Quick Action | Home → Quick Actions → Add Sale → Items → Payment | 4–5 | Shallow entry point reduces by 1 |
| Onboarding (first launch) | 9-step wizard | 9 | One-time; not a recurring navigation path |

**Shortcut mitigation for deep flows:**
- "Add Sale" Quick Action on Home reduces the New Sale entry point from Transactions (tap 1) to Home (tap 0).
- "Add Expense" and "Add Customer" Quick Actions similarly reduce depth by 1 tap.
- AI OS can initiate any transaction by voice, bypassing all visual navigation taps.

---

## 5. Home Screen Quick Actions

The Quick Actions row on Home (confirmed in Screens.png) provides direct-tap access to the four most frequent entry points:

```
[ Add Sale ]  [ Add Expense ]  [ Add Customer ]  [ ··· More ]
```

- **Add Sale** → opens New Sale flow directly (skips Transactions list)
- **Add Expense** → opens Add Expense form directly (skips Transactions list)
- **Add Customer** → opens Add Customer form directly (skips Customers list)
- **··· More** → same as More tab — opens More drawer

Tapping any Quick Action from Home = 1 tap total to reach the creation screen.

---

## 6. Back Navigation Rules (`UI-UX.txt §160`)

Back navigation must preserve, where practical:

| State | Preserved |
|-------|-----------|
| Scroll position | Yes — module lists restore scroll offset on back |
| Active filters | Yes — filter/tab selections persist within a session |
| Draft data | Yes — partially entered forms auto-draft; back shows "Resume draft?" prompt |
| AI OS context | Yes — dismissing AI OS returns to the exact screen it was invoked from |

**Tab state persistence:** Each bottom tab maintains its own navigation stack. Switching from Transactions to Reports and back restores the Transactions stack exactly (including any open sub-screens).

**Hardware back button / swipe-back:** Follows platform convention (Android back button, iOS swipe-from-left). Never exits the app from a module screen — navigates up the stack. Exit on Home tab only.

---

## 7. Deep-Link Paths (`UI-UX.txt §161`)

The following surface types must support direct deep-linking (bypassing normal navigation):

| Trigger | Deep-link target | Example |
|---------|-----------------|---------|
| Notification — low stock alert | Inventory → specific item detail | `vepari://inventory/{itemId}` |
| Notification — payment due | Customer → specific customer detail | `vepari://customers/{customerId}` |
| AI OS action recommendation | Relevant business screen | `vepari://transactions/new-sale` |
| AI OS evidence card | Source document | `vepari://documents/{documentId}` |
| Alerts list item tap | Alerts → specific alert detail | `vepari://alerts/{alertId}` |

Deep links must resolve correctly even if the app was not previously running (cold-start deep-link). On cold start: Launch → Security → deep-link destination.

---

## 8. App State Restoration (`UI-UX.txt §162`)

When the app resumes from background:

```
App was backgrounded
  ↓
If < 15 minutes: restore to previous screen (no security re-check)
  ↓
If > 15 minutes OR sensitivity threshold reached: Security gate
  ↓
AI OS Briefing ("While You Were Away") if AI OS is DORMANT
  ↓
Restore to previous screen
```

Never return the user to the home screen on resume unless a security event requires it or the previous context is no longer valid (deleted record, etc.).

---

## 9. AI OS Overlay Integration with Navigation

The AI OS operates as an overlay layer, not a stack screen (§163). This means:

- **Bottom tab bar remains visible** behind the AI OS overlay (dimmed, not hidden) so the user always knows their location
- **AI OS does not consume a navigation history entry** — back navigation skips over the AI OS state
- **Context-aware entry:** AI OS inherits the current screen's module context automatically (§166); opening from Finance gives the AI a Finance context without user re-statement
- **Re-entry points** (§165): dedicated Voice tab, long-press on Voice tab (Chat mode), contextual "Ask AI" buttons within module screens

---

## 10. Screens Not Yet Reachable in Phase 3–8

The following §239 screens are defined in the IA but will not be reachable until their implementation phase:

| Screen | Implementation Phase | Reason |
|--------|---------------------|--------|
| AI OS (full Voice/Chat/Memory) | Phase 8–9 | Requires AI gateway and Sarvam integration |
| Sync / Offline indicators | Phase 7 | Requires sync queue infrastructure |
| Team / Permissions | Phase 10+ | Requires multi-user backend |
| Automation | Phase 10+ | Requires automation engine |
| Connection Portfolio | Phase 11+ | Requires third-party integrations |
| Analytics (full) | Phase 6 | Requires finance engine |
| Devices | Phase 10+ | Requires device management |

Navigation entries for these screens appear in More but are **greyed out with "Coming soon" state** until their phase ships. They are never hidden — discoverability is preserved (§158).

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Complete screen tree (§239) | `docs/ux/information-architecture.md` |
| AI OS states (13-state model) | `AI OS.txt`; `docs/ux/information-architecture.md` §Navigation Design Rules |
| Engine domain mapping | `docs/decisions/decision-log.md` — DL-006 |
| Font/script strategy | `docs/decisions/decision-log.md` — DL-010 |
| Sarvam language support | `docs/research/sarvam-language-coverage.md` — DL-009 |
