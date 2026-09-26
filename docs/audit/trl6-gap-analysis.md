# TRL 6 Readiness — Gap Analysis (Vepari AI Android App)

Audit of the current codebase against (a) the five TRL 6 certification areas and
(b) the production baseline stack. Status legend: ✅ built · 🟡 partial · 🔴 missing.

> **Open decision blocking the build — backend language.** The stated stack is
> internally contradictory: one statement says the backend is **Java (Spring
> Boot) + Python**; the detailed baseline says the backend is **NestJS +
> TypeScript** with Python only behind the AI gateway. The current codebase is
> **NestJS + TypeScript**. The "missing" items below are marked accordingly;
> the Java/Python rows resolve differently depending on this decision.

---

## Part 1 — The five TRL 6 certification areas

### 1. Cross-platform front-end (React Native) — 🟡 partial
| Item | Status | Notes |
|---|---|---|
| React Native + TypeScript app | ✅ | 54 screens, React Navigation, custom design system |
| Platform-agnostic components | ✅ | shared components; no android-only coupling in JS |
| Real data (no hardcoded mocks) | ✅ | screens fetch via `@vepari/api-client` |
| Async states (loading/success/error) | 🟡 | 45 screens use loading/catch, 38 have error state — needs a consistent, audited pattern across all |
| Stable during network drops | 🟡 | offline-first SQLite queue exists; needs field-condition test evidence |
| **Compiled APK/AAB** | 🔴 | **no `android/` (or `ios/`) native project exists** — the app cannot currently be built into an APK/AAB. This is the single biggest front-end gap. |

### 2. Database layer maturity (Prisma) — 🟡 partial
| Item | Status | Notes |
|---|---|---|
| Prisma ORM + finalized relations | ✅ | 28 models on MySQL 8 (DL-011) |
| Real transactions | ✅ | `$transaction` in 8 services; sales-atomicity test |
| Schema constraints | ✅ | unique/index constraints, FK relations |
| Concurrent writes without deadlocks | 🟡 | atomic upserts/increments in place; needs a concurrency/load test to *prove* deadlock-free |
| **Domain fit** | ⚠️ | schema models the **MSME business** domain (sales, customers, inventory…). If TRL 6 is assessed against a *grant/IPR* domain, those entities (applications, budgets, rubrics, scoring) do **not** exist. Confirm the assessed domain. |

### 3. Polyglot back-end (Python & Java) — 🔴 missing (as literally specified)
| Item | Status | Notes |
|---|---|---|
| Java (Spring Boot) services | 🔴 | 0 Java files. Core backend is NestJS/TS. |
| Python microservice(s) | 🔴 | 0 Python files. No AI/PDF microservice. |
| REST integration | ✅ | NestJS REST API exists (`/v1/...`) |
| gRPC pipelines | 🔴 | none |
| Unified workflow under simulated load | 🔴 | no load-test harness |

### 4. Simulated Android deployment matrix — 🔴 missing
| Item | Status | Notes |
|---|---|---|
| Multi-OS testing (Android 13–16) | 🔴 | no device matrix / emulator config |
| Multi-resolution / hardware tiers | 🔴 | none documented |
| Memory / battery / background profiling | 🔴 | none |
| (Depends on) buildable APK | 🔴 | blocked by §1 native project gap |

### 5. Crash & log diagnostics — 🟡 partial
| Item | Status | Notes |
|---|---|---|
| Backend structured logging | ✅ | JSON logger + correlation IDs + metrics + alerting (built this session) |
| **Sentry (React Native)** | 🔴 | not integrated in the mobile app |
| **Logback (Java)** | 🔴 | no Java service to host it |
| API timeout / unhandled-promise capture | 🟡 | backend interceptor captures errors; mobile has no crash reporter |
| Verifiable defect log | 🔴 | no aggregated, exportable defect log yet |

---

## Part 2 — Production baseline stack coverage

### Mobile
| Tech | Status |
|---|---|
| React Native + TypeScript | ✅ |
| React Navigation | ✅ |
| Local SQLite (encrypted) | ✅ `@op-engineering/op-sqlite` |
| Secure storage (Keystore/Keychain) | ✅ `react-native-keychain` |
| Offline sync queue | ✅ (backend sync engine + local queue) |
| Zod validation | ✅ (shared `@vepari/validation`) |
| Expo + EAS | 🔴 not installed (bare RN) |
| TanStack Query | 🔴 (uses manual fetch + context) |
| Zustand | 🔴 (uses React Context) |
| React Hook Form | 🔴 |
| Reanimated / Gesture Handler | 🔴 |
| Skia | 🔴 |
| Firebase Cloud Messaging (push) | 🔴 |
| Crash/analytics (Sentry) | 🔴 |
| **Native `android/` project (APK/AAB)** | 🔴 |

### Backend
| Tech | Status |
|---|---|
| NestJS + TypeScript | ✅ |
| REST API | ✅ |
| MySQL 8 + Prisma | ✅ (DL-011) |
| 5-layer defense-in-depth security | ✅ (perimeter/auth/authz/validation/at-rest+audit) |
| AI gateway (provider adapters) | ✅ (Anthropic→OpenAI; Sarvam server-side) |
| Audit + usage/cost tracking | ✅ |
| WebSocket realtime | 🟡 SSE realtime exists; no socket.io/WS |
| Redis (cache/locks/sessions) | 🔴 |
| BullMQ background jobs | 🔴 |
| Object storage (S3/MinIO) for docs | 🔴 (documents module stores metadata only) |
| Java / Python services | 🔴 (see §3) |

### Infra / DevOps
| Item | Status |
|---|---|
| GitHub source of truth | ✅ |
| CI: secret-scan→typecheck→lint→test→build | ✅ |
| Dockerfile + compose (MySQL) | ✅ |
| Railway deploy config | ✅ |
| Live MySQL server | 🔴 (config ready; not provisioned here) |
| CDN/WAF/load balancer | 🔴 (documented, not provisioned) |
| Staging/prod environments | 🟡 (documented; not stood up) |

---

## Priority order to reach TRL 6 (once the backend-language decision is made)

1. **Generate the native `android/` project** so an APK/AAB can actually be built (unblocks §1 and §4).
2. **Confirm the assessed domain** (MSME vs grant/IPR) — decides whether new schema/modules are needed.
3. **Polyglot decision** — add Python AI microservice (and Java service if required) OR document the TS-only rationale.
4. **Sentry (mobile) + exportable defect log** (§5).
5. **Android device-matrix test plan + evidence** (§4).
6. **Concurrency/load test** proving deadlock-free writes (§2).
7. Provision **live MySQL** + staging (infra).
8. Optional baseline additions: Redis, BullMQ, object storage, push (FCM).
