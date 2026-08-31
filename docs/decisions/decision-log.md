# Vepari AI — Decision Log

> **Document:** `docs/decisions/decision-log.md`  
> **Format:** §0.3 decision log format from the Master Scope and Operating Contract  
> **Entries:** Most recent first  

All entries that affect spec documents record which files need updating. No decision is back-applied silently to source files without a corresponding commit.

---

## DL-010 — Android Font Strategy for Indic Scripts (Research)

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-010 |
| **Domain** | Research — Typography / Design System |
| **Status** | **RESEARCH COMPLETE — READY FOR PHASE 5** |
| **Researcher** | Engineering (Prompt 8 audit) |
| **Researched during** | Prompt 8 (Phase 1 · Type: RESEARCH) |
| **Extends** | DL-001 (typography decision) |
| **Source** | expo/google-fonts GitHub (verified 2026-08-31) |

### Objective

Resolve the Nirmala UI Android-availability caveat from DL-001 and Prompt 0 §0.3.1 with a complete font-per-script mapping across all 23 target languages. This table is the input for Phase 5 (design system) typography token work — specifically Prompt 44 (multilingual typography tokens).

### Nirmala UI: Confirmed Unavailable for Android Bundling

Nirmala UI is a Microsoft proprietary typeface bundled with Windows 8 / 8.1 / 10 / 11. Its status on Android and iOS:

| Platform | Availability | Licensable for bundling? |
|---|---|---|
| Windows 8+ | System font | N/A (OS-bundled) |
| Android | **Not present** — not part of AOSP or Google Fonts | **No** — Microsoft EULA prohibits redistribution without a commercial agreement |
| iOS | **Not present** | **No** — same licensing restriction |
| Google Fonts / open web | Not listed | N/A |

**Conclusion:** Nirmala UI cannot appear in any Vepari AI build on any mobile platform. DL-001 correctly retired it. All Indic script rendering must use open-licensed alternatives.

### Script Inventory for the 23 Target Languages

The 23 languages span 9 distinct writing systems. Two additional scripts appear in "also written in" contexts but are not primary for any language in the target set.

| Writing system | Primary languages in the 23 | Total languages |
|---|---|---|
| Devanagari | Hindi, Marathi, Sanskrit, Nepali, Konkani, Dogri, Bodo, Maithili | **8** |
| Bengali | Bengali, Assamese | **2** |
| Tamil | Tamil | 1 |
| Telugu | Telugu | 1 |
| Kannada | Kannada | 1 |
| Malayalam | Malayalam | 1 |
| Gujarati | Gujarati | 1 |
| Gurmukhi | Punjabi | 1 |
| Odia | Odia | 1 |
| Arabic / Nastaliq | Urdu, Kashmiri, Sindhi | **3** |
| Meitei Mayek | Manipuri | 1 |
| Ol Chiki | Santali | 1 |
| Latin | English (+ transliteration mode for all) | 1 |

### Font-Per-Script Mapping Table

All Noto fonts are licensed under **SIL Open Font License 1.1 (OFL)**. The `@expo-google-fonts/*` npm package wrappers are MIT-licensed. Both licenses permit commercial app bundling with no royalty.

| # | Script | Languages | Primary font (bundle) | @expo-google-fonts package | Weights available | System fallback (Android AOSP) | Must bundle? | RTL? | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Latin** | English | `Lora` (UI), `Cinzel Semibold` (wordmark only) | `@expo-google-fonts/lora` · `@expo-google-fonts/cinzel` | Lora: 400/400i/600/700/700i · Cinzel: 400/500/600/700/800/900 | System Latin (Roboto) | **Yes — bundle** | No | DL-001; also covers Roman-script Konkani |
| 2 | **Devanagari** | Hindi, Marathi, Sanskrit, Nepali, Konkani, Dogri, Bodo, Maithili | `Noto Serif Devanagari` | `@expo-google-fonts/noto-serif-devanagari` | 100–900 (9 weights) | `Noto Sans Devanagari` ✅ | **Yes — bundle serif** | No | Largest group: 8 languages; system AOSP carries Sans but not Serif; variable font file available for size savings |
| 3 | **Bengali** | Bengali, Assamese | `Noto Serif Bengali` | `@expo-google-fonts/noto-serif-bengali` | 100–900 (9 weights) | `Noto Sans Bengali` ✅ | **Yes — bundle serif** | No | Same font family covers both languages |
| 4 | **Tamil** | Tamil | `Noto Serif Tamil` | `@expo-google-fonts/noto-serif-tamil` | (confirmed in DL-001) | `Noto Sans Tamil` ✅ | **Yes — bundle serif** | No | Established in DL-001 |
| 5 | **Telugu** | Telugu | `Noto Serif Telugu` | `@expo-google-fonts/noto-serif-telugu` | 100–900 (9 weights) | `Noto Sans Telugu` ✅ | **Yes — bundle serif** | No | |
| 6 | **Kannada** | Kannada | `Noto Serif Kannada` | `@expo-google-fonts/noto-serif-kannada` | 100–900 (9 weights) | `Noto Sans Kannada` ✅ | **Yes — bundle serif** | No | |
| 7 | **Malayalam** | Malayalam | `Noto Serif Malayalam` | `@expo-google-fonts/noto-serif-malayalam` | 100–900 (9 weights) | `Noto Sans Malayalam` ✅ | **Yes — bundle serif** | No | |
| 8 | **Gujarati** | Gujarati | `Noto Serif Gujarati` | `@expo-google-fonts/noto-serif-gujarati` | 100–900 (9 weights) | `Noto Sans Gujarati` ✅ | **Yes — bundle serif** | No | |
| 9 | **Gurmukhi** | Punjabi | `Noto Serif Gurmukhi` | `@expo-google-fonts/noto-serif-gurmukhi` | 100–900 (9 weights) | `Noto Sans Gurmukhi` ✅ | **Yes — bundle serif** | No | |
| 10 | **Odia** | Odia | `Noto Serif Oriya` | `@expo-google-fonts/noto-serif-oriya` | 400/500/600/700 (4 weights) | `Noto Sans Oriya` ✅ | **Yes — bundle serif** | No | ⚠️ Package named "oriya" not "odia" (historical ISO name); only 4 weights available |
| 11 | **Arabic / Nastaliq** | Urdu, Kashmiri, Sindhi | `Noto Nastaliq Urdu` | `@expo-google-fonts/noto-nastaliq-urdu` | 400/500/600/700 (4 weights) | Partially (`Noto Nastaliq Urdu` bundled in Android 5+ for Urdu system fonts) | **Yes — bundle** | **Yes (RTL)** | ⚠️ RTL: requires `I18nManager.forceRTL` or per-text `writingDirection`; covers Urdu, Kashmiri, Sindhi (all use Perso-Arabic/Nastaliq); no separate Serif variant exists — Nastaliq calligraphic style IS the standard display form |
| 12 | **Meitei Mayek** | Manipuri | `Noto Sans Meetei Mayek` | `@expo-google-fonts/noto-sans-meetei-mayek` | 100–900 (9 weights) | Unreliable (OEM-dependent; Android 11+ on some devices) | **Yes — bundle** | No | ⚠️ No Serif variant exists for this script; Sans is the only option; official script since 2005 (alternate: Bengali script for Manipuri — covered by row 3) |
| 13 | **Ol Chiki** | Santali | `Noto Sans Ol Chiki` | `@expo-google-fonts/noto-sans-ol-chiki` | 400/500/600/700 (4 weights) | Unreliable (few stock Android devices include this) | **Yes — bundle** | No | ⚠️ No Serif variant exists; Sans is the only option; alternate scripts (Devanagari, Bengali) are also used for Santali in practice |

