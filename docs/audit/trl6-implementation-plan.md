# Vepari AI — Architecture & TRL 6 Implementation Plan

Plan only — no code changes are made by this document. It reconciles the stack,
maps the repository, and sequences the work in dependency-aware phases. Companion
to `trl6-gap-analysis.md`.

## Locked decisions

1. **Primary backend = NestJS + TypeScript.** The Java (Spring Boot) + Python
   polyglot reading is **rejected**. No Java. Python is introduced **only** if a
   specialized AI/document-processing workload concretely justifies it (see
   "Python decision" below) — otherwise the backend stays TypeScript-only.
2. **Product domain = Vepari AI MSME** (businesses, customers, suppliers,
   products, inventory, sales, purchases, expenses, payments, finance). The
   TRL 6 "grant/budget/rubric" wording is a template mapped onto this domain
   (e.g. "researcher submits a grant" → "owner submits a sale/transaction").
3. **Database = MySQL 8.x authoritative (cloud), Prisma ORM.** Mobile SQLite is
   local/offline cache only, never authoritative.
4. **Mobile = bare React Native 0.73.6, TypeScript, Android-first, iOS-ready.**

## Android build decision — bare RN, not Expo

The mobile app is **bare React Native 0.73.6** (`AppRegistry.registerComponent`,
`metro-react-native-babel-preset`, plain `app.json`, zero Expo dependencies).
Therefore the `android/` project will be generated from the **RN 0.73.6
community template** and committed, not created via Expo prebuild. Migrating to
Expo/EAS is explicitly **out of scope** — it would be a large rewrite for no
TRL 6 benefit and risks the existing native modules (`op-sqlite`,
`react-native-keychain`, `react-native-audio-record`, `react-native-permissions`).

## Implementation map

### 1. Already exists (production-quality — keep)
- Monorepo: npm workspaces + Turbo; `@vepari/{types,validation,api-client,design-system}` build to `dist`.
- Backend: NestJS + Fastify, 30 modules, REST `/v1`, global ValidationPipe, helmet, CORS allowlist, ThrottlerGuard.
- MySQL + Prisma: 28 models, real `$transaction` usage (8 services), sales-atomicity test.
- 5-layer security: perimeter, JWT+OTP auth, BusinessMember RBAC/tenant isolation, input/injection defense, AES-256-GCM at-rest encryption + `security_events` audit log.
- AI Gateway: provider adapters (Anthropic→OpenAI fallback), Sarvam server-side, prompt-injection guard, usage/cost tracking (paise).
- Observability: structured JSON logs, correlation IDs, metrics + `/metrics`, alerting rules.
- Sync engine: offline mutation queue, cursors, idempotency, conflict handling, multi-device convergence test.
- Mobile: 54 screens, React Navigation, encrypted `op-sqlite`, `react-native-keychain`, offline flows.
- CI: secret-scan→typecheck→lint→test→build; Docker + docker-compose (MySQL); Railway config.

### 2. Partially implemented (extend, don't rewrite)
- Mobile async states — present on ~45 screens; needs a **consistent, audited** state set (loading/success/empty/error/offline/retry/auth/session-expiry/timeout/syncing/conflict/degraded).
- Crash diagnostics — backend logging done; **mobile Sentry missing**; no exportable defect log.
- Realtime — SSE exists; evaluate whether WebSocket is actually needed before adding.
- Concurrency — atomic ops exist; needs an explicit concurrency/load test proving deadlock-free financial writes.
- Environments — documented; staging/prod not stood up; live MySQL not provisioned.

### 3. Missing (build, in priority order)
- **Native `android/` project** (blocks APK/AAB — Phase 1).
- Sentry (mobile) + verifiable defect log.
- Android device-matrix test plan + evidence.
- Redis (cache/locks/rate-limit), BullMQ (background jobs) — only where justified.
- S3-compatible object storage for documents (MySQL keeps metadata only).
- FCM push notifications.
- Concurrency/load test suite.

### 4. Architecturally incorrect / to correct
- None critical found. Watch items: documents module stores metadata only (correct) but has no object-storage backend yet; some state via React Context where TanStack Query/Zustand may be warranted (evaluate, migrate systematically if adopted — no dual architectures).

### 5. Must change
- Add `android/` native project + Gradle + signing architecture (no secrets in Git).
- Introduce Sentry with PII/secret scrubbing.
- Provision live MySQL for staging/prod (infra, needs account).

### 6. Can remain unchanged
- Backend module structure, Prisma schema domain, security layers, AI gateway, sync engine, CI pipeline, Docker/Railway config, shared packages.

## Python decision (per directive)

**Not required now.** Current AI (Sarvam STT/TTS + LLM providers) is served via
server-side calls inside the NestJS AI Gateway and works without Python. A
Python microservice becomes justified **only if** we add a workload TS handles
poorly — e.g. on-device-grade document parsing (invoice/receipt OCR) or a custom
ML recommendation model using Python-only libraries. If/when that is approved,
it will be documented with: purpose, REST API boundary, deployment model
(containerized service behind the gateway), security model (no provider secrets
to mobile; service-to-service auth), and failure behavior (gateway degrades
gracefully, never blocks core flows). Until then: **TypeScript-only backend.**

## Phased execution plan (dependency-aware)

Each phase: inspect → plan → implement → test → typecheck → lint → build →
verify migrations → review → commit → report (Completed / Remaining / Tests /
Build / Risks / Files changed / Next dependency). No phase claims TRL 6 without
real evidence.

- **Phase 1 — Android buildability (highest blocker).** Generate bare-RN 0.73.6
  `android/` project; Gradle config; applicationId `ai.vepari.app`; debug + release
  + AAB build config; signing architecture via env/secret store (no keystore in
  Git); dev/staging/prod variants. Exit: `./gradlew assembleDebug`/`bundleRelease`
  documented and buildable on an SDK machine (cannot be built in this env).
- **Phase 2 — Mobile production hardening.** Audit every screen for the full
  state matrix; standardize an async-state pattern; evaluate + (if adopted)
  systematically introduce TanStack Query + Zustand; no mock business data.
- **Phase 3 — Sentry + diagnostics.** Integrate `@sentry/react-native` with
  scrubbing; correlation-ID continuity mobile↔backend; exportable defect log.
- **Phase 4 — Concurrency/load + financial integrity tests.** Real concurrency
  test for sales/purchases/payments/expenses/ledger/inventory/credit.
- **Phase 5 — Object storage.** S3-compatible adapter, private buckets, signed
  URLs, MIME/size validation; documents module stores references.
- **Phase 6 — Redis + BullMQ.** Cache/locks/rate-limit + background jobs
  (reports, documents, notifications, AI, sync) — never synchronous financial
  mutations.
- **Phase 7 — Android device-matrix test plan** + repeatable commands/evidence.
- **Phase 8 — CI/CD + environments.** Add Android build + integration/db stages;
  staging/prod configs and safeguards.
- **Phase 9 — Documentation refresh** to the actual architecture.

## Constraints honored throughout
Inspect before modifying; no unnecessary rewrites; no duplicate architectures;
no mock business data; no faked builds/UI; MySQL authoritative, SQLite local;
NestJS/TS primary; Java not added; Python only if justified; AI secrets stay
server-side; no secrets in Git; Android-first, iOS-ready; every major decision
documented.
