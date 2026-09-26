# Universal Screen State Model

**Phase:** 2 (UI/UX Foundation)
**Status:** Approved for Phase 2 planning — normative reference for all Phase 4+ wireframes
**Last updated:** 2026-08-31
**Depends on:** `docs/ux/information-architecture.md` (Prompt 11)
**Governing sources:** `PRD.txt §42`; `UI-UX.txt §107–116, §188–190, §251–252`

---

## How to Use This Document

Phase 4 wireframes **must not re-design these states per screen.** Instead, cite the named component and fill in the content slots.

```
Wireframe annotation:
  "Customers list — empty state: → Universal Empty State
   Slot A (what): 'No customers yet'
   Slot B (why):  'Add your first customer to track sales and payments.'
   Slot C (CTA):  [Add Customer]"
```

Every screen component listed here maps to a reusable React Native component in `mobile/src/components/states/`. Implementation names are given in each section.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `PRD.txt` | §42 — list of 9 universal states |
| `UI-UX.txt` | §107–110 (offline/sync UX), §111 (conflict UX), §113 (loading states), §114 (empty states), §115 (error states), §116 (success states), §188–190 (performance UX, offline-first) |
| `UI-UX.txt` | §251 (quality gates — all states must pass), §252 (screen completion checklist) |

---

## State Set (from `PRD.txt §42`)

Every applicable screen must handle all nine states:

| # | State | Display mode | Trigger |
|---|-------|-------------|---------|
| 1 | **Loading** | Inline / skeleton | Data fetch in flight |
| 2 | **Loaded** | Normal content | Data available and fresh |
| 3 | **Empty** | Full-area placeholder | Data fetch succeeded; zero records |
| 4 | **Error** | Inline or full-area | Fetch/action failed |
| 5 | **Success** | Toast / confirmation card | Action completed |
| 6 | **Offline** | Banner + degraded content | No network; local data shown |
| 7 | **Syncing** | Subtle indicator | Local changes uploading |
| 8 | **Conflict** | Blocking card | Local and cloud versions diverged |
| 9 | **Permission denied** | Full-area block | User's role lacks required permission |

"Applicable screen" means any screen that fetches data or performs actions. Infrastructure screens (Auth, Onboarding wizard) define their own state handling.

---

## 1. Loading State

**Component name:** `ScreenLoadingState`  
**Display mode:** Skeleton (preferred) · Inline spinner (secondary) · AI processing indicator (AI OS only)  
**Governed by:** `UI-UX.txt §113`

### Rule
> Avoid full-screen blocking loaders for every operation. Use contextual loading. (`UI-UX.txt §113`)

### Skeleton pattern (default for list screens)

```
┌─────────────────────────────────┐
│  ████████████████  ██████  ← header shimmer
│  ───────────────────────────── 
│  ░░░░░░░░░░░░░  ░░░░░     ← list row shimmer
│  ░░░░░░░░  ░░░░░░░░░░░░
│  ░░░░░░░░░░░░  ░░░░
│  ░░░░░░░░  ░░░░░░░░░░░░
└─────────────────────────────────┘
```

- **Shimmer color:** `colors.surface` base, `colors.border` sweep
- **Animation:** Left-to-right shimmer, 1.2 s period
- **Reduced-motion:** Static placeholder (no animation); same shape, no sweep

### Inline spinner (for actions, not full screens)

```
  [ ↻ ]  Saving...
```

- **Size:** 20dp
- **Color:** `colors.primary`
- **Use for:** Save, delete, submit — never for initial page load

### AI processing indicator

Defined in `docs/ux/interaction-loop-states.md §Step 3` (THINKING animation: expanding rings). Referenced here; not redefined.

### Content slots (none required)
Loading state carries no user-content slots. It is purely structural. The skeleton must match the shape of the Loaded state it will replace so there is no layout jump on resolution.

### Wireframe annotation
```
→ Universal Loading State · variant: skeleton-list
```

---

## 2. Loaded State

**Component name:** (screen-specific — no wrapper needed)  
**Display mode:** Normal content

### Rule
Loaded is the absence of the other states. It is the screen's primary designed state. All Phase 4 wireframes design the Loaded state first; other states are specified by reference to this document.

No spec entry required. The Loaded state is whatever the screen's core design is.

---

## 3. Empty State

**Component name:** `ScreenEmptyState`  
**Display mode:** Full-area placeholder, centered, within the content zone  
**Governed by:** `UI-UX.txt §114`

