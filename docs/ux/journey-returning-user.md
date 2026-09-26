# Journey Map — Returning-User Daily Re-Entry

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `App Flow.txt §18–24, §109–111`; `UI-UX.txt §162–165`

---

## Purpose

This document maps the journey every returning user takes when re-entering the application — from the security gate through AI OS activation to the briefing and on to the Home workspace. Three entry contexts (morning first-launch, mid-day quick return, end-of-day review) share the same navigation path and differ only in briefing content and AI OS emphasis. They are documented as **one journey with three entry contexts**, not three separate documents.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `App Flow.txt` | §18 (returning user flow), §19 (AI OS activation), §20 ("While You Were Away"), §21 (briefing prioritization), §22 (briefing structure), §23 (resource view), §24 (AI OS interaction), §109 (daily user flow), §110 (mid-day flow), §111 (end-of-day flow) |
| `UI-UX.txt` | §162 (app state restoration), §163 (AI OS overlay), §164 (dismissal), §165 (re-entry points) |
| `docs/ux/ai-os-state-machine.md` | 13 AI OS states — entry/exit conditions |
| `docs/ux/screen-inventory.md` | Canonical screen IDs |
| `docs/ux/briefing-prioritization.md` | Briefing content ranking (Prompt 24 — cross-reference) |

---

## 1. Shared Navigation Path

All three entry contexts follow the same screens in the same order. The differences lie in briefing content (§4) and the time-of-day greeting.

```
App.Launch
  ↓
Session check (< 15 min? restore; > 15 min? gate)
  ↓
App.Security                         [PIN or biometric]
  ↓
AIOS.Awakening                       [DORMANT → ANALYZING]
  ↓
AIOS.Briefing                        ["While You Were Away" / Status summary]
  ↓
Home.Home                            [business workspace]
  ↓
[Branch: AI interaction, Quick Action, or module navigation]
```

This path is four screens from app open to Home. The security gate and AI OS activation together take ≤ 5 seconds in normal conditions (device biometric ≈ 0.5 s; AI analysis of local data ≈ 2–4 s for businesses with up to 5,000 records).

---

## 2. Detailed Step Sequence — Shared Path

### Step 1 — App.Launch (Session Check)

```
User opens app (cold start or from background)
  ↓
App checks session age:

  [Session < 15 minutes AND no security sensitivity event]
       ↓
  Restore previous screen directly             ← background resume (§162)
  No security gate, no AI OS briefing
  App re-enters at exactly the screen the user left

  [Session > 15 minutes OR security sensitivity event]
       ↓
  App.Security gate                            ← step 2 below
```

**Session timer rule (`UI-UX §162`):** The 15-minute threshold applies from the moment the app was backgrounded. If the user had the Sales.Cart screen open and returns within 15 minutes, they land directly on Sales.Cart — no PIN, no briefing. After 15 minutes, they go through the full Security → Briefing path.

**Security sensitivity events that force a gate regardless of time:**
- Device screen lock was engaged
- Device was restarted
- Biometric data changed (OS-detected)
- App was force-closed (not backgrounded)

---

### Step 2 — App.Security (PIN / Biometric)

```
App.Security screen appears
  ↓
[Biometric available + enrolled]        [PIN only]
       ↓                                      ↓
  Face ID / fingerprint prompt         4–6 digit PIN entry
       ↓
  [Biometric success]    [Biometric fail — 1×]    [Biometric fail — 3×]
         ↓                      ↓                        ↓
  AIOS.Awakening         Re-try biometric          PIN fallback shown
                                                         ↓
                                                   PIN entry
                                                         ↓
                                                   AIOS.Awakening
```

**Failure handling:**
- 3 biometric failures → PIN fallback (mandatory, cannot skip)
- 5 wrong PINs → 30-second lockout, then retry
- 10 wrong PINs total → account lock; recovery via OTP

---

### Step 3 — AIOS.Awakening (AI OS Activation)

```
App.Security verified
  ↓
AI OS state: DORMANT → INITIALIZING → SECURITY_VERIFIED → AWAKENING
  ↓
[Animation: cinematic AI particle/glow awakening]
  Reduced-motion: static glow + fade-in text (no animation)
  ↓
AI OS state: AWAKENING → ANALYZING
  ↓
[Background: AI scans local SQLite data — no network required]
  Scans: transactions since last session, stock changes, payment events,
         pending sync queue, unread alerts
  ↓
AI OS state: ANALYZING → READY
  ↓
AIOS.Briefing
```

**ANALYZING time targets:**
- Micro (≤ 500 records): < 1 s
- Small (≤ 5,000 records): 1–3 s
- Medium (≤ 50,000 records): 2–4 s
- Enterprise: 3–6 s (progressive — shows partial results as they arrive)

**Offline behavior:** ANALYZING runs entirely on local data. If offline, the AI still produces a briefing from cached local state. The briefing shows an Offline banner: "Showing local data — cloud updates pending."

