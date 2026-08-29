\# VEPARI AI — README



\*\*Repository:\*\* `Vepari AI`  

\*\*Product:\*\* Vepari AI  

\*\*Platform:\*\* Android-first React Native application  

\*\*Future Platform:\*\* iOS  

\*\*Business Scope:\*\* Micro → Small → Medium → Enterprise  

\*\*Languages:\*\* 23 Indian languages  

\*\*AI:\*\* Vepari AI OS + Sarvam AI  

\*\*Architecture:\*\* Local-first · Offline-first · Cloud-synchronized · Multi-device



\---



\# 1. Welcome to Vepari AI



Vepari AI is an AI-powered business operating system designed for \*\*Indian MSMEs\*\*, from micro businesses through small, medium and enterprise-scale organizations.



This repository contains not only the application source code, but also the \*\*complete product, design, technical, AI, database and implementation specifications\*\*.



The repository should be treated as the engineering source of truth.



```text

Product Idea

&#x20;   ↓

PRD

&#x20;   ↓

TRD

&#x20;   ↓

App Flow

&#x20;   ↓

UI/UX

&#x20;   ↓

Frontend

&#x20;   ↓

Backend/API

&#x20;   ↓

Database/Cloud

&#x20;   ↓

AI OS

&#x20;   ↓

Implementation Plan

&#x20;   ↓

Source Code

```



\---



\# 2. IMPORTANT: HOW TO READ THIS REPOSITORY



Do \*\*not\*\* start by opening random source files.



Use this order:



```text

1\. README.md

&#x20;       ↓

2\. PRD.md

&#x20;       ↓

3\. TRD.md

&#x20;       ↓

4\. APP\_FLOW.md

&#x20;       ↓

5\. UI\_UX.md

&#x20;       ↓

6\. FRONTEND.md

&#x20;       ↓

7\. BACKEND\_API.md

&#x20;       ↓

8\. DATABASE\_STORAGE\_MEMORY\_CLOUD.md

&#x20;       ↓

9\. AI\_OS.md

&#x20;       ↓

10\. IMPLEMENTATION\_PLAN.md

&#x20;       ↓

11\. Source code

```



This gives a developer the full picture before changing implementation.



\---



\# 3. MASTER DOCUMENTS



The `docs/` directory contains the primary Vepari AI specifications.



```text

docs/

├── PRD.md

├── TRD.md

├── APP\_FLOW.md

├── UI\_UX.md

├── FRONTEND.md

├── BACKEND\_API.md

├── DATABASE\_STORAGE\_MEMORY\_CLOUD.md

├── AI\_OS.md

└── IMPLEMENTATION\_PLAN.md

```



\---



\# 4. PRD — PRODUCT REQUIREMENTS DOCUMENT



\### File



```text

docs/PRD.md

```



\### Purpose



Defines \*\*what Vepari AI is supposed to do\*\*.



It is the primary product requirements document.



\### Contains



\- Product vision

\- Problems being solved

\- Target users

\- Micro business requirements

\- Small business requirements

\- Medium business requirements

\- Enterprise requirements

\- MSME workflows

\- Product modules

\- Core features

\- AI capabilities

\- Business operations

\- User roles

\- Language requirements

\- Business requirements

\- Product requirements

\- Future expansion



\### Use this when



You need to answer:



> \*\*"What should Vepari AI do?"\*\*



Do not use the PRD to determine implementation details unless the technical documents do not cover them.



\---



\# 5. TRD — TECHNICAL REQUIREMENTS DOCUMENT



\### File



```text

docs/TRD.md

```



\### Purpose



Defines \*\*how the product should technically work\*\*.



\### Contains



\- System architecture

\- Mobile architecture

\- Backend architecture

\- API architecture

\- Database architecture

\- AI architecture

\- Security

\- Authentication

\- Authorization

\- Storage

\- Sync

\- Cloud infrastructure

\- Integrations

\- Scalability

\- Reliability

\- Technical constraints



\### Use this when



You need to answer:



> \*\*"How should Vepari AI technically be built?"\*\*



\---



\# 6. APP FLOW DOCUMENT



\### File



```text

docs/APP\_FLOW.md

```



