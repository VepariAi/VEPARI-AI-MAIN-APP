# AI OS State Machine — Visual and Behavioral Specification

**Phase:** 2 (UI/UX Foundation)
**Status:** Approved for Phase 2 planning
**Last updated:** 2026-08-31
**Depends on:** `docs/decisions/knowledge-map.md §0.10` (13 states confirmed); `docs/ux/interaction-loop-states.md` (Prompt 13)
**Governing sources:** `AI OS.txt §4–5, §16–25, §56–61, §111–113, §124, §139–142`; `UI-UX.txt §125, §163–165`

---

## Sources

| Source | Sections used |
|--------|---------------|
| `AI OS.txt §4–5` | Security gate (non-negotiable); cinematic entrance sequence |
| `AI OS.txt §16–25` | Central AI Core; core states; physics; motion principle; idle/listening/thinking/speaking/alert animations |
| `AI OS.txt §56–61` | Action confirmation, preview, execution, result, failure |
| `AI OS.txt §111–113` | Conflict UX; AI OS restart UX; loading states |
| `AI OS.txt §124` | AI OS transitions (context transforms, not abrupt switches) |
| `AI OS.txt §139–142` | Accessibility; reduced-motion; performance states; resource management |
| `UI-UX.txt §125` | Motion accessibility — AI OS must remain usable without animation |
| `UI-UX.txt §163–165` | AI OS overlay; dismissal; re-entry |
| `docs/decisions/knowledge-map.md §0.10` | 13 states confirmed in exact order |

---

## Motion Language Vocabulary

All animation in the AI OS draws from the following vocabulary. No state may invent new motion language.

| Element | Behavior | Physics (`§18`) |
|---------|----------|-----------------|
| **AI Core rings** | Layered concentric rings around the central glyph | depth, spatial layering, scale |
| **Particle field** | Fine particles orbiting the AI Core | momentum, inertia |
| **Waveform** | Audio-reactive amplitude bars | responsive motion |
| **Glow depth** | Radial light emanating from AI Core center | blur, opacity |
| **Breathing** | Subtle scale oscillation (~0.98→1.02, ~3 s period) | spring |
| **Ambient rotation** | Slow ring rotation (~360° per 30 s) | momentum |

**Motion principle (`§19`):** Movement → State → Meaning. No animation exists for aesthetic reasons alone. Every motion communicates a state change.

**Reduced-motion rule (`UI-UX.txt §125`, `AI OS.txt §140`):** Every animated property must have a static fallback. The AI OS must remain fully functional and legible without any animation. Reduced-motion variants are specified in each state below.

---

## State Reference Table

| # | State | AI Core visual | Tappable? | Duration |
|---|-------|---------------|-----------|----------|
| 1 | DORMANT | Not rendered | No | Until app foreground |
| 2 | INITIALIZING | Not yet visible | Minimal | Until context loaded |
| 3 | SECURITY_VERIFIED | Brief flash | No (transitional) | ~300 ms |
| 4 | AWAKENING | Cinematic entrance | Skip only | 1.5–3 s |
| 5 | ANALYZING | Formed + subtle pulse | Skip | Until briefing ready |
| 6 | READY | Breathing + ambient rotation | All | Until input |
| 7 | LISTENING | Waveform-reactive | Stop + Cancel | Until utterance ends |
| 8 | THINKING | Expanding rings + particles | Cancel only | Until AI responds |
| 9 | RESPONDING | Rhythmic TTS-reactive | Stop speech | Until TTS ends |
| 10 | ACTION_REQUIRED | Alert-adjacent; card prominent | Confirm/Cancel only | Until user acts |
| 11 | EXECUTING | Gentle pulse | Navigate away | Until API returns |
| 12 | COMPLETED | Success animation | Next actions + Dismiss | 8 s or until dismissed |
| 13 | ERROR | Error pulse | Try Again + Go Back | Until user acts |

---

## State Specifications

Each state entry defines: entry condition · visual/motion · tappable elements · exit conditions · interruption behavior · reduced-motion fallback.

---

### 1. DORMANT

**Entry condition:** App is not in the foreground. No active session. Cold start before the security gate. AI OS has never been initialized in this app session.

**Visual / motion:** AI Core is not rendered. No animation. The app may show a splash screen, or no screen (background process).

**Tappable:** None — AI OS has no visible presence.

