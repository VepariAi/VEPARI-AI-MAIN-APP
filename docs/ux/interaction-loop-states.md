# Core Interaction Loop — UI States

**Phase:** 2 (UI/UX Foundation)
**Status:** Approved for Phase 2 planning
**Last updated:** 2026-08-31
**Depends on:** `docs/ux/navigation-model.md` (Prompt 12)
**Governing sources:** `Project Instructions.txt §9`; `AI OS.txt §21, §22, §56–61, §112–114`; `docs/decisions/knowledge-map.md §0.10`

---

## Sources

| Source | Content used |
|--------|-------------|
| `Project Instructions.txt §9` | 7-step interaction loop (OPEN → SPEAK → UNDERSTAND → CONFIRM → REMEMBER → ANALYZE → ACT) and the 12 system sub-steps |
| `AI OS.txt §21–22` | LISTENING and THINKING animation specs |
| `AI OS.txt §56–61` | Action confirmation, preview, execution, result, and failure |
| `AI OS.txt §112–114` | Thinking UX, trust model, response labels |
| `AI OS.txt §219` | Client-side state tracking (idle/listening/thinking/speaking/error/offline/syncing/executing/awaiting_confirmation) |
| `docs/decisions/knowledge-map.md §0.10` | 13 AI OS states confirmed in exact order |

---

## 1. The Two Models

The interaction loop and the AI OS state machine are **separate but aligned** concerns:

- **Interaction loop (`§9`):** A product-level 7-step mental model describing *what the system does* for the user.
- **AI OS state machine:** A technical/UX 13-state model describing *what UI state is rendered* at each moment.

This document maps each interaction-loop step to one or more AI OS states and to concrete screen components.

---

## 2. AI OS State Machine — Reference

Confirmed in `knowledge-map.md §0.10` and `AI OS.txt`. Security gate is non-negotiable before cinematic entrance.

```
                      ┌─────────┐
                      │ DORMANT │  ← app backgrounded / cold start
                      └────┬────┘
                           ↓
                    ┌────────────┐
                    │INITIALIZING│  ← app foreground, loading context
                    └─────┬──────┘
                           ↓
               ┌─────────────────────┐
               │ SECURITY_VERIFIED   │  ← biometric / PIN passed ✓
               └──────────┬──────────┘
                           ↓
                    ┌──────────┐
                    │AWAKENING │  ← cinematic entrance / briefing
                    └────┬─────┘
                          ↓
                    ┌──────────┐
                    │ANALYZING │  ← loading business context
                    └────┬─────┘
                          ↓
                      ┌───────┐
               ┌──────┤ READY ├──────┐
               │      └───────┘      │
               ↓                     ↓
          ┌─────────┐         (voice/text input)
          │LISTENING│
          └────┬────┘
               ↓
          ┌─────────┐
          │THINKING │
          └────┬────┘
               ↓
         ┌───────────┐
         │RESPONDING │  ← text/voice reply, no action needed
         └─────┬─────┘
               │         (if action required)
               ↓
      ┌──────────────────┐
      │  ACTION_REQUIRED │  ← confirmation card shown
      └────────┬─────────┘
               ↓ (user confirms)
          ┌──────────┐
          │EXECUTING │  ← API call in flight
          └────┬─────┘
               ↓
          ┌──────────┐
          │COMPLETED │  ← success result shown
          └──────────┘

  ERROR ← can be reached from LISTENING, THINKING, RESPONDING, EXECUTING
```

**Client-side tracking states** (`AI OS.txt §219`) that map 1-to-1 or many-to-one onto the 13 UI states:

| Client state | Maps to UI state |
|-------------|-----------------|
| `idle` | READY |
| `listening` | LISTENING |
| `thinking` | THINKING |
| `speaking` | RESPONDING |
| `awaiting_confirmation` | ACTION_REQUIRED |
| `executing` | EXECUTING |
| `error` | ERROR |
| `offline` | READY (degraded) |
| `syncing` | EXECUTING (background) |

---

## 3. Representative Example: Voice-Logged Sale

