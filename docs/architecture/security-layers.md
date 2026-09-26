# 5-Layer Defense-in-Depth Security

Vepari AI's security is built as five independent layers. Each layer assumes the
others might be bypassed and defends its own boundary, so a weakness in one does
not become a breach of the whole.

> **On "impenetrable":** no system is impenetrable, and we don't claim to be.
> Defense-in-depth means an attacker must defeat several independent controls,
> each of which also *detects and records* the attempt (Layer 5). The goal is to
> make compromise expensive, contained, and observable — not to promise it can
> never happen.

All persistent data, security logs, and encrypted credentials live in **MySQL 8**.

## Layer 1 — Perimeter / edge
- `helmet` security headers (HSTS, no-sniff, frameguard) — `main.ts`.
- CORS restricted to an explicit origin allowlist (`ALLOWED_ORIGINS`).
- Rate limiting via `ThrottlerGuard` — 10 req/s burst, 200 req/min sustained.
- Request body size bounds; raw-body captured only where webhook verification needs it.
- Private-API posture: `robots.txt` disallow, Swagger disabled in production.

## Layer 2 — Authentication
- OTP login (Indian E.164 phone), OTP codes single-use, 15-minute expiry.
- JWT access tokens (15 min) + refresh tokens (90 days), refresh revocable and
  revoked on logout and account erasure.
- No passwords stored — removes the largest credential-theft surface.

## Layer 3 — Authorization & tenant isolation
- `JwtAuthGuard` gates authenticated routes; identity comes from the verified
  JWT, never from request parameters.
- `BusinessMemberGuard` enforces that the caller belongs to the `:businessId`
  they address — cross-tenant access is structurally rejected before the handler.
- Role checks on `BusinessMember` gate privileged operations (RBAC).

## Layer 4 — Input validation & injection defense
- Global `ValidationPipe` (whitelist, transform) strips unknown fields and
  rejects malformed payloads; Zod schemas validate shared contracts.
- SQL injection: all DB access goes through Prisma parameterized queries — no
  string-built SQL.
- AI prompt-injection guard screens user text in and model output out.
- File uploads validated by size + extension + MIME + magic-byte signature.
- Inbound webhooks verified by per-provider HMAC over the raw body.

## Layer 5 — Data at rest & security audit
- **Encryption at rest:** `EncryptionService` (AES-256-GCM) encrypts stored
  secrets — integration credentials, OAuth tokens, API keys — before they are
  written to MySQL. Fresh random IV per encryption; GCM auth tag detects any
  tampering; the master key (`DATA_ENCRYPTION_KEY`) lives only in the secret
  store, never in the database or source.
- **Security audit log:** `SecurityEventService` records auth failures, rate-limit
  blocks, injection attempts, tenant violations, rejected webhooks/uploads, and
  decryption failures to the MySQL `security_events` table. Writes never throw
  into the request path, feed the metrics/alerting engine, and support
  investigation via `recentCritical()`.

## How the layers interact
A request crosses Layer 1 (edge) → Layer 2 (authn) → Layer 3 (authz) →
Layer 4 (validation) before any handler runs; any data it stores or reads is
protected by Layer 5. A control that blocks a request also emits a security
event, so blocked attempts are visible, alertable, and retained in MySQL.

## Operational rules
- Rotate `DATA_ENCRYPTION_KEY` and `JWT_SECRET` per the incident runbook on any
  suspected exposure (rotating the JWT secret invalidates all tokens).
- Secrets never enter source or images (gitleaks CI gate; `.dockerignore`).
- Review `security_events` (critical) regularly; wire the alerting engine to
  on-call.
