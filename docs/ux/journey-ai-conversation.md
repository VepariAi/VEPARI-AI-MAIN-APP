# Journey Map — AI Conversation

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/ai-action-confirmation-ux.md` (Prompt 19)
**Governing sources:** `UI-UX.txt §244`; `App Flow.txt §24–32`; `AI OS.txt`

---

## Purpose

This document maps the complete AI conversation journey end-to-end:

1. **Pure-answer path** — owner asks a question; AI retrieves, reasons, and responds with data and evidence
2. **Action path** — owner asks the AI to do something (or the AI recommends it); the flow goes through Approval → Execution → Result

Both paths share the same opening steps. They diverge at the "Respond" stage based on whether the AI's response carries an action proposal.

The "Talk to Vepari AI" chat example confirmed in Screens.png grounds both paths.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `UI-UX.txt` | §244 (Complete AI Flow), §163 (AI OS Overlay), §164 (AI OS Dismissal), §165 (AI OS Re-entry) |
| `App Flow.txt` | §24 (AI OS Interaction), §25 (AI Voice Flow), §26 (AI Chat Flow), §27 (AI Question Example), §28 (AI Insight Flow), §29 (AI Action Flow), §30 (AI Action Confirmation), §31 (AI Action Result), §32 (AI Evidence Flow) |
| `AI OS.txt` | 13-state machine; LISTENING / THINKING / RESPONDING / ACTION_REQUIRED / EXECUTING / COMPLETED states |
| `docs/ux/ai-action-confirmation-ux.md` | Action classification (ROUTINE / SIGNIFICANT / DESTRUCTIVE); AI action card anatomy |
| `docs/ux/ai-os-state-machine.md` | State transition rules |

---

## 1. How the Owner Enters AI Conversation

There are three entry modes. All three converge on the same conversation thread.

### Mode A — Voice tab (AIOS.Voice)

```
Owner taps Voice tab [center, elevated, 56dp]
  ↓
AI OS state: READY → LISTENING
  ↓
Microphone activates; waveform animation shown
  ↓
Owner speaks: "How was my business yesterday?"
  ↓
AI OS state: LISTENING → THINKING
```

### Mode B — Text input (AIOS.Chat)

```
Owner taps "Ask AI" or "Ask Vepari" text field
  ↓
Keyboard opens; conversation thread visible
  ↓
Owner types or dictates: "How was my business yesterday?"
  ↓
Owner sends message
  ↓
AI OS state: READY → THINKING
```

### Mode C — Contextual tap (from any screen)

```
AI insight card on Home / Customers.Detail / Briefing
  · "Why?" tapped on a briefing item
  · "Ask about this" tapped on a report card
  ↓
AI OS opens in context-aware mode:
  · The linked record is pre-loaded into AI context
  · First AI turn pre-populated with context: "Rajesh asked about: [record]"
  ↓
AI OS state: READY → THINKING
```

---

## 2. Shared Steps — Ask → Understand → Retrieve

These steps are identical across the pure-answer path and the action path.

```
─────────────────────────────────────────────────────────────────────
STEP 1: ASK
  Owner message received (voice or text)
  AI OS state: THINKING
  Displayed: pulsing thinking animation (or static indicator on reduced-motion)

─────────────────────────────────────────────────────────────────────
STEP 2: UNDERSTAND
  AI resolves intent:
    · Entity extraction: "yesterday" → date, "business" → this business's context
    · Query classification: QUESTION / ACTION_REQUEST / CLARIFICATION_NEEDED
    · Permission check: does this user have access to the data they're asking for?
      (Employee asking for owner-only financials → permission-denied branch, §6)

─────────────────────────────────────────────────────────────────────
STEP 3: RETRIEVE
  AI queries local SQLite:
    SELECT sales, expenses, payments
    WHERE date = yesterday
    AND business_id = current_business

  Data freshness check:
    · Last sync time compared to query date range
    · If stale (> 4 hours behind cloud): adds freshness indicator to response
    · Offline: response uses local-only data; offline indicator shown
