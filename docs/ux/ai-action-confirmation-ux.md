# Vepari AI — AI Action Confirmation UX Pattern

> **Document:** `docs/ux/ai-action-confirmation-ux.md`  
> **Phase:** 2 — UX Architecture  
> **Type:** UI/UX  
> **Prompt:** 19  
> **Depends on:** Prompt 0 §0.10 (AI OS trust model)  
> **Sources:** AI OS.txt §55–61, §111–114, §154, §164–165; UI-UX §37–40, §234; `docs/ux/ai-os-state-machine.md` states 10–13  
> **Consumed by:** Prompt 46 — AI Action Card component implementation  
> **Status:** LOCKED — all AI-initiated actions in all modules must use this pattern  

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)  
2. [The Four-Phase Pattern](#2-the-four-phase-pattern)  
3. [AI Action Card Content Contract](#3-ai-action-card-content-contract)  
4. [Action Classification Table](#4-action-classification-table)  
5. [Phase Detail: PREVIEW (ACTION_REQUIRED)](#5-phase-detail-preview-action_required)  
6. [Phase Detail: CONFIRM](#6-phase-detail-confirm)  
7. [Phase Detail: EXECUTE (EXECUTING)](#7-phase-detail-execute-executing)  
8. [Phase Detail: RESULT (COMPLETED / ERROR)](#8-phase-detail-result-completed--error)  
9. [Permission Check Rule](#9-permission-check-rule)  
10. [Audit Trail Requirement](#10-audit-trail-requirement)  
11. [Voice Confirmation Path](#11-voice-confirmation-path)  
12. [AI Action Card Field Specifications](#12-ai-action-card-field-specifications)  
13. [Module Action Examples](#13-module-action-examples)  
14. [Anti-Patterns](#14-anti-patterns)  
15. [Quality Gate](#15-quality-gate)  

---

## 1. Purpose and Scope

Every action that the Vepari AI OS initiates on behalf of the user — financial write, record mutation, deletion, inventory adjustment, external integration call — must pass through a single reusable confirmation pattern before it executes. This document defines that pattern as a **content contract**: the required fields, the required states, and the required behaviors at each phase.

**Why a single pattern, not module-specific patterns:**

- AI OS.txt §20: "Every consequential AI action is auditable." Auditability requires a consistent event shape.
- UI-UX §234: "Never make consequential AI actions ambiguous." The user must know: What / Why / Impact / Approval / Result — in that order, in every module.
- AI OS.txt §113: The owner must always understand whether the AI is Reporting / Estimating / Recommending / Acting. The ACTION label on the confirmation card makes "Acting" explicit.
- Prompt 46 (AI Action Card component): one component implementation covering all modules. A module-specific variant would require a module-specific component.

**Scope:** This pattern applies to every action where the AI OS initiates a data write, deletion, or external call. It does NOT apply to:
- Navigation actions (AI navigating to a screen — no confirmation required)
- Read-only AI queries (returning data, no write)
- AI briefing cards and recommendation cards (separate patterns — UI-UX §35–37)

---

## 2. The Four-Phase Pattern

```
THINKING (AI determines action needed)
    ↓
PREVIEW — ACTION_REQUIRED
    AI Action Card rises: What / Affected records / Expected result
    [Approve] [Cancel]
    ↓ (user taps [Approve] or says "Yes / Haan / हाँ")
CONFIRM — threshold check
    (Financial significance / destructive / external) → show impact summary
    (Routine financial) → proceed directly
    ↓
EXECUTE — EXECUTING
    API dispatched via normal domain service
    Non-cancellable once in flight (financial integrity)
    ↓
RESULT — COMPLETED or ERROR
    COMPLETED: done summary + follow-up actions
    ERROR: plain-language failure + recovery options
```

**State machine references:** States 10 (ACTION_REQUIRED), 11 (EXECUTING), 12 (COMPLETED), 13 (ERROR) in `docs/ux/ai-os-state-machine.md`.

**The CONFIRM step** is not always a separate UI interaction — see §6 for when it collapses into PREVIEW and when it adds a second explicit confirmation.

---

## 3. AI Action Card Content Contract

Every AI Action Card instance — regardless of module — must carry exactly these six fields. No field may be omitted for actions that reach ACTION_REQUIRED.

| Field | Required | Content | Max length |
|---|---|---|---|
| **action_type_label** | Yes | What the AI is about to do. Verb phrase. In active language. | 40 chars |
| **affected_records** | Yes | The specific records that will be mutated. Named entities (customer name, product name, invoice number). Not "some records." | 3 lines |
| **expected_result** | Yes | The precise outcome if the user approves. Numbers must be shown. | 60 chars |
| **impact_level** | Yes | One of: ROUTINE / SIGNIFICANT / DESTRUCTIVE. Controls confirm step (§6). | enum |
| **approve_label** | Yes | The primary action button label. Specific, not generic. | 20 chars |
| **cancel_label** | Yes | The secondary action button label. Always "Cancel" in active language. | 20 chars |

**Two optional fields:**

| Field | When present | Content |
|---|---|---|
| **evidence_link** | When the action is AI-recommended (not user-initiated) | Tap to see the evidence/insight that led to this action |
| **undo_available** | When the action has a reversal path | Boolean; surfaced on the COMPLETED card, not here |

### Content rules for each field

**action_type_label** — must identify the domain action, not the AI intent:

| Correct | Incorrect |
|---|---|
| "Record Payment" | "Process your request" |
| "Create Invoice" | "Do this" |
| "Delete Customer" | "Remove" |
| "Adjust Stock Level" | "Update inventory" |

**affected_records** — must name the specific entities:

| Correct | Incorrect |
|---|---|
| "Customer: Arun Kumar — ₹2,500 outstanding" | "Customer account" |
| "Invoice #INV-2025-0042 — ₹18,000" | "The invoice" |
| "Product: Tata Salt 1kg — current stock: 12 units" | "A product" |

**expected_result** — must state the post-action state, not the action:

| Correct | Incorrect |
|---|---|
| "₹2,500 will be marked received; Arun's balance becomes ₹0" | "Payment will be recorded" |
| "Invoice #42 will be deleted permanently" | "The record will be removed" |
| "Stock will be reduced by 50 units (new total: 62 units)" | "Stock will be adjusted" |

**approve_label** — mirrors the action, never generic "OK" or "Yes":

| Action type | approve_label |
|---|---|
| Record payment | "Record Payment" |
| Create invoice | "Create Invoice" |
| Delete record | "Delete" |
| Adjust stock | "Adjust Stock" |
| Send to GST portal | "Submit to GST" |
| Create purchase order | "Create Purchase Order" |

---

## 4. Action Classification Table

Every AI-initiated action falls into one of three impact levels. The level determines whether CONFIRM is a single step or requires a second explicit interaction.

| Impact level | Definition | Examples | Confirm behavior |
|---|---|---|---|
| **ROUTINE** | Financial write with no deletion, no irreversibility, no external call. Fully reversible via the module's standard edit flow. | Record payment received, create sale, add expense, add customer, update product price | Single confirmation — PREVIEW card only. [Approve] goes directly to EXECUTE. |
| **SIGNIFICANT** | Financial write with large value (≥ ₹10,000), or multi-record mutation, or external integration call, or action that cannot be undone without a reversal entry (refund, credit note). | Record bulk payment, create invoice batch, file GST return, create purchase order, record refund | Two-step confirmation — PREVIEW card → [Approve] → impact summary screen → [Confirm Anyway] → EXECUTE. |
| **DESTRUCTIVE** | Permanent deletion of a record with no recovery path, or permanent cancellation of a financial document, or an action that removes data from the system permanently. | Delete customer, delete product, cancel invoice, void payment, wipe import data | Two-step confirmation with explicit destructive warning — PREVIEW card → [Approve] → RED impact summary with the word "This cannot be undone" → [Confirm Delete] / [Confirm Cancel] → EXECUTE. |

**Threshold note:** The ₹10,000 SIGNIFICANT threshold applies to individual action values. An action that creates 10 sales of ₹1,000 each (total ₹10,000) is ROUTINE unless the AI is creating them in a batch from a single confirmation. Batch creation of multiple records from one confirmation is always SIGNIFICANT regardless of per-record value.

---

## 5. Phase Detail: PREVIEW (ACTION_REQUIRED)

**AI OS state:** ACTION_REQUIRED (state 10, `docs/ux/ai-os-state-machine.md §10`)

**Entry:** AI THINKING determines a write is required and constructs the Action Card content contract (§3).

**Card anatomy:**

```
┌─────────────────────────────────────────┐
│  ⚡ ACTION                              │  ← AI OS trust label (§114)
│                                         │
│  action_type_label                      │  ← e.g., "Record Payment"
│  ─────────────────────────────────────  │
│  Affected                               │
│  affected_records (1–3 lines)           │  ← named entities, specific values
│                                         │
│  Result if approved                     │
│  expected_result                        │  ← post-action state, precise
│  ─────────────────────────────────────  │
│  [evidence_link if present]             │  ← "Why did you suggest this? ›"
│                                         │
│  ┌──────────────────┐  ┌─────────────┐ │
│  │   approve_label  │  │   Cancel    │ │  ← primary / secondary
│  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────┘
```

**Layout rules:**
- Card is a bottom sheet (spring physics, slides up from bottom edge)
- Background dimmed with a scrim — the tab bar is non-interactive while this card is visible
- The card does NOT cover the AI Core orb — the orb remains visible above the card in its alert-adjacent pulse
- Card max height: 60% of screen height. If content overflows, the card scrolls internally, not the page
- Approve button: `colors.ai` (the brand AI color, not green — approval of an AI action is not the same as a generic success)
- Cancel button: secondary style, never destructive red — cancellation is zero-cost here

**Interactive:**
- Tapping field values in `affected_records` opens read-only detail view of that record
- Tapping `evidence_link` opens evidence overlay (does not dismiss the card)
- Tapping scrim (outside card) = [Cancel] → READY
- Hardware back = [Cancel] → READY
- Voice: "Yes / Haan / हाँ / ஆம்" → confirm path; "No / Nahi / नहीं" → Cancel

**Timeout:** 60 seconds with no response → card auto-dismisses → READY. AI voice: "Okay, I've set that aside. Let me know when you're ready." No action is taken.

**Accessibility:** Card has `accessibilityViewIsModal={true}`. Focus is trapped within the card. Screen reader reads: action_type_label → affected_records → expected_result → Approve button → Cancel button. Voice activation works as above.

---

## 6. Phase Detail: CONFIRM

**When CONFIRM collapses into PREVIEW (no second step):**

Impact level = ROUTINE. User tapping [Approve] on the PREVIEW card goes directly to EXECUTING. No intermediate screen.

**When CONFIRM adds a second explicit step:**

Impact level = SIGNIFICANT or DESTRUCTIVE. User tapping [Approve] on the PREVIEW card shows a second confirmation screen before dispatching the API.

**SIGNIFICANT second confirmation screen:**

```
┌─────────────────────────────────────────┐
│  ← Back                    ACTION       │
│                                         │
│  [action_type_label]                    │
│                                         │
│  Impact summary                         │
│  ─────────────────────────────────────  │
│  What will change:                      │
│  • [specific financial change 1]        │
│  • [specific financial change 2]        │
│  • [external system effect if any]      │
│                                         │
│  This will create an entry in your      │
│  business records that can be reversed  │
│  with a [refund / credit note / etc.]   │
│                                         │
│  ┌──────────────────┐  ┌─────────────┐ │
│  │  Confirm [label] │  │    Cancel   │ │
│  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────┘
```

**DESTRUCTIVE second confirmation screen:**

```
┌─────────────────────────────────────────┐
│  ← Back                 ⚠ DESTRUCTIVE  │  ← amber/red header accent
│                                         │
│  [action_type_label]                    │
│                                         │
│  What will be deleted / cancelled:      │
│  • [specific records named]             │
│  • [financial impacts of deletion]      │
│                                         │
│  ┌─ This cannot be undone. ───────────┐ │  ← red border box
│  │ [Record name] will be permanently  │ │
│  │ removed from your business data.   │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────┐  ┌──────────┐ │
│  │  Delete [Record]    │  │  Cancel  │ │  ← destructive red / secondary
│  └─────────────────────┘  └──────────┘ │
└─────────────────────────────────────────┘
```

**Rules for the CONFIRM step:**
- The [Back] navigation on the CONFIRM screen returns to the PREVIEW card, not to READY. The user can change their mind without cancelling the whole action.
- The CONFIRM screen is not a new AI OS state — it is part of the ACTION_REQUIRED state. The AI Core remains in its alert-adjacent pulse.
- "This cannot be undone" text is mandatory on every DESTRUCTIVE confirmation screen. It may not be paraphrased, shortened, or moved below the fold.

---

## 7. Phase Detail: EXECUTE (EXECUTING)

**AI OS state:** EXECUTING (state 11, `docs/ux/ai-os-state-machine.md §11`)

**Entry:** User confirmed (final [Approve] or [Confirm] tapped / voice "Yes").

**What happens immediately on entry:**
1. `POST /api/v1/[domain-endpoint]` dispatched via the normal domain service (AI OS.txt §59 — the AI never bypasses the backend)
2. Local SQLite write queued (local-first: DL-002)
3. Sync queue entry created
4. Audit log entry created with: `ai_suggested=true`, `user_approved=true`, `action_type`, `affected_record_ids`, `timestamp_approved`, `user_id`, `session_context_ref`

**UI during EXECUTING:**
- Status text appears below the AI Core: "[Verb]-ing [noun]..." (e.g., "Recording payment...", "Saving invoice...", "Adjusting stock...")
- Subtle progress bar below the status text
- No full-screen blocking overlay — the user may navigate away; execution continues in background
- **The action area is locked** — no cancel button is present. This is intentional: a confirmed financial write cannot be interrupted mid-flight (financial integrity). If the user needs to reverse the action, that is a Return / Refund / Void flow after COMPLETED.

**If user navigates away during EXECUTING:**
- Execution continues in background
- A `SyncIndicator` badge appears in the app header (EXECUTING state)
- When the result arrives: if successful → push notification "Done: [action summary]"; if failed → push notification "Couldn't complete [action] — tap to retry"

**If app backgrounds during EXECUTING:**
- The API call is in-flight. Execution continues.
- On return: COMPLETED or ERROR card is shown immediately if the result arrived while backgrounded

---

## 8. Phase Detail: RESULT (COMPLETED / ERROR)

### COMPLETED (AI OS state 12)

**Entry:** API returned success. Data written locally and queued for cloud sync.

**COMPLETED card anatomy:**

```
┌─────────────────────────────────────────┐
│  ✓ Done                                 │  ← green ✓ on AI Core; card header
│                                         │
│  action_type_label (past tense)         │  ← e.g., "Payment Recorded"
│  ─────────────────────────────────────  │
│  Summary                                │
│  [What was done, specific values]       │  ← mirrors expected_result, as fact
│                                         │
│  [undo_available badge if true]         │  ← "Undo available for 60 s ›"
│  ─────────────────────────────────────  │
│  ┌──────────────────┐  ┌─────────────┐ │
│  │  [Primary next]  │  │   Dismiss   │ │
│  └──────────────────┘  └─────────────┘ │
│  [Add Another]                          │  ← tertiary, below buttons
└─────────────────────────────────────────┘
```

**Required content on COMPLETED card:**

| Field | Content | Required |
|---|---|---|
| Summary (past tense) | What was done + the final values | Yes |
| Primary next action label | Context-specific (e.g., "View Sale", "Share Receipt", "Open Invoice") | Yes |
| Undo badge | "Undo available for 60 s" with countdown — present only when `undo_available=true` | Conditional |
| [Add Another] | Shortcut to start the same action type again | Yes |
| [Dismiss] | Dismisses card → READY | Yes |

**AI voice on COMPLETED:** "Done. [Action summary]. [Running context if relevant]." Plain language (AI OS.txt §60). Never technical. Never a confirmation number.

**Auto-dismiss:** Card auto-dismisses after 8 seconds. The completed record is accessible via Home → Recent Activity. No information is lost.

**Undo window (when undo_available=true):**
- 60-second window from action completion
- Undo is only available for ROUTINE and some SIGNIFICANT actions where a single inverse API call fully reverses the effect
- DESTRUCTIVE actions never have an undo window — the "This cannot be undone" warning on the CONFIRM screen is the gate
- If the user taps "Undo": the reverse API call is dispatched (same EXECUTING flow); on success, COMPLETED shows "Undone: [action] has been reversed"

### ERROR (AI OS state 13)

**Entry:** API returned error, or execution timed out, or validation failed.

**ERROR card anatomy:**

```
┌─────────────────────────────────────────┐
│  ⚠ Couldn't Complete                   │  ← amber ⚠ on AI Core
│                                         │
│  Plain-language explanation             │  ← never a technical error string
│  [what failed + why, if known]          │
│                                         │
│  Your data is safe. [No write occurred] │  ← always present
│  ─────────────────────────────────────  │
│  ┌──────────────────┐  ┌─────────────┐ │
│  │    Try Again     │  │  Go Back    │ │
│  └──────────────────┘  └─────────────┘ │
│  [View Details] (expandable, optional)  │  ← technical detail, opt-in
└─────────────────────────────────────────┘
```

**Error message rules:**
- Never show: error codes, stack traces, HTTP status codes, provider error strings
- Always show: what the user was trying to do + a plain-language reason + "Your data is safe"
- Recovery options must be present: [Try Again] and [Go Back] always; [Type instead] when the failure was STT

**Error message examples:**

| Failure type | Display message |
|---|---|
| Network offline | "I couldn't record that right now — no connection. Your data is safe. Try again when you're back online." |
| API validation failure | "I couldn't create that invoice — it seems the customer account needs a GST number first. Go to their profile to add it." |
| Permission denied | "You don't have permission to delete records. Ask your account owner to grant access." |
| Duplicate record | "This payment may already be recorded. Check Arun's payment history before trying again." |
| Server error | "Something went wrong on our side. Your data is safe. Try again in a moment." |
| Timeout | "That took too long and I've timed out. Your data is safe — nothing was saved. Try again." |

---

## 9. Permission Check Rule

**Source:** UI-UX §39; AI OS.txt §164–165

The permission check occurs during THINKING, before ACTION_REQUIRED is entered. The flow is:

```
THINKING
 ↓
AI determines action
 ↓
Permission check against user's role
 ↓ (fails)
RESPONDING (not ACTION_REQUIRED)
"This action requires [permission name]. Ask [Owner / Admin] to grant access."
[Request Access button — routes to Settings → Permissions]
```

**A user who lacks permission never sees the ACTION_REQUIRED card for that action.** The permission gate is upstream. This is not an error state — it is an expected response to a valid request by an unauthorized user.

**Role permission matrix (examples):**

| Action | Owner | Manager | Sales Staff | Inventory Staff |
|---|---|---|---|---|
| Record payment | ✅ | ✅ | ✅ (own sales) | ❌ |
| Create invoice | ✅ | ✅ | ✅ | ❌ |
| Delete customer | ✅ | ✅ | ❌ | ❌ |
| Adjust stock | ✅ | ✅ | ❌ | ✅ |
| File GST return | ✅ | ❌ | ❌ | ❌ |
| Delete product | ✅ | ✅ | ❌ | ❌ |
| View financial reports | ✅ | ✅ | ❌ | ❌ |

Role definitions are configured per business in Settings → Team → Permissions. The matrix above is the default; enterprise accounts may customize it.

---

## 10. Audit Trail Requirement

**Source:** AI OS.txt §154, §20

Every action that passes through this pattern must generate an audit trail entry at the moment of EXECUTING entry (before the API call, not after). The audit entry must capture:

| Audit field | Value | Required |
|---|---|---|
| `audit_id` | UUID | Yes |
| `event_type` | `ai_action_confirmed` | Yes |
| `action_type` | Value of `action_type_label` | Yes |
| `affected_record_ids` | Array of all record IDs named in `affected_records` | Yes |
| `expected_result_snapshot` | Value of `expected_result` at confirmation time | Yes |
| `impact_level` | `ROUTINE / SIGNIFICANT / DESTRUCTIVE` | Yes |
| `ai_suggested` | `true` (all actions through this flow are AI-initiated) | Yes |
| `user_approved` | `true` (only written after explicit approval) | Yes |
| `user_id` | ID of the user who tapped [Approve] | Yes |
| `role_at_approval` | Role of that user at approval time | Yes |
| `timestamp_suggested` | When THINKING generated the action | Yes |
| `timestamp_approved` | When the user tapped [Approve] | Yes |
| `timestamp_executed` | When the API call returned | Yes (written on completion) |
| `outcome` | `COMPLETED / ERROR` | Yes (written on completion) |
| `error_type` | Error classification if outcome=ERROR | Conditional |
| `undo_used` | `true/false` if undo was available and used | Conditional |
| `session_context_ref` | Reference to the AI session context that generated this action | Yes |

The audit trail must be immutable (append-only). No audit entry may be deleted or modified after writing, including by the AI OS. Audit log access is Owner-only by default; Enterprise can grant Manager access.

---

## 11. Voice Confirmation Path

**Source:** UI-UX §171; AI OS.txt §55; `docs/ux/ai-os-state-machine.md §10`

Voice confirmation is an equal-weight path to touch confirmation. It must be supported on every AI Action Card.

**Voice confirmation flow:**

```
ACTION_REQUIRED card visible
    ↓
User says: "Yes" / "Haan" / "हाँ" / "Aam" / "ஆம்" / "Avunu" / "Oui" (etc.)
    → same as tapping [Approve]
    → CONFIRM step if SIGNIFICANT/DESTRUCTIVE
    → EXECUTING if ROUTINE

User says: "No" / "Nahi" / "नहीं" / "Illai" (etc.)
    → same as tapping [Cancel]
    → READY

User says: "What does this do?" / "Explain" / "Why?"
    → AI reads out the expected_result field
    → Card remains; user can still approve or cancel
```

**Voice confirmation rules:**
- Positive affirmations in all 23 supported languages must be recognized — not only Hindi and English
- Negative responses in all 23 supported languages must be recognized
- If voice recognition is unclear during ACTION_REQUIRED: AI responds "I didn't catch that. Say Yes to confirm, or No to cancel" — does not auto-cancel
- A voice "Yes" during SIGNIFICANT/DESTRUCTIVE triggers the second CONFIRM screen; the user must tap [Confirm] on that screen — voice cannot bypass the second confirmation screen for DESTRUCTIVE actions

**Voice on COMPLETED:** After a successful action, the AI delivers the result in the user's active language (TTS if the language is in the 11-language Bulbul set; text + gentle audio cue if in the 12-language STT-only set — per DL-009 rules).

---

## 12. AI Action Card Field Specifications

This section provides the implementation contract for Prompt 46 (AI Action Card component).

### Component name
`AIActionCard`

### Required props

```typescript
interface AIActionCardProps {
  // Content contract (§3)
  actionTypeLabel: string;          // max 40 chars; localized
  affectedRecords: AffectedRecord[]; // 1–3 items
  expectedResult: string;           // max 60 chars; localized
  impactLevel: 'ROUTINE' | 'SIGNIFICANT' | 'DESTRUCTIVE';
  approveLabel: string;             // max 20 chars; localized; verb-specific
  cancelLabel: string;              // max 20 chars; localized; always "Cancel" equivalent

  // Callbacks
  onApprove: () => void;
  onCancel: () => void;

  // Optional
  evidenceLink?: {
    label: string;
    onPress: () => void;
  };
  undoAvailable?: boolean;          // shown on COMPLETED card, not here
}

interface AffectedRecord {
  entityType: string;               // e.g., "Customer", "Invoice", "Product"
  entityName: string;               // e.g., "Arun Kumar", "#INV-042", "Tata Salt 1kg"
  detail: string;                   // e.g., "₹2,500 outstanding", "18 units in stock"
  recordId: string;                 // for audit trail and tap-to-detail
}
```

### AI OS state dependency

`AIActionCard` is only rendered when the AI OS is in `ACTION_REQUIRED` state. The component must not be rendered independently of the state machine. The component's lifecycle must be tied to the state machine transition: mounting = entering ACTION_REQUIRED; unmounting = exiting ACTION_REQUIRED.

### Layout constraints

| Property | Value |
|---|---|
| Presentation | Bottom sheet (slides up from screen bottom) |
| Max height | 60% of screen height |
| Overflow behavior | Internal scroll within card; page does not scroll |
| Background | Scrim (dim) behind card; tab bar non-interactive |
| Approve button style | `colors.ai` background, white label |
| Cancel button style | Secondary (border only), no destructive color |
| DESTRUCTIVE approve button | Red background, white label |

### Accessibility

| Element | accessibilityLabel | accessibilityRole |
|---|---|---|
| Card container | `[actionTypeLabel] — confirmation required` | `dialog` |
| Approve button | `[approveLabel]` | `button` |
| Cancel button | `Cancel [actionTypeLabel]` | `button` |
| Affected record row | `[entityType]: [entityName], [detail]` | — |
| Evidence link | `Why did the AI suggest this?` | `link` |

The card must set `accessibilityViewIsModal={true}` so screen readers do not read content behind the scrim.

---

## 13. Module Action Examples

These examples show how the content contract is populated across different modules. Each uses the exact same `AIActionCard` component.

### Finance — Record Payment

```
action_type_label: "Record Payment"
affected_records:
  - { entityType: "Customer", entityName: "Arun Kumar", detail: "₹2,500 outstanding" }
expected_result: "₹2,500 marked received. Arun's balance becomes ₹0."
impact_level: ROUTINE
approve_label: "Record Payment"
```

### Finance — File GST Return

```
action_type_label: "Submit GST Return"
affected_records:
  - { entityType: "Period", entityName: "October 2025", detail: "GSTR-1 · 14 invoices · ₹2,40,000 taxable" }
expected_result: "GSTR-1 submitted to GST portal. Cannot be revised after filing."
impact_level: SIGNIFICANT
approve_label: "Submit to GST"
```

### Inventory — Adjust Stock

```
action_type_label: "Adjust Stock Level"
affected_records:
  - { entityType: "Product", entityName: "Tata Salt 1kg", detail: "Current: 12 units" }
expected_result: "Stock reduced by 8 units. New total: 4 units. Low-stock alert will trigger."
impact_level: ROUTINE
approve_label: "Adjust Stock"
```

### CRM — Delete Customer

```
action_type_label: "Delete Customer"
affected_records:
  - { entityType: "Customer", entityName: "Raju Traders", detail: "3 open invoices · ₹12,000 outstanding" }
expected_result: "Raju Traders removed permanently. Outstanding invoices will be unlinked."
impact_level: DESTRUCTIVE
approve_label: "Delete Customer"
```

### Operations — Create Purchase Order

```
action_type_label: "Create Purchase Order"
affected_records:
  - { entityType: "Supplier", entityName: "Manoj Distributors", detail: "3 products · estimated ₹18,500" }
expected_result: "PO created and sent to Manoj Distributors. ₹18,500 pending payable logged."
impact_level: SIGNIFICANT
approve_label: "Create Purchase Order"
```

### Voice-initiated — Record Bulk Payment

```
action_type_label: "Record Bulk Payment"
affected_records:
  - { entityType: "Customer", entityName: "Priya Stores", detail: "₹8,000 outstanding" }
  - { entityType: "Customer", entityName: "Suresh & Sons", detail: "₹4,200 outstanding" }
  - { entityType: "Customer", entityName: "Kavitha Textiles", detail: "₹11,000 outstanding" }
expected_result: "3 payments recorded. Total: ₹23,200 received. All 3 balances clear to ₹0."
impact_level: SIGNIFICANT
approve_label: "Record All Payments"
evidence_link: { label: "Why these 3?", onPress: showEvidence }
```

---

## 14. Anti-Patterns

These patterns are explicitly prohibited. Any screen or module that implements one of these is non-conformant with this spec.

| Anti-pattern | Why prohibited | Correct approach |
|---|---|---|
| Generic "OK" or "Yes" as approve_label | UI-UX §40: Never hide consequential actions behind ambiguous buttons | Use a verb-specific label: "Record Payment", "Delete", "Submit" |
| Approval that proceeds to a second action without a new card | Chaining hidden actions — the user approved one thing, not two | Each distinct action requires its own AI Action Card |
| Showing the ACTION_REQUIRED card for navigation actions | Navigation has no financial consequence | No card for navigate-only AI actions |
| Allowing cancel after EXECUTING begins | Financial integrity — an in-flight write cannot be safely interrupted | [Cancel] is only on the PREVIEW/CONFIRM screens; lock the action area during EXECUTING |
| Hiding the expected_result until after approval | User must know the outcome before approving | expected_result is required on the PREVIEW card, not only COMPLETED |
| Dismissing the CONFIRM screen on hardware back to READY | The user chose "Back" — they should return to PREVIEW, not lose the whole flow | [Back] on CONFIRM → PREVIEW card (still in ACTION_REQUIRED) |
| Bypassing the pattern for "simple" actions | Consistency is the contract; Prompt 46 implements one component | Use ROUTINE impact level — it collapses to a single card, which is already minimal |
| Showing technical error strings (HTTP codes, stack traces) | AI OS.txt §111 | Plain-language error + "Your data is safe" + recovery options |
| Auto-approving an action without explicit user confirmation | The AI OS may suggest, never act without approval | Every write requires a user tap or voice confirmation |
| Writing to the database before the user approves | Audit integrity — audit entry records "user_approved=true" only after approval | No writes occur until EXECUTING is entered |

---

## 15. Quality Gate

Prompt 19 is complete when all of the following are true:

1. **Content contract has 6 required fields and 2 optional fields** (§3), each with a named content rule and a correct/incorrect example table.

2. **Action classification covers 3 impact levels** (ROUTINE / SIGNIFICANT / DESTRUCTIVE) with distinct confirm behaviors and a defined ₹10,000 threshold for the SIGNIFICANT boundary.

3. **Four-phase pattern** (PREVIEW → CONFIRM → EXECUTE → RESULT) is specified for all combinations: ROUTINE (3 phases, single confirmation), SIGNIFICANT and DESTRUCTIVE (4 phases, two confirmations).

4. **AI Action Card anatomy diagram** is provided for PREVIEW, COMPLETED, and ERROR — with exact field placement, button labels, and layout constraints sufficient for a component engineer to implement without further design input.

5. **TypeScript interface** (`AIActionCardProps`) is provided with exact prop names, types, and constraints, ready for Prompt 46.

6. **Permission gate** is specified as an upstream THINKING-phase check — unauthorized users never reach ACTION_REQUIRED.

7. **Audit trail** specifies 16 required fields including: `ai_suggested`, `user_approved`, `timestamp_approved`, `role_at_approval`, `outcome`, and `undo_used`.

8. **Voice confirmation path** covers all 23 languages (positive and negative affirmations), handles unclear input without auto-cancelling, and prohibits voice-only bypass of DESTRUCTIVE second confirmation.

9. **6 module examples** (Finance payment, GST return, Inventory, CRM delete, Operations PO, Voice bulk) demonstrate the content contract populated across different domains.

10. **Anti-patterns table** lists 10 prohibited patterns with the source rule and the correct alternative.

---

*Produced under the Vepari AI master governance contract (Prompt 0). Phase 5 Prompt 46 (AI Action Card component) must implement this spec directly — no deviation without a new Decision Log entry.*
