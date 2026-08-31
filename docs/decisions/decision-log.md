# Vepari AI — Decision Log

> **Document:** `docs/decisions/decision-log.md`  
> **Format:** §0.3 decision log format from the Master Scope and Operating Contract  
> **Entries:** Most recent first  

All entries that affect spec documents record which files need updating. No decision is back-applied silently to source files without a corresponding commit.

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
