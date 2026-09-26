# Journey Map — New User Onboarding

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/onboarding-ux.md` (Prompt 17), `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `App Flow.txt §4–17`; `UI-UX.txt §174–177, §240`

---

## Purpose

This document traces the complete path of a first-time user from app install through first Home entry. It covers the happy path and every material branch (skip import, biometric unavailable, login on new device, AI setup assistant, Micro tier collapse, etc.). Later journey documents reference screens by their canonical ID from `docs/ux/screen-inventory.md`.

---

## Sources

| Source | Sections used |
|--------|---------------|
| `App Flow.txt` | §4 (first-launch flow), §5–17 (per-step detail) |
| `UI-UX.txt` | §174 (progressive collection), §175 (progress UX), §176 (AI shortcut), §177 (import UX), §240 (first-launch sequence) |
| `docs/ux/onboarding-ux.md` | Per-step specs, tier collapsing rules, §174 compliance audit |
| `docs/ux/business-size-adaptive-ux.md` | Tier step counts (Micro=5, Small=7, Medium=8, Enterprise=9+7b) |
| `docs/ux/ai-os-state-machine.md` | AWAKENING → ANALYZING → READY cinematic for first Home entry |
| `docs/ux/screen-inventory.md` | Canonical screen IDs |

---

## Journey Scope

| Scope boundary | In scope | Out of scope |
|---|---|---|
| User status | First install, no existing account | Returning user; login on existing device |
| Variants covered | All 4 tiers; biometric unavailable; skip import; AI assistant path; login on new device | Multi-business creation (future); team member onboarding (separate journey) |
| End state | User lands on `Home.Home` for the first time with AI OS completing READY state | Any subsequent session |

---

## 1. Master Flow — Happy Path (Micro Tier)

The Micro-tier path is the shortest and most common. It collapses Business, Size, and Location onto fewer screens.

```
App install
  ↓
App.Launch — splash, session check
  ↓  (no existing session)
Onboarding.Language (+ Welcome)        [Welcome CTA: "Get Started"]
  ↓
Onboarding.Account                     [Enter phone → OTP → Verified]
  ↓
Onboarding.Security                    [Set PIN → Offer biometric]
  ↓
Onboarding.Business (collapsed)        [Name + Type + Size + State — Micro combines these]
  ↓
Onboarding.Industry
  ↓
Onboarding.Configuration               [AI or manual toggles]
  ↓
Onboarding.AI                          [Step 10 + Step 11 + Step 12 combined for Micro]
  ↓
AIOS.Awakening                         [First AI OS cinematic — DORMANT → READY]
  ↓
Home.Home
```

**Micro step count: 5 visible screens** (Welcome/Language · Account/Security · Business/Size/Location · Industry/Configuration · AI/Voice/Intro). The Micro path omits Step 9 (Optional Import is offered inline as a text link, not a dedicated screen).

---

## 2. Master Flow — Full Path (Small / Medium Tier)

```
App.Launch
  ↓
Onboarding.Language                    [Separate screen from Welcome]
  ↓
Onboarding.Account
  ↓
Onboarding.Security
  ↓
Onboarding.Business                    [Name + Type + GST status]
  ↓
Onboarding.Size                        [4 tier cards]
  ↓
Onboarding.Industry
  ↓
Onboarding.Location                    [State + City]
  ↓
Onboarding.Configuration               [Module toggles + GST fields]
  ↓  [optional]
Step 9 Import sub-flow (§3 below)
  ↓
Onboarding.AI                          [Step 10 — AI consent + notifications]
  ↓
[Step 11 — Voice setup]               [integrated into Onboarding.AI screen for Small]
  ↓
[Step 12 — AI OS Introduction]        [4–5 card walkthrough]
  ↓
AIOS.Awakening
  ↓
Home.Home
```

**Small step count: 7 screens.** Medium adds TDS toggles and E-invoicing prompt in Configuration; **Medium step count: 8 screens.**

---

## 3. Master Flow — Enterprise Tier

```
App.Launch
  ↓
Onboarding.Language
  ↓
Onboarding.Account
  ↓
Onboarding.Security
  ↓
Onboarding.Business
  ↓
Onboarding.Size
  ↓
Onboarding.Industry
  ↓
Onboarding.Location                    [State + City; designates Head Office]
  ↓
Step 7b — Branch / Team / Permissions  [Enterprise only — additional screen]
  ↓
Onboarding.Configuration               [Extended: multi-branch P&L, approval workflows, TDS]
  ↓
Step 9 Import sub-flow (§3 below)
  ↓
Onboarding.AI                          [+ team notification routing, approval workflow opt-in]
  ↓
Step 11 — Voice Setup                  [Standalone for Enterprise]
  ↓
Step 12 — AI OS Introduction           [6 cards — adds multi-branch card]
  ↓
AIOS.Awakening
  ↓
Home.Home
```

