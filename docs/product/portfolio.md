# Vepari AI — Portfolio

A structured product & engineering portfolio for Vepari AI. (Prompts 273–278.)

## 273 — Structure & content plan
1. Product story & problem
2. Solution, UX & UI
3. Architecture & technology
4. Impact, demo & roadmap

Each section is evidence-backed by the repository (code, docs, tests).

## 274 — Product story & problem
India has ~63 million MSMEs. Most run on memory, paper, and WhatsApp: they lose
track of who owes them, what's in stock, and whether they're actually profitable.
Existing accounting software is English-first, form-heavy, and assumes always-on
connectivity — a poor fit for a shopkeeper operating in Hindi/Tamil/Marathi on a
budget Android phone with intermittent 2G/3G.

**Vepari AI** is a voice-first, offline-first business brain that a non-technical
owner can operate by *talking* to it in their own language. It records sales,
expenses, credit and inventory; computes GST/TDS; and proactively surfaces what
needs attention.

## 275 — Solution, UX & UI
- **Voice-first (Access Engine):** capture → STT → intent → AI → response → TTS,
  in 23 Indian languages via Sarvam (server-side). Code-mixed input supported.
- **AI OS home + "while you were away" briefing:** the app opens with what
  changed and what needs action, not an empty ledger.
- **Confirmation-gated AI actions:** the AI *proposes*; the owner *approves*
  before anything is written — trust by design.
- **Offline-first UX:** every action works offline and syncs later; the UI shows
  clear sync/offline state.
- **Design system:** locked typography/color/spacing tokens; 54 screens;
  accessibility and multilingual typography rules baked in.

## 276 — Architecture & technology
- **Mobile:** React Native (Android-first, iOS-ready), SQLite offline store,
  sync engine with cursors + idempotency + conflict resolution.
- **Backend:** NestJS 10 + Fastify, 30 modules, Prisma/MySQL, JWT+OTP auth,
  RBAC via business membership.
- **AI Gateway:** single server-side egress to providers (Anthropic → OpenAI
  fallback), prompt-injection defense, per-call cost tracking in paise. AI has
  **no direct database access**.
- **Connection Portfolio:** uniform adapter framework for external providers
  (payments, accounting, banking…) with signed OAuth state, HMAC-verified
  webhooks, and degraded-mode health.
- **Observability:** structured JSON logs with correlation IDs, metrics +
  Prometheus endpoint, health probes, alerting rules.
- **Quality:** 419 unit tests, strict TypeScript, CI gate
  (secret-scan → typecheck → lint → test → build), containerized deploy.
- **Money:** all INR stored as integer paise end to end.

## 277 — Impact, demo & roadmap
- **Impact:** turns an owner's spoken day into structured books, live profit
  visibility, credit tracking, and compliance-ready records — without literacy
  in English or accounting.
- **Demo flow (golden path):** onboard by phone OTP → speak a sale → see it in
  the ledger and today's profit → record a credit sale → get a "while you were
  away" briefing → export a GST-ready report.
- **Roadmap:** live provider integrations (Razorpay first), multi-branch depth,
  iOS release, expanded E2E/scale testing, richer growth recommendations.

## 278 — Final assembly
This document is the assembled portfolio narrative; each claim maps to
repository evidence:
- Engines & modules → `backend/src/modules/*`
- AI safety → `backend/src/modules/ai/*` (gateway, prompt-injection guard)
- Money integrity → finance module + paise assertions in tests
- Connection Portfolio → `docs/architecture/connection-portfolio.md`
- Operability → `docs/deployment/*`, `backend/src/common/observability/*`
- Security & privacy → `docs/audit/security-review.md`, `backend/src/modules/privacy/*`
- Audits → `docs/audit/final-audit.md`
