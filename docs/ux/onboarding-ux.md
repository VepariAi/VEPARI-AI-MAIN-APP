# Onboarding UX Architecture

**Phase:** 2 (UI/UX Foundation)
**Status:** Approved for Phase 2 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/business-size-adaptive-ux.md` (Prompt 14)
**Governing sources:** `UI-UX.txt §174–177, §240`; `App Flow.txt §4–17`; `docs/ux/business-size-adaptive-ux.md`

---

## Sources

| Source | Sections used |
|--------|---------------|
| `UI-UX.txt` | §174 (progressive collection), §175 (progress UX), §176 (AI setup assistant), §177 (import UX), §239 (screen map), §240 (first-launch flow) |
| `App Flow.txt` | §4 (first-launch master flow), §5 (welcome), §6 (language), §7 (account), §8 (security), §9 (business creation), §10–13 (size tiers), §14–15 (import), §16 (AI OS introduction), §17 (first home entry) |
| `docs/ux/business-size-adaptive-ux.md` | Tier step counts (Micro = 5, Enterprise = 9), feature-visibility matrix |

---

## 1. Canonical Step Sequence

The canonical onboarding sequence is sourced from `UI-UX.txt §240` and `App Flow.txt §4`. Steps are numbered; steps that collapse in lower tiers are noted in §4.

```
W  Welcome           (no data collection — brand introduction)
1  Language
2  Account           (create or login + phone/email verification)
3  Security          (PIN + biometric)
4  Business          (name + type)
5  Business Size     (tier selection)
6  Industry
7  Location
8  Configuration     (AI-shortcuttable via §176)
9  Optional Import
10 AI Setup
11 Voice Setup
12 AI OS Introduction
   ↓
   Home