\### Purpose



Defines how users move through the application.



\### Contains



\- Application launch

\- Security flow

\- Owner authentication

\- AI OS entrance

\- Main navigation

\- Screen-to-screen navigation

\- Business workflows

\- AI workflows

\- Forms

\- Actions

\- Confirmation flows

\- Error flows

\- Offline flows

\- Notification flows

\- Connection flows



\### Use this when



You need to answer:



> \*\*"Where does the user go next?"\*\*



\---



\# 7. UI/UX DOCUMENT



\### File



```text

docs/UI\_UX.md

```



\### Purpose



Defines the complete visual and interaction system.



\### Contains



\- Official Vepari AI color palette

\- Official typography

\- \*\*Lora as the main English font\*\*

\- Indian-language font handling

\- 23-language UI requirements

\- Layout system

\- Spacing

\- Components

\- Buttons

\- Cards

\- Inputs

\- Navigation

\- Headers

\- Footers

\- Icons

\- Logos

\- Animations

\- Motion

\- Physics

\- AI OS interface

\- Responsive behavior

\- Accessibility

\- Screen specifications

\- UX states



\### Use this when



You need to answer:



> \*\*"How should this screen look and behave?"\*\*



\---



\# 8. FRONTEND DOCUMENT



\### File



```text

docs/FRONTEND.md

```



\### Purpose



Translates the UI/UX into frontend engineering requirements.



\### Contains



\- React Native architecture

\- TypeScript

\- Component architecture

\- Design system implementation

\- State management

\- Navigation

\- Forms

\- Local data

\- API integration

\- Offline UX

\- Sync UX

\- AI OS components

\- Animations

\- Accessibility

\- Multilingual implementation

\- Frontend testing



\### Use this when



You need to answer:



> \*\*"How do I implement this UI in React Native?"\*\*



\---



\# 9. BACKEND + API DOCUMENT



\### File



```text

docs/BACKEND\_API.md

```



\### Purpose



Defines the server-side application and API contract.



\### Contains



\- Backend architecture

\- API versioning

\- Authentication

\- Authorization

\- RBAC

\- Business services

\- Domain services

\- API endpoints

\- Validation

\- Error handling

\- Pagination

\- Search

\- Transactions

\- Events

\- Jobs

\- Notifications

\- AI gateway

\- Integrations

\- Webhooks

\- Audit

\- Logging



\### Use this when



You need to answer:



> \*\*"What API does the frontend call and what happens on the server?"\*\*



\---



\# 10. DATABASE / STORAGE / MEMORY / CLOUD DOCUMENT



\### File



```text

docs/DATABASE\_STORAGE\_MEMORY\_CLOUD.md

```



\### Purpose



Defines where Vepari AI stores everything.



\### Contains



\- Cloud database

\- SQLite

\- Secure device storage

\- Object storage

\- Business data

\- Financial data

\- Documents

\- AI memory

\- AI context

\- Sync metadata

\- Audit logs

\- Technical logs

\- Events

\- Backups

\- Recovery

\- Retention

\- Security

\- Multi-device synchronization

\- Offline architecture

\- Cloud architecture



\### Use this when



You need to answer:



> \*\*"Where is this data stored, synchronized and protected?"\*\*



\---



\# 11. AI OS DOCUMENT



\### File



```text

docs/AI\_OS.md

```



\### Purpose



Defines the \*\*Vepari AI OS\*\*, which is the intelligent operating layer of the application.



It is \*\*not simply a chatbot\*\*.



\### Contains



\- AI OS philosophy

\- Security-gated entrance

\- AI OS animation

\- Jarvis-inspired interaction model

\- Business briefing

\- Away-time activity summary

\- Alerts

\- Business resources

\- AI context

\- Memory

\- Voice

\- Text interaction

\- Insights

\- Recommendations

\- AI navigation

\- AI actions

\- Approval flows

\- AI automation

\- Sarvam integration

\- AI security

\- AI failure handling

\- AI observability



\### Critical flow