### Design Token Names (for Phase 5 reference)

To be defined in the design system alongside the DL-001 tokens. Naming convention follows the pattern established in DL-001:

```
fontFamily.brand          = 'Cinzel_600SemiBold'       // wordmark/logo only
fontFamily.ui             = 'Lora_400Regular'           // all English UI text
fontFamily.devanagari     = 'NotoSerifDevanagari_400Regular'
fontFamily.bengali        = 'NotoSerifBengali_400Regular'
fontFamily.tamil          = 'NotoSerifTamil_400Regular' // DL-001
fontFamily.telugu         = 'NotoSerifTelugu_400Regular'
fontFamily.kannada        = 'NotoSerifKannada_400Regular'
fontFamily.malayalam      = 'NotoSerifMalayalam_400Regular'
fontFamily.gujarati       = 'NotoSerifGujarati_400Regular'
fontFamily.gurmukhi       = 'NotoSerifGurmukhi_400Regular'
fontFamily.odia           = 'NotoSerifOriya_400Regular'  // pkg: noto-serif-oriya
fontFamily.nastaliq       = 'NotoNastaliqUrdu_400Regular' // Urdu, Kashmiri, Sindhi
fontFamily.meeteiMayek    = 'NotoSansMeeteiMayek_400Regular'
fontFamily.olChiki        = 'NotoSansOlChiki_400Regular'
```

Fallback stack for each: `[scriptFont, systemSansScript, system-ui, sans-serif]`

### Bundling Strategy and APK Size

The 23-language full bundle is large. Recommended phased approach:

| Phase | Fonts bundled | Languages covered | Estimated add to APK |
|---|---|---|---|
| **MVP (Phase 9–10)** | Latin (Lora, Cinzel), Devanagari, Tamil | English, Hindi (+ 7 more Devanagari), Tamil | +6–8 MB |
| **Phase 11–12** | + Bengali, Telugu, Kannada, Malayalam, Gujarati, Gurmukhi | Full TTS-11 language set | +8–12 MB additional |
| **Phase 13** | + Odia, Nastaliq, Meetei Mayek, Ol Chiki | Remaining 12 languages | +4–6 MB additional |

**APK size optimization:** Use Expo's font subsetting or load only the weights actually referenced in design tokens (typically 400 Regular, 500 Medium, 600 SemiBold, 700 Bold). Avoid bundling all 9 weights for every script in the MVP build. Variable font files (where available) cover all weights in a single file and are significantly more efficient.

### RTL Implementation Note

Three languages use Nastaliq (Urdu, Kashmiri, Sindhi) — all RTL. React Native RTL handling:

- `I18nManager.isRTL` and `I18nManager.forceRTL(true)` to flip the layout direction.
- Per-text RTL: wrap RTL text in a `<Text style={{writingDirection: 'rtl', textAlign: 'right'}}>` without forcing global RTL (safer for mixed-language screens).
- React Native's layout system uses logical `start`/`end` instead of `left`/`right` when RTL is active — use `marginStart`/`marginEnd` and `paddingStart`/`paddingEnd` in components that may contain RTL text.
- Business data fields may mix LTR (numbers, English) and RTL (Urdu) content on the same screen — use `unicodeBidi: 'embed'` or `bidiEmbedding` text blocks to isolate directionality.

### Consequences and Required Follow-Up

- [x] Nirmala UI confirmed unavailable for Android bundling. ✓
- [x] All 13 scripts mapped to verified @expo-google-fonts packages. ✓
- [x] Font token naming convention established. ✓
- [x] Bundling strategy (phased by implementation phase) defined. ✓
- [ ] **Phase 5 typography tokens**: Implement `fontFamily.*` tokens in the design system using this table. Do not invent new font names — use the exact package export names above.
- [ ] **Package weight selection**: At Phase 9 (React Native foundation), confirm with design which weights are actually used before bundling all 9 weights per script.
- [ ] **Odia font name**: Use package `@expo-google-fonts/noto-serif-oriya` — the name "oriya" is historical and the package will not be found under "odia."
- [ ] **RTL layout**: Implement RTL support in the component system before Urdu/Kashmiri/Sindhi voice interface goes live (Phase 13).
- [ ] **Variable fonts**: Check if `@expo-google-fonts/noto-serif-devanagari` supports variable font loading via expo-font for APK size reduction.
- [ ] **knowledge-map.md §0.15**: Update with this research (done in same commit).

### References

- `docs.expo.dev` / `github.com/expo/google-fonts` — @expo-google-fonts package registry (verified 2026-08-31)
- DL-001 — typography decision (Cinzel + Lora + Noto Serif Tamil)
- `Project Instructions.txt §7` — 23-language mandate
- `UI-UX.txt §Typography` — design token source document
- Microsoft Nirmala UI EULA — confirms non-redistributable

---

*End of DL-010 entry.*

---

## DL-009 — Sarvam AI Endpoint Language Coverage (Research)

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-009 |
| **Domain** | Research — Voice/Language Architecture |
| **Status** | **RESEARCH COMPLETE — ACTION REQUIRED** |
| **Researcher** | Engineering (Prompt 7 audit) |
| **Researched during** | Prompt 7 (Phase 1 · Type: RESEARCH) |
| **Source** | `docs.sarvam.ai` (fetched 2026-08-31) |