```

**Rule (§174):** No step may collect information whose absence would not prevent the correct functioning of all subsequent steps. Each step's "Why now" justification below constitutes the progressive-collection audit.

---

## 2. Per-Step Specifications

### W — Welcome

| Field | Value |
|-------|-------|
| **Purpose** | Brand introduction; entry point selection |
| **Screen** | Splash + animated Vepari AI wordmark (Cinzel Semibold); sub-text in default device language |
| **Data collected** | None |
| **CTAs** | [Get Started] · [Log In] · [Change Language] |
| **Skippable** | Not applicable — no data collected |
| **Tier applicability** | All tiers |
| **Notes** | "Log In" routes returning users directly to Security gate, bypassing all onboarding steps |

---

### Step 1 — Language

| Field | Value |
|-------|-------|
| **Purpose** | Set display language for all subsequent screens |
| **Data collected** | `language_preference` (one of 23 supported languages) |
| **Why now (§174)** | All UI text, voice recognition, TTS, and onboarding content from Step 2 onward must render in the selected language. Cannot defer — a Hindi speaker must not see Step 2 in English. |
| **Input** | Scrollable list of 23 languages; each shows language name in that language (e.g., "हिंदी", "தமிழ்", "English") + script sample |
| **Skippable** | No. Device locale is pre-selected as the default; user confirms or changes. |
| **AI shortcut** | None — precedes AI initialization |
| **Tier applicability** | All tiers. In Micro tier, this step is combined with Welcome on a single screen. |

---

### Step 2 — Account

| Field | Value |
|-------|-------|
| **Purpose** | Establish authenticated identity; no business data is stored without an account |
| **Data collected** | Phone number (primary) or email (fallback); OTP verification code |
| **Why now (§174)** | Authentication is the prerequisite for all data persistence and cloud sync. Business data entered in Step 4+ must be owned by an authenticated account. Cannot defer. |
| **Paths** | **New user:** enter phone → receive OTP → verified. **Returning user on new device:** enter phone → OTP → routed to Security (skips onboarding). |
| **Skippable** | No. OTP verification is mandatory before any onboarding step beyond language. |
| **AI shortcut** | None — precedes AI initialization |
| **Tier applicability** | All tiers |
| **Notes** | Authentication is intentionally decoupled from business data (`App Flow §7`): one account can own multiple businesses in future. |

---

### Step 3 — Security

| Field | Value |
|-------|-------|
| **Purpose** | Establish the security gate that protects all subsequent access |
| **Data collected** | PIN (4–6 digit, required); biometric enrollment (optional: fingerprint or face ID) |
| **Why now (§174)** | `App Flow §19` mandates that the AI OS cinematic entrance fires only after security is verified. Security cannot be deferred after account creation — business data entered in Step 4+ is immediately sensitive. |
| **Skippable** | PIN is required. Biometric is optional ("Set up later" defers to Settings). |
| **AI shortcut** | None |
| **Tier applicability** | All tiers. In Micro tier, combined with Account step on a two-screen flow (phone → OTP → PIN) with biometric offered as an inline optional. |

---

### Step 4 — Business

| Field | Value |
|-------|-------|
| **Purpose** | Create the business entity that all subsequent data belongs to |
| **Data collected** | Business name (required); Business type (Product / Service / Both); GST registration status (Registered / Unregistered / Not sure) |
| **Why now (§174)** | Business name is needed to address the owner throughout onboarding ("Welcome to [Name]'s business"). Business type determines which industry options appear in Step 6 and which modules are relevant. GST status determines whether Configuration (Step 8) shows tax fields. |
| **Skippable** | No. Business name is required. Business type defaults to "Both" if not selected. GST status defaults to "Not sure" if not selected. |
| **AI shortcut (§176)** | AI setup assistant is available from this step onward. Instead of filling fields manually, the owner can tap "Tell me about your business" and speak or type a description. AI extracts business name, type, and GST status from the response and populates the fields for review. |
| **Tier applicability** | All tiers. In Micro tier, this screen also collects Size + Industry (see §4 — Tier Collapsing). |

---

### Step 5 — Business Size

| Field | Value |
|-------|-------|
| **Purpose** | Set the tier that governs feature visibility for all subsequent app experience |
| **Data collected** | Tier: Micro / Small / Medium / Enterprise |
| **Why now (§174)** | Size determines which steps follow (Enterprise adds Branch/Team/Permissions step), which Configuration fields appear, and which feature-visibility matrix applies. Must be known before Step 6 (Industry) so that industry options can be filtered to relevant ones for the tier. |
| **UI** | Four option cards, each showing: tier name, MSME threshold (e.g., "Turnover up to ₹10 Cr"), typical profile, and one-line example ("Solo shop, home business"). Not all users know their legal MSME tier — the descriptions are written to be self-identifying, not regulatory. |
| **Skippable** | No. If AI inferred size from the Business step conversation, this step shows AI's suggestion pre-selected and asks for confirmation. |
| **AI shortcut (§176)** | If the §176 assistant conversation already implies size (e.g., "I run a small chai shop"), AI pre-selects Micro. User confirms. |
| **Tier applicability** | All tiers — this step exists in all tier paths, but in Micro it is part of the collapsed Business screen. |

---

### Step 6 — Industry

| Field | Value |
|-------|-------|
| **Purpose** | Configure industry-appropriate defaults for product categories, expense categories, and common transactions |
| **Data collected** | Industry category (required); sub-category (optional) |
| **Industry categories** | Retail · Restaurant / Food · Services · Trading / Distribution · Manufacturing · Healthcare · Construction · Education · Agriculture · Transport · Other |
| **Why now (§174)** | Industry determines the default product category taxonomy (so "Add Product" pre-fills relevant categories), default expense categories (Rent, Raw Materials, etc.), and which compliance features are suggested in Configuration. Cannot be deferred to after Configuration — Configuration uses it. |
| **Skippable** | Not strictly skippable, but "Other" is always available. AI suggests industry from the §176 conversation. |
| **AI shortcut (§176)** | If the business description mentioned "chai shop", "grocery store", or similar, AI pre-selects the industry and sub-category. |
| **Tier applicability** | All tiers. In Micro and Small, this is a simple grid of category cards. Medium and Enterprise show sub-categories. |

---

### Step 7 — Location

| Field | Value |
|-------|-------|
| **Purpose** | Set the GST state code and regional context for tax configuration |
| **Data collected** | State (required — determines GST state code); City/town (optional); Pincode (optional) |
| **Why now (§174)** | The GST state code is needed for Configuration (Step 8) to set the correct IGST/CGST/SGST split for inter/intra-state transactions. Cannot be deferred — invoices generated after onboarding require the correct state code. City and pincode are optional at this point; they can be completed in Settings later. |
| **Skippable** | State is required. City and pincode are optional ("Add later" visible). |
| **AI shortcut** | If the business name or conversation mentioned a recognizable city, AI pre-fills state. |
| **Tier applicability** | **Micro:** Combined into the collapsed Business screen (state only). **Small/Medium:** Standalone screen (state + city). **Enterprise:** Standalone screen; also designates this location as "Head Office"; additional branches are added later in Branch Setup (Step 7b, Enterprise only). |

#### Step 7b — Branch / Team / Permissions (Enterprise only)

| Field | Value |
|-------|-------|
| **Purpose** | Set up the organizational structure before configuration |
| **Data collected** | Additional branch locations (name + state, optional at this point); initial team members (name + phone + role, optional); role-based permission model (defaults available) |
| **Why now (§174)** | Enterprise Configuration (Step 8) needs to know how many branches and user roles exist to configure correctly (e.g., branch-level P&L reporting, permission boundaries). Cannot be deferred to after Configuration. |
| **Skippable** | Fully skippable — "Set up team later" moves to Configuration with single-branch defaults. |
| **Tier applicability** | Enterprise only |

---

### Step 8 — Configuration

| Field | Value |
|-------|-------|
| **Purpose** | Configure which modules are active and set the initial business parameters |
| **Why now (§174)** | Module configuration determines what appears on Home and in every subsequent screen. A business that says "I don't track stock" should not see Inventory on their Home screen from day one. Must be set before first Home entry. |
| **Skippable** | Not skippable; but AI-shortcuttable (see below). AI generates a sensible default configuration based on size + industry + location; user reviews rather than configures from scratch. |
| **Tier applicability** | All tiers; field set varies by tier |

**Without AI assistant:** User sees a reviewed set of toggles and fields, grouped by category.

**With AI assistant (§176):**
```
AI: "A few quick questions to set up your business."
  → "Do you track stock / inventory?"
  → "Are you GST registered? What's your GSTIN?"
  → "Do you have employees or a team?"
  → "Do you accept UPI or online payments?"
  → "Do you issue formal invoices or cash memos?"
