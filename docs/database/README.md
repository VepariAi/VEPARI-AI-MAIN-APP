# docs/database

Database schema and data architecture documentation for Vepari AI.

**Expected contents (populated during Phase 9–10 and onward):**
- PostgreSQL schema (cloud — authoritative)
- SQLite schema (on-device — local-first)
- Sync queue schema (operation_id, device_id, entity, base_version, status, retry_count)
- Data classification matrix (business fact / event / preference / derived context)
- Migration scripts and versioning policy
- Data isolation model (per-business)
- Audit trail design
- GST data model (see `docs/research/accounting-compliance.md` for compliance grounding)

**Locked constraints (DL-002):**
- Core transactional data: syncs to cloud PostgreSQL by default
- AI/analytics signals: local-only unless user explicitly consents
- Database is authoritative — AI memory is always secondary to database records

**Status:** Directory established. Population begins at Phase 9 (React Native + database foundation).

**Governing reference:** `Database, Storage.txt`; `TRD.txt §2`; `docs/decisions/decision-log.md` DL-002