```text

App opens

&#x20;   ↓

Owner security

&#x20;   ↓

Security completed

&#x20;   ↓

AI OS animation

&#x20;   ↓

AI OS appears

&#x20;   ↓

Business briefing

&#x20;   ↓

Alerts + resources

&#x20;   ↓

Insights

&#x20;   ↓

Actions

```



\### Use this when



You need to answer:



> \*\*"How should Vepari AI behave intelligently?"\*\*



\---



\# 12. IMPLEMENTATION PLAN



\### File



```text

docs/IMPLEMENTATION\_PLAN.md

```



\### Purpose



Defines the order in which the entire product should be built.



\### Contains



\- Development phases

\- Dependencies

\- Repository setup

\- Environment setup

\- Database implementation

\- Backend implementation

\- Frontend implementation

\- Local storage

\- Sync

\- AI

\- AI OS

\- Integrations

\- Security

\- Testing

\- CI/CD

\- Staging

\- Production

\- Android release

\- Future iOS expansion

\- Team development model



\### Use this when



You need to answer:



> \*\*"What should we build next?"\*\*



\---



\# 13. DESIGN DIRECTORY



```text

design/

```



This directory contains the visual source material for the product.



Recommended structure:



```text

design/

├── colors/

├── typography/

├── icons/

├── logos/

├── ai-os/

├── components/

├── screens/

└── reference/

```



\---



\# 14. COLORS



```text

design/colors/

```



Contains the official Vepari AI color definitions.



Use these instead of inventing new colors.



\### Rule



> \*\*Never introduce arbitrary colors into production UI when an official design token already exists.\*\*



\---



\# 15. TYPOGRAPHY



```text

design/typography/

```



Contains:



\- official typography

\- Lora configuration

\- font weights

\- size hierarchy

\- Indian-language fallback strategy

\- typography examples



\### Important



\*\*Lora is the primary English font for Vepari AI.\*\*



For Indian scripts, use the approved compatible font/fallback system defined by the design specification.



\---



\# 16. ICONS



```text

design/icons/

```



Contains the official icon assets/system.



Icons should be reused rather than recreated inconsistently.



\---



\# 17. LOGOS



```text

design/logos/

```



Contains:



\- Vepari AI logo

\- app icon

\- logo variants

\- light/dark variants

\- required brand assets



Do not alter the official logo without a design decision.



\---



\# 18. AI OS DESIGN ASSETS



```text

design/ai-os/

```



Contains visual references/assets related to the Vepari AI OS.



This includes the established:



\- Jarvis-inspired interface language

\- AI orb

\- glow

\- panels

\- motion references

\- AI OS components

\- interaction references



The visual inspiration is used as a \*\*design language\*\*, not as a copy of another product.



\---



\# 19. COMPONENT DESIGNS



```text

design/components/

```



Contains visual references for reusable components.



Examples:



```text

Buttons

Cards

Inputs

Navigation

Tabs

Bottom sheets

Dialogs

AI components

Charts

Lists

```



\---



\# 20. SCREEN DESIGNS



```text

design/screens/

```



Contains references/designs for complete application screens.



\---



\# 21. REFERENCE DIRECTORY



```text

design/reference/

```



Contains source/reference material used while designing Vepari AI.



Reference files should not automatically be treated as production assets.



\---



\# 22. MOBILE APPLICATION



```text

apps/mobile/

```



This is the Android-first React Native application.



Conceptually:



```text

apps/mobile/

├── src/

├── assets/

├── components/

├── screens/

├── navigation/

├── state/

├── database/

├── sync/

├── services/

└── ...

```



The exact structure may evolve during implementation.



\---



\# 23. MOBILE RESPONSIBILITIES



The mobile application handles:



\- UI

\- navigation

\- local state

\- SQLite

\- secure storage

\- offline experience

\- sync client

\- AI OS presentation

\- voice interaction

\- API communication

\- notifications

\- device capabilities



\---



\# 24. PACKAGES



```text

packages/

```



Shared functionality should live here where appropriate.



Recommended:



```text

packages/

├── design-system/

├── shared-types/

├── validation/

├── api-client/

└── business-logic/

```



\---



\# 25. DESIGN SYSTEM PACKAGE



```text

packages/design-system/

```



Contains reusable Vepari AI UI primitives.