Configuration generated from answers → User reviews summary → Confirm
```

**Fields by tier:**

| Field | Micro | Small | Medium | Enterprise |
|-------|:-----:|:-----:|:------:|:----------:|
| Opening financial date | Required | Required | Required | Required |
| GSTIN (if registered) | Optional | Optional | Required | Required |
| Inventory tracking on/off | Toggle | Toggle | Toggle (on by default) | Always on |
| Supplier tracking on/off | Toggle | Toggle (on by default) | Always on | Always on |
| Purchase tracking on/off | Toggle | Toggle (on by default) | Always on | Always on |
| E-invoicing (IRP) | — | — | Toggle (if AATO ≥ ₹5 Cr) | Toggle |
| TDS tracking | — | Informational only | Toggle | Required |
| Multi-branch P&L | — | — | — | Auto-on if branches set |
| Default payment modes | Toggle (Cash/UPI) | Toggle | Multi-select | Multi-select |
| Currency | INR (fixed) | INR (fixed) | INR (fixed) | INR (fixed, multi-currency planned) |

---

### Step 9 — Optional Import

| Field | Value |
|-------|-------|
| **Purpose** | Give businesses with existing data a path to start populated rather than empty |
| **Data collected** | Import source selection; uploaded file or connection; field mappings |
| **Why now (§174)** | Import happens before first Home entry so the owner sees a populated dashboard, not an empty state. Import after Configuration so the mapper knows which fields are active (e.g., no inventory fields if inventory is off). |
| **Skippable** | Yes — "Start Fresh" is the primary CTA. "Import Data" is secondary. Step is explicitly optional. |
| **Import sources** | Tally (XML export) · Excel / CSV · WhatsApp Business export · Manual bulk entry |
| **Import flow (§177)** | Choose source → Upload/Connect → Map fields → Validate → Preview (sample rows) → Confirm → Result (Imported: N / Needs review: N / Failed: N) |
| **Tier applicability** | All tiers. Micro: Excel/CSV and manual entry only. Small+: Tally and WhatsApp Business. Enterprise: All sources + API connection option. |
| **Notes** | Never silently import questionable records (§177). Invalid records are quarantined, not discarded — owner reviews them after reaching Home. |

---

### Step 10 — AI Setup

| Field | Value |
|-------|-------|
| **Purpose** | Establish AI OS permissions and communication preferences before first use |
| **Data collected** | AI memory consent (opt-in: "AI can learn your patterns over time"); notification preferences (business alerts on/off; AI suggestions on/off) |
| **Why now (§174)** | AI OS needs memory consent before it begins the ANALYZING → READY sequence that fires on first Home entry. If consent is deferred, the AI OS cannot personalize the first briefing. Notification settings are needed before the OS can push the first alert. |
| **Skippable** | Memory consent defaults to **On** with a clear one-line explanation ("I'll remember your sales patterns to give you better insights. You can turn this off in Settings."). The owner can toggle it off here. Notifications default to On for business-critical alerts only. Both can be changed in Settings anytime. |
| **What AI OS introduction covers (App Flow §16)** | What the AI can do · What it can see · What it remembers · What requires approval · What it executes automatically. The AI must not imply unrestricted authority. |
| **AI shortcut** | None — this step is about configuring the AI, not using it. |
| **Tier applicability** | All tiers. Micro: simplified two-toggle screen ("AI learns your patterns / Alerts for important events"). Enterprise: adds team notification routing, approval workflow opt-in. |

---

### Step 11 — Voice Setup

| Field | Value |
|-------|-------|
| **Purpose** | Configure voice interaction language and test STT/TTS before first use |
| **Data collected** | Voice language (may differ from UI language — e.g., UI in English, voice in Hindi); voice speed preference (Normal / Slightly faster); microphone permission grant |
| **Why now (§174)** | Voice is the primary interaction mode (elevated center Voice tab). Configuring voice language before Home entry ensures the first voice interaction works correctly. Microphone permission must be granted now or the Voice tab is non-functional. |
| **Skippable** | Yes — "Set up later" defers to Settings; defaults to UI language for voice. If skipped, Voice tab shows a "Complete setup" prompt on first tap. |
| **Voice language options** | 23 supported languages. STT (Saaras v3/v4) available for all 23. TTS (Bulbul v3) available for 11; for the remaining 12, a "text-only reply" note is shown: "I'll understand [language] but reply in text — voice reply coming soon." |
| **Test phrase** | After language selection: "Tap the mic and say a test phrase" → system recognizes and displays it → owner confirms it was understood correctly. |
| **Tier applicability** | All tiers |

---

### Step 12 — AI OS Introduction

| Field | Value |
|-------|-------|
| **Purpose** | Introduce the AI OS's capabilities and set correct expectations before first use |
| **Data collected** | None. This is a walkthrough, not a collection step. |
| **Why now (§174)** | No data collected — §174 progressive-collection rule is not triggered. The step is retained because `App Flow §16` requires establishing AI authority boundaries before first use ("The AI should not imply unrestricted authority"). |
| **Skippable** | Yes — "Skip Intro" tap-through, or tap anywhere to advance. |
| **Content** | 4–5 swipeable cards: |

| Card | Title | One-line description |
|------|-------|---------------------|
| 1 | "I record for you" | "Tell me about a sale, expense, or payment — I'll save it." |
| 2 | "I remember" | "I learn your business patterns over time." |
| 3 | "I always ask first" | "For anything important, I confirm before acting." |
| 4 | "I work offline" | "No internet? I keep working and sync when you're back." |
| 5 (CTA) | "Let's go" | [Enter my business →] |

**Cinematic treatment:** Uses the full AWAKENING → ANALYZING → READY AI OS state sequence (per `docs/ux/ai-os-state-machine.md`). The "Let's go" card triggers the first AWAKENING cinematic entrance. This is the same sequence as every returning-user launch — onboarding is the first instance.

**Tier applicability:** All tiers. Enterprise: adds a sixth card explaining multi-branch visibility.

---

## 3. What Each Step Is Allowed to Collect — §174 Compliance Audit

| Step | Collects | NOT collected here (and why not) |
|------|----------|----------------------------------|
| 1 Language | Language preference | Business data — account doesn't exist yet |
| 2 Account | Phone/email, OTP | Business name — account identity must be separate from business identity |
| 3 Security | PIN, biometric | Any business data — security gate must precede data entry |
| 4 Business | Name, type, GST status | Location — not needed until tax config in Step 8; team — not needed until Enterprise Step 7b |
| 5 Business Size | Tier | Industry — tier is needed first to know which industry sub-categories to offer |
| 6 Industry | Category, sub-category | Products, customers — no master data at this point; collected in use or Optional Import |
| 7 Location | State (required), city, pincode (optional) | Full address — postal address not needed for tax config; only state code is required |
| 8 Configuration | Active modules, GSTIN, opening date, payment modes | Products, customers, suppliers — these are master data, collected via Import (Step 9) or first use |
| 9 Optional Import | Existing business data | Any new fields — import maps to already-configured fields only |
| 10 AI Setup | Memory consent, notification prefs | Voice language — collected in dedicated Voice step |
| 11 Voice Setup | Voice language, speed, mic permission | AI memory — collected in dedicated AI Setup step |
| 12 AI OS Intro | Nothing | — |

**No step collects data that is not needed for the correct operation of subsequent steps.** Each field not collected at a step either: (a) belongs to a later step where it is contextually appropriate, (b) is collected at first use (master data), or (c) is collected in Settings.

---

## 4. Tier-Adaptive Step Counts

Business size (set in Step 5) collapses or expands the step sequence. The step count in the progress indicator adjusts accordingly.

| Step group | Micro (5) | Small (7) | Medium (8) | Enterprise (9) |
|------------|:---------:|:---------:|:----------:|:--------------:|
| Welcome + Language | 1 screen (combined) | 2 screens | 2 screens | 2 screens |
| Account + Security | 1 screen (Phone → OTP → PIN inline) | 2 screens | 2 screens | 2 screens |
| Business + Size + Industry | 1 screen (AI-assisted, all three) | 3 screens | 3 screens | 3 screens |
| Location | Folded into Business screen (state only) | 1 screen | 1 screen | 1 screen (+ Branch step) |
| Configuration | 1 screen (AI auto-fills, 2–3 toggles) | 1 screen | 1 screen | 1 screen |
| Optional Import | Offered inline on Configuration screen | 1 screen | 1 screen | 1 screen |
| AI + Voice + Intro | 1 screen ("Meet Vepari" combined) | 3 screens | 3 screens | 3 screens |
| Branch/Team/Permissions | — | — | — | 1 screen |
| **Total distinct screens** | **5** | **7** | **8** | **9** |

**Notes:**
- Step count shown in the progress indicator equals the screen count above, not the canonical step count.
- Micro combines steps to reduce cognitive load per `App Flow §11` ("simpler onboarding, fewer unnecessary controls").
- The 5-step Micro path should complete in under 4 minutes in practice.
- Enterprise's 9th step (Branch/Team/Permissions) is skippable — if skipped, Enterprise defaults to single-branch behavior until configured in Settings.

---

## 5. AI Business Setup Assistant (§176 Detail)

The AI setup assistant is available from Step 4 (Business) onward. It does not replace the step sequence — it shortens the manual entry within each step.

**Entry:** A secondary CTA on each step screen: "Let me help you set this up" (or voice equivalent in selected language).

**Flow:**
```
User taps "Let me help"
 ↓
