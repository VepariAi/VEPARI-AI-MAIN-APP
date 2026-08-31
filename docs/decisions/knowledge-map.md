# Vepari AI — Project Knowledge Map

> **Document:** `docs/decisions/knowledge-map.md`  
> **Phase:** 0 — Governance  
> **Type:** KNOWLEDGE  
> **Produced by:** Full cold-repository audit (Prompt 1 task)  
> **Audit date:** 2026-08-31  
> **Repository:** `vepariai/vepari-ai-main-app`  
> **Branch at audit:** `claude/vepari-master-scope-dijnhp`  
> **Files audited:** 38 (all files at repository root)  
> **Application code:** NONE — design and specification phase only  
> **Governing contract:** Prompt 0 — Master Scope and Operating Contract  

---

## Table of Contents

1. [Decision Log — Conflicts Found During Audit](#1-decision-log--conflicts-found-during-audit)
2. [File Classification Table](#2-file-classification-table)
   - 2.1 [Master Specification Documents](#21-master-specification-documents)
   - 2.2 [Governance and Meta Documents](#22-governance-and-meta-documents)
   - 2.3 [Visual Brand Assets](#23-visual-brand-assets)
   - 2.4 [Engine Capability Slides](#24-engine-capability-slides)
   - 2.5 [Research Reports](#25-research-reports)
   - 2.6 [Package Feature Catalogs](#26-package-feature-catalogs)
   - 2.7 [Market Reference Data](#27-market-reference-data)
   - 2.8 [Cost Reference](#28-cost-reference)
   - 2.9 [License](#29-license)
3. [Prompt 0 §0.3–0.20 Cross-Check](#3-prompt-0-0320-cross-check)

---

## 1. Decision Log — Conflicts Found During Audit

Entries follow the §0.3 format from the Master Scope and Operating Contract. No conflict is resolved silently in this document. See `docs/decisions/decision-log.md` for full decision records.

---

### DL-001 — Typography: Lora vs. Cinzel Semibold

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-001 |
| **Domain** | Design System — Typography |
| **Status** | **DECIDED — 2026-08-31** |
| **Was blocking** | Phase 5 (now unblocked) |

**Decision:** Two-tier typography system:
- **Cinzel Semibold** — wordmark/logo lockup and brand display text only
- **Lora** — all UI headings, body text, and content throughout the app
- **Noto Serif Tamil** — all Tamil-script content (replaces Nirmala UI, which is not licensable for Android)

**Full record:** See `docs/decisions/decision-log.md` entry DL-001.

**Required follow-up:** All 9 master spec documents need their typography sections updated to state the two-tier distinction. Prompt 0 §0.3.1 (external template) needs updating.

---

### DL-002 — Data Authority: Local-First vs. Cloud-Authoritative

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-002 |
| **Domain** | Architecture — Data Authority |
| **Status** | **DECIDED 2026-08-31** — See `decision-log.md` DL-002 |
| **Blocks** | Phase 7 (Sync architecture implementation) |

**Title:** TRD §2 and Database·Storage.txt §closing give contradictory authority designations for cloud storage.

**Conflict:**
- `TRD.txt §2` "Critical Architectural Decision" labels cloud role as: *"Cloud: Minimal/optional, consent-based"*
- `PRD.txt` Principle 2 states: *"Cloud is the authoritative source"*
- `Backend.txt` treats cloud as the system of record for shared business truth
- `Database, Storage.txt` closing definition (final sentence of the document): *"Local-first for speed and offline business continuity. Cloud-authoritative for shared business truth."* — this is the synthesis

**Synthesis available:** `Database, Storage.txt` resolves the contradiction via a dual-layer model: local-first = operational speed and offline continuity; cloud-authoritative = shared truth across devices/users. This is architecturally coherent but has not been ratified across all spec documents.

**Options:**
1. Adopt the `Database, Storage.txt` synthesis as the canonical position. Update TRD §2 to remove "minimal/optional" language. PRD Principle 2 already agrees.
2. Reopen architectural debate.

**Recommendation:** Option 1. The synthesis in `Database, Storage.txt` is logically consistent and already implied by the sync architecture in all spec files. Requires team ratification and a TRD §2 edit.

**Owner:** Technical architect.

**References:** `TRD.txt §2`, `PRD.txt Principle 2`, `Backend.txt §data-authority`, `Database, Storage.txt §closing`.

---

### DL-003 — Engine Slide Numbering: Missing "06" and Duplicate "10"

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-003 |
| **Domain** | Visual Assets — Engine Pitch Slides |
| **Status** | OPEN |
| **Blocks** | None (pitch materials, not shipping code) |

**Title:** Engine capability slide deck has a missing number (06) and a duplicate number (10 used by both Memory Engine and Customer Engine).

**Conflict:** 10 engine PNG files exist in the repository. Slide numbers visible in the frames:
- 05 — Vision Engine
- 07 — Finance Engine
- 08 — Inventory Engine
- 09 — Voice Engine
- 10 — **Memory Engine** (also shows "10")
- 10 — **Customer Engine** (also shows "10") — **DUPLICATE**
- 11 — Market Engine
- 12 — Automation Engine
- 13 — Growth Engine
- 14 — Intelligence Engine
- **06 — NOT FOUND in any file**

**Options:**
1. Renumber Customer Engine from 10 to 06; no files need to be added or removed.
2. Accept the numbering as-is for pitch purposes; add a corrected-numbering note to the slide template.

**Recommendation:** None. Owner of pitch deck should renumber. This does not block any development work.

**Owner:** Pitch/marketing deck owner.

**References:** All 10 `*Engine.png` files.

---

### DL-004 — Module Count: PRD.txt "40 modules" vs. Prompt 0 "24 modules"

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-004 |
| **Domain** | Product Scope — Module Catalog |
| **Status** | OPEN — needs clarification of counting methodology |
| **Blocks** | None immediately; affects Phase 4–6 scope planning |

**Title:** PRD.txt lists 40 core business modules; Prompt 0 Master Scope states 24 modules.

**Conflict:**
- `PRD.txt §Business Modules` lists 40 named core business modules across the full platform.
- Prompt 0 §0.7 (MVP Scope) implies a narrower set; the number "24" appears in governing summaries.

**Clarification needed:** The difference may be that 24 = MVP-scoped modules (Phase 4–8) while 40 = full platform scope including Phases 9–15 enterprise features. This is not explicitly stated in any document.

**Options:**
1. Define "24 modules" as the MVP deliverable, "40 modules" as the full PRD target. Document this distinction explicitly.
2. Audit the PRD module list and agree on a single authoritative count.

**Recommendation:** Option 1 is likely the correct interpretation but must be confirmed by the product owner. Prompt 0 should be amended to clarify "24 MVP modules of 40 total."

**Owner:** Product owner.

**References:** `PRD.txt §Business Modules`, Prompt 0 §0.7.

---

### DL-005 — Apache 2.0 License Not Referenced in Governing Documents

| Field | Value |
|---|---|
| **Date** | 2026-08-31 |
| **Decision-ID** | DL-005 |
| **Domain** | Legal — Licensing |
| **Status** | OPEN — may be intentional, needs acknowledgment |
| **Blocks** | None immediately; relevant before open-source or partner distribution |

**Title:** The repository carries an Apache License 2.0 file, but no governing specification document references the license or its implications for the codebase.

**Finding:** `LICENSE` (Apache 2.0, full text, 202 lines) exists at repository root. None of the 9 master spec documents, Readme.md, or Prompt 0 §0.3–0.20 reference licensing terms, contributor rights, or distribution constraints.

**Options:**
1. Intentional — Apache 2.0 is the chosen license; add a license acknowledgment to Readme.md and governing docs.
2. Inadvertent — this is a private commercial product and Apache 2.0 was added by default; review with legal counsel and replace or update.

**Recommendation:** None. This requires a legal/business decision. Document the intent.

**Owner:** Legal or business owner.

**References:** `LICENSE` (root).

---

## 2. File Classification Table

**Columns:** FILE · TYPE · PURPOSE · REQUIREMENTS TRACEABILITY · KEY FEATURES DOCUMENTED · DEPENDENCIES · CONFLICTS · OPEN QUESTIONS

---

### 2.1 Master Specification Documents

These 9 files are the primary sources of truth for all product decisions, ranked by §0.3 authority hierarchy: TRD > PRD > App Flow ≈ UI-UX > Frontend = Backend = Database·Storage = AI OS > Implementation Plan.

---

#### PRD.txt

| Field | Detail |
|---|---|
| **File** | `PRD.txt` |
| **Type** | Master Specification — Product Requirements Document |
| **Size** | 49,289 bytes · ~3,521 lines · 142 sections |
| **Purpose** | Defines what Vepari AI is, who it is for, why it exists, and what it must do. Establishes 7 platform principles, 40 core business modules, 16 implementation phases (coarse), all user personas, competitive context, and market assumptions. |
| **Requirements Traceability** | Source of all product requirements. All other spec docs trace requirements back to PRD sections. |
| **Key Features Documented** | Product vision (Business OS for Indian MSMEs), 7 platform principles, 40 business module catalog, data flows (sale, AI, offline), 16-phase implementation order (coarse), all 4 AI engine mandates, API contract (`{data, meta, request_id}`), voice/language mandate (23 languages), offline-first mandate, security baseline |
| **Dependencies** | Informs: TRD, App Flow, UI-UX, Frontend, Backend, Database·Storage, AI OS, Implementation Plan |
| **Conflicts** | §Principle 2 "Cloud is authoritative" vs. TRD §2 "Cloud: minimal/optional" → **DL-002** |
| **Open Questions** | Module count: 40 total vs. "24 MVP modules" — **DL-004**. Implementation phase granularity differs from TRD §50-step order and Implementation Plan §47-step sequence. |

---

#### TRD.txt

| Field | Detail |
|---|---|
| **File** | `TRD.txt` |
| **Type** | Master Specification — Technical Requirements Document |
| **Size** | 44,233 bytes · ~2,946 lines · 153 sections |
| **Purpose** | Defines how Vepari AI is built. Contains the complete technology stack, all architectural decisions, security requirements, API contracts, the 50-step implementation order (finest granularity), sync architecture, and all infrastructure patterns. Highest authority on architectural decisions per §0.3 hierarchy. |
| **Requirements Traceability** | Overrides PRD on architectural interpretation. §2 is the canonical local-first decision point. |
| **Key Features Documented** | Full technology stack (React Native + Expo, encrypted SQLite, PostgreSQL-class cloud, REST /api/v1/), 50-step implementation order, sync queue schema (operation_id, device_id, entity, base_version, status, retry_count), idempotent retry model, optimistic concurrency with version numbers, financial conflict strictest-handling rule, JWT auth, Cloudflare → NGINX/Caddy → Kong/Traefik edge, AI provider-agnostic gateway |
| **Dependencies** | Governs: Frontend, Backend, Database·Storage. Informs: AI OS, Implementation Plan |
| **Conflicts** | §2 "Cloud: Minimal/optional, consent-based" vs. PRD Principle 2 and Backend.txt → **DL-002** |
| **Open Questions** | TRD §2 text must be updated (corrected wording in DL-002) before Phase 14 begins. |
| **Status note** | Final section: *"Actual implementation: ⏳ Not yet complete."* |

---

#### App Flow.txt

| Field | Detail |
|---|---|
| **File** | `App Flow.txt` |
| **Type** | Master Specification — Application Flow Document |
| **Size** | 42,543 bytes · ~3,256 lines · 161 sections |
| **Purpose** | Defines every user-facing state transition in the application: onboarding, login, all business workflows, golden flows (business/AI/offline/connection), crash recovery, biometric failure, conflict resolution, app restart sequences. |
| **Requirements Traceability** | Traces to PRD user personas and use cases. Feeds UI-UX screen design and Frontend component requirements. |
| **Key Features Documented** | 161 state transitions, golden business flow (sale → sync), golden AI flow (voice → insight → action), golden offline flow, golden connection flow, biometric failure recovery, 5-tab navigation structure (Home·Transactions·Voice·Reports·More), session management, logout flow |
| **Dependencies** | Input from: PRD, TRD. Feeds: UI-UX, Frontend |
| **Conflicts** | None found during audit. |
| **Open Questions** | State machine notation not formalized — is the 161-section list the canonical state machine or a prose description? |

---

#### UI-UX.txt

| Field | Detail |
|---|---|
| **File** | `UI-UX.txt` |
| **Type** | Master Specification — UI/UX Design System |
| **Size** | 59,313 bytes · ~4,560 lines · 264 sections |
| **Purpose** | Defines the complete design system: color palette, typography, component library, screen map, interaction patterns, accessibility requirements, animation specs, and 15 final UX principles. |
| **Requirements Traceability** | Implements PRD platform principles. Feeds Frontend component specs. Must agree with Brand.png on all brand values. |
| **Key Features Documented** | 6 official colors (Deep Brown #3B2F2A, Heritage Gold #C8A96B, Olive Green #5A6B4F, Terracotta #B45B4A, Warm Beige #F2E8D6, Ivory White #FAF7F2), **Lora** as primary English display/brand typography, complete screen map matching Screens.png 16 screens, 5-tab bottom navigation, all component specifications, accessibility mandates, 15 UX principles |
| **Dependencies** | Input from: PRD, App Flow. Feeds: Frontend. Must reconcile with: Brand.png |
| **Conflicts** | Typography: states Lora; Brand.png specimen states Cinzel Semibold → **DL-001** |
| **Open Questions** | Tamil typography: UI-UX.txt does not explicitly name the Tamil face used in Brand.png specimen ("NIRMALA UI SEMIBOLD TAMIL"). Is Nirmala UI the locked Tamil face or a placeholder? |

---

#### Frontend.txt

| Field | Detail |
|---|---|
| **File** | `Frontend.txt` |
| **Type** | Master Specification — Frontend Architecture |
| **Size** | 49,489 bytes · ~3,674 lines · 214 sections |
| **Purpose** | Defines the complete React Native + Expo + TypeScript frontend architecture: directory structure, all component specifications, state management, AI OS frontend subsystem, data flow diagrams, 44-step frontend development order. |
| **Requirements Traceability** | Implements TRD stack decisions and UI-UX design system. Must match App Flow state transitions. |
| **Key Features Documented** | Full recommended project directory structure, component package structure (atoms → molecules → organisms → templates → screens), AI OS frontend integration (state machine rendering, cinematic entrance, voice overlay), 44-step development order, Android-first with iOS-ready mandate, offline data queue integration |
| **Dependencies** | Input from: TRD, UI-UX, App Flow. Feeds: Backend API contract. Depends on: Implementation Plan phase order |
| **Conflicts** | None found. Typography follows Lora (consistent with UI-UX.txt, conflicting with Brand.png — inherits **DL-001**) |
| **Open Questions** | Expo SDK version not pinned in spec. Specific React Native version not specified. |

---

#### Backend.txt

| Field | Detail |
|---|---|
| **File** | `Backend.txt` |
| **Type** | Master Specification — Backend Architecture |
| **Size** | 59,951 bytes · ~4,171 lines · 276 sections |
| **Purpose** | Defines the complete backend architecture: all API endpoints (/api/v1/ patterns), domain maps, service responsibility boundaries, sync architecture, AI gateway structure, database schema patterns, authentication (JWT), and 15 final backend principles. |
| **Requirements Traceability** | Implements TRD architectural decisions. Provides API contract for Frontend. |
| **Key Features Documented** | Complete API surface (REST /api/v1/), standard response schema `{data, meta, request_id}`, list response schema `{items, pagination, meta, request_id}`, error schema `{error:{code,message,details}, request_id}`, JWT auth, modular monolith pattern, AI provider-agnostic gateway, Sarvam AI as primary voice/language provider, all domain endpoints (sales, inventory, customers, suppliers, finance, reports, AI, sync), 15 backend principles |
| **Dependencies** | Input from: TRD, PRD. Contracts with: Frontend. Governs: Database·Storage, AI OS backend |
| **Conflicts** | §data-authority treats cloud as system of record — partially conflicts with TRD §2 → **DL-002** |
| **Open Questions** | Specific API versioning strategy beyond /api/v1/ (e.g., how v2 is introduced) not specified. |

---

#### Database, Storage.txt

| Field | Detail |
|---|---|
| **File** | `Database, Storage.txt` |
| **Type** | Master Specification — Data Architecture |
| **Size** | 40,300 bytes · ~2,794 lines · 200 sections |
| **Purpose** | Defines data classification taxonomy, isolation matrix, security matrix, local SQLite schema patterns, cloud PostgreSQL schema patterns, sync queue, object storage rules, and data retention policies. |
| **Requirements Traceability** | Implements TRD data architecture decisions. Informs Backend schema design. Governs all data handling in Frontend. |
| **Key Features Documented** | Data classification taxonomy (business fact, business event, user preference, conversation/derived-insight context), isolation matrix (per-business, per-user, per-device), security matrix, encrypted SQLite on-device, PostgreSQL-class cloud, sync queue schema, object storage with signed access, 4-type memory model tracing to AI OS, **closing definition: "Local-first for speed and offline business continuity. Cloud-authoritative for shared business truth."** |
| **Dependencies** | Input from: TRD, Backend. Feeds: Frontend offline layer. Directly governs: AI OS memory storage |
| **Conflicts** | Closing definition is the synthesis adopted as the resolution for **DL-002** (DECIDED). |
| **Open Questions** | Which specific SQLite encryption library is to be used (SQLCipher? Expo SecureStore integration?)? Not named in spec. |

---

#### AI OS.txt

| Field | Detail |
|---|---|
| **File** | `AI OS.txt` |
| **Type** | Master Specification — AI Operating System Architecture |
| **Size** | 59,134 bytes · ~3,890 lines · 262 sections |
| **Purpose** | Defines the complete AI OS: state machine (13 states), context engine, role-aware AI behavior, briefing engine, memory architecture (4 types), prompt-injection defenses, provider gateway, all 6 interaction modes (Ask/Analyze/Create/Explain/Navigate/Summarize), AI OS cinematic entrance sequence. |
| **Requirements Traceability** | Implements PRD AI engine mandate. Integrates with Frontend (AI OS frontend subsystem) and Backend (AI gateway). References Database·Storage for memory persistence. |
| **Key Features Documented** | 13 AI OS states (DORMANT → INITIALIZING → SECURITY_VERIFIED → AWAKENING → ANALYZING → READY → LISTENING · THINKING · RESPONDING · ACTION_REQUIRED · EXECUTING · COMPLETED · ERROR), security gate always before cinematic entrance, 4 memory types, provider-agnostic gateway with Sarvam AI as primary, 6 interaction modes, role-aware context (owner/manager/staff/accountant), briefing engine, prompt-injection defense layer |
| **Dependencies** | Input from: PRD (AI engine mandate), TRD (stack), Backend (gateway), Database·Storage (memory persistence). Feeds: Frontend AI OS subsystem |
| **Conflicts** | None unique to AI OS.txt; inherits DL-001 (typography in cinematic entrance screens) and DL-002 (memory storage authority) |
| **Open Questions** | Sarvam-105B availability and cost at MVP scale not addressed. Fallback LLM when Sarvam-105B unavailable (other than generic "provider-agnostic gateway"). |

---

#### Implementation Plan.txt

| Field | Detail |
|---|---|
| **File** | `Implementation Plan.txt` |
| **Type** | Master Specification — Implementation Roadmap |
| **Size** | 43,595 bytes · ~3,071 lines · 147 sections |
| **Purpose** | Defines the canonical phase order (Phase 0–15), 47-step master sequence, parallel workstream model for a 6-member team, feature "definition of done" checklists, and master production-ready gate checklist. |
| **Requirements Traceability** | Translates PRD and TRD requirements into a sequenced delivery plan. Contains granular phase descriptions (coarser than TRD 50-step, finer than PRD 16-phase). |
| **Key Features Documented** | 16 phases (0 Governance → 1 Foundation → 2 Identity → 3 Local Data → 4 Core Business → 5 Transactions → 6 Finance → 7 Sync → 8 AI Foundation → 9 AI OS → 10 Collaboration → 11 Documents → 12 Connection Portfolio → 13 Enterprise → 14 Hardening → 15 Production), 47-step master sequence (01–47), parallel workstream model, definition-of-done checklist, production-ready gate checklist |
| **Dependencies** | Input from: PRD, TRD, all spec docs. Governs: team execution order |
| **Conflicts** | Phase granularity: PRD has coarse 16-phase list; TRD has 50-step order; this file has 47-step master sequence. None contradictory, but no document explicitly declares one as primary for sprint planning. |
| **Open Questions** | Which sequencing document (TRD 50-step or Implementation Plan 47-step) governs sprint-level task assignment? Team size assumption (6 members) may need revisiting. |

---

### 2.2 Governance and Meta Documents

---

#### Readme.md

| Field | Detail |
|---|---|
| **File** | `Readme.md` |
| **Type** | Governance — Developer Onboarding Guide |
| **Size** | 31,960 bytes · ~3,698 lines |
| **Purpose** | Defines the 9-document reading order for new contributors, recommended repository directory structure, component package structure, and 75 numbered rules for AI assistants and team members working on this project. |
| **Requirements Traceability** | Summarizes and cross-references all 9 master spec documents. Is the entry point for all new contributors. |
| **Key Features Documented** | 9-doc reading order, recommended `/apps`, `/packages`, `/docs`, `/scripts` directory tree, 75 operational rules for AI/team, enforcement of design system values, component architecture conventions |
| **Dependencies** | Depends on: all 9 master spec documents (references them by name). Must stay synchronized with spec doc updates. |
| **Conflicts** | None found. Typography follows Lora (consistent with text docs; Brand.png conflict inherited → DL-001). |
| **Open Questions** | 75-rule list not versioned — how are rule additions/changes tracked? |

---

#### PROJECT KNOWLEDGE INTERPRETATION & PRODUCT SCOPE.txt

| Field | Detail |
|---|---|
| **File** | `PROJECT KNOWLEDGE INTERPRETATION & PRODUCT SCOPE.txt` |
| **Type** | Governance — Product Scope Clarification |
| **Size** | 19,787 bytes |
| **Purpose** | Provides explicit guidance on how to interpret the project knowledge corpus. Clarifies that Vepari AI is a Business Operating System, not a billing/accounting/ERP app. Defines what the product is and is NOT. Establishes interpretation rules for AI assistants and contributors. |
| **Requirements Traceability** | Meta-document governing interpretation of all other documents. Operationalizes §0.3 hierarchy. |
| **Key Features Documented** | "Business OS not ERP" distinction, explicit anti-scope statements, product philosophy (Voice → Memory → Intelligence → Action), interpretation protocol for AI assistants |
| **Dependencies** | Depends on: all 9 master spec documents (interprets them). Must be read before any contribution. |
| **Conflicts** | None found. |
| **Open Questions** | Relationship to Prompt 0 (Master Scope): both establish interpretation rules. When they conflict, which takes precedence? (Prompt 0 §0.3 is likely senior, but not stated.) |

---

#### Project Instructions.txt

| Field | Detail |
|---|---|
| **File** | `Project Instructions.txt` |
| **Type** | Governance — AI Assistant Operating Instructions |
| **Size** | 20,530 bytes |
| **Purpose** | Provides specific operational instructions for AI coding assistants working on this project. Defines behavioral rules, output format requirements, communication protocols, and escalation procedures for AI agents. |
| **Requirements Traceability** | Operationalizes Readme.md 75-rule set for AI assistant context. |
| **Key Features Documented** | AI assistant behavioral rules, code-generation constraints, design system enforcement, escalation/conflict-resolution protocol, never-do list |
| **Dependencies** | Depends on: Readme.md, all 9 master spec docs. |
| **Conflicts** | None found. |
| **Open Questions** | Versioning: instructions may become stale as spec docs evolve. Update cadence not defined. |

---

### 2.3 Visual Brand Assets

---

#### Brand.png

| Field | Detail |
|---|---|
| **File** | `Brand.png` |
| **Type** | Visual Asset — Brand Identity Reference |
| **Size** | 1,824,198 bytes |
| **Purpose** | Primary brand identity document showing: logo lockup, color swatches with exact hex values, typography specimen panel, tagline, and brand mark in multiple contexts. |
| **Requirements Traceability** | Primary source for all color values and typography in the design system. UI-UX.txt and Frontend.txt must match Brand.png on colors. |
| **Key Features Documented** | Logo: "ai" glyph inside ornamental gold mandala/lotus border on ivory/cream rounded square. Wordmark: "VEPARI AI". Tagline: "SEE. UNDERSTAND. GROW." Colors: Deep Brown #3B2F2A, Heritage Gold #C8A96B, Olive Green #5A6B4F, Terracotta #B45B4A, Warm Beige #F2E8D6, Ivory White #FAF7F2. **Typography specimen: CINZEL SEMIBOLD (English) / NIRMALA UI SEMIBOLD TAMIL (Tamil).** |
| **Dependencies** | Governs: UI-UX.txt design system (color authority). Conflicts with: all 9 text docs (typography). |
| **Conflicts** | Typography conflict → **DL-001**: text docs say Lora; this asset says Cinzel Semibold |
| **Open Questions** | Is Brand.png the latest version? File has no embedded version/date metadata. |

---

#### App Icon.png

| Field | Detail |
|---|---|
| **File** | `App Icon.png` |
| **Type** | Visual Asset — App Store Icon |
| **Size** | 1,606,892 bytes |
| **Purpose** | Production app icon for Android/iOS. Shows the same mandala "ai" glyph as Brand.png in cream/ivory square, with wordmark "VEPARI AI BUSINESS OS" and tagline "AWAKENING YOUR BUSINESS INTELLIGENCE." |
| **Requirements Traceability** | Must match Brand.png brand identity exactly. Feeds mobile store listing assets. |
| **Key Features Documented** | Confirmed brand identity: same "ai" glyph in mandala, cream/ivory background, gold tones. Secondary tagline "AWAKENING YOUR BUSINESS INTELLIGENCE" (distinct from Brand.png's "SEE. UNDERSTAND. GROW."). |
| **Dependencies** | Depends on: Brand.png (brand consistency). Feeds: app store listings, splash screen spec. |
| **Conflicts** | Two distinct taglines in Brand.png vs. App Icon.png — which is primary for app store? Minor conflict, not blocking. |
| **Open Questions** | Correct app icon resolution for Play Store (512×512) and iOS (1024×1024) — is this file at production resolution? |

---

#### Screens.png

| Field | Detail |
|---|---|
| **File** | `Screens.png` |
| **Type** | Visual Asset — UI Screen Grid Reference |
| **Size** | 1,758,255 bytes |
| **Purpose** | 16-screen grid at real phone proportions showing all key app screens. Primary visual reference for UI/UX implementation. |
| **Requirements Traceability** | Implements UI-UX.txt screen map. All 16 screen layouts must match this reference during frontend development. |
| **Key Features Documented** | 16 screens: Home dashboard, Finance (₹1,45,680 revenue stat), Sales/Add Sale, Customers list, Transactions list, Suppliers list, Inventory list (238 total / 12 low stock / 3 out of stock), Reports menu, AI Insights (2×2 card grid), Alerts, Talk to Vepari chat, Settings, Business Profile. UI pattern: 5-tab bottom nav (Home·Transactions·Voice[elevated center]·Reports·More), gold-filled pill CTAs, "Talk to Vepari" dark-filled/gold-text pill, colored directional arrows with sparklines on stat cards. Status bar on every frame. |
| **Dependencies** | Implements: UI-UX.txt. Feeds: Frontend component specifications. |
| **Conflicts** | None found. All 16 patterns confirmed against UI-UX.txt spec. |
| **Open Questions** | Screens.png is a design mockup — does it represent MVP scope or full product scope? Some screens (Enterprise, Connection Portfolio) not shown. |

---

#### AI OS.png

| Field | Detail |
|---|---|
| **File** | `AI OS.png` |
| **Type** | Visual Asset — AI OS Architecture Diagram |
| **Size** | 1,886,960 bytes |
| **Purpose** | Visual representation of the AI OS architecture showing 8 capability cards (Finance, Customer, Supplier, Inventory, Insight, Automation, Operations, Security) arranged around a central AI core. Reference material for the AI OS architecture, not a literal UI screen. |
| **Requirements Traceability** | Reference for AI OS.txt architecture. Not a UI specification. |
| **Key Features Documented** | 8 domain capability areas, central AI core, compass/diamond mark (distinct from the mandala "அி" glyph used in Brand/App Icon) |
| **Dependencies** | Illustrates: AI OS.txt concepts |
| **Conflicts** | Central logo in this diagram (compass/diamond mark) differs from the mandala glyph in Brand.png and App Icon.png — these appear to be different visual elements for different contexts (architecture diagram vs. brand), not a conflict. |
| **Open Questions** | Is the compass/diamond mark in AI OS.png a separate brand element or a development placeholder? |

---

### 2.4 Engine Capability Slides

All 10 engine PNG files share a common format: numbered pitch-deck slide with a central illustration, 6 orbiting capability icons labeled in English+Tamil, a tagline, and a 5-item benefit banner at the bottom.

**Numbering status:** See **DL-003** — slide 06 is missing; slide 10 is duplicated.

---

#### Vision Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Vision Engine.png` | Pitch Slide | 05 | Defines the Vision Engine — strategic long-range intelligence capability | None | — |

#### Finance Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Finance Engine.png` | Pitch Slide | 07 | Finance Engine — revenue/expense tracking, P&L, GST/TDS/BRS | None | Maps to "Finance Engine" in PRD — confirm this is one of the 4 core AI engines |

#### Inventory Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Inventory Engine.png` | Pitch Slide | 08 | Inventory Engine — stock management, reorder alerts | None | Inventory is a business module, not one of 4 core AI engines in Prompt 0 — confirm engine taxonomy |

#### Voice Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Voice Engine.png` | Pitch Slide | 09 | Voice Engine — 23-language voice input/output, Sarvam AI | None | — |

#### Memory Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Memory Engine.png` | Pitch Slide | 10 | Memory Engine — business fact/event memory, context persistence | DL-003: slide 10 used twice | — |

#### Customer Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Customer Engine.png` | Pitch Slide | 10 | Customer Engine — customer intelligence, relationship tracking | DL-003: slide 10 used twice (also Memory Engine) | — |

#### Market Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Market Engine.png` | Pitch Slide | 11 | Market Engine — market intelligence, competitive analysis | None | — |

#### Automation Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Automation Engine.png` | Pitch Slide | 12 | Automation Engine — workflow automation, scheduled actions | None | — |

#### Growth Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Growth Engine.png` | Pitch Slide | 13 | Growth Engine — government schemes, market opportunity discovery | None | — |

#### Intelligence Engine.png

| File | Type | Slide # | Purpose | Conflicts | Open Questions |
|---|---|---|---|---|---|
| `Intelligence Engine.png` | Pitch Slide | 14 | Intelligence Engine — business analytics, pattern recognition | None | — |

**Engine taxonomy note (RESOLVED — see `decision-log.md` DL-006):** The 4 core AI engines (Business Brain, Finance, Growth, Access) are code namespaces; the 6 problem-led engines (Key Features Report) are feature domains; the 10 slides are flexible marketing icons. The canonical 3-layer mapping table — architectural → problem-led → representative features → icons — is recorded in **DL-006** and is the single source of truth for engine names in Phase 5/6/13. Access Engine is the cross-cutting delivery layer, not a problem-led engine.

---

### 2.5 Research Reports

These 4 PDF files are research-validated context documents. They cannot be directly edited; findings from them inform spec documents.

---

#### Vepari AI_Problem Statement_Report (1).pdf

| Field | Detail |
|---|---|
| **File** | `Vepari AI_Problem Statement_Report (1).pdf` |
| **Type** | Research — Problem Statement and Market Validation |
| **Size** | 1,090,294 bytes |
| **Purpose** | Research-backed validation of the 6 core problems Vepari AI addresses for Indian MSMEs: informal record-keeping, credit access barriers, market information gaps, digital divide (language/voice), supply chain inefficiency, regulatory compliance complexity. Includes severity matrix and Indian MSME market statistics. |
| **Requirements Traceability** | Validates PRD market assumptions and user persona pain points. Contains government scheme data (Package 4 supplement). |
| **Key Features Documented** | 6 problems with severity matrix, Indian MSME market statistics, credit gap analysis, digital literacy barriers by language/geography, regulatory burden quantification |
| **Dependencies** | Informs: PRD, Package 4 (government schemes). Referenced by: Prompt 0 §0.20 |
| **Conflicts** | None |
| **Open Questions** | Data currency: research date not visible in file name. MSME statistics should be verified against current government data before launch. |

---

#### Vepari_Competitor_Analysis_Research_Report.pdf

| Field | Detail |
|---|---|
| **File** | `Vepari_Competitor_Analysis_Research_Report.pdf` |
| **Type** | Research — Competitive Analysis |
| **Size** | 515,372 bytes |
| **Purpose** | Research-backed competitive landscape analysis. Confirms all 7 competitors cited in Prompt 0 §0.20 plus threat ranking and gap analysis. |
| **Requirements Traceability** | Validates PRD competitive context. Informs product differentiation strategy. |
| **Key Features Documented** | 7 competitors confirmed (Khatabook, OkCredit, Vyapar, Zoho Books, QuickBooks India, Tally Prime, Busy Accounting), threat-ranking matrix, competitive gap analysis supporting Vepari's differentiation (voice-first, local-language, AI OS) |
| **Dependencies** | Informs: PRD competitive sections, product positioning |
| **Conflicts** | None |
| **Open Questions** | Competitor data has a shelf life — how frequently will this report be refreshed? |

---

#### Vepari_Key_Features_Research_Report (1).pdf

| Field | Detail |
|---|---|
| **File** | `Vepari_Key_Features_Research_Report (1).pdf` |
| **Type** | Research — Feature Validation and Prioritization |
| **Size** | 296,743 bytes |
| **Purpose** | Research-backed validation of core feature priorities. Confirms the 4 core AI engines and the product's 6 validated capability areas. Attribution note: P-number feature catalog (e.g., P-001 through P-200) is sourced from Package PDFs, not this document. |
| **Requirements Traceability** | Validates PRD feature prioritization. Supplements Package PDF feature catalog. |
| **Key Features Documented** | 4 AI engine validation, 6 capability area confirmation, feature prioritization rationale |
| **Dependencies** | Works alongside: Package 1–4 PDFs (feature catalog). Informs: PRD, Implementation Plan phase ordering |
| **Conflicts** | None |
| **Open Questions** | The P-number catalog (P-001 to P-200) is in the Package PDFs, not here — this needs clear documentation to avoid misattribution. (Correction from Prompt 0 audit.) |

---

#### Impact_and_Benefits_Research_Report.pdf

| Field | Detail |
|---|---|
| **File** | `Impact_and_Benefits_Research_Report.pdf` |
| **Type** | Research — Impact and Benefits Analysis |
| **Size** | 274,568 bytes |
| **Purpose** | Research-backed quantification of expected impact and benefits for Indian MSME users: financial outcomes, productivity gains, credit access improvements, market reach expansion. |
| **Requirements Traceability** | Supports PRD business case. Informs investor/partner communication. |
| **Key Features Documented** | Expected financial outcomes, productivity improvements, credit access projections, market reach metrics |
| **Dependencies** | Informs: PRD business case, marketing materials |
| **Conflicts** | None |
| **Open Questions** | Impact projections are pre-launch estimates; post-launch validation methodology not defined. |

---

### 2.6 Package Feature Catalogs

These 4 PDFs constitute the authoritative feature catalog. Combined they contain 200 features (50 per package), referenced as P-001 through P-200.

---

#### package 1.pdf

| Field | Detail |
|---|---|
| **File** | `package 1.pdf` |
| **Type** | Feature Catalog — Package 1 (Core Business Features) |
| **Size** | 421,633 bytes |
| **Purpose** | Detailed specification of features P-001 through P-050. Core business operations features: sales recording, expense tracking, customer management, inventory basics. |
| **Requirements Traceability** | Source of P-001–P-050 feature definitions. Implementation Plan Phases 4–5 correspond to these features. |
| **Key Features Documented** | 50 features (P-001–P-050) covering core business operations |
| **Dependencies** | Feeds: PRD module list, Implementation Plan Phase 4–5 |
| **Conflicts** | None |
| **Open Questions** | Feature prioritization within the 50: which are MVP-mandatory vs. MVP-optional? |

---

#### package 2.pdf

| Field | Detail |
|---|---|
| **File** | `package 2.pdf` |
| **Type** | Feature Catalog — Package 2 (Finance and Reporting Features) |
| **Size** | 424,810 bytes |
| **Purpose** | Detailed specification of features P-051 through P-100. Finance engine features: journal entries, ledger, trial balance, P&L, GST/TDS/BRS. |
| **Requirements Traceability** | Source of P-051–P-100 feature definitions. Implementation Plan Phase 6 corresponds to these features. |
| **Key Features Documented** | 50 features (P-051–P-100) covering finance and accounting operations |
| **Dependencies** | Feeds: PRD finance modules, TRD custom accounting engine spec |
| **Conflicts** | None |
| **Open Questions** | GST filing integration: which GST portal API version is targeted? |

---

#### package 3.pdf

| Field | Detail |
|---|---|
| **File** | `package 3.pdf` |
| **Type** | Feature Catalog — Package 3 (AI and Intelligence Features) |
| **Size** | 417,329 bytes |
| **Purpose** | Detailed specification of features P-101 through P-150. AI OS features: voice interaction, business intelligence, memory, insights, recommendations. |
| **Requirements Traceability** | Source of P-101–P-150 feature definitions. Implementation Plan Phases 8–9 correspond to these features. |
| **Key Features Documented** | 50 features (P-101–P-150) covering AI, voice, and intelligence capabilities |
| **Dependencies** | Feeds: AI OS.txt spec, Backend AI gateway spec |
| **Conflicts** | None |
| **Open Questions** | Sarvam AI contract terms and API rate limits not referenced in any spec doc. |

---

#### package 4.pdf

| Field | Detail |
|---|---|
| **File** | `package 4.pdf` |
| **Type** | Feature Catalog — Package 4 (Government Schemes and Extended Features) |
| **Size** | 420,736 bytes |
| **Purpose** | Detailed specification of features P-151 through P-200. Government scheme discovery, rural/Gram-Disha context features, Connection Portfolio, and enterprise extension features. Also contains the government scheme database referenced in Problem Statement Report. |
| **Requirements Traceability** | Source of P-151–P-200 feature definitions. Implementation Plan Phases 10–13 correspond to these features. |
| **Key Features Documented** | 50 features (P-151–P-200) covering government schemes, rural context, Connection Portfolio (Phase 12), enterprise features |
| **Dependencies** | Feeds: PRD Growth Engine, Implementation Plan Phase 12. References: Gram-Disha data files |
| **Conflicts** | None |
| **Open Questions** | Government scheme database currency: schemes change frequently; update cadence not defined. |

---

### 2.7 Market Reference Data

---

#### Gram-Disha_India_District_Urbanity_Reference_With_UTs.docx

| Field | Detail |
|---|---|
| **File** | `Gram-Disha_India_District_Urbanity_Reference_With_UTs.docx` |
| **Type** | Market Reference — India District Urbanity Classification |
| **Size** | 70,069 bytes |
| **Purpose** | District-level urbanity classification reference for all Indian states and Union Territories. Used to calibrate feature behavior (voice-first vs. text-first, connectivity assumptions, language defaults) based on user geography. |
| **Requirements Traceability** | Feeds: Package 4 rural/urban feature differentiation, AI OS context engine (geographic context). |
| **Key Features Documented** | District-level urbanity scores/classifications for all Indian states + UTs, usable for geographic feature flagging |
| **Dependencies** | Used by: Package 4 features (P-151+), AI OS geographic context. Related to: Gram-Disha_SIH_Final_16Page.docx |
| **Conflicts** | None |
| **Open Questions** | Data vintage: district classifications change (new districts formed). Census year of this data? Update frequency? The "Gram-Disha" brand name in the filename refers to the classification system, but Vepari product docs should not use "Gram-Disha" as a user-facing term (see next file for context). |

---

#### Gram-Disha_SIH_Final_16Page.docx

| Field | Detail |
|---|---|
| **File** | `Gram-Disha_SIH_Final_16Page.docx` |
| **Type** | Market Reference — Smart India Hackathon Submission |
| **Size** | 7,768,232 bytes (largest file in repo) |
| **Purpose** | 16-page Smart India Hackathon (SIH) final project document for the Gram-Disha project. Provides the research and geographic intelligence background that informs Vepari's rural/semi-urban user context strategy. Not a Vepari product document — a reference/research source. |
| **Requirements Traceability** | Background research for rural context features in Package 4. Not directly implemented. |
| **Key Features Documented** | Rural-urban classification methodology, geographic intelligence framework, MSME rural context research |
| **Dependencies** | Related to: `Gram-Disha_India_District_Urbanity_Reference_With_UTs.docx` |
| **Conflicts** | None in product terms. The "Gram-Disha" branding throughout this document is the hackathon project's name, not Vepari's branding — confirm that no user-facing Vepari feature uses "Gram-Disha" as a label. |
| **Open Questions** | Extent to which Gram-Disha intellectual property (if any) has been licensed for use in Vepari AI — not addressed anywhere in the repository. |

---

### 2.8 Cost Reference

---

#### Cost Estimation.pdf

| Field | Detail |
|---|---|
| **File** | `Cost Estimation.pdf` |
| **Type** | Planning Reference — Cost and Resource Estimation |
| **Size** | 278,738 bytes |
| **Purpose** | Cost and resource estimates for development, infrastructure, and operations. Reference for budget planning and team sizing. |
| **Requirements Traceability** | Informs: Implementation Plan team sizing assumption (6 members), infrastructure choices in TRD. |
| **Key Features Documented** | Development cost estimates, infrastructure cost projections, team composition and cost, operational cost model |
| **Dependencies** | Informed by: TRD stack choices, Implementation Plan phase plan |
| **Conflicts** | None |
| **Open Questions** | Cost estimates are pre-development; actual quotes for Sarvam AI API, Railway/cloud infrastructure, and SQLCipher licensing are not visible in spec docs. Currency and pricing date of estimates? |

---

### 2.9 License

---

#### LICENSE

| Field | Detail |
|---|---|
| **File** | `LICENSE` |
| **Type** | Legal — Open Source License |
| **Size** | 11,357 bytes · 202 lines |
| **Purpose** | Apache License Version 2.0 governing the repository. Establishes terms for use, reproduction, modification, and distribution of the codebase. |
| **Requirements Traceability** | Not referenced in any spec document or governing prompt. **New finding — see DL-005.** |
| **Key Features Documented** | Apache 2.0 full text. Key provisions: perpetual worldwide royalty-free license; patent license grant; no trademark license; disclaimer of warranty; limitation of liability |
| **Dependencies** | Governs: all code in this repository |
| **Conflicts** | Existence not acknowledged in governing docs → **DL-005** |
| **Open Questions** | Is Apache 2.0 the intended license for a commercial product? Should a proprietary license replace this? This is a legal decision. |

---

## 3. Prompt 0 §0.3–0.20 Cross-Check

Each subsection below states the Prompt 0 claim, the primary source(s) checked, and the verification result: **CONFIRMED**, **CORRECTED**, or **CONFLICT**.

---

### §0.3 — Source-of-Truth Hierarchy

**Claim:** Authority order is TRD > PRD > App Flow ≈ UI-UX > Frontend = Backend = Database·Storage = AI OS > Implementation Plan.

**Sources checked:** All 9 master spec documents.

**Result: CONFIRMED.** The 9 documents are internally consistent with this hierarchy. TRD §2 is the highest-authority architectural decision point. Implementation Plan §1 defers to TRD/PRD on all architectural questions.

---

### §0.4 — Open Decisions

**Claim:** 5 open decisions exist (typography conflict, data authority, implementation sequencing, GST filing integration, Sarvam AI contract/rate limits).

**Sources checked:** All spec documents, Brand.png, Database·Storage.txt §closing.

**Result: CONFIRMED with additions.**
- Typography conflict: CONFIRMED → **DL-001**
- Data authority: CONFIRMED (synthesis exists in Database·Storage.txt but not ratified) → **DL-002**
- Implementation sequencing: CONFIRMED (TRD 50-step vs. Implementation Plan 47-step — both valid at different granularities, needs team decision on which governs sprint planning)
- GST integration target: CONFIRMED (not specified in any doc)
- Sarvam AI contract: CONFIRMED (not addressed)
- **NEW: DL-003** Engine slide numbering (06 missing, 10 duplicated)
- **NEW: DL-004** PRD module count (40) vs. Prompt 0 (24) — needs explicit MVP/full-scope distinction
- **NEW: DL-005** Apache 2.0 license not acknowledged in governing docs

---

### §0.5 — Product Vision

**Claim:** Vepari AI is an AI Business Operating System for Indian MSMEs. Philosophy: Voice → Memory → Intelligence → Action. Full loop: Business Activity → Data → Memory → Intelligence → Insight → Recommendation → Action → Business Change → Data.

**Sources checked:** PRD §1 Vision, PROJECT KNOWLEDGE INTERPRETATION & PRODUCT SCOPE.txt.

**Result: CONFIRMED.** PRD §1 and the scope clarification document both explicitly state the Business OS positioning and the full loop definition. The loop diagram appears verbatim in PRD §1.

---

### §0.6 — AI Engines

**Claim:** 4 core AI engines: Business Brain (memory/decisions), Finance Engine (revenue/expenses/credit), Growth Engine (market intelligence/schemes), Access Engine (voice/multilingual/digital access).

**Sources checked:** PRD §AI Engines, AI OS.txt §engine-taxonomy, Key Features Report.

**Result: CONFIRMED.** All 4 engines confirmed in PRD and AI OS.txt with matching descriptions.

**Clarification RESOLVED (DL-006):** The relationship between the 4 architectural engines, 6 problem-led engines, and 10 pitch icons is now locked in `decision-log.md` DL-006 with a single canonical mapping table. Phase 5/6/13 reference that table rather than re-deriving engine names.

---

### §0.7 — MVP Scope

**Claim:** MVP = Phases 0–9 delivering core voice-first business OS with local data, core business modules, finance engine, sync, and AI OS.

**Sources checked:** Implementation Plan.txt §Phase definitions.

**Result: CONFIRMED.** Implementation Plan explicitly defines Phases 0–9 as the MVP delivery set. Phases 10–15 are post-MVP.

**Note:** Module count discrepancy (DL-004) affects this section: if PRD has 40 modules total and Prompt 0 implies 24 for MVP, the exact MVP module list needs explicit documentation.

---

### §0.8 — Technology Stack

**Claim (locked):** React Native + Expo + TypeScript (Android-first, iOS-ready); encrypted SQLite on-device; PostgreSQL-class cloud; custom accounting engine (journal entries → ledger → trial balance → P&L, GST/TDS/BRS); modular monolith backend; REST /api/v1/ with JWT; AI provider-agnostic gateway with Sarvam AI primary; Cloudflare → NGINX/Caddy → Kong/Traefik; private object storage with signed access.

**Sources checked:** TRD §Stack, Backend.txt §Architecture, Database·Storage.txt §Storage.

**Result: CONFIRMED — all elements.** Every component of the stack is confirmed in TRD as the locked choice. No alternative technology appears anywhere in the spec.

**One gap:** SQLite encryption library is not named anywhere (TRD says "encrypted SQLite" but does not specify SQLCipher vs. other implementations). This is a minor open question, not a conflict.

---

### §0.9 — Design System

**Claim:** Six official hex values: Deep Brown #3B2F2A, Heritage Gold #C8A96B, Olive Green #5A6B4F, Terracotta #B45B4A, Warm Beige #F2E8D6, Ivory White #FAF7F2.

**Sources checked:** Brand.png (color swatches), UI-UX.txt §Colors, Frontend.txt §Design Tokens.

**Result: CONFIRMED — all 6 hex values match exactly** across Brand.png, UI-UX.txt, and Frontend.txt.

**Open conflict on typography:** Prompt 0 states Lora as primary English display font. Brand.png says Cinzel Semibold. See **DL-001**.

**Typography extended — RESEARCH COMPLETE (DL-010, 2026-08-31):** DL-001 retired Nirmala UI with a caveat (Android availability unresolved). DL-010 closes that caveat. Nirmala UI is confirmed unavailable on Android and non-redistributable under Microsoft EULA. All 23 target languages are mapped to verified `@expo-google-fonts/*` Noto packages (SIL OFL, commercial bundling permitted). 13 scripts covered: Devanagari (8 languages), Bengali (2), Tamil, Telugu, Kannada, Malayalam, Gujarati, Gurmukhi, Odia, Nastaliq/RTL (Urdu/Kashmiri/Sindhi), Meitei Mayek, Ol Chiki, Latin. Three scripts (Nastaliq, Meitei Mayek, Ol Chiki) have no Noto Serif variant — Sans is the only option. Odia package is named `noto-serif-oriya` (historical ISO name, not "odia"). 14 `fontFamily.*` design tokens defined for Phase 5. Phased APK bundling strategy established. RTL implementation guidance for Nastaliq scripts recorded. See `decision-log.md` DL-010 for the complete font-per-script table and token definitions.

---

### §0.10 — AI OS Architecture

**Claim:** 13 states (DORMANT → INITIALIZING → SECURITY_VERIFIED → AWAKENING → ANALYZING → READY → LISTENING · THINKING · RESPONDING · ACTION_REQUIRED · EXECUTING · COMPLETED · ERROR). Security gate always before cinematic entrance.

**Sources checked:** AI OS.txt §State Machine.

**Result: CONFIRMED.** All 13 states confirmed in exact order in AI OS.txt §State Machine. Security gate sequencing (SECURITY_VERIFIED before AWAKENING/cinematic entrance) is explicitly stated as a non-negotiable constraint.

---

### §0.11 — Voice and Language Architecture

**Claim:** 23-language support. Sarvam Saaras v3/v4 (STT), Bulbul v3 (TTS), Sarvam-105B (LLM). Provider-agnostic gateway.

**Sources checked (original):** AI OS.txt §Voice, Backend.txt §AI-Gateway.
**Sources checked (Prompt 7 live verification):** `docs.sarvam.ai` endpoints fetched 2026-08-31 — see DL-009.

**Result: PARTIALLY CORRECTED — DL-009 (2026-08-31).** The 23-language claim holds for **STT only** (Saaras v3/v4 covers all 23 in transcribe/codemix/translit/verbatim modes). **Bulbul v3 TTS covers only 11 languages** (Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, English). 12 languages have voice input but no TTS voice output in the current Sarvam stack: Assamese, Urdu, Nepali, Konkani, Kashmiri, Sindhi, Sanskrit, Santali, Manipuri, Bodo, Maithili, Dogri. `translate` mode on Saaras is also limited to the same 11 languages. Sarvam-105B and Mayura also document only 11-language coverage. Provider-agnostic gateway is confirmed in Backend.txt and is the architectural path to 23-language TTS. Odia uses `od-IN` for STT and `or-IN` for TTS — code discrepancy documented in DL-009. See DL-009 for full coverage table and Phase 13 implications.

---

### §0.12 — Memory Architecture

**Claim:** Four memory types: business fact, business event, user preference, conversation/derived-insight context. Database always outranks memory. Scoped per business. User inspect/correct/delete controls.

**Sources checked:** AI OS.txt §Memory, Database·Storage.txt §Data-Classification.

**Result: CONFIRMED.** All 4 memory types confirmed in AI OS.txt. Database-over-memory authority rule confirmed. Business-scoped isolation confirmed in Database·Storage.txt isolation matrix. User control requirements confirmed.

---

### §0.13 — Naming and Conflict Notes

**Claim:** "Connection Portfolio" has two meanings. Gram-Disha urban reference needs cleanup.

**Sources checked:** Implementation Plan.txt §Phase 12, Package 4 features, Gram-Disha files, Project Instructions.txt §27.

**Result: RESOLVED — DL-007 (2026-08-31).** The term had four uses across the repository — three facets of the in-product integrations feature (Phase 12 feature set, provider/adapter capability, overall integration framework) plus one showcase-deliverable meaning in Project Instructions §27. The collision is resolved by renaming:

- **"Connection Portfolio"** — canonical name for the in-product integrations feature (unchanged in all spec docs, code, and API routes).
- **"Product Showcase Portfolio"** — new canonical name for the final external showcase deliverable (Phase 20). `Project Instructions.txt §27` and Phase 20 references updated.

See `decision-log.md` DL-007 for the full glossary.

**Gram-Disha — AUDIT COMPLETE (DL-008, 2026-08-31):** Full search across all repo files for "Gram-Disha", "HBFS", "SIH26091" and related variants. Result: **zero product contamination** — none of these strings appear in any spec doc, code, or product-facing material. All knowledge-map references are audit/metadata only. District-urbanity dataset retained with canonical neutral-label rules established (see DL-008). SIH workbook content confirmed excluded from all Vepari specs. One open item: IP/licensing review required before any geo-aware feature ships.

---

### §0.14 — Security and Privacy Baseline

**Claim:** JWT auth, encrypted local storage, consent-based data collection, per-business data isolation, prompt-injection defenses in AI OS.

**Sources checked:** TRD §Security, Backend.txt §Auth, AI OS.txt §Security, Database·Storage.txt §Security-Matrix.

**Result: CONFIRMED — all elements.** JWT confirmed as auth mechanism. Encrypted local storage confirmed (SQLite encryption). Consent-based data collection in TRD. Business isolation confirmed in isolation matrix. Prompt-injection defenses explicitly addressed in AI OS.txt §Security.

---

### §0.15 — Offline and Sync Approach

**Claim:** Encrypted SQLite on-device for speed/offline; cloud PostgreSQL as authoritative shared state; sync queue with operation_id, device_id, entity, base_version, status, retry_count; idempotent retries; optimistic concurrency with version numbers; financial conflicts strictest handling.

**Sources checked:** TRD §Sync, Backend.txt §Sync, Database·Storage.txt §Sync-Queue.

**Result: CONFIRMED — all elements, exact field names.** All 6 sync queue fields confirmed in Database·Storage.txt schema. Idempotent retry model confirmed. Optimistic concurrency with version numbers confirmed. Financial conflict strictest-handling rule confirmed in TRD §Sync.

---

### §0.16 — Git and Team Workflow

**Claim:** Git workflow, branch naming, PR process defined.

**Sources checked:** Readme.md §Workflow (75-rule set).

**Result: CONFIRMED.** Readme.md 75-rule set includes git workflow rules, branch naming conventions, and PR process. No conflicts.

---

### §0.17 — Phase Order

**Claim:** Canonical phase order is Phase 0 through Phase 15 as defined in Implementation Plan.txt.

**Sources checked:** Implementation Plan.txt, PRD.txt §Phases, TRD.txt §Implementation-Order.

**Result: CONFIRMED — Implementation Plan is canonical.**
- PRD: 16 phases (coarser descriptions)
- TRD: 50-step implementation order (finest granularity, sub-phase steps)
- Implementation Plan: 16 phases + 47-step master sequence (middle granularity)

All three are consistent and non-contradictory. Implementation Plan.txt is the canonical phase order per §0.3 hierarchy. TRD 50-step sequence governs within-phase ordering.

---

### §0.18 — Testing Philosophy

**Claim:** Testing approach defined.

**Sources checked:** Implementation Plan.txt §Testing, TRD §Quality.

**Result: CONFIRMED.** Testing philosophy present in Implementation Plan. No conflicts.

---

### §0.19 — Observability Baseline

**Claim:** Observability requirements defined.

**Sources checked:** Backend.txt §Observability, TRD §Operations.

**Result: CONFIRMED.** Observability baseline (logging, error tracking, performance monitoring) defined in Backend.txt. No conflicts.

---

### §0.20 — Competitive Grounding

**Claim:** 7 competitors identified: Khatabook, OkCredit, Vyapar, Zoho Books, QuickBooks India, Tally Prime, Busy Accounting.

**Sources checked:** `Vepari_Competitor_Analysis_Research_Report.pdf`.

**Result: CONFIRMED — all 7 competitors confirmed** with threat-ranking matrix and competitive gap analysis. No additional major competitors found that are missing from Prompt 0.

---

## Summary: What Was Found

### Confirmed (✓)

All 6 design system hex values match Brand.png exactly. All 16 Screens.png layouts match UI-UX.txt spec. All 7 competitors confirmed in research report. All 6 MSME problems confirmed. All 4 AI engines confirmed. 4 package PDFs = 200 features (P-001–P-200). All sync queue fields match exactly. All 13 AI OS states confirmed in correct order. Full technology stack confirmed in TRD.

### Corrected (≠)

| Claim | Correction |
|---|---|
| "Connection Portfolio has 2 meanings" | Had **4 uses** (3 integrations facets + 1 showcase deliverable) — **RESOLVED DL-007**: showcase deliverable renamed to "Product Showcase Portfolio"; integrations uses unchanged |
| P-number catalog in Key Features Report | P-numbers sourced from **Package PDFs**, not Key Features Report |
| Government schemes in Package 4 only | Also documented in **Problem Statement Report** |
| Gram-Disha = minor cleanup | **AUDIT COMPLETE (DL-008)** — Zero contamination in all spec docs. District-urbanity data retained with neutral label rules. SIH workbook content excluded. One open IP/licensing item before geo-aware feature ships. |
| "24 modules" | PRD lists **40 modules** total; 24 may be MVP subset — **DL-004** |

### New Conflicts Logged (!)

| Decision | Status | Blocking |
|---|---|---|
| **DL-001** Typography: Lora vs. Cinzel Semibold | **DECIDED 2026-08-31** — Two-tier: Cinzel (wordmark) + Lora (UI) + Noto Serif Tamil | Phase 5 unblocked; 9 spec docs need typography section update |
| **DL-002** Data authority: Local-first vs. Cloud-authoritative | **DECIDED 2026-08-31** — Two-tier: core business data syncs to cloud by default; TRD §2 "consent-based/minimal" = AI/analytics signals only. TRD §2 text update required before Phase 14. | Phase 14 (Sync) unblocked; TRD §2 needs correction |
| **DL-003** Engine slide numbering: 06 missing, 10 duplicated | OPEN | Not blocking dev |
| **DL-004** PRD 40 modules vs. Prompt 0 24 modules | OPEN | Phase 4 scope planning |
| **DL-005** Apache 2.0 license not in governing docs | OPEN | Pre-distribution |
| **DL-007** "Connection Portfolio" naming collision | **DECIDED 2026-08-31** — "Connection Portfolio" = integrations feature (unchanged); "Product Showcase Portfolio" = final showcase deliverable. `Project Instructions.txt §27` + Phase 20 updated. | No future docs may use "Connection Portfolio" to mean the showcase |
| **DL-008** Gram-Disha exclusion audit | **AUDIT COMPLETE 2026-08-31** — Zero product contamination. District-urbanity dataset retained with neutral-label rules. SIH workbook content excluded. IP/licensing review required before geo-aware features ship. | IP review required pre-Phase 18 |
| **DL-009** Sarvam AI endpoint language coverage | **RESEARCH COMPLETE 2026-08-31** — STT (Saaras v3): 23 languages ✅. TTS (Bulbul v3): 11 languages only ⚠️. 12 gap languages: STT-in, text-only reply. Translate mode: 11 langs only. Odia code discrepancy: `od-IN` (STT) vs `or-IN` (TTS). Phase 13 ceiling established. | Phase 13 design must include text-only reply fallback for 12 gap languages; TRD §AI-Voice needs correction |
| **DL-010** Android font strategy for Indic scripts | **RESEARCH COMPLETE 2026-08-31** — Nirmala UI confirmed unavailable on Android and non-redistributable. All 23 target languages mapped to 13 scripts, each mapped to a verified `@expo-google-fonts/*` Noto package (SIL OFL). 14 `fontFamily.*` design tokens defined. Phased APK bundling strategy established (MVP: Latin + Devanagari + Tamil; Phase 11–12: TTS-11 full set; Phase 13: remaining 12). RTL guidance for Nastaliq scripts documented. 3 scripts (Nastaliq, Meitei Mayek, Ol Chiki) Sans-only — no Noto Serif variant exists. Odia package name is `noto-serif-oriya`, not "odia". | Phase 5 typography tokens must use exact token names from DL-010; Phase 9 must not reference or bundle Nirmala UI; Phase 13 RTL components required before Urdu/Kashmiri/Sindhi voice UI goes live |

---

*End of knowledge map. Last updated: 2026-08-31 (DL-010 added). Next review: on any spec document update or at start of Phase 1.*