Examples:



```text

Button

Card

Input

Typography

Colors

AI components

```



\---



\# 26. SHARED TYPES



```text

packages/shared-types/

```



Contains shared TypeScript types/interfaces used by frontend and backend where appropriate.



This reduces mismatched API contracts.



\---



\# 27. VALIDATION



```text

packages/validation/

```



Contains reusable validation definitions where appropriate.



\---



\# 28. API CLIENT



```text

packages/api-client/

```



Contains the typed client used by the mobile application to communicate with the backend.



\---



\# 29. BUSINESS LOGIC



```text

packages/business-logic/

```



Only genuinely platform-independent logic should be placed here.



Do not blindly move server-side domain rules into the mobile application.



\---



\# 30. BACKEND



```text

backend/

```



Contains the server application.



Conceptually:



```text

backend/

├── api/

├── auth/

├── domain/

├── services/

├── database/

├── ai/

├── integrations/

├── jobs/

├── events/

├── notifications/

├── audit/

└── ...

```



\---



\# 31. BACKEND RESPONSIBILITIES



The backend owns:



\- authorization

\- business rules

\- authoritative transactions

\- cloud data

\- AI gateway

\- integrations

\- auditing

\- background jobs

\- notifications

\- synchronization

\- security enforcement



\---



\# 32. DATABASE DIRECTORY



```text

database/

```



Contains database implementation resources.



```text

database/

├── migrations/

├── seeds/

└── schemas/

```



\---



\# 33. MIGRATIONS



```text

database/migrations/

```



Contains database schema changes.



Every production schema change should have a migration.



\---



\# 34. SEEDS



```text

database/seeds/

```



Contains safe development/staging seed data.



Never place real production business data here.



\---



\# 35. SCHEMAS



```text

database/schemas/

```



Contains schema definitions/reference material where applicable.



\---



\# 36. TESTS



```text

tests/

```



Contains automated tests.



Recommended categories:



```text

tests/

├── unit/

├── integration/

├── api/

├── database/

├── sync/

├── ai/

├── security/

└── e2e/

```



\---



\# 37. UNIT TESTS



Test individual functions/components/services.



\---



\# 38. INTEGRATION TESTS



Test communication between subsystems.



Examples:



```text

API → Database

API → Storage

AI → Context

Sync → API

```



\---



\# 39. API TESTS



Every important API should test:



```text

Success

Validation

Authentication

Authorization

Tenant isolation

Failure

```



\---



\# 40. DATABASE TESTS



Test:



\- migrations

\- constraints

\- transactions

\- concurrency

\- tenant isolation

\- financial integrity



\---



\# 41. SYNC TESTS



Test:



```text

Offline

Online

Retry

Duplicate

Conflict

Multi-device

Network failure

```



\---



\# 42. AI TESTS



Test:



\- context retrieval

\- memory isolation

\- AI outputs

\- actions

\- authorization

\- prompt injection defenses

\- provider failures



\---



\# 43. SECURITY TESTS



Test:



\- unauthorized requests

\- role escalation

\- cross-business access

\- cross-branch access

\- token handling

\- file access

\- AI authorization



\---



\# 44. E2E TESTS



Test complete workflows:



```text

Login

&#x20;↓

Business

&#x20;↓

Product

&#x20;↓

Inventory

&#x20;↓

Sale

&#x20;↓

Payment

&#x20;↓

AI insight

```



\---



\# 45. SCRIPTS



```text

scripts/

```



Contains developer/automation utilities.



Examples:



```text

Database setup

Seed generation

Build helpers

Validation

Release scripts

```



\---



\# 46. GITHUB ACTIONS



```text

.github/workflows/

```



Contains CI/CD workflows.



The pipeline should automatically validate code before merging where configured.



\---



\# 47. README USAGE GUIDE



When a developer joins the project:



\### Step 1



Read:



```text

README.md

```



\### Step 2



Read:



```text

docs/PRD.md

docs/TRD.md

```



\### Step 3



Read the relevant workflow:



```text

docs/APP\_FLOW.md

```



\### Step 4



Read the relevant design:



```text

docs/UI\_UX.md

```



\### Step 5



