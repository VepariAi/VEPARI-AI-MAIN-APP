# Backend Deployment & Release Runbook

Covers the containerized backend deployment, database migration process,
environment separation, release-candidate flow, and rollback. (Prompts
220–224, 227, 229.)

## 1. Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| Production image | `Dockerfile` (repo root) | Multi-stage build → slim `node:22-slim` runtime, non-root `vepari` user, `/health` HEALTHCHECK |
| Local stack | `docker-compose.yml` | Postgres 16 + backend for local/integration use |
| Ignore rules | `.dockerignore` | Keeps secrets, `node_modules`, tests, mobile out of the build context |

Build and run locally:

```bash
docker build -t vepari-backend .
docker compose up --build          # brings up Postgres + backend, runs migrations
```

## 2. Environment separation (Prompt 220)

Three isolated environments; **no shared databases or secrets** across them.

| Env | Branch | Database | Secrets source |
|---|---|---|---|
| development | feature branches | local Postgres / dev instance | `backend/.env` (git-ignored) |
| staging | `main` | staging Postgres | platform secret store |
| production | tagged release | production Postgres | platform secret store |

Required variables are documented in `backend/.env.example`. Secrets are
**never** committed; the CI secret-scan (gitleaks) gates every push.

## 3. Database migration deployment (Prompt 222)

Prisma migrations are the single source of truth for schema. The deploy
process applies pending migrations **before** the new app version serves
traffic (see `docker-compose.yml` `command`).

```bash
# CI/CD deploy step (never run `migrate dev` in staging/production):
npx prisma migrate deploy --schema backend/prisma/schema.prisma
```

Rules:
- **Forward-only** in staging/production. Never edit an applied migration; add a new one.
- Additive changes (new nullable column, new table) deploy safely alongside the old app version.
- Destructive changes (drop/rename column) require the expand → migrate → contract pattern across two releases so an in-flight old version never hits a missing column.
- Every migration is reviewed for lock impact on large tables before merge.

## 4. Release candidate process (Prompt 224)

1. All CI checks green on `main` (secret-scan → typecheck → lint → test → build).
2. Cut a release candidate tag: `vX.Y.Z-rc.N`.
3. Deploy the RC image to **staging**; run `migrate deploy` first.
4. Run the golden-flow regression suite (Prompt 195) against staging.
5. Smoke-check `/health`, `/health/ready`, `/metrics/alerts` (no firing critical alerts).
6. Promote: retag as `vX.Y.Z` and deploy to production.

## 5. CI/CD pipeline (Prompt 221)

`.github/workflows/ci.yml` runs on every push/PR:

```
secret-scan → typecheck → lint → test → build
```

The `build` job compiles the shared packages + backend and asserts
`backend/dist/main.js` exists, so a broken production build fails CI rather
than at deploy time. The shared packages (`@vepari/types`,
`@vepari/validation`) emit real JS to `dist/` — the runtime `node dist/main`
resolves them from compiled output, not TypeScript source.

## 6. Rollback procedure (Prompt 227)

Application rollback is fast; schema rollback is deliberate.

1. **App rollback:** redeploy the previous known-good image tag. Because the
   image is immutable and versioned, this is a single retag/redeploy.
2. **Schema:** do **not** auto-revert migrations. If a migration caused the
   incident, roll the app back to a version compatible with the current
   schema (the expand/contract pattern guarantees the previous version still
   works against the newer additive schema), then ship a corrective forward
   migration.
3. Confirm recovery: `/health/ready` returns `ok`, `/metrics/alerts` shows no
   firing critical alerts, error-rate counter stops climbing.

## 7. Go-live checklist (Prompt 229)

- [ ] All secrets set in the production secret store; none in the image.
- [ ] `DATABASE_URL` points at production Postgres; connection verified via `/health/ready`.
- [ ] `ALLOWED_ORIGINS` restricted to real production origins.
- [ ] `migrate deploy` applied; `migrate status` clean.
- [ ] `/metrics` scrape target registered; alert rules wired to on-call.
- [ ] Rollback tag identified and reachable.
- [ ] Backup/restore verified (see `disaster-recovery.md`).
