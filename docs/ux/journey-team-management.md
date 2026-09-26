# Journey Map — Team Management

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/screen-inventory.md` (Prompt 21)
**Governing sources:** `App Flow.txt §68–72`; `UI-UX.txt §183–184`

---

## Purpose

This document maps team management journeys:

1. Invitation flow — inviting a new team member
2. Role assignment — selecting and applying a role
3. Branch scoping — restricting a member's access to one or more branches
4. Permission-denied handling — what the member sees when they try an unauthorized action
5. Role-aware AI behavior — an employee asking the AI for owner-only financials gets a permission explanation, not a data leak

---

## Sources

| Source | Sections used |
|--------|---------------|
| `App Flow.txt` | §68 (Team flow), §69 (Invitation flow), §70 (Permission flow), §71 (Multi-business flow), §72 (Branch flow) |
| `UI-UX.txt` | §183 (Role-aware UI), §184 (Permission-denied UX) |
| `docs/ux/screen-inventory.md` | Canonical screen IDs |
| `docs/ux/journey-ai-conversation.md` | AI permission-denied branch |

---

## 1. Roles and Permissions — Foundation

Before the journeys, this is what roles mean in the system.

### Standard roles

| Role | Typical capabilities |
|------|---------------------|
| Owner | Full access to all modules, reports, financials, team, and settings; can delete business |
| Manager | Operational access (sales, inventory, purchases, customers); access to reports; cannot manage team or view owner-level financials |
| Accountant | Finance, invoices, GST, reports, payment recording; no sales entry; no team management |
| Sales Staff | Sales recording, customer lookup; no financial reports, no settings |
| Viewer | Read-only access to agreed modules; no write operations |
| Custom | Owner defines which modules and actions are permitted |

**UI-UX §183:** The UI can hide actions the user cannot perform, but backend authorization remains authoritative. Hiding a button is a UX convenience — the backend always validates the request independently.

---

## 2. Team Overview (`Team.Members`)

### Entry

Settings → Team → Members (or More → Team for some role levels)

```
┌────────────────────────────────────────────────┐
│ ← Team                             [+ Invite]  │
│ ──────────────────────────────────────────────  │
│ Members (4)                                    │
│                                                │
│ ┌─────────────────────────────────────────────┐│
│ │ 👤 Rajesh Kumar          Owner         [→] ││
│ │ Active · Main Store + Warehouse A          ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ 👤 Sanjay Mehta          Manager       [→] ││
│ │ Active · Main Store only                   ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ 👤 Meena Sharma          Sales Staff   [→] ││
│ │ Active · Main Store only                   ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ 📨 Kavya Patel           Invited            ││
│ │ Invite pending · Sent 2 days ago       [→] ││
│ └─────────────────────────────────────────────┘│
│                                               │
│ [+ Invite new member]                         │
└────────────────────────────────────────────────┘
```

---

## 3. Invitation Flow (`Team.Invite`)

### Who can invite

- Owner: can invite any role
- Manager: can invite Sales Staff and Viewer (not Manager, Accountant, or Owner)

### Step-by-step

```
[+ Invite] button tapped
  ↓
Team.Invite
  ↓
─────────────────────────────────────────────────────────────────────
Step 1: Contact
  · Enter phone number or email address of the person to invite
  · If phone is in the owner's contacts: name suggestion shown
  · If already a Vepari user: "Kavya Patel — already on Vepari" (faster join)
  · If not a user: invite includes a download link + join code

─────────────────────────────────────────────────────────────────────
Step 2: Role Selection
  ┌────────────────────────────────────────────────┐
  │  Select role for this member                   │
  │  ─────────────────────────────────────────────  │
  │  ○ Manager                                    │
  │    Can manage sales, inventory, customers     │
  │    Can view reports and financials            │
  │                                               │
  │  ● Sales Staff                    ← selected  │
  │    Can record sales and view customers        │
  │    Cannot view financial reports              │
  │                                               │
  │  ○ Accountant                                 │
  │  ○ Viewer                                     │
  │  ○ Custom…                                    │
  └────────────────────────────────────────────────┘

  Role description is shown inline — no navigation to learn what each role means.

─────────────────────────────────────────────────────────────────────
Step 3: Branch Scope
  (Only shown for businesses with more than one branch)

  ┌────────────────────────────────────────────────┐
  │  Which branches can this member access?        │
  │  ─────────────────────────────────────────────  │
  │  ☑ Main Store                                 │
  │  ☐ Warehouse A                                │
  │  ☐ All current and future branches            │
  └────────────────────────────────────────────────┘

  Default: the branch the inviter is currently operating in.
  "All current and future branches" — only an Owner can grant this.

