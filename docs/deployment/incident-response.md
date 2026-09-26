# Incident Response Runbook

Operational responses to production incidents. (Prompts 209, 254–262.)

General principles: **contain first, diagnose second, communicate throughout.**
Every incident gets a correlation-id timeline (logs carry `correlationId`),
a root cause, and a follow-up action to prevent recurrence.

## Severity levels

| Sev | Meaning | Response |
|---|---|---|
| SEV1 | Data loss/corruption, security breach, full outage | Immediate; all hands |
| SEV2 | Major feature down, elevated error rate | Within 30 min |
| SEV3 | Degraded/partial, workaround exists | Next business day |

## 254 — Production outage
1. Confirm scope: `/health`, `/health/ready`, `/metrics/alerts`.
2. Check recent deploys — if the outage followed a deploy, roll back to the previous image tag (see `backend-deployment.md §Rollback`).
3. Check database reachability (`/health/ready` `database` check).
4. If infra (host/network), fail over / restart; if code, roll back.
5. Post-incident: root cause, add an alert or test that would have caught it.

## 255 — Database corruption / data-integrity failure
1. Stop writes to the affected scope if integrity is at risk.
2. Assess blast radius via `AuditLog` (who/what changed).
3. Restore from the most recent verified backup to a staging instance; validate.
4. Reconcile the delta since backup from audit logs where possible.
5. Financial data: never silently overwrite — reconstruct via the journal (immutable transaction records) and reconcile.

## 256 — Sync corruption
1. Identify affected devices/businesses via `SyncCheckpoint`.
2. Freeze sync for the affected scope.
3. Server is authoritative: force-pull server state to the device; re-queue only device mutations proven not yet applied (idempotency keys prevent double-apply).
4. Resolve financial conflicts via the special-case rules (never lose a recorded transaction).

## 257 — Security breach
1. Contain: revoke affected sessions (`RefreshToken` deleteMany), rotate exposed secrets immediately.
2. Preserve evidence: snapshot logs/audit before remediation.
3. Assess data exposure scope; identify affected users.
4. Remediate the vulnerability; deploy the fix.
5. Notify per legal obligation; document timeline.

## 258 — Leaked secret
1. Treat as compromised immediately — rotate the secret at the provider.
2. Invalidate anything signed/issued with it (e.g. rotate `JWT_SECRET` → all tokens invalid, users re-authenticate).
3. Purge the secret from history if committed; the gitleaks gate should have blocked it — investigate why it didn't.
4. Audit for misuse during the exposure window.

## 259 — Unsafe AI action
1. AI actions are proposals requiring explicit user approval before execution — an unsafe action should never auto-apply.
2. If an unsafe proposal pattern is found, disable the offending tool in the tool-calling registry and add a guard/test.
3. Review the prompt-injection guard patterns; add the bypassing signature.

## 260 — AI provider outage / runaway cost
1. Outage: the provider gateway already fails over Anthropic → OpenAI with retry; if all providers are down, AI features degrade gracefully (non-AI flows keep working).
2. Runaway cost: watch `ai_provider_failures_total` and usage counters; the `ai_provider_failures` alert fires on sustained failures. Cap or disable AI via config if cost spikes.

## 261 — Failed deployment / broken migration
1. A broken build fails the CI `build` job before deploy.
2. If a migration half-applied: do not `migrate dev` in prod. Assess `migrate status`, roll the app back to a schema-compatible version, ship a corrective forward migration.

## 262 — Backup failure / disaster recovery
1. Verify backups on a schedule (see `disaster-recovery.md`); a failed backup is a SEV2.
2. On data loss, restore the latest verified backup, then reconcile from `AuditLog`/journal.