Read the relevant implementation specification:



```text

docs/FRONTEND.md

docs/BACKEND\_API.md

docs/DATABASE\_STORAGE\_MEMORY\_CLOUD.md

```



\### Step 6



For AI work:



```text

docs/AI\_OS.md

```



\### Step 7



For implementation order:



```text

docs/IMPLEMENTATION\_PLAN.md

```



\---



\# 48. HOW TO IMPLEMENT A NEW FEATURE



Never start directly from the UI.



Use:



```text

PRD

&#x20;↓

App Flow

&#x20;↓

UI/UX

&#x20;↓

Frontend

&#x20;↓

Backend/API

&#x20;↓

Database

&#x20;↓

AI/Sync if required

&#x20;↓

Tests

```



\---



\# 49. EXAMPLE: NEW INVENTORY FEATURE



Read:



```text

PRD

↓

APP\_FLOW

↓

UI\_UX

↓

FRONTEND

↓

BACKEND\_API

↓

DATABASE\_STORAGE\_MEMORY\_CLOUD

↓

IMPLEMENTATION\_PLAN

```



Then implement:



```text

Database

&#x20;↓

Backend

&#x20;↓

API

&#x20;↓

Local SQLite

&#x20;↓

Sync

&#x20;↓

Frontend

&#x20;↓

Tests

```



\---



\# 50. EXAMPLE: NEW AI FEATURE



Read:



```text

PRD

↓

AI\_OS

↓

APP\_FLOW

↓

UI\_UX

↓

BACKEND\_API

↓

DATABASE\_STORAGE\_MEMORY\_CLOUD

```



Then implement:



```text

AI Context

&#x20;↓

AI Gateway

&#x20;↓

Provider

&#x20;↓

Backend Action

&#x20;↓

Audit

&#x20;↓

AI OS UI

&#x20;↓

Tests

```



\---



\# 51. EXAMPLE: NEW SCREEN



Read:



```text

APP\_FLOW

↓

UI\_UX

↓

FRONTEND

```



Then:



```text

Component

&#x20;↓

Screen

&#x20;↓

Navigation

&#x20;↓

State

&#x20;↓

API

&#x20;↓

Loading

&#x20;↓

Error

&#x20;↓

Offline

&#x20;↓

Accessibility

```



\---



\# 52. EXAMPLE: NEW DATABASE ENTITY



Read:



```text

TRD

↓

DATABASE\_STORAGE\_MEMORY\_CLOUD

↓

BACKEND\_API

```



Then:



```text

Schema

&#x20;↓

Migration

&#x20;↓

Constraints

&#x20;↓

Indexes

&#x20;↓

Repository

&#x20;↓

Domain service

&#x20;↓

API

&#x20;↓

Tests

```



\---



\# 53. EXAMPLE: NEW INTEGRATION



Read:



```text

PRD

↓

TRD

↓

BACKEND\_API

↓

DATABASE\_STORAGE\_MEMORY\_CLOUD

```



Then:



```text

Connection

&#x20;↓

Credential handling

&#x20;↓

Provider adapter

&#x20;↓

OAuth/API

&#x20;↓

Webhook

&#x20;↓

Normalization

&#x20;↓

Sync

&#x20;↓

Audit

&#x20;↓

UI

```



\---



\# 54. HOW AI CODE ASSISTANTS SHOULD USE THIS REPOSITORY



Claude Code or another coding assistant should first inspect:



```text

README.md

```



Then relevant documents under:



```text

docs/

```



before making architectural changes.



For a task, provide the assistant with:



```text

Task

\+

Relevant document

\+

Relevant source directory

```



\---



\# 55. AI CODING RULE



AI coding tools must \*\*not invent product requirements\*\* when the master documents already define them.



If implementation and specification conflict:



```text

STOP

&#x20;↓

Identify conflict

&#x20;↓

Explain conflict

&#x20;↓

Resolve deliberately

&#x20;↓

Update documentation if required

&#x20;↓

Implement

```



\---



\# 56. GITHUB AS SOURCE OF TRUTH



The repository is the source of truth for:



```text

Code

Architecture

Implementation documentation

Design assets committed to repository

Database migrations

Tests

CI/CD

```