**Exit conditions:**
- App brought to foreground → INITIALIZING

**Interruption behavior:** N/A — there is nothing to interrupt.

**Reduced-motion fallback:** N/A (no animation in this state).

---

### 2. INITIALIZING

**Entry condition:** App foreground; session starting; loading business context from local SQLite; checking for cached AI context.

**Visual / motion:**
- Background environment elements begin to stabilize (subtle fade-in of background layer)
- AI Core: not yet visible — the visual "container" forms first
- No spinner — the visual preparation itself communicates loading
- Status: none shown to user (this is infrastructure, not user-facing)

```
                [Background environment]
                  ↕ opacity 0→0.3
                [Container ring]
                  ↕ scale 0.8→1.0
```

**Tappable:** Minimal. Navigation is suppressed. Splash screen or last-seen content shown as background; the user cannot yet interact with AI OS features.

**Exit conditions:**
- Context loaded + security check not required (returning user within session timeout) → SECURITY_VERIFIED → AWAKENING
- Context loaded + security check required → security gate (PIN/biometric prompt)
- Security gate passed → SECURITY_VERIFIED

**Interruption behavior:** Cannot be skipped. Security gate must complete. If user presses hardware back button: app moves to background → DORMANT.

**Reduced-motion fallback:** Skip all fade/scale animations. Go directly to security gate or SECURITY_VERIFIED with no visual transition.

---

### 3. SECURITY_VERIFIED

**Entry condition:** Biometric/PIN/security-flow completed successfully. This is confirmed by the security module; AI OS.txt §4 states this gate is non-negotiable and AI OS must never bypass it.

**Visual / motion:**
```
Security Complete  (brief confirmation text, ~300 ms)
       ↓
Environment stabilizes  (background fully visible)
       ↓
→ immediately transitions to AWAKENING
```
Duration: ~300 ms. This is a transitional checkpoint, not a resting state.

**Tappable:** None — too brief for interaction.

**Exit conditions:**
- Immediately → AWAKENING (no user action required)

**Interruption behavior:** Cannot be interrupted. Too brief. Hardware back = cancel session → DORMANT.

**Reduced-motion fallback:** No visual change; immediate transition to AWAKENING without any animation.

---

### 4. AWAKENING

**Entry condition:** Post-SECURITY_VERIFIED. The cinematic entrance sequence begins.

**Visual / motion (from `AI OS.txt §5`):**

```
Entrance sequence (1.5 s full · 3 s extended):
  1. Spatial visual elements appear     (particles fade in, depth layers activate)
  2. AI Core forms                      (rings scale from 0 → full size, spring physics)
  3. AI OS rises into interface         (core translates up from center-bottom, spring easing)
  4. AI Core glows to full depth        (opacity + blur settle)
  5. Greeting / briefing begins         (text fades in below AI Core)
```

Character: **cinematic · responsive · intelligent · physical · premium · spatial** (`AI OS.txt §5`). Not a loading animation — a deliberate entrance.

**AI Core visual:** Rings forming, particles orbiting, glow depth building. Full motion language active.

**Tappable:**
- [Skip entrance] — tap anywhere on the AI Core or dedicated skip affordance to jump immediately to ANALYZING
- No other interactive elements during entrance

**Exit conditions:**
- Entrance animation completes → ANALYZING
- User taps [Skip] → ANALYZING immediately

**Interruption behavior:** Tap anywhere skips the remainder of the entrance animation. AI OS snaps immediately to ANALYZING state (no partial animation). Subsequent sessions: entrance duration can be shortened after the first run (returning-user experience).

**Reduced-motion fallback:** No entrance animation. AI Core appears at full opacity/size immediately. The text greeting fades in over 200 ms (opacity only, no motion). No ring formation, no particle animation, no spring.

---

### 5. ANALYZING

**Entry condition:** Post-AWAKENING. Business context loading: sales since last session, outstanding payments, stock levels, alerts, AI briefing content.

**Visual / motion:**
- AI Core: fully formed, subtle pulse (scale ±0.5%, 2 s period)
- Status text below AI Core (§112 pattern — no chain-of-thought):

```
  "Good morning, Arun."          (greeting appears)
  "Checking your business..."    (context loading)
  "Preparing your briefing..."   (brief assembly)
```

- Briefing card appears when ready: "While You Were Away" screen (§25, §169)