**Enterprise step count: 9 screens + optional Step 7b (always shown for Enterprise but fully skippable).**

---

## 4. Branch: Returning User — New Device (Login Path)

A user who already has an account taps "Log In" on the Welcome screen. This path exits onboarding after Account verification.

```
App.Launch
  ↓
Onboarding.Language (+ Welcome)
  ↓  [user taps "Log In"]
Onboarding.Account                     [Enter phone → OTP → Verified as existing account]
  ↓
Onboarding.Security                    [Set up NEW PIN on this device (first time on this device)]
  ↓  [biometric offered]
AIOS.Awakening                         [Skips all onboarding steps 4–12 — data already exists]
  ↓
Home.Home
```

**Note:** The existing business data is already in the cloud. No business creation steps appear. The AI OS Briefing will show the business state as it was at last sync.

---

## 5. Branch: Welcome Screen — Language Change Before Start

A user who wants to change the language before tapping "Get Started":

```
Onboarding.Language (+ Welcome)        [default = device locale pre-selected]
  ↓  [user taps "Change Language" link]
Onboarding.Language                    [language picker opened]
  ↓  [selects language]
Onboarding.Language (+ Welcome)        [re-rendered in new language]
  ↓  [user taps "Get Started"]
Onboarding.Account                     [continues in selected language]
```

This is a same-screen interaction (not a separate navigation push) for Micro tier. For Small/Medium/Enterprise, Language is a standalone screen and the re-render happens in-place.

---

## 6. Branch: Security Setup — Biometric Unavailable

The biometric offer at Step 3 adapts to device capability:

```
Onboarding.Security
  ↓  User sets PIN (required)
  ↓  System checks biometric availability

  [If fingerprint/face available]             [If not available — old device]
       ↓                                              ↓
  "Add fingerprint? (optional)"           "Biometric not available on this device"
       ↓  [user taps "Set Up"]                        ↓
  OS biometric enrollment prompt              PIN-only confirmation screen
       ↓  [enrolled]                                  ↓
  "Face/fingerprint added ✓"              "Your PIN keeps your business secure"
       ↓                                              ↓
  Onboarding.Business                     Onboarding.Business
```

**If biometric enrollment fails mid-flow** (e.g., fingerprint rejected 3 times):
```
  OS enrollment failure
       ↓
  "Fingerprint setup failed — tap here to try again later"
       ↓  [Skip for now]
  Onboarding.Business                     [Biometric can be set up in Settings.Security later]
```

---

## 7. Branch: Business Setup — AI Assistant Path (§176)

At Step 4 (Business), the owner can use the AI setup assistant instead of filling fields manually.

```
Onboarding.Business
  ↓  [user taps "Tell me about your business"]
AIOS overlay / chat prompt appears
  ↓  User speaks or types: "I run a small grocery shop in Chennai"
AI extracts: Name=null, Type=Product, Size=Micro, Industry=Retail, Location=Tamil Nadu
  ↓
Fields pre-populated for review:
  Business name: [blank — name not extracted, field highlighted]
  Type: Product ✓
  Business size: Micro (suggested)
  Industry: Retail (suggested)
  State: Tamil Nadu (suggested)
  ↓
User fills: Business name → "Kavitha Stores"
  ↓
All fields confirmed → Continue
  ↓
Onboarding.Size                         [AI suggestion pre-selected; user confirms]
  ↓
Onboarding.Industry                     [AI suggestion pre-selected; user confirms]
  ↓
Onboarding.Location                     [State pre-filled from AI; user confirms or adds city]
```

**Acceptance rule:** AI suggestions are always shown for *review and confirmation*, never silently accepted. The owner must actively confirm each AI-populated field.

---

## 8. Branch: Configuration — AI vs Manual Path

At Step 8 (Configuration), two paths are available:

### Path A — AI conversation (§176)

```
Onboarding.Configuration
  ↓  [AI is now initialized; AI assistant appears]
AI: "Let me set up your business in 60 seconds."
  → "Do you track stock / inventory?"  → [Yes / No / Sometimes]
  → "Are you GST registered?"          → [Yes / Not yet / Not sure]
  → "Do you have a team?"              → [Just me / Yes, a few people]
  → "Do you accept UPI or cards?"      → [Yes / Cash only]
  → "Do you issue formal invoices?"    → [Yes / Cash bills only]
  ↓
Config summary generated:
  Inventory: On
  GST: Unregistered (fields shown as optional)
  Team: Off
  Payments: UPI + Cash
  Invoices: On
  ↓
"Here's how I've set up your business — change anything"
  ↓  [user reviews + taps Confirm]
Onboarding.AI (Step 10)
```

### Path B — Manual toggles