### Rule (verbatim from `§114`)
> Every empty screen should explain:
> 1. what is empty
> 2. why it matters
> 3. what the user can do

### Structure

```
┌─────────────────────────────────┐
│                                 │
│         [Illustration]          │  ← Slot I: optional illustration
│                                 │     (contextual icon or AI character)
│      ── Slot A ──               │
│      [What is empty]            │  ← headline, 1 line, bold
│                                 │
│      ── Slot B ──               │
│      [Why it matters]           │  ← body text, 1–2 sentences, muted
│                                 │
│      ── Slot C ──               │
│      [Primary CTA button]       │  ← required; one action
│      [Secondary CTA] (optional) │  ← optional; e.g., "or import"
│                                 │
│      ── Slot D ──               │
│      [AI suggestion] (optional) │  ← optional; AI OS contextual nudge
│                                 │
└─────────────────────────────────┘
```

### Slot rules

| Slot | Required | Max length | Content rule |
|------|----------|-----------|--------------|
| I (illustration) | No | 1 icon/image | Must be contextual to the screen, never generic |
| A (what) | **Yes** | 4 words | Noun phrase only: "No customers yet" not "You have no customers" |
| B (why) | **Yes** | 2 sentences | Explains the value of the missing content, not just its absence |
| C (primary CTA) | **Yes** | 1 action | Most direct path to adding/fixing the empty state |
| C (secondary CTA) | No | 1 action | Alternative path only (import, invite, etc.) |
| D (AI suggestion) | No | 1 sentence | AI OS proactive nudge ("Want me to add your first customer by voice?") |

### Standard examples (Phase 4 reference)

| Screen | Slot A | Slot B | Slot C |
|--------|--------|--------|--------|
| Customers list | No customers yet | Add your first customer to start tracking sales and payments. | [Add Customer] |
| Suppliers list | No suppliers yet | Track who you buy from to manage purchases and outstanding bills. | [Add Supplier] |
| Transactions list | No transactions yet | Record your first sale or expense to see your business activity here. | [Add Transaction] |
| Inventory | No products in stock | Add products to track what you have and get low-stock alerts. | [Add Product] |
| Reports | No data for this period | Record some transactions to see your profit and loss report. | [Go to Transactions] |
| Alerts | All clear | No alerts right now. You'll be notified when something needs your attention. | (no CTA; no action needed) |

### Search empty state (variant)

When a user searches and finds nothing, the empty state changes:

```
Slot A: No results for "[query]"
Slot B: Try different words, or check the spelling.
Slot C: [Clear search]
```

### Wireframe annotation
```
→ Universal Empty State
  A: "No customers yet"
  B: "Add your first customer to start tracking sales and payments."
  C: [Add Customer]
```

---

## 4. Error State

**Component name:** `ScreenErrorState`  
**Display mode:** Full-area (fetch failure) or inline banner (action failure)  
**Governed by:** `UI-UX.txt §115`

### Rule (verbatim from `§115`)
> Errors must answer:
> - What happened?
> - Was my data saved?
> - What can I do?

### Structure — full-area (fetch failure)

```
┌─────────────────────────────────┐
│                                 │
│          [Error icon]           │  ← warning/error icon, not ❌
│                                 │
│      ── Slot A ──               │
│      [What happened]            │  ← 1 sentence, plain language, no error codes
│                                 │
│      ── Slot B ──               │
│      [Data safety statement]    │  ← was data saved? reassure or warn
│                                 │
│      ── Slot C ──               │
│      [Primary recovery action]  │  ← e.g., [Try Again]
│      [Secondary action]         │  ← e.g., [View saved data] [Go Back]
│                                 │
└─────────────────────────────────┘
```

### Structure — inline banner (action failure)

```
┌─────────────────────────────────────────────────────┐
│ ⚠  [What happened] · [Recovery action link]     [×] │
└─────────────────────────────────────────────────────┘
```

Inline banner appears below the header, does not block content, auto-dismisses after 8 s unless it requires action.

### Slot rules

| Slot | Required | Rule |
|------|----------|------|
| A (what happened) | **Yes** | Plain language only. Never: "500 Internal Server Error." Always: "Couldn't load your customers right now." |
| B (data safety) | **Yes** | For fetch errors: "Your saved data is still here." For action errors: "Nothing was changed." or "The sale was not recorded." |
| C (primary CTA) | **Yes** | [Try Again] for retryable errors; [Go Back] for terminal errors |
| C (secondary CTA) | Conditional | Required when offline fallback exists: [View saved data] |

### Standard error messages by cause