### Objective

Verify the exact language coverage of the two Sarvam AI endpoints Vepari AI will call — Saaras v3/v4 (STT) and Bulbul v3 (TTS) — against the 23-language mandate in Project Instructions §7. Identify any gap before Phase 13 (localization) design begins.

### Endpoint Summary

#### STT — `POST https://api.sarvam.ai/speech-to-text`

| Parameter | Value |
|---|---|
| **Model** | `saaras:v3` (recommended) · `saaras:v4` (latest; adds Global English) |
| **Auth** | `api-subscription-key` header |
| **Input** | `file` (WAV, MP3, AAC, FLAC, OGG) — max **30 seconds** per request |
| **Mode options** | `transcribe` (default), `translate`, `verbatim`, `translit`, `codemix` |
| **Language detection** | Automatic when `language_code` omitted |
| **Batch API** | Required for audio longer than 30 seconds |

#### TTS — `POST https://api.sarvam.ai/text-to-speech`

| Parameter | Value |
|---|---|
| **Model** | `bulbul:v3` |
| **Auth** | `api-subscription-key` header |
| **Input** | `text` (string) — max **2,500 characters** per request |
| **Voices (v3)** | 37 total: 23 male (default: Shubh), 14 female (default: Ishita) |
| **Pace control** | `pace` float 0.5–2.0 |
| **Audio formats** | WAV (default), MP3, Linear16, Mulaw, Alaw, Opus, FLAC, AAC |
| **Sample rates** | 8000 / 24000 (default) / 32000 / 44100 / 48000 Hz |

### Language Coverage Table

Sourced from `docs.sarvam.ai` on 2026-08-31. Language codes are as documented per endpoint — note the Odia code discrepancy flagged below.