---

### Step 4 — AIOS.Briefing ("While You Were Away")

```
AIOS.Briefing
  ↓
Time-of-day greeting:
  [Morning]      "Good morning. Here's your business."
  [Afternoon]    "Welcome back. Here's what happened."
  [Evening]      "Good evening. Here's today's summary."
  ↓
Business status line:
  e.g., "Today: ₹12,400 in sales · ₹3,200 in expenses"
  ↓
Prioritized event list (see §4 for content variants by context)
  ↓
[Recommended actions, if any]
  ↓
CTA: [Let's go →]                       [or: auto-dismissed after 3 s of no interaction]
  ↓
Home.Home
```

**Dismissal options:**
- Tap "Let's go" → Home.Home
- Tap specific briefing item → navigate directly to linked screen
- Swipe up / swipe down → Home.Home
- Auto-dismiss: if user taps anywhere outside the briefing card, briefing closes and Home.Home is shown
- Voice: say "Let's go" or "Show me home" → dismisses to Home.Home

---

### Step 5 — Home.Home (Business Workspace)

```
Home.Home
  ↓
  [AI OS remains in READY state — accessible via Voice tab or "Ask AI" button]
  ↓
  User may:
    · Use Quick Actions (Add Sale / Add Expense / Ask AI)
    · Navigate via bottom tabs (Transactions / Reports / More)
    · Tap Recent Activity items
    · Tap AI OS cards on the Home surface
    · Engage Voice tab for AI interaction
```

---

## 3. Three Entry Contexts

The four-step path above is identical across all contexts. The contexts differ in which events the AI OS has to report and how the briefing is framed.

### Context A — Morning First-Launch

**Trigger:** First app open of the day (session age > 15 min from previous day).

```
AIOS.Briefing — Morning context
  ↓
Greeting: "Good morning, [name]. Ready for today?"
  ↓
Overnight summary (events since last session):
  · "3 payments received while you were away — ₹8,200 total"
  · "Stock: 2 products running low"
  · "1 new customer inquiry — Ramesh Kumar"
  ↓
Today's outstanding items:
  · "₹15,000 payment due from Sharma Traders — 2 days overdue"
  · "GST filing due in 3 days"
  ↓
AI recommendation:
  · "Start with the overdue payment — should I draft a reminder?"
  ↓
[Action cards if recommendations exist]
  ↓
CTA: "Let's go →"
```

**AI OS state after briefing:** READY. The AI remains ambient in the background; the Voice button is active.

**Morning-specific behavior:** If the business had significant overnight activity (e.g., e-commerce orders, scheduled sync), the briefing leads with those events. If it was a quiet night, the briefing leads with today's planned tasks or pending items.

---

### Context B — Mid-Day Quick Return

**Trigger:** Re-opening after < 8 hours since morning launch, with session age > 15 min.

```
AIOS.Briefing — Mid-day context
  ↓
Greeting: "Welcome back."
  ↓
Since-your-last-session summary (compact — fewer events):
  · "₹6,400 in sales since 9:30 AM"
  · "1 low-stock alert — Basmati Rice"
  ↓
[No "Good morning" / no overnight summary — that was shown this morning]
  ↓
Quick-action suggestion:
  · "Add the Sharma delivery payment when ready"
  ↓
CTA: "Continue →"   [or direct tap on a listed event → linked screen]
```

**Mid-day-specific behavior:**
- Briefing is shorter — only events since the last session, not overnight
- No daily summary (it is not end-of-day)
- AI leads with actionable items, not informational ones
- "Continue" replaces "Let's go" to signal resuming rather than starting

---

### Context C — End-of-Day Review

**Trigger:** Re-opening in the evening (after ~6 PM local time) with meaningful session gap.

```
AIOS.Briefing — End-of-day context
  ↓
Greeting: "Good evening. Here's how today went."
  ↓
Day summary (aggregate):
  · "Today: ₹18,200 sales · ₹4,400 expenses · ₹13,800 net"
  · "5 new customers · 2 pending payments"
  ↓
Unresolved items:
  · "Amit Singh: ₹3,500 still outstanding"
  · "Rice stock at 12 kg — reorder suggested"
  ↓
AI end-of-day recommendation:
  · "Good day overall. Compared to last Tuesday, sales were up 14%."
  · "Want me to prepare tomorrow's pending payment list?"
  ↓
[Optional: AI action card — "Prepare payment reminders" → tap to approve]
  ↓
CTA: "Done for today →"
```

**End-of-day-specific behavior:**
- Aggregate totals are shown (not a flat event list)
- AI surfaces tomorrow-relevant items (overdue payments, upcoming GST dates)
- "Done for today" is the CTA — signals wrap-up mode, not task start
- The AI may proactively suggest end-of-day actions (AI action cards appear in briefing if the ACTION_REQUIRED state is triggered)

---

## 4. Entry Context Detection