| Cause | Slot A | Slot B | Slot C |
|-------|--------|--------|--------|
| Network timeout | Couldn't connect right now. | Your saved data is still here. | [Try Again] |
| Server error (5xx) | Something went wrong on our end. | Nothing was changed. | [Try Again] · [Go Back] |
| Validation error | [Specific field] isn't valid. | Nothing was saved yet. | [Fix it] (focus field) |
| Sync error | Couldn't sync yet. | Your data is still saved on this device. | [Retry] · [View Details] |
| STT failure (AI OS) | I didn't catch that. | — | [Try Again] · [Type instead] |

### Financial error variant

For financial actions (sales, payments, refunds), Slot B must always explicitly state whether the transaction was written or not. Ambiguity is not acceptable.

```
Slot B options for financial errors:
  "The sale was NOT recorded. Try again safely."      ← clean failure
  "The sale may have been recorded. Check your       ← ambiguous — requires
   Transactions list before trying again."             manual verification prompt
```

### Wireframe annotation
```
→ Universal Error State · variant: full-area
  A: "Couldn't load your customers right now."
  B: "Your saved data is still here."
  C: [Try Again]
```

---

## 5. Success State

**Component name:** `ScreenSuccessState` (toast variant) · `ActionSuccessCard` (card variant)  
**Display mode:** Toast (non-blocking, auto-dismiss) or card (blocking, requires dismiss)  
**Governed by:** `UI-UX.txt §116`

### Rule (verbatim from `§116`)
> Success should provide confirmation without unnecessary interruption. Then offer relevant next actions.

### Toast (default — non-blocking)

```
┌────────────────────────────────────────┐
│ ✓  [What was done]         [Undo] [×]  │  ← 4 s auto-dismiss (8 s if Undo offered)
└────────────────────────────────────────┘
```

- **Position:** Bottom of screen, above bottom tab bar
- **Color:** `colors.success` background, white text
- **Undo:** Offer for reversible actions within the dismiss window only

### Action success card (blocking — used for significant financial completions)

This is the COMPLETED state card from the AI OS interaction loop (`docs/ux/interaction-loop-states.md §Step 7`). Same component, used for non-voice transactions too.

```
┌─────────────────────────────────┐
│  ✓  [What was done]             │  ← Slot A: 1 line
│     [Supporting detail]         │  ← Slot B: amounts, names, date
│                                 │
│     [Primary next action]       │  ← Slot C: most logical next step
│     [Secondary next action]     │  ← Slot D: optional
└─────────────────────────────────┘
```

### Slot rules

| Slot | Required | Rule |
|------|----------|------|
| A (what was done) | **Yes** | Past tense, specific: "Sale recorded" not "Success" |
| B (supporting detail) | Conditional | Required for financial actions: "₹350 · Ramesh Store · Cash" |
| C (primary next action) | **Yes** | Most likely next step: [View Sale] [Add Another] [Share Receipt] |
| D (secondary next action) | No | Alternative: [Go Home] |

### Standard examples

| Action | Toast text | Next actions |
|--------|-----------|--------------|
| Sale recorded | ✓ Sale recorded — ₹350 | [View] · [Add Another] · [Share Receipt] |
| Customer added | ✓ Ramesh Store added | [View Customer] · [Add Sale] |
| Expense saved | ✓ Expense saved — ₹620 | [View] · [Add Another] |
| Payment marked | ✓ Payment of ₹1,500 received | [View] |

### Wireframe annotation
```
→ Universal Success State · variant: toast
  A: "Sale recorded — ₹350"
  C: [View Sale]  D: [Add Another]
```

---

## 6. Offline State

**Component name:** `OfflineBanner` (persistent) + `OfflineCapabilityNote` (per-action)  
**Display mode:** Persistent banner below header + inline notes on cloud-only actions  
**Governed by:** `UI-UX.txt §107, §109, §188–190`

### Rule
> The user should experience "The app works." rather than "The app is waiting for the server." (`UI-UX.txt §189`)

### Persistent offline banner

```
┌─────────────────────────────────────────────┐
│  ○  Working offline · Changes will sync     │  ← always visible when offline
└─────────────────────────────────────────────┘
```

- **Color:** `colors.warning` tint (yellow/amber), not error red — offline is normal, not a failure
- **Position:** Directly below screen header, above content
- **Dismiss:** Not dismissible while offline

### Offline content behavior

