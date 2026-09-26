# Maintenance Processes

Recurring processes that keep the codebase, docs, and dependencies healthy.
(Prompts 263–266.)

## 263 — Decision log maintenance
- Every architecturally significant decision gets an ADR in `docs/decisions/`
  (`DL-###`), with status (PROPOSED / DECIDED / SUPERSEDED), context, decision,
  and consequences.
- The decision index (`docs/decisions/decision-log.md`) lists all ADRs.
- Superseding a decision never deletes the old record — mark it SUPERSEDED and
  link forward, so the history of *why* is preserved.

## 264 — Documentation synchronization
- Docs live beside code in `docs/` and are updated in the **same PR** as the
  change they describe (deployment, security, architecture, audits).
- A change to a public contract (API route, env var, migration) must update the
  relevant doc in that PR; reviewers check for it.
- `CLAUDE.md` is the single source of truth for project conventions; changes to
  conventions update it.

## 265 — Dependency update process
- Cadence: review dependency updates on a regular schedule.
- Security patches (advisories) are prioritized and fast-tracked.
- Process: update → `npm ci` → `npx turbo typecheck lint test build` all green →
  commit the lockfile → PR. Never bump a major version without reading its
  migration notes.
- The CI secret-scan/typecheck/lint/test/build gate protects every update.

## 266 — Technical debt review
- Track debt explicitly (TODO with an owner/issue, or an ADR when structural).
- Review periodically; each cycle picks a small number of highest-leverage items
  (test gaps, in-memory stores that should be persisted, duplicated logic).
- Prefer incremental, test-backed refactors over big rewrites; keep CI green at
  every step.
- Known standing items:
  - Some module stores are in-memory (connections, usage, market-intelligence) —
    migrate to Prisma when their models are added.
  - Expand E2E/integration coverage as flows stabilize.
