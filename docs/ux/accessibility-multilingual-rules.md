# Vepari AI — Accessibility & Multilingual UX Ground Rules

> **Document:** `docs/ux/accessibility-multilingual-rules.md`  
> **Phase:** 2 — UX Architecture  
> **Type:** UI/UX  
> **Prompt:** 18  
> **Depends on:** Prompt 8 (DL-009 — Sarvam AI language coverage audit)  
> **Sources:** UI-UX §9, §120, §123, §125–129, §132–134, §194–196, §205, §235, §251, §256, §259; DL-009  
> **Status:** LOCKED — ground rules; apply to all Phase 4 and Phase 6 screens  

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)  
2. [Non-Color Status Rule](#2-non-color-status-rule)  
3. [Text Expansion Tolerance](#3-text-expansion-tolerance)  
4. [Script-Safe Layout Rules](#4-script-safe-layout-rules)  
5. [Dynamic Type and Font Scaling](#5-dynamic-type-and-font-scaling)  
6. [Touch Target Rules](#6-touch-target-rules)  
7. [Screen-Reader Labels](#7-screen-reader-labels)  
8. [Motion Accessibility](#8-motion-accessibility)  
9. [Voice Language UX Rules](#9-voice-language-ux-rules)  
10. [Number, Currency, and Date Localization](#10-number-currency-and-date-localization)  
11. [Multilingual Testing Gate](#11-multilingual-testing-gate)  
12. [Implementation Gate Checklist](#12-implementation-gate-checklist)  
13. [Quality Gate](#13-quality-gate)  

---

## 1. Purpose and Scope

These rules define the **non-negotiable floor** that every screen produced in Phase 4 (business screens) and Phase 6 (reports and analytics) must pass. They are testable pass/fail conditions, not aspirational goals.

**Why these rules are ground rules, not guidelines:**

- UI-UX §235: "Never treat translation as an afterthought. Every component must be language-resilient from the beginning."
- UI-UX §256: Accessibility ✓ and Localization foundation ✓ must both be satisfied before large-scale screen implementation proceeds.
- UI-UX §259: All 23 supported languages must be tested across text expansion, script rendering, voice, and AI before localization is called complete.

**What "testable" means in this document:** Every rule in §§2–11 is phrased as a concrete condition that a developer or QA engineer can check with a binary pass/fail verdict — no judgment calls. Aspirational wording ("should feel accessible") is prohibited in this document.

---

## 2. Non-Color Status Rule

**Source:** UI-UX §194 (color accessibility), §205 (charts)

### Rule A2.1 — Status indicator pairing (mandatory)

> **Every status indicator that uses color must also pair a non-color signal (icon, label, or pattern) so that the status is fully readable when color is removed.**

**Pass condition:** A tester who views the screen in grayscale, or who is color-blind, can identify every status without ambiguity.

**Fail condition:** Any status that is distinguished from another status solely by hue — e.g., green dot vs. red dot with no icon or label difference.

**Applies to:**
- Sync status: Saved locally / Synced / Queued / Failed / Conflict (UI-UX §230)
- Transaction status: Paid / Unpaid / Partial / Overdue
- AI OS state indicators (see `docs/ux/ai-os-state-machine.md`)
- Inventory alerts: In stock / Low stock / Out of stock
- GST / compliance badges: Valid / Pending / Error
- Connection status: Online / Offline / Syncing / AI unavailable (UI-UX §193)
- Form field validation: Valid / Error / Warning

**Required pairs:**

| Status | Color | Paired icon | Paired label |
|---|---|---|---|
| Saved locally | amber | cloud-off icon | "Saved locally" |
| Synced | green | checkmark icon | "Synced" |
| Queued | blue | clock icon | "Queued" |
| Sync failed | red | warning icon | "Sync failed" |
| Conflict | orange | merge icon | "Conflict" |
| Low stock | amber | alert-triangle | "Low stock" |
| Overdue | red | calendar-alert | "Overdue" |
| Offline | gray | wifi-off | "Offline" |
| AI unavailable | gray | ai-off icon | "AI unavailable" |

No status may rely on color as the *sole* distinguishing signal.

### Rule A2.2 — Chart understandability without color

> **Every chart must be readable when displayed in grayscale — labels, values, or patterns must distinguish data series independently of hue.**

**Pass condition:** Each data series in a chart can be identified without color — by label, direct annotation, pattern fill, or shape marker.

**Fail condition:** A pie chart, bar chart, or line chart where two or more segments/series are only distinguished by color.

**Implementation note:** Prefer labeled data points and direct annotations over legend-only charts. When a legend is used, each entry must also carry a pattern or shape marker — not only a color swatch.

---

## 3. Text Expansion Tolerance

**Source:** UI-UX §9, §128

### Rule A3.1 — No fixed-width text containers

> **No UI string container may use a fixed pixel width that truncates translated text. All containers must use flex/wrap layout or expand to accommodate text that is up to 2.5× the English character count.**

**Pass condition:** Every button, label, tab, and card title in all 23 supported languages fits completely within its container without truncation, ellipsis cutoff, or overflow, when rendered at the default system font size.

**Fail condition:** Any non-number string is truncated with `...` (ellipsis) in a language other than English at the default font size and at default screen width (360dp minimum viewport).

**Rationale (§128):** A button like "Save" in English may become significantly longer in another language. Buttons must adapt rather than truncate.

### Rule A3.2 — Two-line wrap is the minimum fallback

> **When a translated string does not fit on one line in its container, the container must wrap to at least two lines before truncating. Truncation is permitted only at three or more lines when the layout has no available vertical space.**

**Pass condition:** No single-line-only constraint is applied to translatable strings unless the layout physically cannot expand (e.g., a tab bar label that must stay on one line).

**Exception:** Bottom navigation tab labels (≤ 4 characters enforced in translations). All tab labels in the 23 supported languages must be confirmed ≤ 4 characters or abbreviated accordingly before the tab bar is built.

### Rule A3.3 — Expansion testing languages

The following languages are required test vectors for text expansion because they consistently produce the longest translations from English:

| Test priority | Language | Reason |
|---|---|---|
| Required | Tamil | Agglutinative — long single words |
| Required | Telugu | Agglutinative — long single words |
| Required | Malayalam | Agglutinative — longest average word length |
| Required | Hindi | Devanagari script — vertical stroke overhead |
| Required | Bengali | Compound consonants — visual density |
| Recommended | Marathi | Shares Devanagari; similar expansion |
| Recommended | Gujarati | Distinct script; mid-range expansion |

A screen is not approved for release until it passes text expansion with Tamil, Telugu, Malayalam, Hindi, and Bengali at minimum.

---

## 4. Script-Safe Layout Rules

**Source:** UI-UX §9 (typography rule), DL-001 (resolved), §260 principle 10

### Rule A4.1 — No hardcoded line heights

> **No component may use a hardcoded CSS/RN `lineHeight` value that does not account for scripts with descenders, conjuncts, or vowel marks above the cap height. All line heights must reference the typography design token for the active script.**

**Pass condition:** Text in Devanagari, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Gurmukhi, Odia, and Urdu renders without clipping — no letters are cut off at the top or bottom of their container.

**Fail condition:** Any akshar (syllable cluster) is visually clipped when rendered in the target script font at any supported system font size.

### Rule A4.2 — Typography token hierarchy

> **The active script determines the font family. Mixing scripts within a single string uses the correct font for each Unicode block. The fallback chain must be declared per script.**

Required font assignments (from DL-001):

| Script / use | Font | Scope |
|---|---|---|
| Brand wordmark / logo lockup | Cinzel Semibold | Wordmark and logo display only |
| English UI — headings, body, content | Lora | All English UI text |
| Tamil | Noto Serif Tamil | All Tamil-script content |
| Devanagari (Hindi, Marathi, Sanskrit, Nepali) | Noto Serif Devanagari | All Devanagari-script content |
| Telugu | Noto Serif Telugu | All Telugu-script content |
| Kannada | Noto Serif Kannada | All Kannada-script content |
| Malayalam | Noto Serif Malayalam | All Malayalam-script content |
| Bengali / Assamese | Noto Serif Bengali | All Bengali-script content |
| Gujarati | Noto Serif Gujarati | All Gujarati-script content |
| Gurmukhi (Punjabi) | Noto Serif Gurmukhi | All Gurmukhi-script content |
| Odia | Noto Serif Oriya | All Odia-script content |
| Urdu | Noto Nastaliq Urdu | All Urdu-script content |
| Other scripts (Santali-Ol Chiki, Sindhi, Kashmiri, etc.) | Noto Sans [script] | Per Unicode block |

**Pass condition:** No UI string renders using a fallback system font (visible as "tofu" squares or mismatched glyph metrics).

**Fail condition:** Any Indic script character renders as a .notdef glyph (□) or falls back to the device default.

### Rule A4.3 — RTL support for Urdu

> **Urdu text (script: Nastaliq, direction: RTL) must render right-to-left within its text container. The text container itself does not need to flip the surrounding layout, but the Urdu string must not be forced into LTR rendering.**

**Pass condition:** Urdu strings display with correct RTL text shaping. Bidirectional text (a Urdu label adjacent to a Latin number) follows Unicode bidi algorithm.

**Fail condition:** Urdu characters appear in reversed order, or are rendered in an Indic script font rather than Nastaliq.

---

## 5. Dynamic Type and Font Scaling

**Source:** UI-UX §251 QA checklist ("dynamic text"), §123 (touch targets)

### Rule A5.1 — Layout must not break at system font scale 1.3×

> **Every screen must remain functional — no text overlap, no button overflow, no hidden controls — when the Android system font size is set to 1.3× (Large) of the default.**

**Pass condition:** At 1.3× font scale, all interactive elements remain tappable, all labels remain readable, and no text overlaps any other element.

**Fail condition:** At 1.3× font scale, any button label overflows its button container, any card title overlaps adjacent content, or any form label is hidden behind another element.

### Rule A5.2 — Minimum readable font size

> **No translatable UI string may render below 12sp (scaled pixels) at the default system font size.**

**Pass condition:** Every string — including metadata labels, timestamps, and secondary descriptions — is ≥ 12sp at 1× scale.

**Fail condition:** Any label is rendered at 10sp or below.

**Exception:** Legal fine print or copyright text (if any) is excluded. Financial figures and business data are never excluded.

---

## 6. Touch Target Rules

**Source:** UI-UX §123 (touch targets)

### Rule A6.1 — Minimum touch target size

> **Every interactive control must have a touch target of at least 48dp × 48dp, regardless of its visual size.**

**Pass condition:** A tester using Android Accessibility Scanner or a layout bounds overlay confirms every tappable element has a hit area ≥ 48 × 48dp.

**Fail condition:** Any button, icon-button, switch, checkbox, or link has a touch target smaller than 48 × 48dp.

### Rule A6.2 — Touch target spacing

> **Interactive controls that appear adjacent must have at least 8dp of non-interactive space between their touch target edges.**

**Pass condition:** No two adjacent touch targets overlap.

**Fail condition:** Any two adjacent interactive controls have overlapping or touching hit areas, causing accidental activation.

### Rule A6.3 — Icon-only controls require accessible labels

> **An icon-only control (no visible text label) must have an `accessibilityLabel` that describes its action in the active language. The accessible label must be surfaced to screen readers.**

**Pass condition:** TalkBack (Android) announces the correct action description for every icon-only button.

**Fail condition:** TalkBack announces "button" or "unlabeled" for any icon-only control.

---

## 7. Screen-Reader Labels

**Source:** UI-UX §126 (screen reader support)

### Rule A7.1 — Every meaningful element has a complete accessibility descriptor

> **Every interactive and informational element must have: (a) an `accessibilityLabel` describing what it is or does, (b) an `accessibilityRole` matching its function, (c) an `accessibilityState` reflecting its current state, and (d) where the action has a consequence, an `accessibilityHint` describing the result.**

Required attributes per element type:

| Element type | Label | Role | State | Hint |
|---|---|---|---|---|
| Primary button | Action name in active language | `button` | Disabled state if applicable | Required if action has a financial consequence |
| Navigation tab | Tab name in active language | `tab` | Selected/unselected | — |
| Icon-only button | Action description in active language | `button` | — | Required |
| Status badge | Status text in active language | — | — | — |
| Form field | Field label in active language | `adjustable` (sliders) or none | `invalid` when validation fails | — |
| AI OS orb / animated element | "AI [state name]" in active language | `none` (decorative) | — | — |
| Chart | Chart title + data summary in active language | — | — | — |
| Sync status indicator | Full status text in active language | — | — | — |

**Pass condition:** TalkBack reads a meaningful, context-accurate description for every element the user can focus.

**Fail condition:** TalkBack reads "image," "view," "button," or silence for any non-decorative element.

### Rule A7.2 — Decorative animations do not interrupt screen readers

> **Animated elements that carry no informational content (AI orb pulse, background particles, transition decorations) must be marked `importantForAccessibility="no"` so they do not receive focus during screen-reader navigation.**

**Pass condition:** TalkBack does not stop at, announce, or repeat any purely decorative animation.

**Fail condition:** TalkBack focus lands on, or repeatedly re-announces, a decorative animation element.

### Rule A7.3 — Accessible labels are in the active language

> **The `accessibilityLabel` for every element must be in the language the user has configured, not hardcoded English.**

**Pass condition:** A user with Tamil configured hears TalkBack read labels in Tamil.

**Fail condition:** Any `accessibilityLabel` is a hardcoded English string when the active language is not English.

---

## 8. Motion Accessibility

**Source:** UI-UX §125 (reduced-motion behavior), §195 (accessibility motion), §196 (accessibility AI OS)

### Rule A8.1 — Reduced-motion behavior is mandatory, not optional

> **When `prefers-reduced-motion` / the Android "Remove animations" accessibility setting is active, the app must present all information and complete all workflows with no functional degradation. The reduced-motion variant must be explicitly specified for every animated component.**

**Pass condition:** With "Remove animations" enabled in Android Settings, every screen remains navigable, every state transition is communicated (via label or instant visual change), and no UI element becomes hidden or unresponsive.

**Fail condition:** Any screen becomes unusable, any state transition is undetectable, or any interactive element disappears when animations are disabled.

### Rule A8.2 — AI OS reduced-motion equivalents are required

> **Each of the 13 AI OS states (defined in `docs/ux/ai-os-state-machine.md`) must have a reduced-motion visual variant. The variant must communicate the state change through a non-animated signal: a label change, an instant color/icon change, or a static visual indicator.**

**Pass condition:** A user with reduced motion enabled can identify the current AI OS state from a static, non-animated element at all times.

**Fail condition:** The AI OS state is only communicated through animation (orb pulse, particle effect, breathing glow) with no static equivalent.

### Rule A8.3 — No information is conveyed solely through animation timing

> **Duration, speed, and easing of animations must not be the carrier of information. Information is conveyed by the resulting state, not by how the transition feels.**

**Pass condition:** Skipping any animation does not cause the user to miss any business or AI information.

**Fail condition:** A timeout, urgency level, or confidence indicator is expressed only through animation speed or pulse frequency.

---

## 9. Voice Language UX Rules

**Source:** UI-UX §132–134, DL-009 (Prompt 8 audit)

These rules apply to the Voice tab, AI OS LISTENING state, and any screen with inline voice input.

### Rule A9.1 — Active listening language is always visible

> **When the AI OS is in LISTENING state, the current STT language must be displayed as a visible, non-animated label on screen — not only as part of a Settings menu.**

**Pass condition:** During every LISTENING state, a label clearly shows the active language (e.g., "Listening in Hindi" / "हिंदी में सुन रहे हैं"). The label is present without opening any menu.

**Fail condition:** The active listening language is hidden, absent, or accessible only through a settings tap.

### Rule A9.2 — TTS gap languages show text-only indicator

> **For the 12 languages that have STT but no Bulbul TTS voice (Assamese, Urdu, Nepali, Konkani, Kashmiri, Sindhi, Sanskrit, Santali, Manipuri, Bodo, Maithili, Dogri), the AI's response must be delivered as text and the text-only delivery mode must be indicated with a visible label, not inferred by the user.**

**Pass condition:** When the active language is one of the 12 gap languages, the AI response area displays a label such as "Reply in text" alongside the response. No spoken audio plays for the response.

**Fail condition:** The user speaks in a gap language and receives a silent response with no indication of why there is no audio.

### Rule A9.3 — Language switch during voice interaction is acknowledged

> **When the user switches input language mid-interaction (speaks a different language than the currently configured one), the system acknowledges the switch before continuing. Silent language switching without user feedback is prohibited.**

**Pass condition:** If a detected language differs from the configured language and the system switches, a brief indicator (toast or inline label) confirms the new active language before the next AI response.

**Fail condition:** The system silently switches language and the user cannot determine which language is now active without checking settings.

### Rule A9.4 — AI response language follows user configuration

> **The AI's text and voice response must be in the user's configured language, not defaulting to English, unless the user explicitly requests another language.**

**Pass condition:** A user whose configured language is Tamil receives AI responses in Tamil text. A user whose configured language is a TTS-gap language receives AI responses in text, in that language.

**Fail condition:** The AI responds in English when the user's configured language is not English, without an explicit user request.

### Rule A9.5 — Odia endpoint codes handled per DL-009

> **Saaras STT calls for Odia must use `od-IN`. Bulbul TTS calls for Odia must use `or-IN`. These codes must never be swapped or assumed to be interchangeable.**

**Pass condition:** The voice service integration test confirms Odia STT uses `od-IN` and Odia TTS uses `or-IN`.

**Fail condition:** Either endpoint receives the wrong locale code for Odia.

---

## 10. Number, Currency, and Date Localization

**Source:** UI-UX §129 (numbers), §130 (currency), §131 (date/time)

### Rule A10.1 — Financial precision is language-invariant

> **The mathematical value of any financial figure — amount, tax, total, balance — must be identical regardless of the active display language. Only the display format (digit grouping, decimal separator, numeral script) may vary by locale.**

**Pass condition:** ₹1,00,000.00 in Hindi displays as the numerically identical amount in all 23 languages. No rounding or precision loss occurs during localization of the display.

**Fail condition:** Any financial value changes its mathematical value as a side effect of locale-specific number formatting.

### Rule A10.2 — Indian number formatting by default

> **All financial amounts in Indian rupees must use the Indian number format (lakh/crore grouping: 1,00,000 and 1,00,00,000) as the default, not the Western format (1,000,000). The display format must be configurable in business settings but must default to Indian grouping.**

**Pass condition:** A fresh installation with no configuration change displays ₹1,00,000 not ₹1,000,000.

**Fail condition:** The application defaults to Western thousand grouping for Indian rupee amounts.

### Rule A10.3 — Numeral scripts: Eastern numerals on request only

> **Eastern (Devanagari, Tamil, Telugu, etc.) numeral scripts in financial figures are only rendered when the user has explicitly enabled them in Display Settings. Financial figures default to ASCII numerals (0–9) in all locales to prevent accounting errors from numeral script confusion.**

**Pass condition:** In the default configuration, all financial figures use ASCII 0–9 regardless of UI language.

**Fail condition:** Financial figures render in Devanagari or Tamil numerals by default, without user opt-in.

### Rule A10.4 — Date and time are locale-aware

> **All date and time displays must use the locale-appropriate format for the active language. The ISO date (YYYY-MM-DD) is never shown to the user directly; the locale format is always applied.**

**Pass condition:** A user with Hindi configured sees dates in DD/MM/YYYY (Indian format). A user with English configured sees DD MMM YYYY or DD/MM/YYYY per Indian convention.

**Fail condition:** ISO dates (e.g., "2025-10-01") are displayed directly to the user in any language.

---

## 11. Multilingual Testing Gate

**Source:** UI-UX §127, §259

A screen may not be marked ready for production until all of the following checks pass.

### 11.1 — Required test languages

Every screen must be tested in at minimum:

| # | Language | Script | Why required |
|---|---|---|---|
| 1 | English | Latin | Baseline |
| 2 | Hindi | Devanagari | Most-used Indian language |
| 3 | Tamil | Tamil | Maximum text expansion |
| 4 | Telugu | Telugu | Maximum text expansion |
| 5 | Malayalam | Malayalam | Maximum word length |
| 6 | Bengali | Bengali | Compound conjuncts |
| 7 | Urdu | Nastaliq (RTL) | RTL direction |
| 8 | Punjabi | Gurmukhi | Gurmukhi script test |
| 9 | One TTS-gap language | Various | Text-only reply path |

Testing all 23 is required before the localization gate (§259) is signed off.

### 11.2 — Tested surface types per language

For each test language, all of the following UI surfaces must be verified:

| Surface | What to verify |
|---|---|
| Headers / screen titles | No truncation, no overflow |
| Buttons | No truncation; wraps gracefully when needed |
| Cards | Title, metadata, and action labels all fit |
| Table / list rows | Row height adjusts; no clip |
| Dialogs / modals | Content area scrolls when needed; CTA buttons visible |
| AI responses | Long responses scroll; do not overflow container |
| Forms | Labels visible; fields expand with translation |
| Notifications | Banner and toast text fully visible |
| Bottom navigation tabs | Tab labels fit; abbreviations confirmed |
| Status indicators | Icon + label pair visible in all languages |

### 11.3 — Voice surface test

For each language in the 11-language TTS set:
- Voice input recognized and transcribed correctly
- AI response plays as audio
- Active language label is visible during LISTENING

For each language in the 12-language STT-only set:
- Voice input recognized and transcribed correctly
- AI response delivered as text only
- Text-only indicator is visible

---

## 12. Implementation Gate Checklist

These are the conditions required before Phase 4 screen implementation begins, as set by UI-UX §256:

| Gate condition | Test method | Pass condition |
|---|---|---|
| Color independence verified | Grayscale screenshot review | All status indicators readable without color |
| Text expansion passed | 5-language render test | No truncation in Tamil, Telugu, Malayalam, Hindi, Bengali |
| Script rendering verified | Font audit per script | No .notdef glyphs in any supported script |
| Line height safety confirmed | Visual clip inspection | No akshar clipped in any Indic script |
| Touch targets ≥ 48dp | Accessibility Scanner | All interactive elements ≥ 48 × 48dp |
| Screen-reader labels complete | TalkBack walkthrough | Every element has meaningful label + role |
| Reduced-motion variants defined | Motion-off screenshot | All states visible without animation |
| AI OS reduced-motion equivalent | Motion-off + TalkBack | All 13 states identifiable statically |
| Voice language label present | Manual UI review | LISTENING state always shows active language |
| TTS gap language text-only path | Manual test in Assamese | Text-only indicator shown; no silent failure |
| Financial precision preserved | Unit test: locale formatting | Same value in all 23 locales |
| Indian number format default | Fresh install test | ₹1,00,000 not ₹1,000,000 by default |
| Odia endpoint codes correct | Integration test | STT `od-IN`, TTS `or-IN` |
| Dynamic type 1.3× stable | Font scale emulator test | No overlap or hidden elements at 1.3× |
| Accessible labels in active language | TalkBack in Tamil | Labels announced in Tamil, not English |

All 15 conditions must pass. A partial pass is a fail.

---

## 13. Quality Gate

Prompt 18 is complete when the following conditions are all true:

1. **Every rule is testable:** Each rule in §§2–11 has a named pass condition and a named fail condition. No rule uses aspirational language ("should be accessible," "strive to support").

2. **Non-color status rules cover all 9 status types defined in this document** (sync, transaction, AI state, inventory, GST, connection, form validation, voice language, TTS gap).

3. **Text expansion tolerance specifies the 5 required test-vector languages** (Tamil, Telugu, Malayalam, Hindi, Bengali) plus the exception handling for bottom nav tabs.

4. **Script-safe rules cover all 12 Indic scripts** in Vepari AI's 23-language set and explicitly address Urdu RTL rendering.

5. **Screen-reader rules cover all element types** in the core component library (`docs/ux/navigation-model.md` component list).

6. **Motion accessibility rules address all 13 AI OS states** by reference to `docs/ux/ai-os-state-machine.md`.

7. **Voice language rules implement DL-009 findings:** The 11-language TTS ceiling is explicit; the 12 STT-only gap languages are named; Odia endpoint code discrepancy is captured as a testable rule.

8. **Financial precision rule is unambiguous:** Mathematical value is invariant across all 23 locales; display format may vary; Eastern numeral scripts require opt-in.

9. **Implementation gate checklist has 15 verifiable conditions**, all of which must pass before Phase 4 screen implementation begins.

---

*Produced under the Vepari AI master governance contract (Prompt 0). No rule in this document may be relaxed without a new Decision Log entry.*
