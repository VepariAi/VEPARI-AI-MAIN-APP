# Error & Debugging Playbooks

Fast-path diagnosis for recurring failure classes. Each entry: symptom →
likely cause → fix. (Prompts 246–253.)

## 246 — Build & dependency errors
| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module '@vepari/types'` at runtime | shared package not built to `dist/` | `npx turbo run build --filter=@vepari/backend...` (types/validation emit JS; `main` → `dist/index.js`) |
| `npm ci` fails on lockfile mismatch | `package-lock.json` out of sync | run `npm install`, commit the lockfile; never hand-edit it |
| Turbo cache serves stale output | inputs changed but cache key didn't | `npx turbo run build --force` |
| Prisma client missing | client not generated | `npx prisma generate --schema=backend/prisma/schema.prisma` |

## 247 — TypeScript / runtime errors
| Symptom | Likely cause | Fix |
|---|---|---|
| `TS2532 Object is possibly 'undefined'` | `noUncheckedIndexedAccess` on `arr[i]` | guard, or `arr[i]!` when provably present |
| `TS2379` assigning `x \| undefined` to optional | `exactOptionalPropertyTypes` | conditional spread `...(v !== undefined ? { k: v } : {})` |
| Decorator metadata missing at runtime | `reflect-metadata` not imported first | ensure `import 'reflect-metadata'` is the first line of `main.ts` |
| `no-control-regex` lint error | literal control char in a regex | use explicit escapes / a printable range |

## 248 — Database / migration errors
| Symptom | Likely cause | Fix |
|---|---|---|
| `migrate deploy` fails: pending migration conflict | migration edited after apply | never edit an applied migration; add a new forward one |
| Column missing after deploy | destructive change shipped in one release | use expand → migrate → contract across two releases |
| `P2002 unique constraint` | duplicate insert | check idempotency key / upsert instead of create |
| Long lock on large table | non-concurrent index/alter | review lock impact before merge; batch/backfill |

## 249 — API / authentication errors
| Symptom | Likely cause | Fix |
|---|---|---|
| 401 on a valid token | access token expired (15 min) | client refreshes via refresh token |
| 403 on a business route | caller not a member | `BusinessMemberGuard` correctly rejecting; verify membership |
| 429 Too Many Requests | throttle limit hit | back off; limits are 10/s burst, 200/min |
| CORS error in browser | origin not allowlisted | add to `ALLOWED_ORIGINS` |

## 250 — Sync / conflict debugging
| Symptom | Likely cause | Fix |
|---|---|---|
| Duplicate records after retry | mutation replayed | idempotency key must dedupe; verify key is stable per mutation |
| Device stuck behind server | cursor not advancing | inspect `SyncCheckpoint`; force server→device pull |
| Financial conflict | two edits to same transaction | apply financial special-case rules; never drop a recorded transaction |

## 251 — AI / voice debugging
| Symptom | Likely cause | Fix |
|---|---|---|
| All AI calls fail | both providers down/misconfigured | gateway fails Anthropic→OpenAI; check keys; AI degrades, core app still works |
| Prompt-injection false negative | pattern not covered | add signature to `INJECTION_PATTERNS`/`LEAK_PATTERNS` + a test |
| STT/TTS 401 | Sarvam key missing/invalid | keys are server-side only; check `SARVAM_API_KEY` |
| Cost spike | runaway usage | watch usage counters + `ai_provider_failures` alert; cap via config |

## 252 — Performance regression
| Symptom | Likely cause | Fix |
|---|---|---|
| p95 latency alert firing | slow query / N+1 | inspect `/metrics/json` per-route p95; add index / batch query |
| Memory growth | unbounded in-memory store | metrics sample buffers are capped; audit other stores |

## 253 — Device-specific failures
| Symptom | Likely cause | Fix |
|---|---|---|
| Indic text not rendering | missing font for script | see `docs/decisions/DL-010` font strategy |
| Crash on low-end device | memory pressure | profile; reduce retained lists; lazy-load screens |
| Works online, fails offline | missing offline path | verify mutation queues to SQLite and replays on reconnect |