**Tappable:**
- [Continue] / [View Briefing] on briefing card → exits ANALYZING to READY
- [Skip briefing] → jumps directly to READY
- Navigation tabs: available but dimmed; tapping skips briefing and goes to the tapped module

**Exit conditions:**
- User taps [Continue] on briefing card → READY
- User taps [Skip] → READY
- User taps a navigation tab → READY (briefing available as notification or card)
- Context load fails → ERROR (with message "Couldn't load your business summary")

**Interruption behavior:** Any tap outside the briefing card is treated as "Skip briefing." Briefing content is saved and surfaced as a card on Home for later review. AI OS enters READY without blocking.

**Reduced-motion fallback:** No pulse animation. Text appears at full opacity. Briefing card fades in (200 ms opacity only).

---

### 6. READY

**Entry condition:** Business context loaded; briefing complete or skipped. AI OS is active and awaiting input.

**Visual / motion (§17 Idle / §20):**
- AI Core: breathing animation (scale ±2%, ~3 s period, spring easing)
- Ambient rotation: rings rotate slowly (~360° per 30 s)
- Glow depth: steady, full brightness
- Particle field: calm, low-velocity orbit

```
READY visual rhythm:
  ◎ ← slow ambient rotation, gentle breathing
  Rings at rest but alive
  Particle field: calm orbit
```

**Tappable:** All navigation. All Quick Actions. All business module entries. Voice button. Chat input. The AI Core itself (tap = shortcut to Voice mode).

**Exit conditions:**
- User taps Voice button / AI Core → LISTENING
- User submits text input → THINKING
- Incoming notification alert (significant business event) → brief ALERT sub-state → returns to READY with alert card
- User navigates to a business screen → AI OS persists as overlay (§163), continues at READY

**Interruption behavior:** READY is the resting state; it is not interruptible. Any user action is an exit, not an interruption.

**Reduced-motion fallback:** Static AI Core. No breathing, no rotation, no particle movement. Glow at steady 80% opacity. AI Core is visually distinct but still.

---

### 7. LISTENING

**Entry condition:** User taps Voice button / AI Core; or long-hold from other screens. STT session opens with Sarvam Saaras.

**Visual / motion (§21):**

```
Voice
 ↓
Waveform   (audio-amplitude bars, real-time)
 ↓
AI Core reacts  (rings pulse with audio energy; expands on louder input)
```

- Waveform: horizontal bars below AI Core, react in real-time to microphone amplitude
- AI Core rings: expand and contract with audio energy (louder speech = larger ring expansion)
- Label: "VEPARI IS LISTENING" below waveform
- Interim transcript: appears below label as Sarvam returns partial results
- Voice tab in navigation: elevated button pulses (pulsing ring per `docs/ux/navigation-model.md §2`)

**Tappable:**
- AI Core or waveform → [Tap to stop] (stops listening, processes utterance so far)
- [×] button (top-right) → cancel entirely → READY
- Bottom navigation tabs → dimmed but tappable; tap = cancel listening → READY → navigate

**Exit conditions:**
- End-of-utterance silence (~1.5 s) → STT closes → THINKING
- User taps [Stop] → STT closes → THINKING (processes what was captured)
- User taps [×] → STT cancelled → READY (no processing)
- User taps navigation tab → cancel → READY → navigate
- Network drops / STT error → ERROR

**Interruption behavior:**
- Tap [×] or navigation tab: STT session cancelled immediately. No partial result is processed. AI OS returns to READY with no side effects.
- Hardware back button: equivalent to [×]. Cancel, return to READY.
- App backgrounds: STT session closes. On return, AI OS returns to READY (not LISTENING — microphone should not be hot in background).

**Reduced-motion fallback:** Static waveform bar (no real-time animation). Solid block indicator at microphone icon showing it is active. "LISTENING" label with static underline indicator.

---

### 8. THINKING

**Entry condition:** Utterance received from LISTENING, or text submitted from chat input. STT transcript delivered. AI processing begins (language ID, intent, entity extraction, context lookup, response generation).

**Visual / motion (§22):**

```
Expanding rings:   rings grow outward from AI Core center, fade at edge, repeat
Moving particles:  particle field increases velocity; more erratic orbits
Contextual indicator: subtle pulse on AI Core center
Status text (§112 — no chain-of-thought):
  "Checking Ramesh Store..."
  "Identifying items..."
  "Verifying price..."
```