```
Onboarding.Configuration
  ↓  [user scrolls through toggle groups]
  Inventory tracking: [Toggle] On/Off
  GST registered:     [Yes / No / Not sure]
  GSTIN:              [Text field — only visible if GST=Yes]
  Default payment:    [Checkboxes: Cash / UPI / Card / Credit]
  Formal invoices:    [Toggle]
  ↓  [user taps Save]
Onboarding.AI (Step 10)
```

---

## 9. Branch: Optional Import (Step 9)

Step 9 is explicitly optional. The branch point is in Onboarding.Configuration's final action.

```
Onboarding.Configuration (confirmed)
  ↓
"Would you like to bring in existing data?"
  ┌──────────────────────┬────────────────────────┐
  │  "Import my data"    │   "Start fresh"         │
  └──────────────────────┴────────────────────────┘

[Start fresh — primary path]            [Import my data — secondary]
       ↓                                        ↓
Onboarding.AI (Step 10)            Import source selection:
                                     · Tally (XML export)
                                     · Excel / CSV
                                     · WhatsApp Business
                                     · Manual bulk entry
                                            ↓
                                   Upload / Connect source
                                            ↓
                                   Field mapping (auto where possible)
                                            ↓
                                   Validation
                                            ↓
                                   Preview (sample rows shown)
                                            ↓
                                   Confirm import
                                            ↓
                                   Import result:
                                     "Imported: 45 customers, 12 products"
                                     "Needs review: 3 records — view after setup"
                                            ↓
                                   Onboarding.AI (Step 10)
```

**Import error handling (`UI-UX §177`):** Invalid records are never silently discarded. They are quarantined and surfaced to the owner after first Home entry as an alert: "3 imported records need review." The owner is not blocked — they proceed to Home even with unresolved import records.

**Tier restrictions on import sources:**
- Micro: Excel/CSV and manual bulk entry only
- Small+: Tally + WhatsApp Business
- Enterprise: All sources + API connection

---

## 10. Branch: Voice Setup — Microphone Permission Denied

At Step 11 (Voice Setup), if the user denies microphone permission:

```
Onboarding.AI / Voice Setup
  ↓
[System microphone permission prompt]
  ↓  [user denies]
"Microphone access needed for voice — grant it in Settings"
  [Continue without voice]   [Open phone Settings]
       ↓
Onboarding.AI (continues)              [Voice tab will show "Complete setup" on first tap]
```

**If microphone is denied, the Voice tab shows a persistent "Enable microphone" badge on first tap. The user can grant permission at any time from Settings or when tapping the Voice tab.**

---

## 11. Branch: Voice Setup — Language Gap (STT-Only)

If the user selects a language for voice that has STT coverage but no TTS (12 gap languages: Assamese, Urdu, Nepali, Konkani, Kashmiri, Sindhi, Sanskrit, Santali, Manipuri, Bodo, Maithili, Dogri):

```
Voice language selection → User selects Assamese
  ↓
[Inline note shown below language]:
  "I'll understand Assamese and reply in text.
   Voice reply in Assamese coming soon."
  ↓
Test phrase prompt still shown (STT works — user speaks, text is displayed)
  ↓
User confirms → Continue
```

No branch in the navigation — the flow continues identically. The note sets the correct expectation before first use.

---

## 12. AI OS Introduction → First Home Entry

Step 12 (AI OS Introduction) transitions directly into the first AWAKENING cinematic:

```
Onboarding.AI / Introduction cards
  ↓  [4–5 swipeable cards: "I record" · "I remember" · "I always ask first" · "I work offline" · "Let's go"]
  ↓  [user taps "Let's go" or swipes past the last card]
AIOS.Awakening
  AI OS state: DORMANT → INITIALIZING → SECURITY_VERIFIED → AWAKENING
  Visual: cinematic AI particle animation (reduced-motion: static glow + text)
  ↓  (AWAKENING → ANALYZING → READY)
  "Welcome. I've reviewed your business and I'm ready."
  ↓
AIOS.Briefing                           [Empty state for first session — no "while you were away" events]
  Shown:  "Let's explore your workspace."
  CTA:    [Go to Home]
  ↓
Home.Home                               [First entry — may be mostly empty if no import was done]
```

**First Home entry state:** If no import was done, Home shows the Empty State (defined in `docs/ux/universal-screen-states.md`) for each section: "Add your first customer", "Record your first sale", etc. Quick Actions are highlighted prominently. The AI OS is in READY state and shows a "Try saying: 'Add a sale'" prompt on the Voice button.

---

## 13. Step × Screen Mapping