**Scenario:** The owner is on the Home screen. They tap the Voice tab and say:

> *"Ramesh Store ne aaj paanch kilo rice kharida, teen sau pachaas rupaye, cash mein."*
> (Hindi: "Ramesh Store bought 5 kg rice today, ₹350, cash.")

This is a **real, common MSME action**: recording a cash sale by voice in the owner's own language. It exercises all 7 interaction-loop steps.

---

## 4. Step-by-Step State Trace

### STEP 1 — OPEN

**Interaction loop step:** OPEN  
**AI OS states:** READY → LISTENING  
**Trigger:** User taps elevated Voice tab in bottom navigation

```
Screen: Home (before tap)
┌─────────────────────────────────────┐
│  VEPARI AI · AI OS ACTIVE           │
│  ─────────────────────────────────  │
│  Today's Overview                   │
│  Revenue ₹12,450  Expenses ₹3,200   │
│  ─────────────────────────────────  │
│  [ Talk to Vepari ]    ← dormant    │
│  ────── Quick Actions ──────────── │
│  Add Sale  Add Expense  + More      │
│─────────────────────────────────────│
│  [Home] [Trans] [ ● ] [Reports][···]│  ← Voice tab at rest
└─────────────────────────────────────┘
```

**After tap — AI OS overlay opens:**

```
Screen: Home + AI OS overlay (LISTENING state)
┌─────────────────────────────────────┐
│  ◌ ─── ◌ ─── ● ─── ◌ ─── ◌       │  ← waveform, reacts to audio
│                                     │
│         VEPARI IS LISTENING         │
│                                     │
│  ┌────────────────────────────┐     │
│  │  Tap to end · or just stop │     │
│  └────────────────────────────┘     │
│─────────────────────────────────────│
│  [Home] [Trans] [●pulse][Reports][···]│  ← Voice tab now pulsing
└─────────────────────────────────────┘
```

**What happens technically:**
- Voice tab registers tap → dispatches `AI_OS_ACTIVATE` event
- AI OS transitions: `READY → LISTENING`
- Sarvam Saaras STT session opens (websocket / streaming endpoint)
- Microphone hot; audio capture begins
- UI: waveform animation activates (§21), reacts to audio amplitude in real time

---

### STEP 2 — SPEAK

**Interaction loop step:** SPEAK  
**AI OS state:** LISTENING (continuing)  
**User action:** Owner speaks the utterance

```
Waveform reacts to speech amplitude:
◌ ─── ◯ ─── ● ─── ◯ ─── ◌   (quiet)
─── ●●● ─── ●●●●● ─── ●●● ───  (speaking)
```

**What happens technically:**
- Audio stream → Sarvam Saaras v3/v4 (23-language STT per DL-009)
- Saaras detects language in real-time: `hi-IN` (Hindi)
- Interim transcript renders below waveform as user speaks (streaming partial results)

```
┌────────────────────────────────────────┐
│  ◌ ─── ●●●●● ─── ◌                    │
│                                        │
│  "Ramesh Store ne aaj paanch kilo..."  │  ← interim transcript
│                                        │
│         VEPARI IS LISTENING            │
└────────────────────────────────────────┘
```

- End-of-utterance detection (silence threshold ~1.5 s) → audio stream closes
- Final transcript delivered: *"Ramesh Store ne aaj paanch kilo rice kharida, teen sau pachaas rupaye, cash mein."*

---

### STEP 3 — UNDERSTAND

**Interaction loop step:** UNDERSTAND  
**AI OS state transition:** LISTENING → THINKING  
**Visual:** Waveform fades; expanding rings / moving particles (§22)

```
Screen: AI OS overlay (THINKING state)
┌─────────────────────────────────────┐
│                                     │
│          ◎ ─── ◉ ─── ◎            │  ← expanding rings
│                                     │
│    Checking Ramesh Store...         │  ← status text (§112)
│    Identifying items...             │
│                                     │
│─────────────────────────────────────│
│  [Home] [Trans] [●pulse][Reports][···]│
└─────────────────────────────────────┘
```

**12 system sub-steps (`Project Instructions.txt §9`) executing:**