- Rings expand continuously (not a single burst — sustained motion throughout THINKING)
- Particle velocity: higher than READY, lower than LISTENING
- Label changes: status text updates every 1–2 s to reflect the current step (visible text, not hidden)

**Tappable:**
- [Cancel] button (explicitly visible below status text) → cancels AI request → READY
- Navigation tabs: dimmed but tappable; tap = cancel → READY → navigate

**Exit conditions:**
- AI returns answer (text/voice only) → RESPONDING
- AI determines action required → ACTION_REQUIRED
- AI request fails / timeout → ERROR
- User taps [Cancel] → READY
- User taps navigation → READY → navigate

**Interruption behavior:**
- Tap [Cancel] or navigation: in-flight LLM request cancelled immediately. No partial response shown. Any extracted entities are discarded. AI OS returns to READY with no side effects.
- Financial safety: If the system had already begun entity resolution (looked up customer, product), that lookup is discarded. No write has occurred.
- Hardware back: equivalent to [Cancel].

**Reduced-motion fallback:** Rings do not animate. Static concentric ring display. Particle field static. Status text appears and updates normally. Text is the primary communication of THINKING state.

---

### 9. RESPONDING

**Entry condition:** AI has a complete answer that requires no user action (answer, insight, or estimate — not an action). TTS begins via Sarvam Bulbul.

**Visual / motion (§23):**

```
AI core responds rhythmically to generated speech.
```

- AI Core ring oscillation: matches TTS audio amplitude (similar to LISTENING but output-driven, not input-driven)
- Waveform: output-side bars appear below AI Core (distinct color from LISTENING waveform)
- Response transcript: text of the response appears below waveform as TTS plays (streaming, not all-at-once)
- Response label: AI response labeled per §114 (FACT / INSIGHT / ESTIMATE / RECOMMENDATION)

**Tappable:**
- AI Core or waveform: [Tap to stop] — stops TTS immediately; text remains visible
- Response text: selectable/copyable after TTS ends
- Suggested next actions (if AI includes them): tap to proceed
- Navigation tabs: tappable; tap = stop TTS → READY → navigate

**Exit conditions:**
- TTS completes → READY (response card remains visible; user can re-read, act, or dismiss)
- User taps [Stop] → TTS stops; text stays; READY
- User taps suggested action → ACTION_REQUIRED (if action) or navigation
- User taps navigation tab → TTS stops → READY → navigate

**Interruption behavior:**
- Tap anywhere on AI Core / waveform: TTS stops immediately mid-sentence. The response text card stays visible. READY state. User can read the remainder.
- Navigation tap: same — TTS stops, response saved as a card the user can return to.
- Hardware back: TTS stops, dismiss response, READY.
- No information is lost on interruption: the full response text is always preserved.

**Reduced-motion fallback:** No rhythmic animation. Response text appears immediately (no word-by-word reveal). Static AI Core. Label appears above text block.

---

### 10. ACTION_REQUIRED

**Entry condition:** AI has determined an action that requires explicit user confirmation (`AI OS.txt §56`). Financial actions, deletions, refunds, major inventory adjustments, and external integration actions always require confirmation.

**Visual / motion:**

```
THINKING rings fade
 ↓
Action Preview card rises (bottom-sheet style, spring physics)
 ↓
AI Core: alert-adjacent state (warm pulse, slightly more intense glow)
 ↓
Background dims slightly (scrim behind card)
```

- Action Preview card (`AI OS.txt §57`): prominently displays action type, entities, amounts
- Action label: ACTION (per §114) on the card
- AI Core continues a low-intensity pulse (communicates "waiting for you")

**Tappable:**
- [Confirm] button on card → EXECUTING
- [Cancel] button on card → READY
- Individual field values on the card (to review details; read-only)
- Voice: "हाँ" / "Yes" / "Haan" → EXECUTING; "नहीं" / "No" / "Cancel" → READY
- **Navigation tabs: NOT tappable** — ACTION_REQUIRED is modal. Tapping outside the card = [Cancel] → READY. The tab bar is dimmed and non-interactive.

