# Journey Map — Settings

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `UI-UX.txt §94–104, §159–165, §180`; `App Flow.txt §78, §142–143`

---

## Purpose

This document maps the Settings module journeys:

1. Full Settings tree — all 13 sub-screens and their structure
2. AI memory management
3. Language switching
4. Security settings
5. Account deletion — with the consequence-explanation step (UI-UX §180)
6. Business deletion — distinct from account deletion

---

## Sources

| Source | Sections used |
|--------|---------------|
| `UI-UX.txt` | §94 (Settings tree), §95–104 (each settings sub-screen), §159 (navigation depth), §162 (app state restoration), §163 (AI OS overlay), §164 (AI OS dismissal), §165 (AI OS re-entry), §180 (Data deletion UX) |
| `App Flow.txt` | §78 (Settings flow), §142 (Account deletion flow), §143 (Business deletion flow) |
| `docs/ux/screen-inventory.md` | Canonical screen IDs |
| `docs/ux/journey-ai-conversation.md` | AI memory context |

---

## 1. Settings Tree Overview (`Settings.Settings`)

Entry: More tab → Settings (all roles) / or direct "Settings" button.

**13 sub-screens (UI-UX §94):**

```
Settings
├── 1. Profile
├── 2. Business
├── 3. Language
├── 4. AI
│      └── Memory (Settings.AIMemory)
├── 5. Voice
├── 6. Security
│      └── PIN / Biometrics / Trusted Devices / Sessions / Security Activity
├── 7. Notifications
│      └── Business / AI / Payments / Inventory / System
├── 8. Team
│      └── → Team.Members (same as More → Team)
├── 9. Devices
│      └── Device list → Device detail → Trust / Revoke
├── 10. Connections
│      └── → Connection Portfolio
├── 11. Data
│      └── Import / Export / Storage / Backup / Retention / Deletion
├── 12. Storage
│      └── Local storage used / Cache / Clear cache
└── 13. About
       └── Version / Licenses / Privacy Policy / Contact support
```

**Navigation pattern:** Settings → sub-screen → individual control. Maximum 3 levels deep (UI-UX §159).

**Role visibility:**
- Owner: all 13 sub-screens visible
- Manager: sees Profile, Language, Voice, Security, Notifications (own), Devices (own)
- Sales Staff: sees Profile, Language, Voice, Security (PIN only), Notifications (own)
- Team, Connections, Data, Business: Owner-only

---

## 2. Profile (`Settings.Profile`)

```
Settings.Profile
  ┌────────────────────────────────────────────────┐
  │  Profile                                       │
  │  ─────────────────────────────────────────────  │
  │  [Avatar]  Rajesh Kumar                 [Edit] │
  │                                               │
  │  Phone:      +91 98765 43210            [Edit] │
  │  Email:      rajesh@example.com         [Edit] │
  │  Language:   Hindi                      [→]   │
  │  ─────────────────────────────────────────────  │
  │  Preferences                                  │
  │  Date format:   DD/MM/YYYY              [Edit] │
  │  Currency:      ₹ (INR)                [Edit] │
  │  Fiscal year:   April – March          [Edit] │
  └────────────────────────────────────────────────┘
```

Phone change requires OTP verification. Email change sends a confirmation link.

---

## 3. Business Settings (`Settings.Business`)

```
Settings.Business
  · Business name (editable)
  · Trade name / DBA
  · GSTIN (with verification status)
  · Industry category
  · Business size tier (Micro / Small / Medium / Enterprise)
  · Branches (add, rename, set primary)
  · Locations (physical warehouses / stores)
  · Business preferences:
      - Default GST rate
      - Invoice number format
      - Financial year start month
      - Default payment terms
```

---

## 4. Language Switching (`Settings.Language`)

Language switching affects all UI text, AI responses, and voice I/O simultaneously.

```
Settings → Language
  ↓
Settings.Language
  ┌────────────────────────────────────────────────┐
  │  Language                                      │
  │  ─────────────────────────────────────────────  │
  │  App language (UI text):                       │
  │  ● English                                    │
  │  ○ Hindi (हिंदी)                              │
  │  ○ Telugu (తెలుగు)                            │
  │  ○ Tamil (தமிழ்)                               │
  │  ○ Kannada · Bengali · Marathi · (17 more)    │
  │  ─────────────────────────────────────────────  │
  │  AI response language:                         │
  │    Same as app language     [✓]               │
  │    Different:  [Select →]                     │
  │  ─────────────────────────────────────────────  │
  │  Voice input language:       Hindi             │
  │  Voice output language:      Hindi             │
  │                        (from Voice Settings)  │
  └────────────────────────────────────────────────┘

  Owner selects Hindi:
    ↓
  Preview shown:
    "इस भाषा में ऐप दिखाई देगा — ठीक है?"
    [Apply]    [Cancel]
    ↓
  [Apply] → UI re-renders in Hindi
    · All labels, buttons, menu items → Hindi
    · Numerals: localized (use Devanagari numerals per DL-001 rules if applicable)
    · AI responses in Hindi from next interaction
    · STT: Saaras v3 switches input language to Hindi
    · TTS: Bulbul v3 switches to Hindi voice
```

