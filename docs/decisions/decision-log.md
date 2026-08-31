# Vepari AI — Decision Log

> **Document:** `docs/decisions/decision-log.md`  
> **Format:** §0.3 decision log format from the Master Scope and Operating Contract  
> **Entries:** Most recent first  

All entries that affect spec documents record which files need updating. No decision is back-applied silently to source files without a corresponding commit.

---

## DL-001 — Typography: English and Tamil Typeface Specification

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-001 |
| **Domain** | Design System — Typography |
| **Status** | **DECIDED** |
| **Decision maker** | Product owner |
| **Decided during** | Prompt 2 (Phase 1 · Type: PRODUCT DECISION) |

### Title

Primary English typeface is Cinzel Semibold (wordmark/logo) + Lora (UI). Primary Tamil typeface is Noto Serif Tamil.

### Background

All 9 master text documents (PRD, TRD, App Flow, UI-UX, Frontend, Backend, Database·Storage, AI OS, Implementation Plan) specified **Lora** as "the primary English display/brand typography." `Brand.png`'s typography specimen panel specified **Cinzel Semibold** (English) and **Nirmala UI Semibold Tamil** (Tamil), with no mention of Lora.

This created a direct conflict (DL-001, logged 2026-08-31) that blocked Phase 5 typography token work.

### Options Considered

| Option | Description | Verdict |
|---|---|---|
| A — Two-tier | Cinzel Semibold = wordmark/logo only; Lora = all UI text, headings, body | **CHOSEN** |
| B — Lora everywhere | Lora as single typeface including wordmark; requires Brand.png logo lockup rebuild | Rejected |
| C — Cinzel everywhere | Architecturally impossible: Cinzel has no true lowercase and zero Tamil/Indic script coverage | Off the table |

### Decision

**Option A — Two-tier typography system:**

| Layer | Typeface | Usage |
|---|---|---|
| **Brand / Wordmark** | **Cinzel Semibold** | VEPARI AI wordmark, logo lockup, app-name display text, splash screen brand display |
| **UI / Content** | **Lora** | All screen headings, body text, labels, form fields, UI copy throughout the app |
| **Tamil / Indic** | **Noto Serif Tamil** | All Tamil-script content — replaces Brand.png's Nirmala UI specification |

### Reasoning

1. Brand.png is the primary visual design artefact and was produced by the brand designer. Its typography specimen is a design intent document — Cinzel Semibold is what the designer chose for the wordmark.
2. The 9 text spec documents were written with "Lora as primary typography" meaning the UI/content layer, not the wordmark layer — but this distinction was never made explicit in the text.
3. Cinzel is architecturally limited to display use (no true lowercase, Latin-only) so Option C is technically impossible for an app with 23-language support and prose UI text.
4. The two-tier approach makes both sources simultaneously correct at their respective layers. No Brand.png rebuild is required.
5. **Nirmala UI** (Brand.png's Tamil specification) is a proprietary Microsoft font bundled with Windows — it is not licensable for Android/iOS app bundling without a commercial agreement. **Noto Serif Tamil** is free, open-source, ships natively on Android 7+, is high-quality, and is the natural serif pairing for Lora.

### Consequences and Required Follow-Up

#### Immediate (must be done before Phase 5 typography token work begins)

- [ ] **All 9 master spec documents** need their typography sections updated to add the two-tier distinction. The phrase "Lora is the primary English display/brand typography" must be revised to: "Cinzel Semibold is the wordmark/logo display typeface. Lora is the primary UI heading and body typeface."
- [ ] **UI-UX.txt** §Typography is the most critical update — it governs all component token values.
- [ ] **Prompt 0 §0.3.1** (external template, not a repo file) must be updated to replace "Lora (primary English display/brand)" with the two-tier definition and to replace "Nirmala UI" with "Noto Serif Tamil".
- [ ] **knowledge-map.md** DL-001 entry updated to DECIDED status. ✓ (done in this commit)

#### Before Phase 5 implementation (font token work)

- [ ] Confirm `@expo-google-fonts/cinzel` is available and the correct Semibold weight is accessible.
- [ ] Confirm `@expo-google-fonts/lora` covers all required weights (Regular, Italic, SemiBold, Bold).
- [ ] Confirm `@expo-google-fonts/noto-serif-tamil` covers all required weights for the 23-language rendering strategy.
- [ ] Design tokens in `UI-UX.txt` §Token-Values to reference `fontFamily.brand = 'Cinzel_600SemiBold'` and `fontFamily.ui = 'Lora_400Regular'` (and variants).

#### Does NOT require action before Phase 5

- Brand.png requires no changes. The existing Cinzel Semibold wordmark is now the canonical standard.
- App Icon.png requires no changes.

### References

- `Brand.png` — typography specimen panel (source of Cinzel Semibold and Nirmala UI specifications)
- `UI-UX.txt §Typography` — source of Lora specification (must be updated)
- All 9 master spec documents — all contain Lora references that need the two-tier correction
- DL-001 in `docs/decisions/knowledge-map.md` — original conflict log entry

---

*End of DL-001 entry.*

---

> Additional decisions will be appended above this line as they are made. Entries are ordered most-recent-first.