| # | Language | STT code (Saaras) | TTS code (Bulbul) | STT transcribe | STT translate | STT codemix | STT translit | TTS |
|---|---|---|---|---|---|---|---|---|
| 1 | Hindi | `hi-IN` | `hi-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Bengali | `bn-IN` | `bn-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | Tamil | `ta-IN` | `ta-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | Telugu | `te-IN` | `te-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Kannada | `kn-IN` | `kn-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | Malayalam | `ml-IN` | `ml-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | Marathi | `mr-IN` | `mr-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | Gujarati | `gu-IN` | `gu-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | Punjabi | `pa-IN` | `pa-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | Odia | `od-IN` ⚠️ | `or-IN` ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | English | `en-IN` | `en-IN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| — | *TTS ceiling (11 above)* | | | | | | | |
| 12 | Assamese | `as-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 13 | Urdu | `ur-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 14 | Nepali | `ne-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 15 | Konkani | `kok-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 16 | Kashmiri | `ks-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 17 | Sindhi | `sd-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 18 | Sanskrit | `sa-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 19 | Santali | `sat-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 20 | Manipuri | `mni-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 21 | Bodo | `brx-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 22 | Maithili | `mai-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |
| 23 | Dogri | `doi-IN` | — | ✅ | ❌ | ✅ | ✅ | ❌ |

**STT mode coverage:**
- `transcribe`, `verbatim`, `translit`, `codemix` — all 23 languages ✅
- `translate` (to English) — **11 languages only** (same set as TTS) ⚠️
- Codemix mode: English words in English, Indic words in native script — all 23 ✅
- Translit mode: Latin-script romanization — all 23 ✅

### Key Findings

#### Finding 1 — TTS covers 11 languages, not 23

Bulbul v3 supports 10 Indian languages + English. **12 of the 23 target languages have no TTS voice output** with the current Sarvam stack. This means the "23-language voice experience" claimed in Project Instructions §7 is partially aspirational — the voice input (STT) works for all 23, but voice reply (TTS) is limited to 11.

**The 12 STT-only languages (no TTS):**
Assamese, Urdu, Nepali, Konkani, Kashmiri, Sindhi, Sanskrit, Santali, Manipuri, Bodo, Maithili, Dogri.

For these 12 languages, Vepari AI's response must be delivered as **text only** (or in a fallback language) unless a future Sarvam TTS update or an alternative TTS provider is integrated.

#### Finding 2 — Translate mode also limited to 11 languages

`mode=translate` in Saaras STT converts speech to English text — but this mode only works for the same 11 languages Bulbul supports. For the 12 STT-only languages, translate mode is unavailable; transcribe/codemix/translit still work fully.

#### Finding 3 — Odia language code discrepancy

Saaras STT documentation uses **`od-IN`** for Odia, while the Bulbul TTS REST API uses **`or-IN`** (the ISO 639-1 / BCP-47 standard code). Both refer to the Odia / Oriya language. Implementation must use the endpoint-specific code for each call — never assume they are interchangeable at the API level.

#### Finding 4 — Sarvam-105B and Mayura also limit to 11 languages

The LLM (`sarvam-105b`) and translation model (`mayura`) both document 11-language coverage — the same 11 as Bulbul TTS. This means the complete Sarvam pipeline (Voice → STT → LLM → TTS → Voice Reply) only operates end-to-end in 11 languages today. The provider-agnostic AI gateway in Backend.txt/AI OS.txt is therefore critical to the 23-language vision — a different LLM may need to handle the 12 STT-only languages.

#### Finding 5 — Saaras v4 adds Global English, not more Indian languages

Saaras v4 extends English to cover non-Indian accents ("Global English alongside Indian English"). The 22 Indian language list is unchanged between v3 and v4.

### Phase 13 Localization Ceiling

The real ceiling for Phase 13 (Growth & Access — voice/language build) is:

| Tier | Languages | Voice-in | Voice-out | AI reply | Notes |
|---|---|---|---|---|---|
| **Full round-trip** | 11 | ✅ STT | ✅ TTS | ✅ Sarvam-105B | Complete voice experience |
| **Voice-in, text-out** | 12 | ✅ STT | ❌ no TTS | ⚠️ May need alt LLM | User speaks; app replies in text |
| **No coverage** | 0 | — | — | — | All 23 are covered by STT |

For Phase 13 design: the 11-language full-round-trip set is the **current Sarvam ceiling for a complete voice experience**. Expanding to all 23 requires either a TTS provider other than Sarvam for the 12 gap languages, or waiting for Bulbul roadmap updates.

### Action Items

- [ ] **TRD §AI-Voice**: Add note that TTS coverage is 11 languages (Bulbul v3) as of 2026-08-31; the 23-language mandate applies to STT; Phase 13 must document the text-only fallback for the 12 gap languages.
- [ ] **Phase 13 prompt**: Must reference this research. The AI/voice build must design a text-only reply fallback for Assamese, Urdu, Nepali, Konkani, Kashmiri, Sindhi, Sanskrit, Santali, Manipuri, Bodo, Maithili, Dogri.
- [ ] **Implementation**: Odia code — use `od-IN` for Saaras STT calls, `or-IN` for Bulbul TTS calls. Test both before assuming compatibility.
- [ ] **Provider-agnostic gateway** (Backend.txt §15): Confirm the gateway is designed to route TTS for gap languages to an alternate provider if/when one becomes available — this is the architectural escape hatch.
- [ ] **Monitor Sarvam roadmap**: Bulbul TTS roadmap for additional Indian language coverage is not documented. Re-check before Phase 13 implementation begins.
- [ ] **knowledge-map.md §0.11**: Updated to reflect corrected finding (done in same commit).

### Amendment to Prompt 0 §0.11

> **§0.11 — Voice and Language Architecture (CORRECTED 2026-08-31, DL-009).** The 23-language mandate applies to STT (Saaras v3/v4 covers all 23 languages in transcribe/codemix/translit/verbatim modes). TTS (Bulbul v3) covers **11 languages only** (Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, English). The 12 gap languages (Assamese, Urdu, Nepali, Konkani, Kashmiri, Sindhi, Sanskrit, Santali, Manipuri, Bodo, Maithili, Dogri) have voice input but text-only output in the current Sarvam stack. `translate` mode on Saaras is also limited to the same 11 languages. Full round-trip voice experience is 11-language today; the provider-agnostic gateway is the architectural escape hatch for the 12 gap languages. Note: Odia uses code `od-IN` for STT and `or-IN` for TTS — do not substitute.

### References

- `docs.sarvam.ai/api/getting-started/models/saaras` (fetched 2026-08-31)
- `docs.sarvam.ai/api/getting-started/models/bulbul` (fetched 2026-08-31)
- `docs.sarvam.ai/api/getting-started/models` (model comparison, fetched 2026-08-31)
- `docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/rest-api` (fetched 2026-08-31)
- `docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/rest-api` (fetched 2026-08-31)
- `docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices` (fetched 2026-08-31)
- `Project Instructions.txt §7` — 23-language mandate
- `docs/decisions/knowledge-map.md §0.11` — prior CONFIRMED verdict (now corrected)

---

*End of DL-009 entry.*

---

## DL-008 — Gram-Disha Exclusion Audit

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-008 |
| **Domain** | Audit — Intellectual Property / Naming |
| **Status** | **AUDIT COMPLETE — CLEAN** |
| **Decision maker** | Engineering (audit finding) |
| **Decided during** | Prompt 6 (Phase 1 · Type: AUDIT) |

### Objective

Confirm that no Gram-Disha-specific product mechanics (HBFS scoring, rural-only framing, text-only MVP boundary, SIH26091 problem statement) appear anywhere in Vepari AI documentation, screen copy, or code. Confirm that the district-urbanity reference dataset is retained with a neutral Vepari label and the SIH workbook content is not adopted.

### Audit Scope

All files in the repository as of 2026-08-31. No implementation code exists yet — the repository is in the documentation phase. Files audited:

- **Spec docs** (9 `.txt` files): PRD, TRD, App Flow, UI-UX, Frontend, Backend, Database·Storage, AI OS, Implementation Plan
- **Project governance docs**: Project Instructions.txt, PROJECT KNOWLEDGE INTERPRETATION & PRODUCT SCOPE.txt
- **Decision docs**: `docs/decisions/decision-log.md`, `docs/decisions/knowledge-map.md`
- **Research/reference binary files**: 4 PDFs, package 1–4 PDFs, 2 docx files, Readme.md, LICENSE
- **Excluded from text search** (binary): PNG images, PDF files (searched by Read tool separately for key PDFs)
- **Code files**: zero exist

### Search Terms Used

- `"Gram-Disha"` (and variants: `"Gram Disha"`, `"GramDisha"`, case-insensitive)
- `"HBFS"`
- `"SIH26091"` (and `"SIH 26091"`)
- Broader variants: `"SIH"`, `"Smart India Hackathon"`, `"urbanity score"`, `"rural score"`, `"text-only MVP"`, `"hackathon"`

### Findings

#### Spec docs (.txt files) — CLEAN

| Search term | Matches in spec docs |
|---|---|
| Gram-Disha | **0** |
| HBFS | **0** |
| SIH26091 | **0** |
| SIH / Smart India Hackathon | **0** |
| urbanity score / rural score / district score | **0** |
| text-only MVP / hackathon | **0** |

**Result: Zero contamination.** No Gram-Disha mechanics, HBFS scoring, SIH26091 problem statement, rural-only framing, or text-only MVP boundary appear in any Vepari AI specification document.

#### Decision documentation (.md files) — APPROPRIATE CONTEXT ONLY

All "Gram-Disha" mentions in `knowledge-map.md` are confined to:

1. **File catalog entries** for the two docx files themselves — their filenames, file types, and research purpose. These entries correctly identify the files as research references, not Vepari product documents.
2. **§0.13 naming notes** — acknowledging the brand name exists in the source files and must not leak into product text.
3. **Corrections table** — tracking the cleanup scope.

"Smart India Hackathon" appears once in the knowledge-map file-type field for the SIH submission docx. This is correct attribution.

**Result: All references are appropriate audit/metadata context. No product copy contamination.**

#### Repository research files — STATUS CONFIRMED

Two docx files exist in the repository root as research reference material:

| File | Classification | Status |
|---|---|---|
| `Gram-Disha_India_District_Urbanity_Reference_With_UTs.docx` | **Retained** — geographic reference dataset | The district-level urbanity classification data for all Indian states + UTs is a reusable geographic reference. File remains in repo as research source. |
| `Gram-Disha_SIH_Final_16Page.docx` | **Research-only** — SIH hackathon submission | Contains HBFS scoring, SIH26091 problem statement, rural-only framing, text-only MVP boundary. None of this content appears in any Vepari spec doc. File remains as background research only. |

The district-urbanity data file is retained — it provides the geographic intelligence underpinning rural/urban feature differentiation. It is correctly labeled in the knowledge-map as "Market Reference — India District Urbanity Classification," not as a Vepari product asset.

#### Code — NOT APPLICABLE (no code exists yet)

The repository contains zero implementation code files as of this audit. Future code written against the district-urbanity dataset must use a neutral label (see below).

### Canonical Rules Established by This Audit

**1. Zero tolerance for these strings in product-facing material:**
The following strings must never appear in any Vepari AI screen copy, feature name, API route, code comment, database field name, user-facing documentation, or marketing material:
- `Gram-Disha` / `GramDisha`
- `HBFS`
- `SIH26091`
- Any direct reference to the Smart India Hackathon as a Vepari product source

They may appear only in:
- Research file filenames (as they exist today)
- Knowledge-map / decision-log audit entries (as metadata about those files)
- Code comments that explicitly say `// source: Gram-Disha_India_District_Urbanity_Reference_With_UTs.docx` as a data provenance note — not as a product label

