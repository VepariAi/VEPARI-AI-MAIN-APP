# Journey Map — Offline Lifecycle

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/offline-sync-state-language.md` (Prompt 20)
**Governing sources:** `App Flow.txt §86–89`; `UI-UX.txt §243`

---

## Purpose

This document maps the complete offline lifecycle:

1. Operation performed offline → queued
2. Network returns → sync engine starts
3. Sync commits → conflict detection
4. Conflict branch — with a concrete real example (two devices editing the same customer's credit limit)
5. Resolution → confirmed state

**Core guarantee (App Flow §89):** The application must never silently discard a legitimate business operation. A queued operation survives app restarts, crashes, and extended offline periods.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `App Flow.txt` | §86 (Offline flow), §87 (Reconnect flow), §88 (Sync conflict flow), §89 (Sync failure flow), §90 (App restart flow), §91 (Crash during transaction), §92 (Crash during sync), §93 (AI offline flow) |
| `UI-UX.txt` | §243 (Complete Offline Flow) |
| `docs/ux/offline-sync-state-language.md` | 6 sync states and their display language |
| `docs/ux/universal-screen-states.md` | Offline and Conflict Universal States |

---

## 1. Offline Detection — How the App Knows It's Offline

```
App detects network change:
  · OS network callback reports no connectivity
  · Last API request failed with network error (not auth/server error)
  · Background sync failed consecutively

  ↓
Offline state activated:
  · Offline badge appears in header (all screens)
  · SyncIndicator: "Offline"
  · AI OS briefing: "Showing local data — sync when back online"
  · No user interruption — the owner continues their work normally
```

The app does **not** show a modal or block the UI on offline detection. It surfaces the Offline state indicator and lets work continue.

---

## 2. Full Offline Operation Path

```
─────────────────────────────────────────────────────────────────────
PHASE 1: OFFLINE DETECTED
  Network unavailable
  App remains fully usable for:
    · All read operations from local SQLite
    · Recording new transactions (sales, expenses, payments)
    · Stock adjustments and transfers
    · Adding/editing customers and suppliers
    · AI briefing (from local data cache)
    · Security (local PIN check — no network required)

  Not available offline:
    · OTP for PIN recovery
    · Cloud sync of new transactions
    · Real-time AI insights beyond local cache
    · Sending invoices/receipts by email or WhatsApp

─────────────────────────────────────────────────────────────────────
PHASE 2: OFFLINE OPERATION
  Owner performs a business operation — e.g., records a sale:

  Sales.Cart → Sales.Review → [Confirm sale]
    ↓
  Record written to local SQLite (atomic transaction)
    ↓
  Operation added to sync queue with:
    · operation_id (UUID — unique, idempotent)
    · operation_type: sale_created
    · payload: full record data
    · local_timestamp
    · device_id
    · sync_status: "queued"

  Receipt screen shows:
    ✓ Sale recorded — ₹4,200
    Saved locally · Syncing when connected   ← sync state indicator

  Stock, customer balance, local ledger — all updated immediately from
  local SQLite. The owner sees correct data without waiting for cloud.

─────────────────────────────────────────────────────────────────────
PHASE 3: QUEUE ACCUMULATES
  While offline, every write operation is added to the queue:
    · operation_id prevents duplicates on retry
    · Operations are ordered by local_timestamp
    · Queue survives app restart (durable, written to SQLite)

  Queue visibility (optional — owner can inspect):
    Settings → Sync → Pending operations
    Shows: operation type, timestamp, status (Queued / Failed)
```

---

## 3. Network Returns — Reconnect and Sync

```
─────────────────────────────────────────────────────────────────────
PHASE 4: NETWORK RETURNS
  OS network callback: connectivity restored
    ↓
  App transitions Offline badge → Syncing indicator
  SyncIndicator: "Syncing…" (animated)

─────────────────────────────────────────────────────────────────────
PHASE 5: SYNC ENGINE STARTS
  Sync queue processor wakes:
    · Reads queued operations in timestamp order
    · For each operation:
        POST /api/v1/sync/operations
        Body: { operation_id, operation_type, payload, local_timestamp, device_id }

─────────────────────────────────────────────────────────────────────
PHASE 6: SERVER VALIDATION
  For each operation, the server:
    1. Checks operation_id for idempotency (already processed? Return success, no duplicate)
    2. Validates the payload (data integrity, business rules)
    3. Checks for conflicts (same record modified on another device?)
    4. Commits if no conflict
    5. Pulls cloud changes since last sync

─────────────────────────────────────────────────────────────────────
PHASE 7: SUCCESSFUL SYNC (NO CONFLICT)
  Server responds: 200 OK
    · operation_id marked: sync_status = "synced"
    · Cloud confirmation received

  All synced records update:
    sync_status indicator: "Synced" (checkmark)

  SyncIndicator in header: "Last synced: 2:47 PM"
  Owner sees no disruption — their data is the same as before sync.