**Language persistence:** Stored per-user-profile, not per-device. When user logs in on a new device, language preference follows them.

**Incomplete translation handling:** If a UI string is not yet translated into the selected language, it falls back to English gracefully (no blank labels or raw keys).

---

## 5. AI Settings (`Settings.AI`)

```
Settings.AI
  ┌────────────────────────────────────────────────┐
  │  AI                                            │
  │  ─────────────────────────────────────────────  │
  │  Preferences                                   │
  │    Daily briefing:          On / Off    [✓]   │
  │    AI suggestions:          On / Off    [✓]   │
  │    Proactive recommendations:  On / Off  [✓]  │
  │  ─────────────────────────────────────────────  │
  │  Memory                                 [→]   │
  │  Permissions                            [→]   │
  │  Action confirmation level              [→]   │
  │    ROUTINE / SIGNIFICANT / All actions         │
  └────────────────────────────────────────────────┘
```

### 5.1 AI Memory Management (`Settings.AIMemory`)

The AI stores contextual memory to personalize responses. The owner can see, inspect, and delete any stored memory.

```
Settings → AI → Memory
  ↓
Settings.AIMemory
  ┌────────────────────────────────────────────────────┐
  │  AI Memory                         [Clear all]    │
  │  ──────────────────────────────────────────────── │
  │  Stored context that helps me understand          │
  │  your business. You can remove anything.          │
  │  ──────────────────────────────────────────────── │
  │                                                  │
  │  📌 Business context                             │
  │  "You prefer to be addressed as Rajesh, not sir."│
  │  Added: 15 Aug 2026               [Remove]       │
  │                                                  │
  │  📌 User preference                              │
  │  "Preferred reorder threshold: 20 units          │
  │  (corrected by user on 20 Aug 2026)."           │
  │  Added: 20 Aug 2026               [Remove]       │
  │                                                  │
  │  📌 Business event                               │
  │  "Business peak period: Oct–Nov (Diwali)."      │
  │  Source: 2 years of sales data    [Remove]       │
  │                                                  │
  │  📌 Derived insight                              │
  │  "Priya Textiles pays within 8 days on avg."    │
  │  Source: last 12 payments          [Remove]       │
  │                                                  │
  └────────────────────────────────────────────────────┘
```

**Memory types (App Flow §34):**
- User Preference, Business Context, Business Event, Conversation Context, Derived Insight, Temporary Context

**[Remove] on a single memory:**
```
"Remove this memory?
 The AI will no longer use this context until it re-learns it
 from your data.
 [Remove]    [Cancel]"
```

**[Clear all] — DESTRUCTIVE:**
```
"Clear all AI memory?
 The AI will start fresh — no saved preferences, patterns,
 or business context. It will re-learn from your data over time.
 This cannot be undone.
 [Clear all memory]    [Cancel]"
```

---

## 6. Voice Settings (`Settings.Voice`)

```
Settings.Voice
  · Voice language: 23 options (11 full STT+TTS; 12 STT-only)
  · Input language: speech recognition language
  · Output language: TTS response language
  · Voice enable / disable (toggle Voice tab)
  · Wake word: on / off (if implemented)
  · Voice speed: Normal / Slower / Faster
```

For STT-only languages (12 gap languages), the TTS output option is not shown — the AI responds in text only.

---

## 7. Security Settings (`Settings.Security`)

```
Settings.Security
  ┌────────────────────────────────────────────────┐
  │  Security                                      │
  │  ─────────────────────────────────────────────  │
  │  PIN                                           │
  │    Change PIN                           [→]   │
  │    PIN timeout:  Immediate / 1 min / 5 min    │
  │                                               │
  │  Biometrics                                   │
  │    Face ID / Fingerprint:  On / Off     [✓]  │
  │    Biometric enrolled: Yes                    │
  │                                               │
  │  Trusted Devices                              │
  │    This device (trusted)                      │
  │    Tablet – Sanjay (trusted)            [→]  │
  │    [Manage trusted devices →]                 │
  │                                               │
  │  Sessions                                     │
  │    Current session (this device)              │
  │    Session 2 – Tablet · 3 hrs ago       [→]  │
  │    [Sign out all other sessions]              │
  │                                               │
  │  Security Activity                            │
  │    [View recent logins and security events →] │
  └────────────────────────────────────────────────┘
```