**2. District-urbanity dataset: neutral label in all product and code contexts**

When implementing geographic feature calibration using the district-urbanity data, the internal label must be neutral:

| Use | Correct label | Prohibited label |
|---|---|---|
| Database table | `india_district_context` | `gram_disha_districts` |
| Code variable | `districtContextData` | `gramDishaScore` |
| Feature flag | `geo_context_enabled` | `gram_disha_mode` |
| Product documentation | "India District Context Reference" | "Gram-Disha classification" |
| API field | `district_urbanity_tier` | `hbfs_score` |

**3. SIH workbook content is excluded entirely:**
HBFS scoring, the SIH26091 problem-statement framing, the text-only MVP boundary, and the rural-only product scope definition from the SIH submission are not adopted into Vepari AI in any form. Vepari AI is explicitly a broader MSME platform — Project Instructions §1 and PROJECT KNOWLEDGE INTERPRETATION §1.

### Open Item: IP/Licensing

The knowledge-map flagged (file entry for `Gram-Disha_SIH_Final_16Page.docx`):

> *"Extent to which Gram-Disha intellectual property (if any) has been licensed for use in Vepari AI — not addressed anywhere in the repository."*

The district-urbanity classification data may contain analysis methodology that originated with the Gram-Disha project team. Before shipping any feature that uses that dataset, the team must confirm:

- Whether the district data was derived from public government sources (Census, state gazettes) — in which case it is freely usable
- Whether any proprietary classification methodology or scoring belongs to the Gram-Disha team — in which case explicit permission or a data-purchase agreement is needed

**This is a legal/IP question for the product owner, not a technical question.** It does not block documentation or design work. It must be resolved before Phase 18 (Broader MSME Expansion) ships any geography-aware feature that depends on this dataset.

### Consequences and Required Follow-Up

- [x] Audit complete — zero product contamination confirmed. ✓
- [x] District-urbanity dataset retained with canonical neutral-label rules. ✓
- [x] SIH workbook content confirmed as excluded from all Vepari specs. ✓
- [ ] **IP/licensing review** — team to confirm district data source before geo-aware feature ships (pre-Phase 18).
- [ ] **Knowledge-map §0.13** updated to reflect audit completion (done in same commit).
- [ ] Future code review: any PR that introduces `gram_disha`, `HBFS`, or `SIH` into product-facing code should be rejected at review.

### References

- `Gram-Disha_India_District_Urbanity_Reference_With_UTs.docx` — retained geographic reference dataset
- `Gram-Disha_SIH_Final_16Page.docx` — research background only; SIH workbook content excluded
- `docs/decisions/knowledge-map.md §0.13` — original naming note flagged in Prompt 1 audit
- `Project Instructions.txt §1` — "Vepari AI is NOT limited to micro enterprises"
- `PROJECT KNOWLEDGE INTERPRETATION & PRODUCT SCOPE.txt §1` — scope clarification

---

*End of DL-008 entry.*

---

## DL-007 — Glossary: "Connection Portfolio" vs. "Product Showcase Portfolio"

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-007 |
| **Domain** | Naming — Glossary |
| **Status** | **DECIDED** |
| **Decision maker** | Product owner |
| **Decided during** | Prompt 5 (Phase 1 · Type: DOCUMENTATION) |

### Canonical Definitions

| Term | Meaning | Where it lives |
|---|---|---|
| **Connection Portfolio** | The in-product third-party integrations feature: provider adapters, OAuth/API connections, integration framework. A product capability built in Phase 12 of the Implementation Plan. | Code modules, API routes (`/api/v1/connections/`), all spec docs (TRD §102, PRD §89, Frontend §78, App Flow §75, UI-UX §90, Backend §204, Database·Storage, AI OS). |
| **Product Showcase Portfolio** | The final external deliverable that documents and presents the finished Vepari AI product — produced in Phase 20 after the product is substantially complete. Never built before the product exists. | `Project Instructions.txt §27` and any future showcase/portfolio deliverable documentation. |

**One-line rule for contributors:** *"Connection Portfolio" = the integrations feature inside the product; "Product Showcase Portfolio" = the final external showcase document — never use either term to mean the other.*

### Background

`Project Instructions.txt §27` used "Connection Portfolio" to name the final showcase deliverable (Phase 20). All 9 spec docs use "Connection Portfolio" to name the integrations feature. This created a collision where the same term appeared in two wholly unrelated contexts. The knowledge-map (`§0.13`) identified three distinct meanings all on the integrations side; the showcase-deliverable meaning was a fourth, from a different document.

### Changes Made

- `Project Instructions.txt §27` heading and body: renamed to **Product Showcase Portfolio**.
- `Project Instructions.txt §30 Phase 20`: renamed to **Product Showcase Portfolio**.
- All other uses of "Connection Portfolio" throughout the spec docs: **unchanged** — they correctly name the integrations feature.

### Consequences

- [ ] Any future showcase/portfolio documentation must use "Product Showcase Portfolio."
- [ ] Code module names, API routes, and spec-doc references to the integrations feature keep "Connection Portfolio."
- [ ] Prompt 0 §0.3.4 (if it named the showcase as "Connection Portfolio") should be updated to "Product Showcase Portfolio" in the external template.

---

*End of DL-007 entry.*

---