─────────────────────────────────────────────────────────────────────
PHASE 8: PULL CLOUD CHANGES
  After pushing local queue, the sync engine pulls:
    · Changes made by other devices/users while this device was offline
    · Applied to local SQLite without overwriting local-priority records
    · If a cloud change conflicts with a local change → Conflict branch (§4)
```

---

## 4. Conflict Branch — Concrete Example

**Scenario:** Two devices edit the same customer's credit limit while one is offline.

```
Setup:
  · Device A (owner's phone): online
  · Device B (manager's tablet): went offline at 2:00 PM

─────────────────────────────────────────────────────────────────────
2:05 PM — Device B (offline):
  Manager edits Priya Textiles credit limit
  Old value: ₹10,000
  Manager sets: ₹15,000
  Record written to local SQLite on Device B
  Sync queue: { operation_id: "op-b-1", field: credit_limit, value: 15000, timestamp: 14:05 }
  sync_status = "queued"
  Device B indicator: "Saved locally"

─────────────────────────────────────────────────────────────────────
2:20 PM — Device A (online):
  Owner edits the same customer's credit limit
  Old value: ₹10,000
  Owner sets: ₹20,000
  Record written to SQLite on Device A, syncs immediately
  Cloud record: credit_limit = 20000, last_modified_at: 14:20, device_id: device-a

─────────────────────────────────────────────────────────────────────
3:00 PM — Device B reconnects:
  Sync engine wakes on Device B
  Pushes op-b-1 to server:
    POST /api/v1/sync/operations
    { credit_limit: 15000, local_timestamp: 14:05 }

  Server conflict detection:
    · Cloud record: credit_limit = 20000, last_modified_at: 14:20
    · Incoming: credit_limit = 15000, local_timestamp: 14:05
    · Incoming timestamp is BEFORE cloud record → CONFLICT

  Financial Rule F2: Financial conflicts never auto-resolved.
  Credit limit is a financial field — server returns:
    HTTP 409 Conflict
    { conflict_type: "financial_field", field: "credit_limit",
      local_value: 15000, cloud_value: 20000,
      cloud_modified_at: "14:20", cloud_modified_by: "Rajesh (owner)" }
```

### 4.1 Conflict Notification — Device B

```
Conflict banner appears on Device B (non-blocking — does not freeze the UI):

  ┌────────────────────────────────────────────────────────┐
  │ ⚡ Sync conflict — 1 item needs your review           │
  │ Priya Textiles · Credit limit                   [→]   │
  └────────────────────────────────────────────────────────┘

Universal State: Conflict (Prompt 15 pattern applied)
```

### 4.2 Conflict Resolution Screen

```
Owner (or authorized user) opens the Conflict review:

  ┌────────────────────────────────────────────────────────┐
  │ Conflict: Priya Textiles — Credit Limit                │
  │ ────────────────────────────────────────────────────── │
  │  Your change (Device B, 2:05 PM):                     │
  │    Credit limit: ₹15,000                              │
  │    Changed by: Sanjay (manager)                       │
  │                                                        │
  │  Current cloud record (Device A, 2:20 PM):            │
  │    Credit limit: ₹20,000                              │
  │    Changed by: Rajesh (owner)                         │
  │ ────────────────────────────────────────────────────── │
  │  Which value should be kept?                           │
  │                                                        │
  │  [Keep ₹20,000 — cloud version]                       │
  │  [Keep ₹15,000 — your version]                        │
  │  [Enter a different value]                             │
  └────────────────────────────────────────────────────────┘
```

**Rules for financial conflict resolution:**
- Both values are shown with their authors and timestamps — no information is hidden
- The owner must make an explicit choice — no auto-resolution
- "Enter a different value" allows a third value to be saved (e.g., ₹17,500 as a negotiated limit)
- Resolution is logged in the Activity section: "Credit limit conflict resolved by Rajesh — kept ₹20,000 (2026-09-01 15:02)"

### 4.3 After Resolution

```
Owner taps [Keep ₹20,000 — cloud version]:
  ↓
Device B's local record updated: credit_limit = 20000
  ↓
Conflict record closed: sync_status = "resolved"
  ↓
Conflict banner dismissed
  ↓
SyncIndicator: "Synced"
```

---

## 5. Non-Financial Conflict — Auto-Resolution

Not all conflicts require human review. For non-financial fields (address, notes, tags):

```
Example: Two devices edit Priya Textiles' address simultaneously

  Device B: "123 Main Street" → "456 Park Avenue"
  Device A: "123 Main Street" → "123 Main Street, 2nd Floor"

  Server strategy: Last-write-wins for non-financial fields
    · Cloud record (Device A) was written at 14:20
    · Device B's change at 14:05 is older → auto-discarded
    · Device B receives the cloud version (456 ... no, wait)

  Actually, Device A's write was at 14:20, Device B's at 14:05.
  Server: Device A's 14:20 write is more recent → keep Device A.
  Device B's local address updated to "123 Main Street, 2nd Floor" silently.
  No conflict notification shown.
```

**Classification of auto-resolvable vs. human-required fields:**

| Field type | Strategy |
|------------|----------|
| Credit limit | Human review required (Financial Rule F2) |
| Outstanding balance | Human review required (Financial Rule F2) |
| Payment amounts | Human review required |
| Contact info (name, phone, address) | Last-write-wins |
| Notes / tags | Last-write-wins |
| Preferences / settings | Last-write-wins |
| Transaction records (sales, payments) | Each transaction is immutable — no merge possible; duplicates use operation_id deduplication |

---

## 6. Sync Failure — Retry and Escalation

```
─────────────────────────────────────────────────────────────────────
SYNC FAILURE PATH (App Flow §89)

  Push attempt → server error or timeout
    ↓
  Retry with exponential backoff:
    · Attempt 1: immediate
    · Attempt 2: 2 seconds
    · Attempt 3: 4 seconds
    · Attempt 4: 8 seconds
    · Then: 30-second intervals (up to 10 attempts)
    · Then: passive — retries resume when network status changes
    ↓
  After 10 failed attempts:
    sync_status = "failed"
    User-visible indicator:
      "Sync failed — 3 items not uploaded. [Retry] [Details]"

  [Details] shows:
    · Which operations failed
    · Error type (server rejected / network timeout / validation error)
    · Option to contact support or export the pending data

  Rule: The application NEVER silently discards a failed operation.
  The queue entry remains until the owner explicitly resolves it
  (retry succeeded, or owner acknowledges and cancels an operation).
```

---

## 7. App Restart and Queue Recovery

```
App terminated (background kill, OS restart, crash):
  ↓
Next app launch:
  App.Security → load local SQLite → recover sync queue

  Queue recovery:
    · Read all records with sync_status IN ("queued", "failed")
    · Resume sync if network available
    · No data loss — queue is written to durable SQLite before any response is shown

Crash during a transaction (App Flow §91):
  · Database transaction was not committed → SQLite rollback
  · No partial business record persists
  · On restart: the operation is not in the queue (it was never committed)
  · Owner may need to re-enter the record — AI briefing may prompt: "It looks like a sale was interrupted — want to continue?"

Crash during sync (App Flow §92):
  · operation_id is idempotent — re-sending a queued operation never creates a duplicate
  · Queue read on restart → already-committed operations return 200 OK and are marked synced
  · Not-yet-committed operations retry as normal
```

---

## 8. Offline AI Behavior (App Flow §93)

| AI capability | Offline behavior |
|---------------|-----------------|
| Daily briefing | Runs on local data — shows "Showing local data — sync when back online" |
| Question answering | Answers from local SQLite cache; notes if data may be stale |
| Action execution | Writes to local SQLite + queues action; shows "Saved locally" |
| Voice / STT | Saaras v3 requires connectivity; offline shows "Voice unavailable — type your question" |
| TTS (responses) | Bulbul v3 requires connectivity; text-only responses shown offline |
| Pattern detection | Runs on local data — works offline |
| Cloud-dependent insights | Not available; AI says "I'll have more context when you're back online" |

---

## 9. Sync State Indicators — Quick Reference

All sync states use the canonical language from `docs/ux/offline-sync-state-language.md`:

| State | Display text | Color |
|-------|-------------|-------|
| Saved locally | "Saved locally" | Amber |
| Queued | "Queued — will sync when connected" | Amber |
| Syncing | "Syncing…" | Blue (animated) |
| Synced | "Synced" | Green |
| Failed | "Sync failed — [Retry]" | Red |
| Conflict | "Conflict — review needed" | Orange |

---

## 10. Acceptance Criteria Verification

| Criterion (Prompt 30) | Met? | Evidence |
|---|:---:|---|
| Full offline lifecycle: operation → queued → network returns → sync → conflict (if any) → resolution → confirmed | ✓ | §2, §3, §4 |
| Conflict branch shown | ✓ | §4 |
| Concrete example: two devices editing same customer's credit limit | ✓ | §4 |
| Non-abstract — specific values, timestamps, actors | ✓ | §4 scenario |
| Sync failure path | ✓ | §6 |
| App restart and queue recovery | ✓ | §7 |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Sync state display language | `docs/ux/offline-sync-state-language.md` |
| Offline re-entry journey | `docs/ux/journey-returning-user.md` §7 |
| Universal States (Offline, Conflict) | `docs/ux/universal-screen-states.md` |
| Financial conflict rules (F2, F5) | `docs/ux/ai-action-confirmation-ux.md` |