```

---

## 3. Path A — Pure-Answer Path

**Trigger:** The AI's intent classification is QUESTION — the owner is asking for information, not requesting an action.

**Example:** "How was my business yesterday?"

```
─────────────────────────────────────────────────────────────────────
STEP 4A: RESPOND
  AI OS state: THINKING → RESPONDING

  AI composes response:
    · Lead fact: ₹18,200 in sales yesterday
    · Comparison: up 14% vs. last Tuesday
    · Important movement: Tata Salt 5 kg — 23 units sold (best day)
    · Reason (if detectable): Durga Puja proximity, higher footfall
    · Recommendation (optional): "Consider restocking Tata Salt before the weekend."

  Displayed in conversation thread:

  ┌──────────────────────────────────────────────────────┐
  │ Vepari AI                                    10:42   │
  │                                                      │
  │ Yesterday was a good day. ₹18,200 in sales —        │
  │ 14% above last Tuesday. Your best seller was         │
  │ Tata Salt 5 kg (23 units).                           │
  │                                                      │
  │ Expenses were ₹4,400. Net: ₹13,800.                  │
  │                                                      │
  │ 📊  [See full breakdown]                             │
  │                                                      │
  │ 💡 Tata Salt stock is now at 12 units — below       │
  │    your usual reorder level of 20.                   │
  │    [Reorder it →]                                    │
  └──────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────────────────────
STEP 5A: EVIDENCE
  "See full breakdown" expands inline:

  ┌──────────────────────────────────────────────────────┐
  │ Yesterday's sales breakdown                          │
  │ ─────────────────────────────────────────────────── │
  │ Tata Salt 5 kg      × 23   ₹5,520                   │
  │ Amul Gold 5 kg      × 12   ₹3,600                   │
  │ Basmati Rice 5 kg   × 8    ₹3,200                   │
  │ … 14 more products                [See all →]       │
  │ ─────────────────────────────────────────────────── │
  │ 4 customers  ·  12 transactions  ·  avg ₹1,517      │
  └──────────────────────────────────────────────────────┘

  Source is real data from local SQLite. The AI cites the date range and
  sync timestamp ("as of 10:40 AM sync"). No extrapolation.

─────────────────────────────────────────────────────────────────────
STEP 6A: RECOMMENDATION (optional tail)
  The AI may append a recommendation card — e.g., the low-stock alert above.
  A recommendation appears only when grounded in the retrieved data.

  Owner can:
    · Tap [Reorder it →] → enters Action path (§4)
    · Say "Yes, reorder it" → enters Action path (§4)
    · Say "No thanks" / dismiss → conversation ends; AI returns to READY

─────────────────────────────────────────────────────────────────────
AI OS state after pure-answer: RESPONDING → READY
  The conversation thread persists; the owner can ask a follow-up question.
```

---

## 4. Path B — Action Path

**Trigger:** The owner requests an action directly ("Reorder Tata Salt") OR taps the recommendation action shortcut ("Reorder it →") from a previous response.

**Example continuation:** Owner says "Reorder it" after the sales query above.

```
─────────────────────────────────────────────────────────────────────
STEP 4B: ACTION PROPOSAL
  AI OS state: THINKING → ACTION_REQUIRED

  AI composes an action card:

  ┌──────────────────────────────────────────────────────┐
  │ Vepari AI                                    10:43   │
  │                                                      │
  │ I'll create a purchase order for Tata Salt 5 kg.     │
  │                                                      │
  │ ┌─────────────────────────────────────────────────┐ │
  │ │  Create Purchase Order                          │ │
  │ │  ─────────────────────────────────────────────  │ │
  │ │  Product:   Tata Salt 5 kg × 30 units           │ │
  │ │  Supplier:  Hindustan Unilever (last used)      │ │
  │ │  Est. cost: ₹7,200 (last price ₹240/unit)       │ │
  │ │  Expected result: Stock → 42 units              │ │
  │ │  Impact: SIGNIFICANT (above ₹10,000 threshold?) │ │
  │ │           No — ₹7,200. Single confirm.          │ │
  │ │                                                 │ │
  │ │  [Create purchase order]    [Change details]    │ │
  │ └─────────────────────────────────────────────────┘ │
  │                                                      │
  │  [Not now]                                           │
  └──────────────────────────────────────────────────────┘

  Action card content (per ai-action-confirmation-ux.md):
    · action_type_label: "Create Purchase Order"
    · affected_records: "Tata Salt 5 kg × 30 units · HUL"
    · expected_result: "Stock increases to 42 units"
    · impact_level: ROUTINE (< ₹10,000)
    · approve_label: "Create purchase order"
    · cancel_label: "Not now"