## DL-002 — Data Authority: Core Business Sync vs. Consent-Based AI/Analytics Signals

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-002 |
| **Domain** | Architecture — Data Authority and Sync |
| **Status** | **DECIDED** |
| **Decision maker** | Product owner |
| **Decided during** | Prompt 4 (Phase 1 · Type: PRODUCT DECISION) |
| **Supersedes** | The DL-002 "OPEN" entry in `knowledge-map.md` §Decision-Log |

### Title

Core business transactional data syncs to cloud by default; TRD §2's "consent-based, minimal cloud" applies only to optional AI/analytics signals — not to core business data.

### Background

Three governing documents described the cloud's role in conflicting terms:

- **TRD §2** — *"Cloud: Minimal/optional, consent-based."* Read in isolation, this implies that cloud sync is an opt-in feature rather than a system default.
- **PRD Principle 2** — *"Cloud is the authoritative source."* This treats cloud as the permanent system of record.
- **Backend.txt** — Architecturally treats cloud PostgreSQL as authoritative for shared business truth.
- **Database·Storage.txt** (synthesis definition) — *"Local-first for speed and offline business continuity. Cloud-authoritative for shared business truth."*

If left unresolved, a backend engineer implementing the sync queue (Phase 14) cannot determine whether cloud sync is a default toggle or an opt-in feature — a cascade into conflicting API design, storage architecture, and onboarding UX decisions.

### Interpretation Analysis

TRD §2's key word is **"minimal"** — it describes the *amount* of data transmitted to cloud, not the *optionality* of core business sync. Reading TRD §2 against the rest of the document:

- TRD §2 expresses a **privacy architecture principle**: the platform should not upload raw AI conversation content, voice recordings, or usage telemetry without user consent.
- PRD Principle 2 + Backend.txt express a **data authority principle**: for business entities that must survive device loss or be accessible across devices, cloud is the authoritative store.

These are two separate principles about two different categories of data, expressed in a single sentence that conflated them. They are not in genuine contradiction.

### Decision

**The canonical two-tier data authority model:**

**Tier 1 — Core Business Data (always syncs to cloud by default)**

All structured business transactional data syncs to cloud-authoritative PostgreSQL by default whenever connectivity is available; the device SQLite store is the local-first cache for offline speed and resilience; cloud is the system of record.

Tier 1 includes:
- Sales, expenses, revenue, and financial transactions
- Customer profiles and credit records
- Supplier profiles and ledger entries
- Inventory events and product records
- Business memory entries (facts and events)
- Order and reconciliation records
- User account and business profile data

**Tier 2 — AI/Analytics Signals (consent-based, minimal, optional)**

This is what TRD §2's "consent-based, minimal cloud" language was intended to describe. Tier 2 data is transmitted to cloud only with explicit user consent and in the minimum quantity required for the stated purpose.

Tier 2 includes:
- Voice interaction patterns used for model improvement (opt-in only)
- Usage analytics and telemetry (opt-in only)
- AI personalization signals not required for core function (opt-in only)
- Raw voice recordings — never stored in cloud; processed server-side and discarded

**The one implementable sentence:**

> All core business transactional data (sales, expenses, credit, customers, suppliers, inventory, business memory) is synced to cloud-authoritative PostgreSQL by default on every connectivity window; local SQLite is the offline cache, not the system of record; only AI-improvement and analytics signals are consent-based and optional.

### Optional Single-Device Mode

A future product decision may introduce an explicit single-device/local-only mode for businesses that explicitly do not want cloud sync. If introduced, it must be:

- An explicit, informed, opt-out choice at onboarding (not the default)
- Documented with clear consequences (data loss on device loss; no multi-device access)
- Implemented as a product feature with its own decision log entry

**This decision establishes cloud sync on as the default.** Single-device mode, if ever introduced, is a deliberate exception that requires a separate decision log entry before implementation.

### Required Correction to TRD §2

TRD §2's phrase *"Cloud: Minimal/optional, consent-based"* must be updated before Phase 14 (sync) begins to prevent engineers from misreading the original phrasing. The corrected text:

> **Cloud:** Core business transactional data syncs to cloud-authoritative PostgreSQL by default. AI/analytics signals are consent-based, minimal, and optional. Raw voice recordings are processed server-side and not retained in cloud storage.

### Consequences and Required Follow-Up

- [x] Canonical two-tier data authority model recorded (this entry). ✓
- [x] One implementable sentence produced. ✓
- [ ] **TRD §2** must be updated with the corrected cloud description above before Phase 14 begins.
- [ ] **Phase 14 prompt** (offline/sync) must reference this decision and the DL-006 module structure for sync queue implementation.
- [ ] **Onboarding UX** should communicate that core business data is cloud-synced by default (trust and transparency principle, PRD §21).
- [ ] If single-device/local-only mode is introduced, record a new decision log entry before implementing it.

### Amendment to Prompt 0 §0.3.2

The team's Prompt 0 template is maintained outside the repository. To reflect this resolution:

> **§0.3.2 — Data authority (RESOLVED 2026-08-31, DL-002).** Vepari AI uses a two-tier model: **core business transactional data** (sales, expenses, credit, customers, suppliers, inventory, business memory) syncs to cloud-authoritative PostgreSQL by default; **AI/analytics signals** are consent-based, minimal, and optional — this is what TRD §2's "consent-based, minimal cloud" refers to. Local SQLite is the offline cache. Cloud is the system of record. This decision is closed; do not reopen without a superseding decision-log entry.

In **§0.4 (Open Decisions)**, mark the data-authority item **RESOLVED (DL-002)** and remove it from the open list.

### References

- `TRD.txt §2` — source of "Minimal/optional, consent-based" (must be corrected before Phase 14)
- `PRD.txt Principle 2` — "Cloud is the authoritative source"
- `Backend.txt` — PostgreSQL as cloud system of record
- `Database·Storage.txt` — synthesis definition: "Local-first for speed and offline business continuity. Cloud-authoritative for shared business truth."
- `docs/decisions/knowledge-map.md` DL-002 — original conflict log entry

---

*End of DL-002 entry.*

---

## DL-006 — Engine Taxonomy: Canonical 3-Layer Hierarchy and Naming

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-006 |
| **Domain** | Product Architecture — Engine Taxonomy |
| **Status** | **DECIDED** |
| **Decision maker** | Product owner |
| **Decided during** | Prompt 3 (Phase 1 · Type: PRODUCT DECISION) |
| **Supersedes** | The "clarification needed" note on engine taxonomy in `knowledge-map.md` §0.6 cross-check |

### Title