AI OS enters LISTENING state (microphone opens)
 ↓
Owner speaks or types a description of their business
 ↓
AI THINKING: extracts fields relevant to current step
 ↓
AI RESPONDING: "Based on what you told me, here's what I've set up:"
 ↓
ACTION_REQUIRED card shows pre-filled form for review
 ↓
Owner confirms or edits
 ↓
Step completes; AI carries context to next step
```

**Context carries forward:** Information spoken in Step 4 (e.g., "I run a small grocery store in Chennai") is used to pre-fill Step 5 (Micro), Step 6 (Retail), Step 7 (Tamil Nadu), and Step 8 (inventory on, GST on, UPI payments). The owner reviews each pre-fill rather than answering again.

**Language:** The AI setup assistant converses in the language selected in Step 1. Voice input uses Saaras STT; responses use Bulbul TTS where available.

**Constraint:** The AI setup assistant does not skip steps — it only pre-populates fields within steps. The owner must review each step's output before advancing. This enforces the §174 progressive-collection guarantee.

---

## 6. Optional Import — Step 9 Detail

| Phase | What happens |
|-------|-------------|
| **Choose source** | Tally (XML) / Excel·CSV / WhatsApp Business / Manual |
| **Upload/Connect** | File picker or connection flow |
| **Map fields** | AI pre-maps common fields (customer name, phone, balance); owner reviews |
| **Validate** | System checks for duplicates, missing required fields, invalid values |
| **Preview** | Shows first 10 records; flags any "Needs review" rows |
| **Confirm** | Owner taps [Import N records] + [Review M flagged later] |
| **Result** | Summary card: Imported: N · Needs review: M · Failed: P |
| **After import** | Flagged records appear in a "Review queue" on Home; owner addresses them in their own time |

**§177 rule:** Never silently import questionable records. Every invalid record is surfaced, not discarded.

**Failure recovery:** If import fails mid-way, valid records already imported are retained. Owner can restart from the failed batch only.

---

## 7. Progress Indicator (§175)

- **Format:** Segmented step bar at the top of each onboarding screen (not a percentage number). Filled segments = completed; current = filled differently; future = empty.
- **Label:** "Step N of M" where M = tier-appropriate total (5/7/8/9).
- **Back navigation:** All steps support back navigation; previously entered data is preserved.
- **No time estimate shown** — avoids creating time pressure (§175: "without creating a stressful multi-page wizard").
- **Progress is saved:** If the app is closed mid-onboarding (crash, phone call), re-opening resumes at the current step with all entered data intact.

---

## 8. Returning Users and Login Path

A user who already has a Vepari AI account (login via Step 2 on a new device, or session resumed after 15+ minutes) bypasses onboarding entirely:

```
Welcome → [Log In] → Account (phone + OTP) → Security (PIN/biometric) → AI OS Awakening → Home
```

No onboarding steps are shown. Business data is synced from cloud. This path is `App Flow §18` (returning-user flow).

---

## 9. Quality Gate

A Phase 3 implementation of onboarding passes if:

1. **§174 compliance:** No step displays or requires a field that is not used by a downstream step or first-use screen. Audited against the table in §3 above.
2. **Tier step counts:** Micro flow completes in 5 distinct screens; Enterprise in 9. Progress indicator reflects the correct count per tier.
3. **AI assistant available Step 4+:** The "Let me help" CTA is present on Steps 4, 5, 6, 7, 8 and invokes the §176 conversation flow.
4. **Import is genuinely optional:** "Start Fresh" is the primary CTA on Step 9; "Import Data" is secondary. The onboarding flow completes correctly if the import step is tapped past without action.
5. **Voice setup gracefully deferred:** If Step 11 is skipped, the Voice tab on Home shows a "Complete setup" prompt on first tap rather than failing silently.
6. **Mid-onboarding resume:** Closing and re-opening the app during onboarding resumes at the correct step with all entered data intact.
7. **Login path is clean:** A returning user who taps "Log In" reaches Home without seeing any onboarding screen.
8. **AI OS Introduction fires AWAKENING:** Step 12's "Let's go" tap triggers the AWAKENING → ANALYZING → READY state sequence, identical to all subsequent app launches.
9. **Import result surfaces flagged records:** Any records marked "Needs review" during Optional Import appear in a review queue on Home — they are never silently dropped.

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| Feature visibility per tier | `docs/ux/business-size-adaptive-ux.md` |
| AI OS state sequence (AWAKENING etc.) | `docs/ux/ai-os-state-machine.md` |
| Screen map (§239) | `docs/ux/information-architecture.md` |
| Navigation (bottom tab appears after onboarding) | `docs/ux/navigation-model.md` |
| Universal screen states (Loading, Empty, Error etc.) | `docs/ux/universal-screen-states.md` |
| Voice language coverage (23 languages, STT/TTS gaps) | `docs/research/sarvam-language-coverage.md` (DL-009) |
| MSME thresholds and GST rules | `docs/research/accounting-compliance.md` |
