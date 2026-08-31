# Vepari AI — Decision Log

> **Document:** `docs/decisions/decision-log.md`  
> **Format:** §0.3 decision log format from the Master Scope and Operating Contract  
> **Entries:** Most recent first  

All entries that affect spec documents record which files need updating. No decision is back-applied silently to source files without a corresponding commit.

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