\---



\# 57. CLAUDE CODE AS DEVELOPMENT ENVIRONMENT



Claude Code sessions are \*\*not\*\* the source of truth.



They are development environments.



The shared state is:



```text

GitHub Repository

```



This is important because six team members may work from different computers.



\---



\# 58. MULTI-DEVICE WORKFLOW



Each developer:



```text

GitHub

&#x20;↓

Pull latest

&#x20;↓

Create branch

&#x20;↓

Claude Code

&#x20;↓

Implement

&#x20;↓

Test

&#x20;↓

Commit

&#x20;↓

Push

&#x20;↓

Pull Request

&#x20;↓

Review

&#x20;↓

Merge

```



\---



\# 59. DO NOT STORE SECRETS IN GITHUB



Never commit:



```text

API keys

Passwords

OAuth secrets

Database credentials

Private tokens

Signing keys

Production secrets

```



Use environment/secrets management.



\---



\# 60. DO NOT TREAT REFERENCE FILES AS CODE



A design image or research document is not automatically an implementation specification.



Determine its role:



```text

Reference

Design

Requirement

Asset

Documentation

Code

```



before using it.



\---



\# 61. DOCUMENT HIERARCHY



When making decisions, use this hierarchy:



```text

Product requirement

&#x20;       ↓

Technical architecture

&#x20;       ↓

App flow

&#x20;       ↓

UI/UX

&#x20;       ↓

Implementation specification

&#x20;       ↓

Actual code

```



If code differs from the documented intended behavior, determine whether:



1\. the code is wrong, or

2\. the documentation needs an intentional update.



\---



\# 62. OFFLINE-FIRST RULE



Do not implement the application as:



```text

UI

&#x20;↓

API only

```



The intended architecture is:



```text

UI

&#x20;↓

Repository

&#x20;↓

Local SQLite

&#x20;↓

Sync

&#x20;↓

Cloud

```



where the operation supports offline behavior.



\---



\# 63. CLOUD AUTHORITY RULE



For shared authoritative business state:



```text

Cloud Database

```



is the final authority.



\---



\# 64. MEMORY RULE



AI memory is contextual information.



It is \*\*not\*\* authoritative business truth.



```text

Database fact > AI memory

```



\---



\# 65. AI ACTION RULE



AI cannot directly modify the database.



Correct flow:



```text

AI

&#x20;↓

Action proposal

&#x20;↓

User approval where required

&#x20;↓

API

&#x20;↓

Authorization

&#x20;↓

Domain service

&#x20;↓

Database

&#x20;↓

Audit

```



\---



\# 66. FINANCIAL DATA RULE



Financial operations require strict server-side validation and transactional integrity.



Never rely solely on client-side calculations for authoritative financial records.



\---



\# 67. MULTILINGUAL RULE



Every new feature must consider all 23 supported Indian languages.



Check:



```text

Text length

Font support

Translation

Layout

Overflow

Voice where supported

Numbers

Dates

Currency

Accessibility

```



\---



\# 68. DESIGN RULE



Always use the official Vepari AI:



```text

Color system

Typography

Components

Icons

Logo

Motion language

AI OS language

```



Do not introduce a separate visual identity for individual modules.



\---



\# 69. AI OS RULE



The AI OS is the intelligent operating layer across Vepari AI.



It should be able to:



```text

Understand

Retrieve

Explain

Navigate

Recommend

Act

Automate

```



but always within authorization and safety boundaries.



\---



\# 70. PRODUCTION COMPLETION RULE



A feature is not complete simply because:



```text

"The screen works."

```



Completion requires the relevant:



```text

UI

UX

Frontend

API

Backend

Database

Local storage

Sync

Security

Tests

Audit

Observability

Documentation

```



\---



\# 71. DEVELOPMENT STATUS



Use:



```text

PLANNED

IN PROGRESS

BLOCKED

IN REVIEW

TESTING

STAGING

COMPLETED

```



Do not mark features as completed until their actual implementation and verification are finished.



\---



\# 72. QUICK REFERENCE



| Question | Read |

|---|---|

| What is Vepari AI? | `PRD.md` |