| Content type | Offline behavior |
|-------------|-----------------|
| Local data (customers, products, cached transactions) | Show normally — no degradation |
| AI OS voice and chat | Available using cached context and local model if applicable |
| Cloud-only data (bank balance, IRP status, team activity) | Hide or show "Last updated [time]" label |
| Reports requiring full cloud data | Show last-fetched report with staleness label |

### Per-action offline note (inline, within action flows)

When an action requires cloud connectivity and cannot be queued:

```
⚠  [Action] requires an internet connection.
   [Why it's needed]
   [Retry when connected] — or — [Queue for later]
```

- **"Queue for later"** is shown only for actions that can be safely deferred (e.g., sync a document). Never for actions with ambiguous completion status.

### Offline transaction confirmation (replaces normal Success toast)

```
┌────────────────────────────────────────────────┐
│ ✓ Saved to this device                         │
│ ↻ Will sync when connection returns            │
└────────────────────────────────────────────────┘
```

(`UI-UX.txt §109` — verbatim pattern)

### Wireframe annotation
```
→ Universal Offline Banner (always)
  + per-action: Universal Offline Capability Note where cloud-only
```

---

## 7. Syncing State

**Component name:** `SyncIndicator`  
**Display mode:** Subtle header indicator — never blocks content  
**Governed by:** `UI-UX.txt §108`

### Sync status values (from `§108`)

```
Synced    → ✓ (brief flash, then hidden)
Syncing   → ↻ (animated, visible while in progress)
Queued    → ○ (static, waiting for connection)
Failed    → ⚠ (persists; links to Sync Error state)
Conflict  → ! (persists; routes to Conflict state)
```

### SyncIndicator location

```
┌─────────────────────────────────────────────┐
│  SCREEN TITLE          [Search] [↻ Syncing] │  ← syncing indicator in header actions area
└─────────────────────────────────────────────┘
```

- **Position:** Header right area, alongside other header actions
- **Size:** Icon (20dp) + optional label ("Syncing…") — label only shown for >3 s sync
- **Tap behavior:** Opens Sync status detail sheet (shows queued operations count, last sync time, any errors)

### Rule
Syncing is background behavior. It must never block the UI or prevent the user from continuing to use the screen.

### Wireframe annotation
```
→ Universal Sync Indicator · position: header-right
```

---

## 8. Conflict State

**Component name:** `ConflictResolutionCard`  
**Display mode:** Blocking card within the affected record's detail screen  
**Governed by:** `UI-UX.txt §111`

### Rule (verbatim from `§111`)
> A conflict should never be silently hidden.
> Financial conflicts require particularly careful UX.

### Structure

```
┌─────────────────────────────────────────────┐
│  !  Changes need review                     │  ← Slot A: what the conflict is
│─────────────────────────────────────────────│
│  ── This device ──    ── Cloud ──           │
│  [Local value]        [Cloud value]         │  ← Slot B: side-by-side diff
│                                             │  ← show field name, both values, timestamps
│  Changed by this device on [time]           │
│  Changed from another device on [time]      │
│─────────────────────────────────────────────│
│  [Keep this device's version]               │  ← Slot C: resolution options
│  [Use cloud version]                        │
│  [View full history]                        │
└─────────────────────────────────────────────┘
```

### Slot rules

| Slot | Required | Rule |
|------|----------|------|
| A (description) | **Yes** | Name the specific record: "Ramesh Store's balance has changed on two devices" not "Conflict detected" |
| B (diff) | **Yes** | Show both values side by side with timestamps. Never hide either value. |
| C (resolution) | **Yes** | Always offer at least 2 resolution paths. Never auto-resolve without user action. |

### Financial conflict variant

For financial records (sales, payments, balances):

- Slot B must show both the amount AND the transaction context (date, counterparty), not just a raw number
- Slot C must include [View full transaction history] as a third option
- Auto-resolution is never permitted for financial conflicts
- If resolution cannot be determined (e.g., double payment risk), add: "If unsure, contact your accountant before resolving."

### Conflict discovery paths

Conflicts are surfaced from two points:
1. **Record detail screen** — conflict card blocks the record view in-situ
2. **Sync status detail sheet** (tapped from SyncIndicator) — lists all pending conflicts with record names

### Wireframe annotation
```
→ Universal Conflict Resolution Card
  A: "Ramesh Store's balance has changed on two devices"
  B: [diff table: This device ₹2,650 vs Cloud ₹3,250]
  C: [Keep this device] · [Use cloud] · [View history]
```

---

## 9. Permission Denied State