### Change PIN flow

```
Settings.Security → Change PIN
  ↓
Enter current PIN (verification)
  ↓
Enter new PIN (4–6 digits)
  ↓
Confirm new PIN
  ↓
PIN changed — "Security updated"
```

---

## 8. Notifications (`Settings.Notifications`)

```
Settings.Notifications
  Category toggles:
    Business alerts (sales, expenses, payments)    [On]
    AI briefing notifications                      [On]
    Payment reminders                              [On]
    Inventory / stock alerts                       [On]
    System (sync failures, updates)               [On]

  Each category:
    [→] for per-notification-type control
    e.g., "Payment overdue — notify me when: [7 days / 3 days / 1 day]"
```

---

## 9. Data Settings — Import, Export, Deletion (`Settings.Data`)

```
Settings.Data
  ├── Import
  │   · Import from CSV / another app
  │   · Field mapping → preview → confirm
  │   · Partial import on error (shows results: Imported / Needs review / Failed)
  │
  ├── Export
  │   · Choose data: Sales / Customers / All
  │   · Format: CSV / Excel / PDF
  │   · Generate → secure file → share via WhatsApp / email / Files
  │
  ├── Storage
  │   · Local storage used: 48 MB
  │   · Cache: 12 MB  [Clear cache]
  │   · Offline data: 36 MB
  │
  ├── Backup (where available)
  │   · Last backup: 2 days ago
  │   · Backup now
  │
  └── Deletion
       → Account deletion (§10 below)
       → Business deletion (§11 below)
```

---

## 10. Account Deletion (`Settings.AccountDeletion`)

Account deletion removes the user's personal account (login, preferences) while the business data may be retained per legal obligations.

**Acceptance criteria requirement (UI-UX §180):** Deletion must be explicit and explain consequences. The consequence-explanation step must appear before confirmation.

### Journey

```
Settings → Data → Deletion → Delete Account
  ↓
App.Security gate (re-authentication required before destructive operations)
  · Enter PIN or biometric — even if session is active
  ↓
Settings.AccountDeletion — Step 1: What happens (Consequence Explanation)

  ┌─────────────────────────────────────────────────────────────┐
  │  Before you delete your account                             │
  │  ─────────────────────────────────────────────────────────  │
  │                                                             │
  │  Deleting your account will:                                │
  │                                                             │
  │  ✗ Remove your login and personal preferences permanently   │
  │  ✗ Sign you out of all devices                             │
  │  ✗ Cancel all active sessions                              │
  │                                                             │
  │  Your business data will NOT be immediately deleted:        │
  │  ✓ Business records, transactions, and customer data        │
  │    are retained as required by applicable law               │
  │    (financial records: 7 years per Indian tax law)          │
  │  ✓ Other team members can continue to access the business   │
  │                                                             │
  │  If you are the sole owner with no other members:           │
  │  → Your business will also be closed and scheduled for      │
  │    deletion after the retention period                      │
  │                                                             │
  │  [Continue to delete]          [Cancel]                    │
  └─────────────────────────────────────────────────────────────┘

  ↓
Step 2: Identity Verification
  "To confirm, enter your phone number registered to this account:"
  [+91 ___________]
  [Confirm]

  Wrong number → error: "Phone number doesn't match. Try again."
  Too many failures → "Contact support to delete your account."

  ↓
Step 3: Final Confirmation (DESTRUCTIVE — two-step)

  ┌─────────────────────────────────────────────────────────────┐
  │  Delete account?                                            │
  │                                                             │
  │  This will permanently remove your Vepari account.         │
  │  This cannot be undone.                                    │
  │                                                             │
  │  [Delete my account]           [Cancel]                    │
  └─────────────────────────────────────────────────────────────┘

  ↓
Controlled deletion process:
  · Account record marked: deletion_scheduled = true, scheduled_at = now
  · Grace period: 30 days (owner can recover by logging in and cancelling)
  · At day 30: personal data purged, business data retained per retention rules
  · All active sessions signed out immediately
  · App returns to: App.Launch (logged out)
  · Email/SMS confirmation: "Your account deletion has been scheduled."
```