| Step | Screen canonical ID | Micro | Small | Medium | Enterprise |
|------|---------------------|:-----:|:-----:|:------:|:----------:|
| Welcome | _(App.Launch splash)_ | Combined with Language | Standalone | Standalone | Standalone |
| 1 Language | `Onboarding.Language` | ✓ (combined) | ✓ | ✓ | ✓ |
| 2 Account | `Onboarding.Account` | ✓ | ✓ | ✓ | ✓ |
| 3 Security | `Onboarding.Security` | ✓ (combined with Account) | ✓ | ✓ | ✓ |
| 4 Business | `Onboarding.Business` | ✓ (combined: Business+Size+Location) | ✓ | ✓ | ✓ |
| 5 Size | `Onboarding.Size` | _(collapsed into Business)_ | ✓ | ✓ | ✓ |
| 6 Industry | `Onboarding.Industry` | ✓ (combined with Configuration) | ✓ | ✓ | ✓ |
| 7 Location | `Onboarding.Location` | _(collapsed into Business)_ | ✓ | ✓ | ✓ |
| 7b Branch/Team | _(extended Location screen)_ | — | — | — | ✓ (skippable) |
| 8 Configuration | `Onboarding.Configuration` | ✓ (combined with Industry) | ✓ | ✓ | ✓ |
| 9 Import | _(sub-flow within Configuration)_ | Inline link only | ✓ (optional) | ✓ (optional) | ✓ (optional) |
| 10 AI Setup | `Onboarding.AI` | ✓ | ✓ | ✓ | ✓ |
| 11 Voice Setup | _(integrated into Onboarding.AI)_ | Combined | Combined | Standalone | Standalone |
| 12 AI OS Intro | _(integrated into Onboarding.AI)_ | Combined | Combined | Combined | ✓ (6 cards) |
| — | `AIOS.Awakening` | ✓ | ✓ | ✓ | ✓ |
| — | `AIOS.Briefing` | ✓ (empty state) | ✓ (empty state) | ✓ (empty state) | ✓ (empty state) |
| — | `Home.Home` | ✓ | ✓ | ✓ | ✓ |

---

## 14. Error and Recovery Paths

| Error condition | Screen | Recovery action |
|---|---|---|
| OTP not received (30 s) | `Onboarding.Account` | "Resend OTP" link appears at 30 s; retry up to 3× before showing "Contact support" |
| OTP expired (5 min) | `Onboarding.Account` | Banner: "Code expired — tap to resend" |
| Server error on account creation | `Onboarding.Account` | Error state: "Something went wrong. Try again." [Retry] |
| Biometric enrollment failed | `Onboarding.Security` | Skip option; biometric deferred to Settings.Security |
| Business name already exists (same account) | `Onboarding.Business` | "You have a business with this name. Do you want to add a new one or log in?" |
| Import file invalid format | Import sub-flow | Error state: "We couldn't read this file. Supported: .xlsx, .csv, .xml" [Try another] |
| Import field mapping — unrecognizable column | Import sub-flow | Column shown as "Unmatched" with dropdown to map to known field; skip option available |
| AI configuration generation failure | `Onboarding.Configuration` | Falls back to manual toggles path silently; no error shown to user |
| Microphone permission denied | Voice setup | Inline note; Voice tab shows "Enable microphone" badge |
| Network lost during onboarding | Any step post-Account | Offline banner appears; local steps (language, security, business data) continue offline; cloud steps (account creation, OTP) require connectivity — user shown "Waiting for connection…" |

---

## 15. Acceptance Criteria Verification

| Criterion (Prompt 22) | Met? | Evidence |
|---|:---:|---|
| Welcome → Language covered | ✓ | §1, §5 |
| Account branch covered | ✓ | §1–4, §14 (OTP errors) |
| Security Setup branch covered (biometric unavailable) | ✓ | §6 |
| Business Creation covered | ✓ | §1–3, §7 |
| Business Size covered | ✓ | §1–3, §13 (step mapping) |
| Initial Data / Import covered | ✓ | §9 |
| Skip Import branch covered | ✓ | §9 (Start fresh path) |
| AI OS Introduction covered | ✓ | §12 |
| First Home Entry covered | ✓ | §12 |
| All tiers mapped | ✓ | §1–3, §13 |
| Login on new device branch | ✓ | §4 |
| Biometric unavailable branch | ✓ | §6 |
| AI assistant setup path | ✓ | §7, §8 |
| Voice language gap (STT-only) | ✓ | §11 |
| Microphone permission denied | ✓ | §10 |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Per-step onboarding specs | `docs/ux/onboarding-ux.md` (Prompt 17) |
| Returning-user daily re-entry journey | `docs/ux/journey-returning-user.md` (Prompt 23) |
| AI OS states (AWAKENING → READY) | `docs/ux/ai-os-state-machine.md` |
| Screen canonical IDs | `docs/ux/screen-inventory.md` (Prompt 21) |
| Business-size adaptive rules | `docs/ux/business-size-adaptive-ux.md` |
| Accessibility multilingual rules | `docs/ux/accessibility-multilingual-rules.md` |