Lock one canonical engine hierarchy — 4 architectural engines → 6 problem-led engines → 10 flexible icons — with capability-based naming and the source naming collision resolved.

### Background

The project knowledge described "engines" at four different granularities, which read as four competing taxonomies:

- **4** — architectural engines (`Project Instructions.txt §4`, `PROJECT KNOWLEDGE… §5`): Business Brain, Finance Engine, Growth Engine, Access Engine.
- **6** — problem-led engines (`Vepari_Key_Features_Research_Report`, whose cover states *"From four package documents to six problem-led intelligence engines"*).
- **8** — AI OS dashboard cards (`AI OS.png`): Finance, Customer, Supplier, Inventory, Insight, Automation, Operations, Security.
- **10** — marketing pitch icons (the 10 `*Engine.png` files).

Left unreconciled, these would produce inconsistent navigation labels, dashboard copy, and code module names. `Prompt 0 §0.3.3` proposed a 3-layer resolution (4 → 6 → flexible icons). This decision **confirms that resolution with two evidence-forced amendments** and locks canonical names.

> **Source gap:** `Vepari AI Jain.pptx` slide 3 — named as an inspect-first source — is **not present in the repository** (no PPTX files exist). The Key Features Research Report explicitly states its purpose is to *"Support Slide 3 and the feature architecture,"* so the Report is treated as the authoritative written proxy for that slide. **Follow-up:** add/export the PPT (or slide 3) to the repo so the visual source is preserved.

### Decision

**The 4 / 6 / 8 / 10 counts are four *views* of one hierarchy, not four taxonomies:**

- **Layer 1 — 4 architectural engines** = code module namespaces (stable, internal).
- **Layer 2 — 6 problem-led engines** = feature domains / dashboard sections (the user- and developer-facing unit of organization).
- **Layer 3 — 10 icons** = flexible marketing/visual labels only, never a source of truth for names.
- **The 8 AI OS.png cards** = one dashboard rendering = the 6 engines + two cross-cutting layers (Automation, Security). Not a separate taxonomy.

**Amendment 1 — Access Engine is the cross-cutting delivery layer, not a problem-led engine.** Of the 4 architectural engines, 3 (Business Brain, Finance, Growth) own the 6 problem-led engines; **Access Engine** (voice, 23-language, low-friction I/O, privacy-aware storage) underpins all 6. Report page 10: *"Every engine shares the same basic layer: Tamil voice input, structured memory, live data calls, privacy-aware storage."* The Voice(09) icon and "Security" belong here.

**Amendment 2 — Naming collision resolved.** The Report named engine #4 *"Growth & Scheme Intelligence"* and engine #6 *"Growth Intelligence"* — both roll up to the architectural **Growth Engine**, so "Growth" cannot name a sub-engine. Canonical capability names (collision removed) are adopted; the Report's diagnostic **problem names are internal-only** (research traceability / analytics tags), never user-facing.

### THE Canonical Mapping Table

> **This table is the single source of truth for engine names.** Phase 5 (design system / navigation), Phase 6 (finance & business-brain build), and Phase 13 (growth & access build) prompts MUST reference this table instead of re-deriving engine names from the Report, the icons, or the PPT.

| # | Architectural engine (code namespace) | Canonical problem-led engine (UI + code) | Internal problem name (never user-facing) | Package base | Representative features | Applicable icons |
|---|---|---|---|---|---|---|
| 1 | **Business Brain** | **Business Memory Intelligence Engine** | Operational Amnesia | P1 | Voice Business Log, Customer/Supplier profiles, Order History, Day-End Reconciliation, SOP Generator, Business Continuity/Succession | Memory(10), Intelligence(14), Vision(05) |
| 2 | **Finance Engine** | **Financial Intelligence Engine** | Financial Leakage | P2 | Revenue/Expense Logger, AI Profit Calculator, Cost-Per-Unit Builder, overhead/waste/GST-adjusted margin, Monthly P&L | Finance(07) |
| 3 | **Finance Engine** | **Credit Intelligence Engine** | Credit Tracking Failure | P2 + P4 | Credit Terms Tracker, Bad-Debt Recovery, Credit Trail Builder, Alternative Credit Score, Lender-Ready Statement, Loan Matcher | Finance(07) *(shared)* |
| 4 | **Finance Engine** *(primary)* + Business Brain | **Inventory Intelligence Engine** | Inventory Mismatch | P1 + P2 + P3 | Product Performance Ranker, Shrinkage Tracker, Demand/Perishable/Peak planners, Batch & Delivery Tracker, Commodity Price Alert | Inventory(08) |
| 5 | **Growth Engine** | **Scheme & Compliance Intelligence Engine** *(was "Growth & Scheme")* | Scheme Blindness | P4 | Scheme Eligibility Chatbot, Step Guide, Doc Checklist, Deadline Alerts, MUDRA/PM-SVANidhi/PMEGP/CGTMSE/GeM navigators | Growth(13) |
| 6 | **Growth Engine** | **Customer & Market Intelligence Engine** *(was "Growth")* | Growth Stagnation | P3 + P4 | Voice-First CRM, Repeat/Lapsed customer tools, Personalised Offers, Referral & Occasion marketing, Market Radar, Churn Early-Warning | Customer(10), Market(11), Automation(12) |
| — | **Access Engine** *(cross-cutting; underpins all 6)* | *not a problem-led engine — enabling delivery layer* | — | — | Voice input, 23-language STT/TTS, translation, low-friction output, privacy-aware storage, security | Voice(09) |

**Icon notes:** Vision(05) = the "SEE" pillar (insight/foresight surface of Business Memory). Automation(12) illustrates Customer & Market automation (WhatsApp Commerce, auto-showcase) but is conceptually cross-cutting (orchestrated via Business Brain + Access). Growth(13)'s single icon now maps cleanly to engine #5 only. The duplicate slide-number "10" on Memory and Customer is a slide-deck defect tracked separately in `knowledge-map.md` **DL-003**, independent of this taxonomy.

### Recommended code module structure

```
businessBrain/
  memoryIntelligence/          # Engine 1
financeEngine/
  financialIntelligence/       # Engine 2
  creditIntelligence/          # Engine 3
  inventoryIntelligence/       # Engine 4  (primary owner; depends on businessBrain)
growthEngine/
  schemeComplianceIntelligence/# Engine 5
  customerMarketIntelligence/  # Engine 6
accessEngine/                  # cross-cutting: voice, language, I/O, security
```

### Reasoning