---

## 11. Business Deletion (`Settings.BusinessDeletion`)

Business deletion is a separate, more consequential action — it removes the entire business entity and its data (after the retention period). This is distinct from account deletion.

```
Settings → Data → Deletion → Delete Business
  ↓
App.Security gate (re-authentication)
  ↓
Settings.BusinessDeletion — Step 1: Consequence Explanation (UI-UX §180)

  ┌─────────────────────────────────────────────────────────────┐
  │  Before you delete this business                            │
  │  ─────────────────────────────────────────────────────────  │
  │                                                             │
  │  Deleting "[Business Name]" will:                           │
  │                                                             │
  │  ✗ Remove all team members' access permanently             │
  │  ✗ Cancel all pending sync operations                      │
  │  ✗ Schedule deletion of all business data                   │
  │                                                             │
  │  What this means for your data:                             │
  │  · Financial records (transactions, invoices, GST) are     │
  │    retained for 7 years as required by Indian tax law.     │
  │    You can export them before deletion.                    │
  │  · Customer and supplier data, inventory, and settings     │
  │    are deleted after the retention period.                 │
  │                                                             │
  │  GST and legal obligations:                                 │
  │  · Deleting this business does not cancel your GST          │
  │    registration. You must file a cancellation separately   │
  │    with the GST portal.                                    │
  │                                                             │
  │  [Export my data first →]      [Continue to delete]       │
  └─────────────────────────────────────────────────────────────┘

  [Export my data first →] → Settings.Data → Export (owner can download all records)
  then returns to this flow.

  ↓
Step 2: Type the business name to confirm
  "Type the name of your business to confirm:"
  [________________________]
  Required to match exactly: "[Business Name]"
  Case-sensitive verification.

  ↓
Step 3: Final Confirmation (DESTRUCTIVE — two-step)

  ┌─────────────────────────────────────────────────────────────┐
  │  Delete [Business Name]?                                    │
  │                                                             │
  │  This will permanently delete your business.               │
  │  Financial records are retained for 7 years.               │
  │  This cannot be undone.                                    │
  │                                                             │
  │  [Delete business]             [Cancel]                    │
  └─────────────────────────────────────────────────────────────┘

  ↓
Controlled deletion process (App Flow §143):
  · Business record marked: deletion_scheduled = true
  · All team members signed out immediately; notified via SMS/email
  · 30-day grace period: only owner can cancel by logging in
  · Financial records retained per legal retention rules
  · At end of grace period: business data purged (except retained financials)
  · If owner has other businesses: app switches to another business context
  · If no other businesses: owner's personal account remains but business workspace is empty
```

### Account deletion vs. Business deletion — Key distinction

| Aspect | Account Deletion | Business Deletion |
|--------|-----------------|-------------------|
| What is removed | Personal account (login, preferences) | Entire business entity and its data |
| Business data | Business data retained (per retention) | Business data deleted (after retention period) |
| Team access | Depends — if other owners exist, business continues | All team members lose access immediately |
| Can be done by | Account owner only | Business owner only |
| Legal data retention | Financial records retained 7 years | Financial records retained 7 years |
| GST implications | None | Owner must separately cancel GST registration |
| Grace period | 30 days | 30 days |

---

## 12. AI OS in Settings Context (UI-UX §163–165)

The AI OS remains accessible from Settings via the Voice tab. Context-awareness applies:

```
Owner in Settings.Security asks:
  "How do I change my PIN?"
    ↓
  AI knows user is in Settings.Security
  AI responds: "Tap 'Change PIN' — I can walk you through it."
  [Change PIN →] shown as a shortcut in AI response
```

AI never reads or cites the PIN or security credential values. It can explain what settings exist and how to navigate to them.

---

## 13. Acceptance Criteria Verification

| Criterion (Prompt 32) | Met? | Evidence |
|---|:---:|---|
| Full Settings tree (all 13 sub-screens) | ✓ | §1 |
| AI memory management | ✓ | §5.1 |
| Language switching | ✓ | §4 |
| Security settings | ✓ | §7 |
| Consequence-explanation step before deletion | ✓ | §10 (account), §11 (business) |
| Account deletion vs. business deletion distinguished | ✓ | §10, §11, comparison table |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| AI memory types | `App Flow.txt §34` |
| AI action confirmation levels | `docs/ux/ai-action-confirmation-ux.md` |
| Data deletion UX rule | UI-UX §180 |
| Language / voice (DL-001, DL-009) | Design language documents |
| Screen canonical IDs | `docs/ux/screen-inventory.md` |
