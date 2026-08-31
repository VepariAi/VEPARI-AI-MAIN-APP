# docs/architecture

Technical architecture documentation for Vepari AI.

**Expected contents (populated during Phase 1 and onward):**
- System architecture diagram
- Four-engine model (Business Brain, Finance Engine, Growth Engine, Access Engine) — see DL-006
- AI OS state machine documentation
- Voice pipeline architecture
- Sync architecture (local SQLite ↔ cloud PostgreSQL) — see DL-002
- Security architecture
- Provider-agnostic AI gateway design
- React Native module architecture

**Locked decisions that feed this directory:**
- DL-002: Two-tier data authority (core business data syncs to cloud by default; AI/analytics signals consent-based)
- DL-006: Three-layer engine taxonomy (4 architectural + 6 problem-led + 10 pitch icons)

**Status:** Directory established. Population begins at Phase 1 (research and architecture decisions).

**Governing reference:** `TRD.txt`; `Backend.txt`; `AI OS.txt`; `docs/decisions/decision-log.md`
