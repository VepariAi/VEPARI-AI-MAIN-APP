# Railway Deployment (MySQL)

Deploying the Vepari AI backend to Railway with a MySQL database. (Batch 5, DL-011.)

## Overview

- **Build:** Railway builds the repo-root `Dockerfile` (multi-stage, non-root
  runtime) — configured in `railway.json` (`builder: DOCKERFILE`).
- **Database:** Railway's **MySQL** plugin provides a managed MySQL 8 instance.
- **Migrations:** the deploy `startCommand` runs `prisma migrate deploy` before
  `node dist/main`, so the schema is applied before traffic is served.
- **Health:** Railway polls `/health`; the container also has its own HEALTHCHECK.

## One-time setup

1. Create a Railway project and add the **MySQL** database plugin.
2. Add the backend service from this GitHub repo (Railway detects `railway.json`
   and builds the `Dockerfile`).
3. Set the service variables (Settings → Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Reference the MySQL plugin's connection string. Railway exposes `MYSQL_URL` / `MYSQLHOST` etc.; set `DATABASE_URL` to the `mysql://user:pass@host:port/db` form. |
   | `JWT_SECRET` | `openssl rand -base64 64` |
   | `DATA_ENCRYPTION_KEY` | `openssl rand -hex 32` (exactly 64 hex chars) |
   | `ALLOWED_ORIGINS` | comma-separated production origins |
   | `NODE_ENV` | `production` |
   | AI/SMS provider keys | Sarvam/OpenAI/Anthropic/Twilio, per `backend/.env.example` |

   All secrets live only in Railway's variable store — never in the repo or image.

## Deploy flow

1. Push to the deploy branch → Railway builds the image.
2. On release, the `startCommand` applies pending migrations, then starts the server.
3. Railway routes traffic once `/health` returns 200.

## Migrations

- Forward-only in production; `migrate deploy` never resets data.
- Destructive schema changes follow the expand → migrate → contract pattern
  across two releases (see `backend-deployment.md`).

## Rollback

- Redeploy the previous image/deployment from the Railway dashboard.
- Schema: roll the app back to a version compatible with the current schema
  (additive migrations keep the prior version working), then ship a corrective
  forward migration. See `incident-response.md §261`.

## Notes

- Supabase/PostgreSQL are not used (DL-011) — the database is MySQL 8 only.
- The same image runs under `docker compose` locally against the bundled MySQL
  service, so local and Railway runtimes match.