The AI OS determines which briefing context to use based on:

| Signal | Logic |
|--------|-------|
| Time of day | Morning = 5 AM–12 PM; Afternoon/mid-day = 12 PM–6 PM; Evening = 6 PM–11 PM; Late night = 11 PM–5 AM (brief = overnight summary if overnight data exists) |
| Hours since last session | < 4 h = Mid-day compact; ≥ 4 h morning session = Morning; ≥ 4 h evening = End-of-day |
| Volume of events since last session | > 10 events → expanded briefing; 0 events → "Quiet since last time — [one summary stat]" |
| Time of day + event volume | Takes both signals — 6 PM with 0 events since 4 PM shows "Quiet afternoon" not full end-of-day; 6 PM with heavy event load shows full end-of-day |

**Late-night opening (11 PM–5 AM):** Briefing shows a minimal "Business status" line only, no action recommendations, and a "Get some rest — I'll remind you in the morning" soft message. The AI does not surface reminders or action requests during late-night sessions.

---

## 5. Background Resume (< 15 Minutes)

When the app returns from background within 15 minutes, the Security gate and AI OS briefing are both skipped. The user lands directly on their previous screen. This is not a re-entry journey — it is a session continuation.

```
App backgrounded for < 15 min
  ↓
User returns to foreground
  ↓
Previous screen restored (scroll position preserved)
  ↓
[SyncIndicator in header shows sync status if background sync ran]
  ↓
No security gate, no briefing
```

However, if the AI OS was in an active state (LISTENING, THINKING, ACTION_REQUIRED) when the app was backgrounded:

```
App backgrounded while AIOS.Voice LISTENING
  ↓
AI OS state → DORMANT (auto)         [listening cannot hold in background]
  ↓
App restored < 15 min
  ↓
Previous underlying screen restored (e.g., Sales.Cart)
  ↓
[AI OS is DORMANT — Voice tab at rest; no auto-resumption of listening]
```

---

## 6. Deep-Link Re-Entry

A push notification taps directly into a specific screen (e.g., low-stock alert → `Inventory.LowStock`).

```
Notification received (app backgrounded or closed)
  ↓
User taps notification
  ↓
App.Launch (cold start if closed, warm start if backgrounded)
  ↓
App.Security gate
  ↓
[Security verified]
  ↓
[Skip AIOS.Briefing for critical notifications]
  OR
[Show truncated briefing: "1 alert — [notification text]" → tap → destination]
  ↓
Inventory.LowStock (deep-link destination)
```

**Deep-link security rule:** Every deep-link entry goes through App.Security before reaching the destination — never bypass the security gate, even for push notifications. Cold-start deep links follow: App.Launch → App.Security → destination.

---

## 7. Offline Re-Entry

```
User opens app — no network
  ↓
App.Security                         [local PIN check — no network needed]
  ↓
AIOS.Awakening                       [runs on local SQLite data — no network needed]
  ↓
AIOS.Briefing                        [local data analysis only]
  Offline banner: "Showing local data — sync when back online"
  Briefing content: events from local SQLite (may be behind cloud by sync gap)
  ↓
Home.Home
  Offline badge in header (Offline state per universal-screen-states.md)
  SyncIndicator: "Queued" or "Failed" for items pending sync
```

**What works offline:**
- Security (PIN)
- AI OS briefing (local data)
- All read operations from local SQLite
- Recording new transactions (saved locally, queued for sync)
- AI insights from cached local data

**What requires connectivity:**
- OTP for forgotten PIN recovery
- Cloud sync of new transactions
- Real-time AI insights beyond local cache
- Sending invoices / receipts by email or WhatsApp

---

## 8. Session Paths at a Glance

| Entry scenario | Security gate | AI OS briefing | Destination |
|---|:---:|:---:|---|
| Cold start (> 15 min) | ✓ | ✓ | Home.Home |
| Warm start / background (< 15 min) | — | — | Previous screen |
| Warm start (> 15 min) | ✓ | ✓ | Home.Home |
| Deep-link notification (cold) | ✓ | Truncated | Destination screen |
| Deep-link notification (warm > 15 min) | ✓ | Truncated | Destination screen |
| Deep-link notification (warm < 15 min) | — | — | Destination screen |
| Offline cold start | ✓ (local PIN) | ✓ (local data) | Home.Home (offline badge) |

---

## 9. Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Briefing content ranking and structure | `docs/ux/briefing-prioritization.md` (Prompt 24) |
| New-user onboarding journey | `docs/ux/journey-new-user.md` (Prompt 22) |
| AI OS 13-state machine | `docs/ux/ai-os-state-machine.md` |
| Offline/sync state language | `docs/ux/offline-sync-state-language.md` |
| App state restoration rules | `UI-UX.txt §162`; `docs/ux/navigation-model.md §8` |
| Screen canonical IDs | `docs/ux/screen-inventory.md` (Prompt 21) |