**Exit conditions:**
- User taps [Confirm] or says "Yes/Haan/हाँ" → EXECUTING
- User taps [Cancel] or says "No/Nahi/नहीं" → READY
- User taps outside card (scrim) → [Cancel] → READY
- Hardware back → [Cancel] → READY
- Timeout (60 s with no response) → card dismisses → READY; AI voice: "Okay, I've cancelled that. Let me know when you're ready."
- Network drops during wait → ERROR (card stays; user warned; [Try when connected] offered)

**Interruption behavior:**
- Tap outside card = cancel. No action is taken. No write occurs. Safe to retry.
- The word "Cancel" or "No" by voice also dismisses.
- This is the last point before irreversible financial writes begin. Cancellation here has zero cost.

**Reduced-motion fallback:** Card appears at full opacity (no slide-in animation). Scrim appears immediately. Confirm and Cancel buttons always visible. No pulse on AI Core.

---

### 11. EXECUTING

**Entry condition:** User confirmed action (from ACTION_REQUIRED). API call dispatched (`POST /api/v1/…`).

**Visual / motion:**

```
Action Preview card fades/transforms to progress state
AI Core: gentle, continuous pulse (not urgent — communicates "working")
Status text: "Saving sale..."  "Recording payment..."  "Updating stock..."
```

- No blocking overlay. Content behind is still visible.
- Progress indication is subtle — not a full-screen loader (`AI OS.txt §113`).
- The action area shows a progress bar beneath the status text.

**Tappable:**
- Most navigation is available — user can navigate away. Execution continues in background.
- [View progress] indicator in header (SyncIndicator state: EXECUTING) — tap to see details
- **Action area itself is locked** — cannot [Cancel] once executing begins (financial integrity; `AI OS.txt §59` — AI uses normal backend APIs, not direct DB manipulation)

**Exit conditions:**
- API success → COMPLETED
- API error → ERROR
- User navigates away → execution continues in background; result surfaced via notification or SyncIndicator when done
- App backgrounds → execution continues; result delivered on return

**Interruption behavior:**
- User navigating away does not cancel execution. The API call is in flight; the sale/payment/record will either succeed or fail and the result will be surfaced.
- This is intentional: a sale is not un-sold because the user went to another screen. The sync queue ensures result visibility.
- If the user needs to undo a completed action, that is a separate Return/Refund flow — not a cancel of execution.

**Reduced-motion fallback:** Static progress bar (not animated). Status text only. No pulse on AI Core.

---

### 12. COMPLETED

**Entry condition:** Action API call succeeded. Data written to local SQLite; sync queue entry created; audit log written.

**Visual / motion (§17 Success):**

```
AI Core: success animation (rings briefly bloom outward, then settle)
 ↓
✓ indicator appears on AI Core center
 ↓
COMPLETED card surfaces (from below, spring physics)
 ↓
AI voice delivers result
```

- Success is brief and confident: not prolonged celebration, not a subtle toast that gets missed
- COMPLETED card shows: what was done, key figures, follow-up actions (§60 pattern)

**AI voice:** *"Done. [Action summary]. [Running context total]."*

**Tappable:**
- [Primary next action] on card (e.g., [View Sale], [Share Receipt])
- [Add Another] shortcut
- [Dismiss] / tap anywhere outside card → READY
- Navigation tabs: tappable → dismiss card → navigate

**Exit conditions:**
- User taps follow-up action → navigation or new flow
- User taps [Dismiss] or outside → READY
- Auto-dismiss after 8 s → READY (card remains accessible as "recent activity" on Home)
- User says "Record another" → LISTENING immediately

**Interruption behavior:** COMPLETED is itself the end-state. Any tap dismisses the card. No information is lost — the record has already been saved. The transaction persists regardless of how quickly the card is dismissed.

**Reduced-motion fallback:** No bloom animation. ✓ icon appears at full opacity. Card appears at full opacity (no spring). Auto-dismiss still occurs at 8 s.

---

### 13. ERROR

**Entry condition:** Any state → ERROR on failure. Error type classified per `AI OS.txt §190`:

| Error type | Possible source states |
|-----------|----------------------|
| Offline | LISTENING, THINKING, EXECUTING |
| Provider (Sarvam/LLM) | LISTENING, THINKING, RESPONDING |
| Permission | THINKING, EXECUTING |
| Validation | THINKING, ACTION_REQUIRED, EXECUTING |
| Conflict | EXECUTING |
| Internal | Any |

**Visual / motion (§24 Alert):**