─────────────────────────────────────────────────────────────────────
STEP 5B: APPROVAL
  Owner reviews action card.

  [ROUTINE — single confirm]
  · One tap on [Create purchase order] → proceeds to EXECUTING

  [SIGNIFICANT — two-step confirm (≥ ₹10,000)]
  · First tap → expands: "Confirm: Create purchase order for ₹12,000?"
  · Second tap on [Confirm] → proceeds to EXECUTING

  [DESTRUCTIVE — two-step + warning]
  · "This cannot be undone" warning shown
  · Two confirms required

  [Change details]
  · Opens `Purchases.NewPurchase` with fields pre-filled
  · Owner edits manually → saves there (not through AI action path)

  [Not now / Cancel]
  · Action card dismissed
  · AI OS state: ACTION_REQUIRED → READY
  · Conversation persists; AI says "Okay — let me know if you'd like to reorder later."

─────────────────────────────────────────────────────────────────────
STEP 6B: EXECUTION
  AI OS state: ACTION_REQUIRED → EXECUTING

  Executing indicator shown in conversation thread:
    "Creating purchase order…"  [animated indicator]

  Backend operations (sequenced):
    1. Write purchase order to local SQLite (EXECUTING state)
    2. Set sync_status = "queued"
    3. Post to sync queue (cloud sync)
    4. If cloud confirms: sync_status = "synced"

  Financial Rule F5: No optimistic "Synced" before cloud confirmation for
  financial records. The record shows "Saved locally — syncing" until cloud
  confirms.

─────────────────────────────────────────────────────────────────────
STEP 7B: RESULT
  AI OS state: EXECUTING → COMPLETED

  AI response in conversation thread:

  ┌──────────────────────────────────────────────────────┐
  │ Vepari AI                                    10:43   │
  │                                                      │
  │ ✓ Purchase order created.                            │
  │                                                      │
  │ ┌─────────────────────────────────────────────────┐ │
  │ │  PO #2024-089                                   │ │
  │ │  Tata Salt 5 kg × 30 units  ·  HUL              │ │
  │ │  ₹7,200  ·  Saved locally (syncing)             │ │
  │ │                              [View PO →]        │ │
  │ └─────────────────────────────────────────────────┘ │
  │                                                      │
  │ Anything else?                                       │
  └──────────────────────────────────────────────────────┘

  Audit record written:
    · Action type: purchase_order_created
    · Performed by: AI (on behalf of owner Rajesh)
    · Timestamp, device, AI session ID

  AI OS state: COMPLETED → READY
```

---

## 5. Evidence Drilling — "Why did you suggest this?"

From any AI recommendation or completed action, the owner can tap [Why?] or ask "Why did you suggest that?" to drill into the AI's reasoning.

```
Owner: "Why did you suggest reordering Tata Salt?"
  ↓
AI OS state: READY → THINKING → RESPONDING
  ↓
AI response:

  ┌──────────────────────────────────────────────────────┐
  │ Evidence: Restock suggestion                         │
  │ ─────────────────────────────────────────────────── │
  │ · Current stock: 12 units                           │
  │ · Your reorder level: 20 units                      │
  │ · Average daily sales (last 30 days): 4 units/day   │
  │ · Days until stock-out at current rate: ~3 days     │
  │ ─────────────────────────────────────────────────── │
  │ Data source: Sales movements · Last synced 10:40 AM │
  │                                    [View records →] │
  └──────────────────────────────────────────────────────┘
```

[View records →] navigates to `Inventory.MovementHistory` filtered to Tata Salt last 30 days.

No AI recommendation is presented without a defensible evidence chain in real business data (Rule B3, `briefing-prioritization.md`).

---

## 6. Permission-Denied Branch

When a team member (non-owner) asks the AI for data they don't have permission to see:

```
Employee Meena asks: "What is our total profit this month?"
  ↓