| Sub-step | Operation | Result |
|----------|-----------|--------|
| 1 | Capture voice | Audio stream: `hi-IN`, 4.2 s |
| 2 | Transcribe | *"Ramesh Store ne aaj paanch kilo rice kharida, teen sau pachaas rupaye, cash mein."* |
| 3 | Identify language | `hi-IN` (Hindi, confirmed) |
| 4 | Interpret intent | `INTENT: NEW_SALE` (confidence 0.97) |
| 5 | Extract business entities | customer=`Ramesh Store`, item=`Rice`, quantity=`5 kg`, amount=`₹350`, payment=`Cash`, date=`today` |
| 6 | Identify financial values | amount=`₹350`, tax=`0%` (rice is GST-exempt, §9 of GST 2.0 zero-rated list) |
| 7 | Determine required action | `POST /api/v1/sales` → new sale record |
| 8 | Business context lookup | Ramesh Store: EXISTS (Customer ID 42). Rice 5 kg: EXISTS (Product ID 17, price ₹70/kg → ₹350 ✓). Stock: 48 bags remaining |
| 9 | Confirmation required? | YES — financial action (§56) |
| 10 | Build action preview | Sale card for user review |
| 11–12 | (deferred to CONFIRM step) | — |

**Status text progression during THINKING (§112 — never expose chain-of-thought):**

```
"Checking Ramesh Store..."     (CRM lookup)
"Identifying items..."         (product lookup)
"Verifying price..."           (amount cross-check)
"Ready."                       (THINKING complete)
```

---

### STEP 4 — CONFIRM

**Interaction loop step:** CONFIRM  
**AI OS state transition:** THINKING → RESPONDING → ACTION_REQUIRED  
**Visual:** Action Preview card (§57) replaces rings; voice response plays

```
Screen: AI OS overlay (ACTION_REQUIRED state)
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────────┐  │
│  │  ACTION  [label per §114]     │  │
│  │                               │  │
│  │  Record Sale                  │  │
│  │  ─────────────────────────    │  │
│  │  Customer:   Ramesh Store     │  │
│  │  Item:       Rice 5 kg        │  │
│  │  Amount:     ₹350             │  │
│  │  Payment:    Cash             │  │
│  │  Date:       Today            │  │
│  │                               │  │
│  │  [   Cancel   ] [  Confirm  ] │  │
│  └───────────────────────────────┘  │
│                                     │
│─────────────────────────────────────│
│  [Home] [Trans] [●] [Reports][···]  │
└─────────────────────────────────────┘
```

**AI voice output (Sarvam Bulbul v3, `hi-IN`):**
> *"Ramesh Store ke liye paanch kilo rice ki sale record karoon, teen sau pachaas rupaye cash mein? Confirm karein."*
> (Confirm recording 5 kg rice sale to Ramesh Store for ₹350 cash?)

**Confirmation options:**
- **Tap "Confirm"** → proceeds to REMEMBER step
- **Tap "Cancel"** → AI OS returns to READY, overlay remains open
- **Voice "हाँ" / "Yes" / "Haan"** → treated as Confirm (voice confirmation active in RESPONDING state)
- **Voice "नहीं" / "No"** → treated as Cancel

**Trust signal:** The ACTION label (§114) is displayed prominently. The user always sees what the AI intends to do before it does it. The AI never silently performs financial actions (§9 mandate: *"The AI must not silently perform important financial actions without appropriate confirmation rules."*).

---

### STEP 5 — REMEMBER

**Interaction loop step:** REMEMBER  
**AI OS state transition:** ACTION_REQUIRED → EXECUTING  
**Trigger:** User taps "Confirm"

```
Screen: AI OS overlay (EXECUTING state)
┌─────────────────────────────────────┐
│                                     │
│          ◎ ─── ◉ ─── ◎            │  ← progress rings (subtle)
│                                     │
│         Saving sale...              │
│                                     │
│─────────────────────────────────────│
│  [Home] [Trans] [●] [Reports][···]  │
└─────────────────────────────────────┘
```