| What should it do? | `PRD.md` |

| How is it architected? | `TRD.md` |

| How does the user move? | `APP\_FLOW.md` |

| How does it look? | `UI\_UX.md` |

| How do I build the mobile UI? | `FRONTEND.md` |

| What API do I use? | `BACKEND\_API.md` |

| Where is data stored? | `DATABASE\_STORAGE\_MEMORY\_CLOUD.md` |

| How does AI OS work? | `AI\_OS.md` |

| What should we build first? | `IMPLEMENTATION\_PLAN.md` |

| Where are visual assets? | `design/` |

| Where is Android code? | `apps/mobile/` |

| Where is backend code? | `backend/` |

| Where are migrations? | `database/migrations/` |

| Where are tests? | `tests/` |

| Where is CI/CD? | `.github/workflows/` |



\---



\# 73. THE GOLDEN RULE



Before changing anything in Vepari AI:



```text

STOP

&#x20;↓

UNDERSTAND

&#x20;↓

READ THE RELEVANT DOCUMENT

&#x20;↓

CHECK EXISTING CODE

&#x20;↓

PLAN

&#x20;↓

IMPLEMENT

&#x20;↓

TEST

&#x20;↓

DOCUMENT

&#x20;↓

COMMIT

```



\*\*Never blindly code first.\*\*



\---



\# 74. VEPARI AI MASTER ARCHITECTURE



```text

&#x20;                        VEPARI AI

&#x20;                           │

&#x20;                 ┌─────────┴─────────┐

&#x20;                 │                   │

&#x20;             PRODUCT              DESIGN

&#x20;                 │                   │

&#x20;                PRD                UI/UX

&#x20;                 │                   │

&#x20;                TRD             Design System

&#x20;                 │                   │

&#x20;            App Flow                  │

&#x20;                 └─────────┬─────────┘

&#x20;                           ↓

&#x20;                      IMPLEMENTATION

&#x20;                           │

&#x20;         ┌─────────────────┼─────────────────┐

&#x20;         ↓                 ↓                 ↓

&#x20;      MOBILE             BACKEND           CLOUD

&#x20;         │                 │                 │

&#x20;     React Native          API            Database

&#x20;     SQLite             Services         Storage

&#x20;     Secure Store       AI Gateway       Security

&#x20;         │                 │                 │

&#x20;         └─────────────────┼─────────────────┘

&#x20;                           ↓

&#x20;                          SYNC

&#x20;                           │

&#x20;                           ↓

&#x20;                        AI OS

&#x20;                           │

&#x20;                     ┌─────┴─────┐

&#x20;                     ↓           ↓

&#x20;                  Memory      Sarvam

&#x20;                     │

&#x20;                     ↓

&#x20;              Intelligence

&#x20;                     │

&#x20;         ┌───────────┼────────────┐

&#x20;         ↓           ↓            ↓

&#x20;     Insights     Actions     Automation

&#x20;         │           │            │

&#x20;         └───────────┼────────────┘

&#x20;                     ↓

&#x20;             CONNECTION PORTFOLIO

&#x20;                     │

&#x20;                     ↓

&#x20;            EXTERNAL SERVICES

```



\---



\# 75. FINAL RULE FOR ALL SIX TEAM MEMBERS



Every team member should be able to understand the project by starting with this README and then following the relevant master document.



The repository should therefore remain:



\*\*Readable → Structured → Documented → Testable → Secure → Reproducible.\*\*



And the ultimate relationship is:



```text

&#x20;               README

&#x20;                 ↓

&#x20;         MASTER DOCUMENTS

&#x20;                 ↓

&#x20;            DESIGN SYSTEM

&#x20;                 ↓

&#x20;             SOURCE CODE

&#x20;                 ↓

&#x20;             DATABASE

&#x20;                 ↓

&#x20;                APIs

&#x20;                 ↓

&#x20;              AI OS

&#x20;                 ↓

&#x20;            INTEGRATIONS

&#x20;                 ↓

&#x20;               TESTS

&#x20;                 ↓

&#x20;            PRODUCTION

```



\*\*This README is the entry point for the entire Vepari AI repository.\*\*