─────────────────────────────────────────────────────────────────────
Step 4: Review and Send
  ┌────────────────────────────────────────────────┐
  │  Invitation summary                            │
  │  ─────────────────────────────────────────────  │
  │  To:     Kavya Patel (+91 98765 43211)         │
  │  Role:   Sales Staff                           │
  │  Branch: Main Store only                       │
  │  ─────────────────────────────────────────────  │
  │  [Send invitation]          [Edit]             │
  └────────────────────────────────────────────────┘

  [Send invitation]:
    · Invitation record created in local SQLite
    · Queued for cloud sync (status = "pending")
    · WhatsApp / SMS sent via cloud backend:
        "Rajesh has invited you to join [Business Name] on Vepari.
         Tap to accept: [link] | Code: XXXXXX"
    · Recipient appears in Team.Members with "Invited" badge

─────────────────────────────────────────────────────────────────────
Step 5: Acceptance (on recipient's device)
  Kavya taps the link:
    · Opens Vepari app (or app store if not installed)
    · Login / signup (if new user)
    · "You've been invited to join [Business Name] as Sales Staff"
    · [Accept] → member record activated
    ↓
  On the inviter's device (next sync):
    · Kavya's status changes to "Active"
    · Owner notified: "Kavya Patel joined as Sales Staff"

─────────────────────────────────────────────────────────────────────
Step 6: Membership Activated
  Kavya can now log in and use the app
  with Sales Staff permissions, Main Store scope.
```

---

## 4. Role Management — Editing an Existing Member

```
Team.Members → tap Sanjay Mehta
  ↓
Team.MemberDetail
  ┌────────────────────────────────────────────────┐
  │ ← Sanjay Mehta                    [Edit role] │
  │ Manager · Active                              │
  │ Member since: 12 Jan 2026                     │
  │                                               │
  │ Branch access:  Main Store only               │
  │ Last active:    Today, 9:45 AM                │
  │ Permissions:    Sales, Inventory, Customers,  │
  │                 Reports (operational)          │
  │ ─────────────────────────────────────────────  │
  │ Recent activity:                              │
  │ · Sale ₹2,400 · Priya Textiles · 2 hrs ago   │
  │ · Stock adjustment: Amul 5 kg +20 · yesterday │
  │ ─────────────────────────────────────────────  │
  │ [Revoke access]                               │
  └────────────────────────────────────────────────┘
```

**[Edit role]:** Opens role and branch scope selection (same as invitation Step 2–3). Role changes take effect on the member's next API request — backend enforces immediately.

**[Revoke access]:** DESTRUCTIVE action.
```
"Remove Sanjay Mehta from this business?
This will immediately end their access.
Their past transactions remain in your records."

[Remove member]    [Cancel]
Classification: DESTRUCTIVE — two-step confirm
```

---

## 5. Branch Scoping — How It Constrains Access

Branch scoping operates at every data-access level:

| Data type | Effect of branch scope |
|-----------|----------------------|
| Transactions | Member sees only sales/purchases/payments from scoped branches |
| Customers | Sees customers who have transacted at scoped branches |
| Inventory | Sees stock for scoped branches; cannot transfer from non-scoped branches |
| Reports | Reports are filtered to scoped branches |
| AI insights | AI answers reflect scoped-branch data only |

```
Branch flow (App Flow §72):
  Business
    ↓
  Branches
    ↓
  Select Branch (user's scoped branches shown)
    ↓
  Branch-scoped data
```

If a member tries to access a non-scoped branch (e.g., via a deep link):
```
403 Forbidden from backend
  ↓
Permission-denied screen:
  "You don't have access to Warehouse A.
   Contact Rajesh (owner) to request access."
```

---

## 6. Permission-Denied Handling (UI-UX §184)

The UI can hide buttons the member cannot tap, but when they encounter a restriction, the explanation is always explicit — never silent.

### 6.1 Restricted button (hidden at UI level)

```
Meena (Sales Staff) views Customers.Detail
  · [Delete customer] button is NOT shown (hidden by role-aware UI)
  · No "locked" icon — the button simply doesn't appear for Sales Staff

Why: UI-UX §183 — the UI can hide actions the user cannot perform.
```

### 6.2 Restricted screen (explicit block)

```
Meena navigates via deep link to Finance.Reports
  ↓
Backend validates: Sales Staff role → Finance.Reports access = denied
  ↓
Permission-denied screen shown:

  ┌────────────────────────────────────────────────┐
  │                                               │
  │              🔒                               │
  │                                               │
  │   You don't have permission to view           │
  │   Financial Reports.                          │
  │                                               │
  │   This module requires Manager or             │
  │   Accountant access.                          │
  │                                               │
  │   [Go back]    [Contact owner]               │
  │                                               │
  └────────────────────────────────────────────────┘

  [Contact owner] → pre-populated WhatsApp/SMS: "Hi Rajesh, I need access to Financial Reports."
```

### 6.3 Restricted action (tried to submit)

```
Meena somehow accesses a delete button (e.g., a bug or edge case):
  ↓
Request sent to backend
  ↓
Backend authorization check: denied
  ↓
UI shows error toast:
  "You don't have permission to perform this action."
  (Does not reveal what data would have been deleted)
```

---

## 7. Role-Aware AI Behavior

This is the acceptance-criteria requirement: an employee asking the AI for owner-only financials gets a **permission explanation**, not a silent data leak.

### 7.1 Scenario — Sales Staff asks about profit

```
Meena (Sales Staff, Main Store) opens Voice tab:

Meena: "What was our total profit this month?"
  ↓
AI OS state: LISTENING → THINKING
  ↓
AI resolves intent: QUESTION — financial report (profit)
  ↓
Permission check:
  · User: Meena · Role: Sales Staff
  · Sales Staff: Finance.Reports = DENIED
  ↓
AI response (RESPONDING state):

  ┌──────────────────────────────────────────────┐
  │ Vepari AI                            14:22   │
  │                                              │
  │ I can't share profit details with your       │
  │ current access level.                        │
  │                                              │
  │ Financial reports are available to           │
  │ the business owner and accountants.          │
  │                                              │
  │ I can tell you about today's sales           │
  │ or your customer transactions.               │
  │                                              │
  │ [What can I ask you?]                        │
  └──────────────────────────────────────────────┘
```

**Rules enforced:**
- AI does not reveal the actual profit figure (not even a hint like "quite high" or "I can't say but it was a good month")
- AI does not suggest workarounds ("maybe try the Reports tab")
- AI tells the employee what they CAN ask — directing toward permitted data
- AI names the role level required — so the employee knows what to request from the owner
- Backend authorization is still the ultimate gate — the AI's refusal mirrors backend permission

### 7.2 Scenario — Manager asks about owner-only settings

```
Sanjay (Manager) asks: "What is Rajesh's personal login email?"
  ↓
AI: "That's private account information I can't share.
     I can help with business operations, sales, inventory,
     and team-level activity."
```

### 7.3 Scenario — Sales Staff asks an allowed question

```
Meena: "How many sales did I make today?"
  ↓
AI permission check: Sales data for scoped branch → ALLOWED
  ↓
AI responds with data for Meena's transactions at Main Store today.
  · Does NOT include sales by other staff members (privacy)
  · Does NOT include Warehouse A data (branch scope)
```

---

## 8. Pending Invitation States

| State | What owner sees | What invitee sees |
|-------|----------------|-------------------|
| Sent | "Kavya Patel — Invited · 2 days ago" | Invitation message with link |
| Expired (7 days) | "Kavya Patel — Invite expired [Resend]" | Link expired; can request re-invite |
| Accepted | "Kavya Patel — Active" | Welcome to the business |
| Declined | "Kavya Patel — Declined [Remove / Resend]" | Confirmation to decliner |
| Revoked (before acceptance) | "Invite cancelled" | Link becomes invalid |

---

## 9. Universal States Applied

| Screen | Loading | Empty | Error | Permission-denied |
|--------|:-------:|:-----:|:-----:|:-----------------:|
| `Team.Members` | ✓ | ✓ ("No members yet — you're the only one") | ✓ | Owner-only screen |
| `Team.Invite` | — | — | ✓ | Non-owners see read-only view |
| `Team.MemberDetail` | ✓ | — | ✓ | ✓ (if accessing member in another branch) |

---

## 10. Acceptance Criteria Verification

| Criterion (Prompt 31) | Met? | Evidence |
|---|:---:|---|
| Invitation flow | ✓ | §3 |
| Role assignment | ✓ | §3 Step 2, §4 |
| Branch scoping | ✓ | §3 Step 3, §5 |
| Permission-denied handling | ✓ | §6 |
| Role-aware AI behavior | ✓ | §7 |
| Employee asking AI for owner-only financials gets explanation, not data | ✓ | §7.1 |

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| AI conversation permission-denied branch | `docs/ux/journey-ai-conversation.md` §6 |
| Role-aware UI rule | UI-UX §183 |
| Permission-denied UX rule | UI-UX §184 |
| Screen canonical IDs | `docs/ux/screen-inventory.md` |
