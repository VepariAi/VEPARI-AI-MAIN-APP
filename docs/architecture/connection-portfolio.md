# Connection Portfolio Architecture

How Vepari AI integrates with external providers (accounting, payments,
e-commerce, banking, logistics, communication). (Prompts 230–238, plus the
enterprise items 239–245.)

## 230 — Architecture

The Connection Portfolio treats every external system uniformly through a
single **adapter interface**, so the sync engine, webhook processor, and health
monitor never contain provider-specific code.

```
                    ┌────────────────────────┐
   provider APIs →  │   ConnectionAdapter    │ ← one per provider (231)
   provider hooks → │  (sync/webhook/health) │
                    └───────────┬────────────┘
                                │ resolved by id
                    ┌───────────▼────────────┐
                    │     AdapterRegistry     │ (231)
                    └───┬─────────┬─────────┬─┘
          ┌─────────────▼──┐ ┌────▼──────┐ ┌▼───────────────┐
          │ ConnectionSync │ │ Webhook   │ │ Health monitor │
          │ engine (233)   │ │ processor │ │ (235)          │
          └────────────────┘ │ (234)     │ └────────────────┘
                             └───────────┘
```

Adapters are **pure orchestration**: they translate provider payloads to
`NormalizedRecord`s (amounts always in integer paise) and never touch the
database. The caller persists normalized records through domain services, so
the two-tier data authority model (backend is authoritative) is preserved.

## 231 — Provider adapter interface

`ConnectionAdapter` declares `providerId`, `name`, `category`, `authType`, and
three operations: `sync()`, `handleWebhook()`, `healthCheck()`. Adapters
self-register in `AdapterRegistry` at module init.

## 232 — OAuth / credential flow

`OAuthFlowService` builds the provider authorize URL with a **signed, single-use
`state`** token binding the callback to `{provider, business, connection, nonce,
issuedAt}` (HMAC-SHA256, constant-time verified, TTL-bounded) — CSRF defense for
the callback. Client secrets and the signing secret stay server-side and are
never returned to a client.

## 233 — Sync engine

`ConnectionSyncService.runSync()` resolves the adapter, runs an incremental sync
from the stored cursor, records `connection_sync_*` metrics, and returns
normalized records plus the next cursor. Adapter failures are **caught**, not
thrown, and mapped to `failed` (or `degraded` for a benign `*_not_configured`).

## 234 — Webhook processing

`WebhookProcessorService.process()` resolves the adapter and delegates
verification + parsing to it (each provider signs differently). The
`ConnectionWebhookController` (unauthenticated by JWT — providers have no
session) reads the **raw** request body (`rawBody: true` on Fastify) so HMAC
runs over exact bytes, resolves the per-provider secret from the environment,
and always acks 200 with an `accepted` flag (providers retry on non-2xx).

## 235 / 238 — Health monitoring & degraded mode

`checkHealth()` returns `{ healthy, degraded, detail }`. A failing provider
never breaks the portfolio: its connection shows `degraded`/`ERROR` while all
other connections and the core app keep working.

## 237 — First real provider: Razorpay

`RazorpayAdapter` implements Razorpay's real webhook scheme (HMAC-SHA256 of the
raw body, `x-razorpay-signature`, no timestamp component) and normalizes
`payment.captured` events to `NormalizedRecord`s with amounts kept in paise.
`sync()` requires live `key_id`/`key_secret` and reports `razorpay_not_configured`
rather than fabricating data until wired to the live REST API.

## Enterprise (239–245)

- **239 RBAC depth / 240 multi-branch:** roles on `BusinessMember` gate
  privileged operations; `BusinessMemberGuard` enforces per-business scope. A
  business may have multiple members and (future) branches under one owner.
- **241 analytics depth:** the analytics + reports modules provide P&L, trial
  balance, health score, growth and scheme-matching outputs.
- **242 usage-based entitlements / 245 billing:** the usage module tracks
  per-business AI/API consumption with cost in paise; the billing module holds
  plan/entitlement state that gates premium capability.
- **243/244 iOS:** the mobile app is built on React Native with a platform
  abstraction; no Android-only native modules block an iOS build. iOS-specific
  implementation is planned for a later phase.
