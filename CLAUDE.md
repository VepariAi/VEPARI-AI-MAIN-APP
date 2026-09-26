# CLAUDE.md — Vepari AI

## Project Identity

**Vepari AI** — AI-powered, mobile-first business intelligence platform for MSMEs across India.

One product. One repository. Six developers. Multiple machines. Source of truth: Git.

## Quick Context

- **Branch strategy**: feature branches → PR → `main`
- **Monorepo**: npm workspaces — `packages/*`, `mobile`, `backend`
- **Build orchestrator**: Turbo v2 (`npx turbo <task>`)
- **Node**: ≥20. npm: ≥10
- **Language**: TypeScript strict mode everywhere

## Repository Layout

```
/
├── backend/          NestJS 10 + Fastify — API server
├── mobile/           React Native 0.73.6 — Android-first, iOS-ready
├── packages/
│   ├── types/        @vepari/types — shared TypeScript interfaces (no runtime code)
│   ├── validation/   @vepari/validation — Zod schemas shared by FE and BE
│   ├── api-client/   @vepari/api-client — typed HTTP client for mobile
│   ├── design-system/ @vepari/design-system — tokens, base components
│   └── config/       @vepari/config — env config helpers
├── docs/             Product, UX, architecture, decisions
├── .github/workflows/ CI pipelines
└── CLAUDE.md         ← you are here
```

## Architecture Principles

### Security (non-negotiable)
- **Never** store secrets, API keys, passwords or credentials in source code or Git
- All AI provider keys (Sarvam, OpenAI, Anthropic) stay **behind the AI Gateway — never client-side**
- Sarvam STT/TTS calls: server-side only
- JWT: 15-min access tokens, 90-day refresh tokens
- OTP login via SMS (Indian phone numbers, E.164 format)

### Financial Data
- All INR amounts stored as **paise (integer)** — never float
- Monetary arithmetic uses integer paise throughout; only format to rupees for display

### Backend Authority
- The backend/database is the authoritative source for all business-critical data
- Mobile may cache locally (SQLite) but must sync and handle conflicts explicitly
- **AI never gets direct database access** — all AI interactions go through the AI Gateway module

### Offline-First
- Mobile designed for Indian connectivity conditions (2G/3G, intermittent)
- Local SQLite stores queued mutations; sync engine reconciles when online
- User never loses data due to connectivity

## Four Core Engines

| Engine | Responsibility |
|--------|---------------|
| Business Brain | Memory, context, decisions, continuity |
| Finance Engine | Revenue, expenses, profit, credit, ledgers |
| Growth Engine | Market intel, customers, opportunities, schemes |
| Access Engine | Voice, multilingual, conversational interaction |

## Backend (NestJS)

### Running locally
```bash
cd backend
cp .env.example .env      # fill in required values
npm install
npm run start:dev
```

### Key commands
```bash
npx turbo typecheck       # type-check all packages
npx turbo lint            # lint all packages
npx turbo test            # run all tests
npx turbo build           # build all packages
```

### Module structure
`backend/src/modules/<name>/` — each module has `.module.ts`, `.controller.ts`, `.service.ts`

27 modules: auth, users, businesses, team, customers, suppliers, products, inventory, sales,
expenses, purchases, payments, finance, operations, documents, reports, analytics, ai, voice,
search, notifications, automation, connections, sync, billing, usage, audit

### Database (Prisma)
```bash
cd backend
npx prisma migrate dev    # run migrations (dev)
npx prisma studio         # visual DB browser
npx prisma generate       # regenerate client after schema changes
```
Schema lives at `backend/prisma/schema.prisma`.

## Mobile (React Native)

### Running locally
```bash
cd mobile
npm install
npx react-native run-android    # Android
npx react-native run-ios        # iOS (Mac only)
```

### Environment
`mobile/src/services/env.ts` resolves `dev | staging | production` via `globalThis.__ENV__`.
No secrets ever in the mobile bundle.

### Navigation
React Navigation v6 — bottom tabs + stack navigators per domain.

### Path aliases
`@/*` maps to `mobile/src/*` (configured in `mobile/tsconfig.json` + `babel.config.js`).

## Shared Packages

| Package | Purpose |
|---------|---------|
| `@vepari/types` | TypeScript interfaces — import freely, zero runtime cost |
| `@vepari/validation` | Zod schemas — use for API request/response validation |
| `@vepari/api-client` | HTTP client — mobile uses this to call the backend |
| `@vepari/design-system` | Tokens + base UI components |
| `@vepari/config` | Shared config helpers |

## CI / CD

CI runs on every PR: **gitleaks → typecheck → lint → test** (sequential, secret-scan gates all).

Never bypass a failing check with `--no-verify`. Fix the root cause.

## Development Rules (per Project Instructions §17)

**Always:**
1. Inspect the repository first — understand existing architecture
2. Make minimal appropriate changes
3. Run `npx turbo typecheck lint test` before pushing
4. Document significant decisions in `docs/decisions/`

**Never:**
- Blindly rewrite working code
- Invent APIs or database tables not in the schema
- Remove tests to make builds pass
- Silently change business logic
- Store secrets in source or Git

## Multilingual

22 Indian languages + English supported via Sarvam AI.
Language is a UI concern only — business entities are language-independent.
Sarvam API calls must remain **server-side**.

## Phase Status

Per Project Instructions §30 (20-phase order):
- Phases 1–8: Research, UX, IA, wireframes, design system, HiFi UI, prototype, validation ✓
- **Phase 9**: React Native Android foundation (in progress)
- Phases 10–20: Pending

Per Master Implementation Plan §143 (47-step Final Implementation Order):
- Steps 1–6: Repo, environment, CI, design system shell, mobile shell, backend shell ✓
- Steps 7+: In progress

## Decisions Log

See `docs/decisions/` for architectural decision records (ADRs).

Key standing decisions:
- Sarvam AI for STT/TTS (22 Indian languages + English)
- NestJS + Fastify for backend (performance)
- React Native for mobile (shared logic, Android-first)
- Prisma ORM for database access
- Zod for runtime validation (shared FE/BE)
- INR as paise (integer) throughout
- JWT auth with OTP (Indian phone, SMS)