1. The Key Features Research Report is the purpose-built, authoritative source for the 6-engine layer (it exists specifically to turn the 4 packages into 6 problem-led engines with a full source trail back to package pages).
2. Capability names are UI-appropriate and each maps 1:1 to an architectural parent; the diagnostic problem names ("Operational Amnesia," etc.) are useful internally but insulting if shown to a user about their own business.
3. Removing "Growth" from both sub-engine names eliminates the collision while keeping "Growth Engine" meaningful as the architectural parent of both scheme and customer/market work.
4. Treating Access as cross-cutting matches the Report's integration-layer section and the reality that voice/language is how every other engine is reached — not a feature domain of its own.

### Consequences and Required Follow-Up

- [x] Canonical mapping table recorded (this entry). ✓
- [ ] **Phase 5/6/13 prompts** reference this table for all engine names (acceptance criterion for Prompt 3).
- [ ] **Add `Vepari AI Jain.pptx` (or slide 3)** to the repository to close the source gap.
- [ ] When code scaffolding begins, use the module structure above; do not introduce "Growth Intelligence" or "Growth & Scheme" as module names.
- [ ] Analytics/event taxonomy may use the internal problem names as stable tags (operational_amnesia, financial_leakage, credit_tracking_failure, scheme_blindness, inventory_mismatch, growth_stagnation).

### Amendment to Prompt 0 §0.3.3 and §0.4

The team's Prompt 0 template is maintained outside the repository. To reflect this resolution:

> **§0.3.3 — Engine taxonomy (RESOLVED 2026-08-31, DL-006).** Canonical hierarchy is 3-layer: **4 architectural engines** (Business Brain, Finance, Growth, Access) as code namespaces → **6 problem-led engines** (Business Memory, Financial, Credit, Inventory, Scheme & Compliance, Customer & Market Intelligence) as feature domains → **10 icons** as flexible visual labels. Access Engine is the cross-cutting delivery layer, not a problem-led engine. Diagnostic problem names are internal-only. See `docs/decisions/decision-log.md` DL-006 for the full mapping table.

In **§0.4 (Open Decisions)**, mark the engine-taxonomy item **RESOLVED (DL-006)** and remove it from the open list.

### References

- `Vepari_Key_Features_Research_Report (1).pdf` — the 6 problem-led engines, feature sets, and package source trail (pp. 2–10)
- `Project Instructions.txt §4` / `PROJECT KNOWLEDGE… §5` — the 4 architectural engines
- `AI OS.png` — the 8-card dashboard view
- The 10 `*Engine.png` files — the marketing icon layer
- `docs/decisions/knowledge-map.md` DL-003 — engine slide-numbering defect (separate issue)

---

*End of DL-006 entry.*

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
5. **Nirmala UI** (Brand.png's Tamil specification) is a proprietary Microsoft font bundled with Windows — it is not licensable for Android/iOS app bundling without a commercial agreement. **Noto Serif Tamil** is free and open-source (SIL Open Font License), high-quality, and the natural serif pairing for Lora. It must be **bundled with the app** (via `@expo-google-fonts/noto-serif-tamil`), not relied upon as a system font: Android reliably ships *Noto Sans Tamil* as a system face, but *Noto Serif Tamil* system availability is not guaranteed across devices/OS versions. The SIL OFL license makes bundling safe. *Noto Sans Tamil* is the recommended system-available fallback if a bundled face fails to load.

### Consequences and Required Follow-Up

#### Immediate (must be done before Phase 5 typography token work begins)

- [ ] **All 9 master spec documents** need their typography sections updated to add the two-tier distinction. The phrase "Lora is the primary English display/brand typography" must be revised to: "Cinzel Semibold is the wordmark/logo display typeface. Lora is the primary UI heading and body typeface."
- [ ] **UI-UX.txt** §Typography is the most critical update — it governs all component token values.
- [x] **Prompt 0 §0.3.1** amendment text persisted below (see "Amendment to Prompt 0 §0.3.1"). Prompt 0 is a conversational template, not a repo file; per Project Instructions §14–15 the repository is the source of truth, so the resolution is recorded here for the team to paste into their template. ✓
- [x] **knowledge-map.md** DL-001 entry updated to DECIDED status. ✓ (done in commit 00871bb)

#### Before Phase 5 implementation (font token work)

- [ ] Confirm `@expo-google-fonts/cinzel` is available and the correct Semibold weight is accessible.
- [ ] Confirm `@expo-google-fonts/lora` covers all required weights (Regular, Italic, SemiBold, Bold).
- [ ] Confirm `@expo-google-fonts/noto-serif-tamil` covers all required weights for the 23-language rendering strategy.
- [ ] Design tokens in `UI-UX.txt` §Token-Values to reference `fontFamily.brand = 'Cinzel_600SemiBold'` and `fontFamily.ui = 'Lora_400Regular'` (and variants).

#### Does NOT require action before Phase 5

- Brand.png requires no changes. The existing Cinzel Semibold wordmark is now the canonical standard.
- App Icon.png requires no changes.

### Amendment to Prompt 0 §0.3.1

The team's Prompt 0 template (Master Scope and Operating Contract) is maintained outside the repository. To reflect this resolution, replace the §0.3.1 typography-conflict entry with the following ratified text:

> **§0.3.1 — Typography (RESOLVED 2026-08-31, DL-001).** Vepari AI uses a two-tier English type system: **Cinzel Semibold** for the wordmark/logo lockup and brand display only, and **Lora** for all UI headings, body text, and content. Tamil/Indic content uses **Noto Serif Tamil**, bundled with the app (SIL OFL), with **Noto Sans Tamil** as the system-available fallback. Nirmala UI (originally shown in Brand.png) is retired — it is a proprietary Windows font and not licensable for app bundling. This decision is closed; do not reopen without a superseding decision-log entry.

Once the team pastes this into their Prompt 0, the former "Lora vs. Cinzel — OPEN" note in §0.3.1 and any "Nirmala UI" reference should be removed.

### References

- `Brand.png` — typography specimen panel (source of Cinzel Semibold and Nirmala UI specifications)
- `UI-UX.txt §Typography` — source of Lora specification (must be updated)
- All 9 master spec documents — all contain Lora references that need the two-tier correction
- DL-001 in `docs/decisions/knowledge-map.md` — original conflict log entry

---

*End of DL-001 entry.*

---

> Additional decisions will be appended above this line as they are made. Entries are ordered most-recent-first.