```
AI Core: warm amber/red pulse (2–3 pulses, then settles to steady amber glow)
 ↓
Error card surfaces (not a full-screen takeover)
 ↓
AI Core: steady amber (communicates "needs attention, but recoverable")
```

- Error card follows the Universal Error State spec (`docs/ux/universal-screen-states.md §4`)
- AI voice: plain-language explanation (`AI OS.txt §111`): "I couldn't record that right now. Your data is safe. Try again."
- **Never:** "500 Internal Server Error" or technical strings (`AI OS.txt §111`)

**Tappable:**
- [Try Again] → returns to the appropriate prior state (LISTENING if STT error; THINKING if LLM error; EXECUTING if API error)
- [Type instead] → opens text chat (if STT failed)
- [Go Back] / [Dismiss] → READY
- [View Details] → expands error explanation
- Navigation tabs: tappable → dismiss error → navigate → READY

**Exit conditions:**
- User taps [Try Again] → LISTENING / THINKING (context preserved where possible)
- User taps [Dismiss] / navigation → READY
- Unrecoverable error (e.g., auth expired): dismissing routes to security gate

**Interruption behavior:** ERROR is terminal for the failed operation. The user is never stranded — [Go Back] and navigation tabs are always active. Any tap on [Try Again] initiates a fresh attempt.

**Reduced-motion fallback:** No pulse. Amber static glow on AI Core. Error card at full opacity. Icon (⚠) replaces animation.

---

## Transition Rules

### Valid transitions (all others are invalid)

```
DORMANT         → INITIALIZING (app foreground)
INITIALIZING    → SECURITY_VERIFIED (auth passed)
SECURITY_VERIFIED → AWAKENING (immediate)
AWAKENING       → ANALYZING (entrance complete or skipped)
ANALYZING       → READY (briefing complete/skipped)
READY           → LISTENING (voice input)
READY           → THINKING (text input)
LISTENING       → THINKING (utterance complete)
LISTENING       → READY (cancel/×)
LISTENING       → ERROR (STT failure)
THINKING        → RESPONDING (answer, no action)
THINKING        → ACTION_REQUIRED (action needed)
THINKING        → READY (cancel)
THINKING        → ERROR (AI failure)
RESPONDING      → READY (TTS complete or stopped)
RESPONDING      → ACTION_REQUIRED (suggested action tapped)
ACTION_REQUIRED → EXECUTING (confirmed)
ACTION_REQUIRED → READY (cancelled)
EXECUTING       → COMPLETED (success)
EXECUTING       → ERROR (failure)
COMPLETED       → READY (dismissed / auto-dismiss)
COMPLETED       → LISTENING (voice "Record another")
ERROR           → LISTENING (Try Again from LISTENING error)
ERROR           → THINKING (Try Again from THINKING error)
ERROR           → READY (dismissed)
Any state       → ERROR (failure at any point)
Any state       → DORMANT (app backgrounds)
```

### Re-entry from DORMANT

When app returns from background, entry point depends on elapsed time:
- < 15 minutes: INITIALIZING → SECURITY_VERIFIED → READY (no cinematic entrance)
- ≥ 15 minutes: INITIALIZING → security gate → SECURITY_VERIFIED → AWAKENING → ANALYZING → READY
- Configurable by owner in Security settings

---

## Quality Gate

A state fails the quality gate if any of the following are true:

- State has no defined entry condition
- State has no defined exit condition
- Interruption behavior says "N/A" for any state where a user tap is physically possible
- ACTION_REQUIRED allows navigation tab taps (modal violation)
- EXECUTING allows Cancel (financial integrity violation)
- ERROR leaves user stranded (no [Go Back] or navigation)
- Any state shows a technical error string (HTTP status, exception name)
- LISTENING continues after app backgrounds (microphone-in-background violation)
- Any animated property has no reduced-motion fallback

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| 13 states confirmed | `docs/decisions/knowledge-map.md §0.10` |
| Interaction loop mapped to states | `docs/ux/interaction-loop-states.md` |
| Voice tab elevation and overlay positioning | `docs/ux/navigation-model.md §2` |
| Universal Error State component | `docs/ux/universal-screen-states.md §4` |
| Sarvam STT/TTS language support | `docs/research/sarvam-language-coverage.md` (DL-009) |
| Action confirmation rules | `AI OS.txt §56–61` |
| Security gate architecture | `AI OS.txt §4, §253` |
