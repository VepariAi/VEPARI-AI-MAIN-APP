# docs/api

API specification documentation for Vepari AI.

**Expected contents (populated during Phase 9–10 and onward):**
- REST API reference (`/api/v1/` route inventory)
- Authentication specification (JWT flow)
- AI gateway API contracts (Sarvam AI, provider-agnostic interface)
- WebSocket event contracts
- Error code catalogue
- Rate limit documentation
- API versioning policy

**Locked constraints:**
- Base path: `/api/v1/`
- Auth: JWT (Bearer token)
- Sarvam STT endpoint: `POST https://api.sarvam.ai/speech-to-text` (header: `api-subscription-key`)
- Sarvam TTS endpoint: `POST https://api.sarvam.ai/text-to-speech`
- Sarvam API keys must remain server-side at all times — never in client code or Git

**Status:** Directory established. Population begins at Phase 9 (React Native foundation) and Phase 10 (core MVP implementation).

**Governing reference:** `Backend.txt`; `TRD.txt §Stack`; `docs/decisions/decision-log.md` DL-009