AI OS state: THINKING
  ↓
Permission check: Meena's role = Sales Staff — no access to Finance.Reports
  ↓
AI OS state: THINKING → RESPONDING
  ↓
AI response:

  ┌──────────────────────────────────────────────────────┐
  │ Vepari AI                                    14:22   │
  │                                                      │
  │ I can't share profit details with your current       │
  │ account access. You can see sales and inventory,     │
  │ but financial reports are available to the           │
  │ business owner only.                                 │
  │                                                      │
  │ If you need this information, ask Rajesh (owner)     │
  │ to share it with you or update your permissions.     │
  └──────────────────────────────────────────────────────┘
```

**Rules:**
- The AI explains what it cannot do and why — no silent failure or confusing non-answer
- The AI does not reveal what the data actually contains
- The AI does not suggest workarounds that would bypass authorization
- Backend authorization remains authoritative (UI-UX §183); the AI's refusal mirrors backend permission, never bypasses it
- The explanation matches the employee's context — it names the right owner without revealing sensitive info

---

## 7. Conversation Thread Persistence

The conversation thread remains visible across the conversation session:

| State | Thread behavior |
|-------|----------------|
| Owner taps away to another screen | Thread preserved; AI floating button visible |
| Owner returns to Voice tab | Thread shows full history from this session |
| Session ends (> 15 min background) | Thread cleared on next security-gate re-entry; new session starts |
| App backgrounded while LISTENING | AI stops listening (cannot hold mic in background); state → DORMANT |
| Offline | Thread persists locally; AI warns "Operating on local data — some answers may be limited" |

---

## 8. Conversation Entry Points Summary

| Entry | Context pre-loaded | AI OS opening state |
|-------|-------------------|---------------------|
| Voice tab tap | None (general) | LISTENING |
| "Ask AI" text tap | None (general) | READY (keyboard open) |
| "Why?" on briefing item | That briefing event | THINKING (processing context) |
| AI insight card "Ask about this" | That record | THINKING |
| Recommendation action shortcut | That recommendation context | ACTION_REQUIRED |
| Voice: "Ask Vepari" from any screen | Current screen context | LISTENING |

---

## 9. AI OS State Transitions — Full Map

```
READY
  ↓ [Owner speaks / types]
LISTENING (voice) or THINKING (text)
  ↓
THINKING [Understand → Retrieve → Reason]
  ↓
RESPONDING [Pure-answer path]
  OR
ACTION_REQUIRED [Action path — waiting for owner approval]
  ↓
EXECUTING [Approved action running]
  ↓
COMPLETED [Action done; result shown]
  ↓
READY [Next question or end of conversation]

ERROR (from any state):
  · Connection failure during EXECUTING → local write preserved, cloud retry queued
  · Data retrieval failure → "I couldn't retrieve that data. Try again?" [Retry]
  · Permission denied → explanation shown (§6 above)
  · STT failure → "I didn't catch that — could you say it again or type it?"
```

---

## 10. Acceptance Criteria Verification

| Criterion (Prompt 29) | Met? | Evidence |
|---|:---:|---|
| Full AI flow: Ask → Understand → Retrieve → Respond → Evidence → Recommendation → Action → Approval → Execution → Result | ✓ | §2, §3, §4 |
| Pure-answer path end-to-end | ✓ | §3 |
| Action path end-to-end | ✓ | §4 |
| "Talk to Vepari AI" chat example grounded | ✓ | §3 (sales query), §4 (reorder action) |
| Evidence drilling ("Why?") | ✓ | §5 |
| Permission-denied branch | ✓ | §6 |
| AI OS state transitions | ✓ | §9 |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| AI action card content contract | `docs/ux/ai-action-confirmation-ux.md` |
| AI OS 13-state machine | `docs/ux/ai-os-state-machine.md` |
| Briefing AI recommendations | `docs/ux/briefing-prioritization.md` §3 (Rule B3) |
| Team permission rules | `docs/ux/journey-team-management.md` |
| Offline AI behavior | `docs/ux/journey-offline-lifecycle.md` |