**Component name:** `PermissionDeniedState`  
**Display mode:** Full-area block (replaces content zone entirely)  
**Governed by:** `PRD.txt §42`; security architecture in `AI OS.txt §253`

### Rule
The permission denied state must explain what permission is missing and who can grant it. It must never expose the permission name as a raw technical string (e.g., `sales:read`).

### Structure

```
┌─────────────────────────────────┐
│                                 │
│          [Lock icon]            │
│                                 │
│      ── Slot A ──               │
│      [What you can't do]        │  ← "You can't view reports"
│                                 │
│      ── Slot B ──               │
│      [Who can grant access]     │  ← "Ask your business owner to enable this for your role."
│                                 │
│      ── Slot C ──               │
│      [Recovery action]          │  ← [Go Back] always present
│      [Request access] (opt.)    │  ← show only if in-app request is supported
│                                 │
└─────────────────────────────────┘
```

### Slot rules

| Slot | Required | Rule |
|------|----------|------|
| A (what) | **Yes** | Describe the capability, not the permission. "You can't view Finance" not "finance:read denied" |
| B (who can grant) | **Yes** | Name the role that can grant access. For Micro (single user): show "This feature isn't available on your current plan" instead |
| C (Go Back) | **Yes** | Always present — user must not be stranded |
| C (Request access) | No | Only when the system supports in-app permission requests |

### Standard examples

| Screen | Slot A | Slot B | Slot C |
|--------|--------|--------|--------|
| Finance (staff role) | You can't view Finance. | Ask your business owner to enable Finance access for your role. | [Go Back] |
| Team (Micro tier) | Team management isn't available yet. | Upgrade your business profile to Small to manage team members. | [Go Back] · [Upgrade] |
| Reports (read-only role) | You can't view Reports. | Ask your business owner to give you Reports access. | [Go Back] |

### Wireframe annotation
```
→ Universal Permission Denied State
  A: "You can't view Finance."
  B: "Ask your business owner to enable Finance access for your role."
  C: [Go Back]
```

---

## 10. Applying This Spec — Phase 4 Wireframe Protocol

For every new screen added in Phase 4, the wireframe must complete the following state checklist. The wireframe references this document rather than re-designing states.

```
Screen: [Screen name]
──────────────────────────────────────────────────────
[ ] Loading     → Universal Loading State · variant: [skeleton-list | skeleton-detail | spinner]
[ ] Loaded      → [screen's primary design]
[ ] Empty       → Universal Empty State
                  A: "[what]"
                  B: "[why]"
                  C: [[CTA label]]
[ ] Error       → Universal Error State · variant: [full-area | inline-banner]
                  A: "[what happened]"
                  B: "[data safety statement]"
                  C: [[recovery CTA]]
[ ] Success     → Universal Success State · variant: [toast | card]
                  A: "[what was done]"
                  C: [[next action]]
[ ] Offline     → Universal Offline Banner (always) + capability notes where required
[ ] Syncing     → Universal Sync Indicator · position: header-right
[ ] Conflict    → Universal Conflict Resolution Card (only if screen shows synced records)
[ ] Permission  → Universal Permission Denied State
                  A: "[what]"
                  B: "[who can grant]"
──────────────────────────────────────────────────────
```

**Minimum required for every data-displaying screen:** Loading · Loaded · Empty · Error · Offline.  
**Required additionally for screens that write data:** Success · Syncing.  
**Required additionally for screens showing synced records:** Conflict.  
**Required additionally for role-gated screens:** Permission denied.

---

## 11. Quality Gate (from `UI-UX.txt §251`)

A screen fails the state quality gate if any of the following are true:

- Loading state uses a full-screen spinner where a skeleton would fit
- Empty state is missing Slot A, B, or C
- Error state does not answer all three questions (what / safe / do)
- Error Slot A contains a raw HTTP status code or technical string
- Financial error Slot B is ambiguous about whether the transaction was written
- Conflict is auto-resolved without user action
- Permission denied state strands the user (no [Go Back])
- Syncing state blocks any UI interaction

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| AI OS THINKING / COMPLETED states | `docs/ux/interaction-loop-states.md` |
| Sync queue architecture | `docs/decisions/decision-log.md` — DL-002; `Database, Storage.txt` |
| Permission model | `AI OS.txt §253`; `PRD.txt §31` |
| Navigation model | `docs/ux/navigation-model.md` |
| Screen completion checklist | `UI-UX.txt §252` (verbatim checklist; this document satisfies the state rows) |
| Design tokens (colors, typography) | `docs/decisions/decision-log.md` — DL-001, DL-010 |
