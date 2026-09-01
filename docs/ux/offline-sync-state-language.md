# Vepari AI — Offline/Sync Visual State Language

> **Document:** `docs/ux/offline-sync-state-language.md`  
> **Phase:** 2 — UX Architecture  
> **Type:** UI/UX  
> **Prompt:** 20  
> **Depends on:** Prompt 15 (`docs/ux/universal-screen-states.md`)  
> **Sources:** UI-UX §107–112, §193, §230; Database·Storage §56–62; Prompt 0 §0.15  
> **Consumed by:** Phase 15 (offline/sync implementation) — this spec applies to every module that performs a mutation  
> **Status:** LOCKED — no module may invent its own sync state language  

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)  
2. [The 6 Sync States](#2-the-6-sync-states)  
3. [Display Locations](#3-display-locations)  
4. [Per-State Visual Spec](#4-per-state-visual-spec)  
5. [SyncIndicator Component (Persistent Header)](#5-syncindicator-component-persistent-header)  
6. [InlineSyncBadge Component (Per-Record)](#6-inlinesyncbadge-component-per-record)  
7. [SyncStatusSheet (Detail View)](#7-syncstatussheet-detail-view)  
8. [Mutation Flow Sequence](#8-mutation-flow-sequence)  
9. [Copy Bank](#9-copy-bank)  
10. [Financial Record Rules](#10-financial-record-rules)  
11. [Anti-Patterns](#11-anti-patterns)  
12. [Quality Gate](#12-quality-gate)  

---

## 1. Purpose and Scope

UI-UX §230 establishes a non-negotiable rule:

> **Never make the user wonder whether a business transaction was saved.**  
> The application must explicitly communicate: Saved locally / Synced / Queued / Failed / Conflict.

This document standardizes exactly how that communication works — the icon, the copy string, the placement, the tap behavior, and the accessibility requirement — for all six sync states, across all surfaces. Phase 15 must implement this spec directly. No module may define its own sync state language.

**Why a single language, not per-module variants:**

- A business owner uses this app across Sales, Inventory, Payments, Expenses, and CRM in a single session. If "Queued" means a clock icon in Sales but a wifi icon in Expenses, trust erodes.
- UI-UX §193 defines a single system status area ("without cluttering the primary UI"). That area is the `SyncIndicator` defined in §5.
- Accessibility Rule A2.1 (Prompt 18) requires icon + label + color for every status. Inventing per-module icons breaks the accessibility guarantee.

**Scope of this spec:**

Applies to every screen that performs a local SQLite write. This includes: Sales, Expenses, Payments, Purchases, Inventory adjustments, Customer records, Supplier records, Product records, Invoice creation, Returns/Refunds, and any other module that writes to the local database.

Does **not** apply to:
- Read-only screens (no mutation, no sync state to show)
- In-flight AI OS interactions (those are covered by the AI OS state machine — `docs/ux/ai-os-state-machine.md` states 11–13)
- Onboarding wizard steps (distinct UX, no sync queue involvement until the first business record is created)

---

## 2. The 6 Sync States

### Mapping: UI label → Backend sync queue state (`Database·Storage §57`)

| UI state | Backend state | Meaning |
|---|---|---|
| **Saved locally** | *(pre-queue; immediate on SQLite commit)* | The write has succeeded in local SQLite. No attempt has yet been made to sync. This is a transient state — it transitions to Queued almost immediately for records that will be synced. |
| **Queued** | `PENDING` | The record is in the sync queue, waiting for a connection. The device is offline or the sync worker has not yet picked this operation. |
| **Syncing** | `SYNCING` | A sync attempt is in flight — the mutation is being transmitted to the cloud API. |
| **Synced** | `SYNCED` | The cloud has accepted and committed the record. The local and cloud versions match. This is the resolved / at-rest state. |
| **Failed** | `FAILED` | One or more sync attempts have failed. The record remains in local SQLite but has not reached the cloud. Requires user attention. |
| **Conflict** | `CONFLICT` | The cloud rejected the mutation because the server version has diverged from the client's base version (`Database·Storage §60`). Requires user resolution. |

**Note on REJECTED (`Database·Storage §57`):** A REJECTED sync operation is one the server refused because of business validation (e.g., GSTIN invalid, invoice number already exists). This is displayed as a **Failed** state with a specific reason string — it is not a separate UI state. The user sees "Failed" with the server's rejection reason in the detail view.

---

## 3. Display Locations

Sync state appears in exactly two places. No module may add a third location.

### Location A — SyncIndicator (Persistent, header)

**What it is:** A small icon + optional label in the header's right-side action area, always visible on every content screen.

**What it communicates:** The aggregate sync state of the entire device — the "worst" state across all queued operations.

**Aggregate priority rule (highest to lowest):**

```
Conflict   (!) → always shown, always red
Failed     (⚠) → shown until resolved
Syncing    (↻) → shown while active
Queued     (○) → shown when offline with pending ops
Synced     (✓) → shown briefly (3 s) after all ops clear
[hidden]       → normal idle state (nothing pending)
```

The `SyncIndicator` shows the highest-priority state. If there is one Conflict and five Synced records, the indicator shows Conflict (!).

### Location B — InlineSyncBadge (Per-record, in lists and detail views)

**What it is:** A small icon + label on the individual record row (in a list) or in the record header (on a detail screen).

**What it communicates:** The sync state of that specific record only.

**When it appears:** Only when the record's sync state is NOT Synced. A Synced record shows no badge — clean state is the absence of a badge.

**When it disappears:** When the record transitions to Synced, the badge fades out (0.3 s fade, or instantly on reduced-motion). After fade, no badge is shown — a synced record has no inline badge.

---

## 4. Per-State Visual Spec

Each state's spec defines: icon, icon color, label text, badge/indicator color, non-color signal (accessibility), and the copy rule.

### 4.1 — Saved locally

| Property | Value |
|---|---|
| **Icon** | `device-storage` (outlined phone with a small save arrow) |
| **Icon color** | `colors.textSecondary` (neutral gray) |
| **Label** | "Saved locally" |
| **Badge background** | `colors.surface` (neutral; not a status color) |
| **Label color** | `colors.textSecondary` |
| **Duration** | Transient — shown for 2–3 s immediately after a local write, then transitions to Queued (offline) or Syncing (online) |
| **Non-color signal** | Icon shape: device outline. Label always present. |
| **SyncIndicator** | Not shown in SyncIndicator. This is a per-record inline only. |
| **InlineSyncBadge** | Yes — shown for 2–3 s, then replaced by next state badge |
| **Tap behavior** | No tap action on "Saved locally" badge (transient) |

**UX rationale (UI-UX §107):** "Saved locally" is "much more reassuring than: Waiting for server…" It is the first thing the user sees after a successful write, confirming that data is not lost.

---

### 4.2 — Queued

| Property | Value |
|---|---|
| **Icon** | `clock-outline` (outlined clock) |
| **Icon color** | `colors.warning` (amber) |
| **Label** | "Queued" |
| **Badge background** | `colors.warningSubtle` (amber tint) |
| **Label color** | `colors.warning` |
| **Duration** | Persistent until connection resumes and sync succeeds |
| **Non-color signal** | Clock icon (time-waiting shape), label "Queued" always present |
| **SyncIndicator** | `○` shown when device is offline AND there are PENDING operations |
| **InlineSyncBadge** | Yes — persistent while queued |
| **Tap behavior** | SyncIndicator tap → SyncStatusSheet. Badge tap → SyncStatusSheet filtered to this record. |

**Copy variants:**

| Context | Copy |
|---|---|
| InlineSyncBadge label | "Queued" |
| SyncIndicator label (offline, ops pending) | "Queued" (label only shown when >3 s in this state) |
| SyncStatusSheet description | "Waiting for connection — will sync automatically" |

---

### 4.3 — Syncing

| Property | Value |
|---|---|
| **Icon** | `refresh-cw` (rotating arrows, animated clockwise) |
| **Icon animation** | Continuous rotation, 1 s/revolution. Stops immediately on reduced-motion — shows static arrows. |
| **Icon color** | `colors.primary` (Vepari blue) |
| **Label** | "Syncing" |
| **Badge background** | `colors.primarySubtle` (blue tint) |
| **Label color** | `colors.primary` |
| **Duration** | While the sync call is in flight |
| **Non-color signal** | Rotating arrows icon (motion + shape), label "Syncing" always present. On reduced-motion: static arrows + label only. |
| **SyncIndicator** | `↻` animated; shown while any operation is SYNCING |
| **InlineSyncBadge** | Yes — shown during sync attempt for this record |
| **Tap behavior** | SyncIndicator tap → SyncStatusSheet showing in-progress count |

**Copy variants:**

| Context | Copy |
|---|---|
| InlineSyncBadge label | "Syncing" |
| SyncIndicator label (if >3 s) | "Syncing…" |
| SyncStatusSheet description | "Uploading [N] change(s)…" |
| EXECUTING state context (AI action) | "Saving [record type]…" (see Prompt 19 §7) |

---

### 4.4 — Synced

| Property | Value |
|---|---|
| **Icon** | `check-circle` (filled circle with checkmark) |
| **Icon color** | `colors.success` (green) |
| **Label** | "Synced" |
| **Badge background** | `colors.successSubtle` (green tint) |
| **Label color** | `colors.success` |
| **Duration** | 3 s in SyncIndicator (then hidden). Badge fades in 0.3 s then disappears from list rows — clean state has no badge. |
| **Non-color signal** | Checkmark-in-circle icon (shape + label). "Synced" label always accompanies the icon during the 3 s window. |
| **SyncIndicator** | `✓` shown for 3 s after all operations clear, then hidden (idle = no indicator) |
| **InlineSyncBadge** | Appears briefly (0.3 s fade-in, 3 s hold, 0.3 s fade-out), then gone. A clean record has no badge. |
| **Tap behavior** | No tap action (transient) |

**Why Synced disappears:** A persistent "Synced" badge on every record creates visual noise. The absence of a badge means "synced and clean." Only states that require user attention (Failed, Conflict) persist indefinitely.

**Copy variants:**

| Context | Copy |
|---|---|
| SyncIndicator brief flash label | "Synced" |
| SyncStatusSheet (all clear) | "All changes saved to cloud" |
| Offline success toast (replaces normal success) | "✓ Saved to this device · Will sync when connection returns" |

---

### 4.5 — Failed

| Property | Value |
|---|---|
| **Icon** | `alert-triangle` (triangle with exclamation mark) |
| **Icon color** | `colors.error` (red) |
| **Label** | "Sync failed" |
| **Badge background** | `colors.errorSubtle` (red tint) |
| **Label color** | `colors.error` |
| **Duration** | Persistent until resolved (user retries, succeeds, or dismisses) |
| **Non-color signal** | Triangle-exclamation icon (distinct shape from clock and check-circle), label "Sync failed" always present. |
| **SyncIndicator** | `⚠` shown persistently; higher priority than Queued and Syncing |
| **InlineSyncBadge** | Yes — persistent on failed record until resolved |
| **Tap behavior** | SyncIndicator tap → SyncStatusSheet filtered to Failed entries. Badge tap → inline retry options (§7). |

**Data safety rule:** The record exists in local SQLite regardless of sync failure. Failure means cloud does not have this version — it does not mean the data is lost.

**Copy variants:**

| Context | Copy |
|---|---|
| InlineSyncBadge label | "Sync failed" |
| SyncIndicator label | "Sync failed" (always shown, no hide) |
| SyncStatusSheet description (generic) | "Couldn't sync · Your data is saved on this device" |
| SyncStatusSheet description (server rejection) | "Couldn't sync · [Server rejection reason in plain language]" |
| InlineSyncBadge expanded (tap → inline) | "Couldn't sync. Your data is safe. [Retry] [View Details]" |

**Retry behavior:** Tapping [Retry] on the Failed state initiates a new sync attempt for that specific operation. The state transitions to Syncing → Synced or Failed again.

**REJECTED variant (server-side business validation failure):**

```
Icon:       alert-triangle (same as Failed)
Label:      "Sync failed"
Detail:     "[Plain-language server rejection reason]"
            e.g., "GST number is not valid — update it in Business Settings"
            e.g., "Invoice number already used — check your invoice list"
Tap action: [Retry] [Edit Record] [View Details]
```

---

### 4.6 — Conflict

| Property | Value |
|---|---|
| **Icon** | `git-merge` (two-branch merge icon, or equivalent "split path" icon) |
| **Icon color** | `colors.error` (red — conflict always requires action) |
| **Label** | "Needs review" |
| **Badge background** | `colors.errorSubtle` (red tint) |
| **Label color** | `colors.error` |
| **Duration** | Persistent until the user resolves the conflict |
| **Non-color signal** | Split-path icon (distinct shape), label "Needs review" always present. |
| **SyncIndicator** | `!` shown persistently; highest priority of all states |
| **InlineSyncBadge** | Yes — persistent on conflicted record until resolved |
| **Tap behavior** | SyncIndicator tap → SyncStatusSheet filtered to Conflicts. Badge tap on list row → navigates to record detail screen, which shows the `ConflictResolutionCard` (§7). |

**Why "Needs review" not "Conflict":** "Conflict" is a technical term. "Needs review" is actionable. The user's mental model is "something needs my attention" not "a versioning conflict occurred."

**Copy variants:**

| Context | Copy |
|---|---|
| InlineSyncBadge label | "Needs review" |
| SyncIndicator label | "Needs review" (always shown) |
| SyncStatusSheet entry | "[Record name] · Changed on this device and another device" |
| ConflictResolutionCard title | "[Record name] has been changed on two devices" |
| ConflictResolutionCard body | "This device: [local value] · Cloud: [cloud value] — review and choose which to keep" |

The `ConflictResolutionCard` full spec is in `docs/ux/universal-screen-states.md §8`. This document defines the copy contract; that document defines the card layout.

---

## 5. SyncIndicator Component (Persistent Header)

**Component name:** `SyncIndicator`  
**React Native location:** `mobile/src/components/sync/SyncIndicator.tsx`  
**Position:** Header right-side action area, alongside search/filter icons  

### States and appearance

```
IDLE (nothing pending):
  [hidden — no indicator shown]

QUEUED (offline, PENDING ops):
  ○  [label: "Queued" if >3 s in this state]

SYNCING (SYNCING ops in flight):
  ↻  [animated; label: "Syncing…" if >3 s]

SYNCED (just cleared):
  ✓  [label: "Synced"; shown for 3 s, then IDLE]

FAILED (any FAILED op):
  ⚠  [label: "Sync failed"; always shown]

CONFLICT (any CONFLICT op):
  !  [label: "Needs review"; always shown]
```

### Header layout

```
┌────────────────────────────────────────────────────────┐
│  ← SCREEN TITLE          [🔍 Search]  [⚠ Sync failed] │
└────────────────────────────────────────────────────────┘
```

- Icon: 20dp
- Label: shown only if state has persisted >3 s (to avoid flicker during fast syncs), OR if state is FAILED or CONFLICT (always shown immediately)
- Label font: 12sp, `colors.textSecondary` (or the state color for FAILED/CONFLICT)
- Tap: always opens `SyncStatusSheet` (§7)

### Accessibility

```
accessibilityLabel:
  IDLE:     [no element — not rendered]
  QUEUED:   "Sync queued — tap for details"
  SYNCING:  "Syncing [N] change(s) — tap for details"
  SYNCED:   "All synced"
  FAILED:   "Sync failed — tap to retry"
  CONFLICT: "Changes need review — tap for details"

accessibilityRole: "button"
```

### Reduced-motion

- SYNCING: static arrows icon (no rotation animation). Label "Syncing…" always present.
- All other states: no animation in any state (SYNCED flash is instant → hidden).

---

## 6. InlineSyncBadge Component (Per-Record)

**Component name:** `InlineSyncBadge`  
**React Native location:** `mobile/src/components/sync/InlineSyncBadge.tsx`  
**Position:** Appears in two contexts:

1. **List row** — right-aligned, vertically centered, after the record metadata
2. **Detail screen header** — below the record title, left-aligned with other metadata

### List row layout

```
┌────────────────────────────────────────────────────────────────┐
│  [Record icon]  Record Name                 [⚠ Sync failed]   │
│                 ₹2,500 · 3 Apr 2025                            │
└────────────────────────────────────────────────────────────────┘
```

### Detail screen layout

```
┌────────────────────────────────────────────────────────────────┐
│  ← Invoice #INV-0042                              [Edit]       │
│  Ramesh Store · ₹18,500 · 3 Apr 2025                          │
│  [⚠ Sync failed] ← inline badge below metadata               │
└────────────────────────────────────────────────────────────────┘
```

### Badge anatomy

```
┌───────────────┐
│ [icon]  Label │  ← icon 14dp, label 12sp, padding: 4dp top/bottom, 8dp left/right
└───────────────┘
    ↑ rounded corners (4dp radius)
    ↑ background: state color (subtle tint)
```

### State-by-state appearance table

| State | Icon | Icon color | Label | Background | Always shown | Tap action |
|---|---|---|---|---|---|---|
| Saved locally | `device-storage` | `textSecondary` | "Saved locally" | `surface` | 2–3 s transient | None |
| Queued | `clock-outline` | `warning` | "Queued" | `warningSubtle` | Until sync | SyncStatusSheet |
| Syncing | `refresh-cw` (anim) | `primary` | "Syncing" | `primarySubtle` | Until done | SyncStatusSheet |
| Synced | `check-circle` | `success` | "Synced" | `successSubtle` | 3 s then hidden | None |
| Failed | `alert-triangle` | `error` | "Sync failed" | `errorSubtle` | Until resolved | Inline retry panel |
| Conflict | `git-merge` | `error` | "Needs review" | `errorSubtle` | Until resolved | Navigate to detail |

### Accessibility

```
accessibilityLabel:
  Saved locally: "Saved to this device"
  Queued:        "Queued for sync — tap for details"
  Syncing:       "Syncing…"
  Synced:        "Synced" (element briefly exists, then unmounted)
  Failed:        "Sync failed — tap to retry"
  Conflict:      "Needs review — tap to resolve"

accessibilityRole: "button" (for Queued, Failed, Conflict — tappable)
                   none / decorative (for Saved locally, Syncing, Synced — no tap action)
```

### Reduced-motion

- Syncing icon: static (no rotation). Label "Syncing" always present.
- Synced badge: appears instantly at full opacity (no fade-in), waits 3 s, then disappears instantly (no fade-out).
- Saved locally badge: appears instantly, disappears instantly after 2–3 s.

---

## 7. SyncStatusSheet (Detail View)

**Component name:** `SyncStatusSheet`  
**React Native location:** `mobile/src/components/sync/SyncStatusSheet.tsx`  
**Trigger:** Tapping `SyncIndicator` in the header from any screen.  
**Presentation:** Bottom sheet (same spring physics as `AIActionCard`).

### Sheet anatomy

```
┌─────────────────────────────────────────────────────┐
│  Sync Status                              [Done]     │  ← header
│ ─────────────────────────────────────────────────── │
│  CONFLICTS  ─────────────────────────────────────── │  ← section, shown only if any
│  [! Needs review]  Ramesh Store balance  [Resolve]  │
│  [! Needs review]  Invoice #INV-0042     [Resolve]  │
│ ─────────────────────────────────────────────────── │
│  FAILED ───────────────────────────────────────────  │  ← section, shown only if any
│  [⚠ Sync failed]  Arun payment ₹2,500   [Retry]    │
│  [⚠ Sync failed]  Invoice #INV-0039     [Retry]    │
│ ─────────────────────────────────────────────────── │
│  IN PROGRESS ──────────────────────────────────────  │  ← section, shown only if any
│  [↻ Syncing]  3 change(s) uploading…               │
│ ─────────────────────────────────────────────────── │
│  QUEUED ───────────────────────────────────────────  │  ← section, shown only if any
│  [○ Queued]  12 change(s) waiting for connection   │
│ ─────────────────────────────────────────────────── │
│  Last synced: Today at 14:22                        │  ← footer always shown
│  [↻ Retry All Failed]    [Force Sync Now]           │  ← action row, conditional
└─────────────────────────────────────────────────────┘
```

### Section rules

| Section | Shown when | Content |
|---|---|---|
| CONFLICTS | Any CONFLICT op | Named list — record type + record name + [Resolve] button |
| FAILED | Any FAILED op | Named list — record type + record name + amount + [Retry] button |
| IN PROGRESS | Any SYNCING op | Aggregate count: "N change(s) uploading…" (not named per record) |
| QUEUED | Any PENDING op | Aggregate count: "N change(s) waiting for connection" |
| Last synced | Always | Locale-aware timestamp of most recent successful sync |
| Retry All Failed | Any FAILED op | Triggers retry on all FAILED operations at once |
| Force Sync Now | Device is online | Triggers an immediate sync pass (ignores normal sync interval) |

### Tap behavior per row

- **Conflict row [Resolve]:** Navigates to the affected record's detail screen, which shows the `ConflictResolutionCard` (`docs/ux/universal-screen-states.md §8`). Sheet dismisses.
- **Failed row [Retry]:** Initiates sync retry for that specific operation. Row state changes to Syncing in place. Sheet stays open.
- **[Retry All Failed]:** Initiates retry for all FAILED operations. All FAILED rows update to Syncing in place.
- **[Force Sync Now]:** Triggers an immediate full sync pass. The IN PROGRESS section appears for each operation.

### Inline retry panel (for InlineSyncBadge tap on Failed record)

When the user taps a "Sync failed" badge on a list row or detail screen (not from the SyncStatusSheet), a small inline panel appears below the badge:

```
Couldn't sync · Your data is safe.
[Retry]  [View Details]
```

- [Retry]: triggers a sync retry for that record only. Badge updates to Syncing.
- [View Details]: opens SyncStatusSheet filtered to this record.
- Panel dismisses on tap outside, or on state change.

---

## 8. Mutation Flow Sequence

This sequence defines exactly what the user sees from the moment they confirm a write until the record reaches a stable state.

### Scenario A — Online, sync succeeds

```
User confirms action (tap [Save] / [Approve])
  ↓
Local SQLite write completes (~50 ms)
  ↓
InlineSyncBadge: "Saved locally" (device icon, gray) — 2 s
  ↓
Sync queue entry created → PENDING
  ↓
InlineSyncBadge: "Syncing" (animated arrows, blue)
SyncIndicator: ↻ "Syncing…" (if >3 s)
  ↓
Cloud API accepts → SYNCED
  ↓
InlineSyncBadge: "Synced" (check circle, green) — 3 s → disappears
SyncIndicator: ✓ "Synced" — 3 s → hidden
  ↓
[Clean state — no badge, no indicator]
```

**Duration goal:** The full sequence from save to clean state should complete in under 5 s on a normal mobile data connection.

### Scenario B — Offline, queued

```
User confirms action
  ↓
Local SQLite write completes
  ↓
InlineSyncBadge: "Saved locally" (device icon) — 2 s
  ↓
OfflineBanner: "○ Working offline · Changes will sync"
Sync queue entry: PENDING (cannot attempt — no connection)
  ↓
InlineSyncBadge: "Queued" (clock, amber) — persists
SyncIndicator: ○ "Queued"
  ↓
[Connection returns]
  ↓
InlineSyncBadge: "Syncing" (animated arrows)
SyncIndicator: ↻ "Syncing…"
  ↓
Cloud API accepts → SYNCED
  ↓
InlineSyncBadge: "Synced" — 3 s → disappears
SyncIndicator: ✓ — 3 s → hidden
```

### Scenario C — Sync fails (retryable)

```
Cloud API returns error (network timeout, 5xx)
  ↓
Operation marked FAILED in sync queue
  ↓
InlineSyncBadge: "Sync failed" (triangle, red) — persists
SyncIndicator: ⚠ "Sync failed" — persists
  ↓
[User taps badge → inline panel]
"Couldn't sync · Your data is safe."
[Retry]  [View Details]
  ↓
User taps [Retry]
  ↓
InlineSyncBadge: "Syncing"
  ↓ (success)
InlineSyncBadge: "Synced" → disappears
```

### Scenario D — Conflict

```
Cloud API returns CONFLICT (409 / version mismatch)
  ↓
Operation marked CONFLICT in sync queue
  ↓
InlineSyncBadge: "Needs review" (merge icon, red) — persists
SyncIndicator: ! "Needs review" — persists
  ↓
[User taps badge → navigates to record detail]
ConflictResolutionCard shown blocking the record detail
  ↓
User resolves: [Keep this device] or [Use cloud version]
  ↓
Resolution dispatched to API
  ↓
CONFLICT → SYNCING → SYNCED
InlineSyncBadge: "Synced" → disappears
SyncIndicator: ✓ → hidden (if no other conflicts)
```

### Scenario E — Offline write, app restart

```
User creates a record while offline
  ↓
SQLite write succeeds; sync queue entry: PENDING
  ↓
User closes app
  ↓
[App restarted — security gate → restore local state]
  ↓
InlineSyncBadge: "Queued" (clock, amber) — persists
SyncIndicator: ○ "Queued"
  ↓
Connection available
  ↓
Sync proceeds as Scenario B
```

UI-UX §112: "The user should not lose a draft or queued operation because the application was closed." This sequence proves the design satisfies that rule.

---

## 9. Copy Bank

All copy strings used by sync state components. Each string must be localized into all 23 supported languages (Phase 15, in cooperation with Phase 16 localization work). English strings are the master here.

### SyncIndicator label strings

| State | Short label (header) |
|---|---|
| Queued | "Queued" |
| Syncing | "Syncing…" |
| Synced | "Synced" |
| Failed | "Sync failed" |
| Conflict | "Needs review" |

### InlineSyncBadge label strings

| State | Badge label |
|---|---|
| Saved locally | "Saved locally" |
| Queued | "Queued" |
| Syncing | "Syncing" |
| Synced | "Synced" |
| Failed | "Sync failed" |
| Conflict | "Needs review" |

### InlineSyncBadge expanded strings (tap → inline panel, Failed only)

| Copy element | String |
|---|---|
| Primary message | "Couldn't sync. Your data is safe." |
| Retry button | "Retry" |
| Details button | "View Details" |

### SyncStatusSheet strings

| Element | String |
|---|---|
| Sheet title | "Sync Status" |
| Done button | "Done" |
| CONFLICTS section header | "CONFLICTS" |
| FAILED section header | "FAILED" |
| IN PROGRESS section header | "IN PROGRESS" |
| QUEUED section header | "QUEUED" |
| In progress aggregate | "N change(s) uploading…" |
| Queued aggregate | "N change(s) waiting for connection" |
| Last synced label | "Last synced: [locale-aware timestamp]" |
| Never synced label | "Not yet synced — will sync when connected" |
| Retry all button | "Retry All Failed" |
| Force sync button | "Sync Now" |
| Resolve button (per conflict row) | "Resolve" |
| Retry button (per failed row) | "Retry" |
| Conflict row description | "[Record name] · Changed on this device and another device" |
| Failed row description (generic) | "[Record name] · [Record value]" |
| Failed row description (rejected) | "[Record name] · [Plain-language rejection reason]" |

### Offline transaction toast (replaces normal success toast when offline)

```
"✓ Saved to this device · Will sync when connection returns"
```

This string is used instead of the normal `ScreenSuccessState` toast when the device is offline and a write succeeds locally. It must never be shown when online — that would be confusing.

---

## 10. Financial Record Rules

Financial records (sales, payments, expenses, purchase orders, invoices, refunds) carry additional requirements beyond the standard sync state language.

### Rule F1 — Financial sync failure is always explicit

> A financial record that fails to sync must show "Sync failed" with the explicit confirmation "Your data is safe" in the expanded view. It must never show a generic error that leaves the user uncertain whether the financial write occurred locally.

**Pass:** "Couldn't sync · Your data is saved on this device"  
**Fail:** "Error occurred" (no data safety confirmation)

### Rule F2 — Financial conflicts are never auto-resolved

> A financial record in Conflict state must require explicit user resolution through the `ConflictResolutionCard`. The system must never silently pick "Use cloud version" or "Keep this device" for a financial field.

**Pass:** User sees both values side-by-side and explicitly taps [Keep this device] or [Use cloud version]  
**Fail:** System silently overwrites one version

### Rule F3 — Double-payment risk surfacing

> If the Conflict involves a payment amount and there is any risk that the same payment was recorded twice (both locally and from another device), the `ConflictResolutionCard` must show the warning: "If unsure, check your payment history before resolving."

**Source:** `docs/ux/universal-screen-states.md §8` financial conflict variant.

### Rule F4 — Financial sync state visible on list rows

> Every list screen that displays financial records (Sales list, Payments list, Expenses list, Invoices list) must show the `InlineSyncBadge` on any record that is not Synced. Financial list rows may not suppress the badge for visual compactness.

**Rationale:** UI-UX §230: "Never make the user wonder whether a business transaction was saved." The list view is where the owner first reviews the day's transactions. A badge must be visible here, not only on the detail screen.

### Rule F5 — No financial amount shown as Synced until cloud confirms

> A financial record must never display the "Synced" state (check-circle badge) until the cloud API has responded with a success status. Optimistic "Synced" display for financial records is prohibited.

**Rationale:** The local-first architecture writes to SQLite immediately (fast, always), but cloud sync is the authoritative committed state (DL-002). Showing "Synced" before cloud confirmation would mislead the owner into thinking a sale is confirmed when it hasn't reached the shared ledger.

---

## 11. Anti-Patterns

| Anti-pattern | Why prohibited | Correct approach |
|---|---|---|
| Inventing a 7th sync state in a specific module | Breaks the universal language; users can't form a mental model | Use one of the 6 defined states; use detail text to distinguish variants |
| Showing "Saved locally" when online (device is online, sync is immediate) | Misleads the user into thinking something is wrong with sync | "Saved locally" is only shown in the 2–3 s window before Syncing begins; skip it when sync is instantaneous |
| Showing "Synced" for financial records before cloud confirmation | Financial false confidence | Cloud confirmation required before Synced state for financial records (Rule F5) |
| Using only color to indicate sync state (no icon, no label) | Accessibility Rule A2.1 (Prompt 18): color alone is prohibited | Icon + label + color always. Never color alone. |
| Auto-resolving a Conflict without user action | UI-UX §111; financial integrity | All conflicts require explicit user resolution |
| Hiding "Sync failed" on list rows for visual tidiness | UI-UX §230; financial Rule F4 | Failed and Conflict badges are never suppressed on list rows |
| Showing a full-screen blocker while syncing | Syncing is background behavior | SyncIndicator only; never block content for sync |
| Dismissing the SyncStatusSheet on successful retry before the user sees the result | User needs to confirm that the retry worked | After retry succeeds, the row in SyncStatusSheet updates to Synced in place; sheet does not auto-dismiss |
| Different icons for the same sync state across different modules | Breaks icon-shape accessibility guarantee (non-color signal) | Same icon set everywhere; see the per-state table in §4 |
| Showing sync state for read-only screens | Read-only screens have no mutations to track | InlineSyncBadge and SyncIndicator are only mounted on screens where mutations can occur |

---

## 12. Quality Gate

Prompt 20 is complete when all of the following are true:

1. **6 sync states are fully specified** (§4): each has icon name, icon color, label text, badge background, non-color signal, duration, display location(s), tap behavior, and copy variants. No state is missing any of these fields.

2. **Two display locations are precisely defined** (§3, §5, §6): `SyncIndicator` (aggregate, header, Prompt 15-referenced component) and `InlineSyncBadge` (per-record, list rows and detail screens). No third location.

3. **Aggregate priority rule** is defined for `SyncIndicator` (§5): Conflict > Failed > Syncing > Queued > Synced (brief) > hidden. A device with mixed states shows the highest-priority state.

4. **SyncStatusSheet anatomy is specified** (§7) with all sections, row content, tap behavior, and action buttons. Named record entries for Conflict and Failed; aggregate counts for Syncing and Queued.

5. **5 mutation flow sequences** (§8) cover: online success, offline queued, sync failure/retry, conflict resolution, and app-restart with queued ops.

6. **Copy bank** (§9) lists every string used by all three components (`SyncIndicator`, `InlineSyncBadge`, `SyncStatusSheet`) in English. All strings require localization in all 23 languages.

7. **5 financial record rules** (§10) prohibit: vague failure messages, auto-resolution of financial conflicts, double-payment risk hiding, badge suppression on financial list rows, and optimistic Synced display before cloud confirmation.

8. **10 anti-patterns** (§11) are named with source rule citations and the correct approach.

9. **Accessibility compliance:** Every state in the per-state table (§4) has a named non-color signal (icon shape + label). `SyncIndicator` and `InlineSyncBadge` accessibility props are specified in §5 and §6.

10. **Reduced-motion variants** are specified for all animated elements: Syncing icon (static arrows + label), Synced fade (instant on/off), Saved locally (instant transitions).

---

*Produced under the Vepari AI master governance contract (Prompt 0). Phase 15 must implement this spec without re-designing any sync state. `SyncIndicator` and `InlineSyncBadge` are the exclusive sync state carriers — no other component may introduce sync state language.*