**Execution chain (`AI OS.txt §58`):**

```
User confirms
  ↓
AI OS → POST /api/v1/sales
  ↓
Permission check (owner role → sale:create ✓)
  ↓
Domain validation (customer exists, product exists, amount > 0)
  ↓
SQLite transaction written (local-first, DL-002)
  ↓
Sync queue entry created (operation_id, device_id, entity=sale, base_version, status=pending)
  ↓
Audit log entry written
  ↓
Result returned to AI OS
```

**Data written:**

```json
{
  "sale_id": "sale_20260831_0047",
  "customer_id": 42,
  "items": [{ "product_id": 17, "qty": 5, "unit": "kg", "price_per_unit": 70, "total": 350 }],
  "payment_method": "cash",
  "amount": 350,
  "tax_amount": 0,
  "date": "2026-08-31",
  "recorded_by": "voice",
  "source_transcript": "Ramesh Store ne aaj paanch kilo rice kharida...",
  "language": "hi-IN"
}
```

**AI memory update:**
- Ramesh Store: last_purchase updated → "Rice 5 kg, ₹350, 2026-08-31"
- Today's running sale total: ₹24,850 + ₹350 = ₹25,200

---

### STEP 6 — ANALYZE

**Interaction loop step:** ANALYZE  
**AI OS state:** EXECUTING (continuing; parallel post-transaction analysis)

**What the system computes while the user sees "Saving...":**

| Signal | Computation | Result |
|--------|-------------|--------|
| Today's sales total | Running sum recalculated | ₹25,200 |
| Inventory stock | Rice 5 kg product, 48 bags → −1 bag sold → 47 remaining | No low-stock trigger (min = 10) |
| Customer credit | Ramesh Store: cash sale, no credit balance change | No update needed |
| Sales trend | Rice sales this week: 8 entries → trending up | Feeds AI insights |
| Business intelligence refresh | Home screen metrics refresh queued | Revenue card will update on next Home render |

