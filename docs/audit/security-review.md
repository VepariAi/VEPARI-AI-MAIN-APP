# Security Review & Hardening Record

Consolidated record of the security-hardening pass. (Prompts 196–209.)

## 196 — Authentication hardening
- OTP login for Indian phone numbers (E.164). OTP codes expire in 15 minutes (`OtpCode`), single-use.
- JWT access tokens: 15-minute lifetime. Refresh tokens: 90-day lifetime, stored in `RefreshToken`, revocable.
- Refresh tokens are deleted on logout and on account erasure.
- No password storage — the OTP + JWT model removes the largest credential-leak surface.

## 197 — Authorization / RBAC
- `JwtAuthGuard` protects authenticated routes; `BusinessMemberGuard` enforces that the caller is a member of the `:businessId` they address.
- Roles are stored on `BusinessMember`; write-privileged operations check role.

## 198 — Tenant isolation
- Every business-scoped query is filtered by `businessId` derived from the membership guard, never from unvalidated client input.
- Cross-tenant access is structurally impossible on guarded routes: the guard rejects a caller who is not a member before the handler runs.
- Verified by the business-member guard tests and per-module scope tests.

## 199 — Secrets management audit
- **No secrets in source or Git.** CI runs gitleaks as the first, gating job on every push.
- All provider keys (Sarvam, OpenAI, Anthropic), the JWT secret, SMS credentials, and `DATABASE_URL` are read from environment variables only (`backend/.env.example` documents the surface; `.env` is git-ignored).
- The `.dockerignore` excludes `.env*` (except `.env.example`) so secrets never enter an image layer.
- Structured logs redact any field whose key matches password/token/secret/apikey/otp/pin patterns (`redact()`), so secrets cannot leak via logs.

## 200 — Encryption (transit + rest)
- Transit: TLS terminated at the platform edge; `helmet` sets HSTS and security headers; CORS restricted to an explicit origin allowlist.
- Rest: database and backups encrypted at rest by the managed Postgres provider.

## 201 — Rate limiting
- Global `ThrottlerGuard`: 10 req/s burst and 200 req/min sustained per client. Auth/OTP endpoints inherit the strict limits to blunt brute-force.

## 202 — AI security hardening
- Prompt-injection guard (`guardInput`/`guardOutput`) screens user text before it reaches a provider and screens model output for system-prompt/credential leaks.
- All AI provider keys stay server-side; the AI Gateway is the only path to a provider. AI has **no direct database access**.
- Per-call cost/usage tracking bounds runaway-cost exposure (see AI provider outage runbook).

## 203 — File upload security
- `validateUpload()` enforces a size cap (10 MB), an extension allowlist, a declared-MIME allowlist, and a **magic-byte signature** check so a spoofed extension/Content-Type is rejected. Filenames with path components or `..` are rejected.

## 204 — Webhook security
- `verifyWebhookSignature()` verifies an HMAC-SHA256 over `timestamp.rawBody` with a shared secret, using constant-time comparison and a 5-minute freshness window to block replay. The **raw** body is signed (verified pre-parse).

## 205 — Device & session security
- Refresh tokens are per-device and individually revocable; erasure revokes all sessions.
- Mobile stores only non-secret session material; no provider keys ever ship in the app bundle.

## 206 — Data minimization
- The user data export excludes tokens/secrets. Only data required for the product's function is collected (phone for OTP, business records the owner enters).

## 207 — Privacy controls
- `GET /v1/privacy/export` — portable export of the caller's own data.
- `GET /v1/privacy/retention` — the retention policy.
- `DELETE /v1/privacy/account` — right to erasure: PII anonymized, sessions revoked, personal AI memory + voice transcripts deleted; statutory financial records retained without PII linkage.
- User id always comes from the verified JWT — one user can never export/erase another's data.

## 208 — Security review pass
- OWASP Top-10 review: injection (parameterized Prisma + Zod validation), broken auth (JWT + OTP + throttle), sensitive data exposure (redaction + TLS + at-rest encryption), broken access control (membership guard + JWT-derived identity), security misconfiguration (helmet, CORS allowlist, Swagger disabled in prod, robots disallow), SSRF/deserialization (no untrusted deserialization; AI egress gated).

## 209 — See `docs/deployment/incident-response.md`