**Trigger evaluation:**
- Low stock? No (47 bags remaining, min = 10)
- Credit limit breach? No (cash sale)
- Unusual amount? No (consistent with Ramesh Store's ₹70/kg history)
- Analytics pipeline: rice sales frequency noted for weekly insight generation

---

### STEP 7 — ACT

**Interaction loop step:** ACT  
**AI OS state transition:** EXECUTING → COMPLETED

```
Screen: AI OS overlay (COMPLETED state)
┌─────────────────────────────────────┐
│                                     │
│            ✓  Done                  │  ← success indicator
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Sale recorded                │  │
│  │  Ramesh Store · ₹350 · Cash   │  │
│  │  Today's total: ₹25,200       │  │
│  │                               │  │
│  │  [View Sale] [Share Receipt]  │  │  ← optional follow-up actions
│  └───────────────────────────────┘  │
│                                     │
│─────────────────────────────────────│
│  [Home] [Trans] [●] [Reports][···]  │
└─────────────────────────────────────┘
```

**AI voice output (Bulbul v3, `hi-IN`):**
> *"Ho gaya. Ramesh Store ke liye teen sau pachaas rupaye ki sale record ho gayi. Aaj ki total bikri: pachchees hazaar do sau rupaye."*
> (Done. ₹350 sale to Ramesh Store recorded. Today's total sales: ₹25,200.)

**Post-completion options:**
| Action | Result |
|--------|--------|
| "View Sale" | Opens Sale detail screen (Transactions stack) |
| "Share Receipt" | Opens share sheet (WhatsApp / UPI / PDF) |
| Tap anywhere outside card | AI OS overlay dismisses; returns to Home |
| Voice "Record another" | AI OS returns to LISTENING immediately |

**Transactions list (visible on swipe or tab switch after dismissal):**

```
TRANSACTIONS                              Today
─────────────────────────────────────────────────
Ramesh Store          Rice 5 kg    ₹350   10:47 AM
  Sale · Cash · voice ●
```

The `voice ●` indicator shows this record was created by voice input, supporting future audit and trust review.

---

## 5. Complete State-Transition Table (This Example)

| # | Step | AI OS state (from → to) | Screen component | User action |
|---|------|------------------------|-----------------|-------------|
| 1 | OPEN | READY → LISTENING | Voice tab (elevated, pulsing); waveform overlay | Tap Voice tab |
| 2 | SPEAK | LISTENING | Waveform reacts; interim transcript renders | Speak utterance |
| 3 | UNDERSTAND | LISTENING → THINKING | Rings animation; status text progression | (none — system) |
| 4 | CONFIRM | THINKING → RESPONDING → ACTION_REQUIRED | Action Preview card; voice asks for confirmation | Hear/read summary |
| 5 | REMEMBER | ACTION_REQUIRED → EXECUTING | Progress indicator; "Saving sale..." | Tap Confirm |
| 6 | ANALYZE | EXECUTING (parallel) | No user-visible state change | (none — system) |
| 7 | ACT | EXECUTING → COMPLETED | Done card; voice confirmation; follow-up options | View result; optional next action |

---

## 6. Error Paths

**No hand-waved steps here either.** Every failure mode has a defined UI state.

### STT failure (LISTENING → ERROR)

```
LISTENING
  ↓ (Sarvam STT timeout / network loss)
ERROR
```

Display: *"I didn't catch that. Tap to try again."*  
Options: [Try again] [Type instead]  
AI OS transitions back to READY on user choice.

### Entity resolution failure (THINKING → RESPONDING, no action)

If `Ramesh Store` is not found in CRM:

```
THINKING
  ↓
RESPONDING (answer, no action)
```

Display: *"I heard a sale to Ramesh Store, but I couldn't find that customer. Would you like to add them first, or try a different name?"*  
Response label: **ESTIMATE** (§114) — not ACTION  
AI OS stays in RESPONDING; no sale is written.

### User cancels at CONFIRM (ACTION_REQUIRED → READY)

```
ACTION_REQUIRED
  ↓ (user taps Cancel or says "No")
READY
```

Display: Confirmation card dismissed. AI OS stays open.  
Voice: *"Okay, cancelled. What else can I help you with?"*  
No data is written. Safe to retry.

### Execution failure (EXECUTING → ERROR)

If the API call fails (network timeout, validation error):

```
EXECUTING
  ↓ (API error)
ERROR
```

Display (§111): *"I couldn't record that right now. Your data is safe. Try again."*  
The SQLite transaction is rolled back. The sync queue entry is not created.  
Options: [Try again] [View unsaved draft]

---

## 7. What the 7 Steps Map to in the App Architecture

| Step | User-facing layer | Technical layer |
|------|-------------------|-----------------|
| OPEN | Voice tab tap → AI OS overlay | `AI_OS_ACTIVATE` event; STT session open |
| SPEAK | Waveform; interim transcript | Sarvam Saaras streaming STT |
| UNDERSTAND | THINKING rings; status text | Intent classifier; entity extractor; CRM/product lookup; structured output |
| CONFIRM | ACTION_REQUIRED card; voice prompt | Structured output rendered as Action Preview (§57) |
| REMEMBER | EXECUTING indicator | `POST /api/v1/sales`; SQLite write; sync queue; audit log |
| ANALYZE | (background, no visible step) | Business intelligence recalc; stock trigger eval; memory update |
| ACT | COMPLETED card; voice result | Sale record persisted; Home metrics refresh queued; optional receipt |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| 13 AI OS states (authoritative) | `docs/decisions/knowledge-map.md §0.10`; `AI OS.txt` |
| Navigation model (how overlay sits over tabs) | `docs/ux/navigation-model.md §2` — Voice tab elevation and overlay rules |
| Sarvam STT/TTS language mapping | `docs/research/sarvam-language-coverage.md` (DL-009) |
| GST on rice (zero-rated) | `docs/research/accounting-compliance.md §GST Slabs` |
| Local-first write / sync queue | `docs/decisions/decision-log.md` — DL-002; `Database, Storage.txt` |
| Action confirmation rules | `AI OS.txt §56–61` |
| Trust model and response labels | `AI OS.txt §113–114` |
