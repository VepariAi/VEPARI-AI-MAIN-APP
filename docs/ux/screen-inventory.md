# Screen Inventory — Complete §239 Reference

**Phase:** 3 (Journey Mapping)
**Status:** Approved for Phase 3 planning
**Last updated:** 2026-09-01
**Depends on:** `docs/ux/information-architecture.md` (Prompt 11), `docs/ux/universal-screen-states.md` (Prompt 15)
**Governing decisions:** DL-006 (engine taxonomy)

---

## Purpose

This document is the working reference for every named screen in the application. Every journey map, flow document, and screen spec in Phase 3 and beyond references screens by their canonical name from this table.

**Acceptance criteria met:**
- Every screen named in `UI-UX.txt §239` appears exactly once
- No screen is invented that is not traceable to §239 or a referenced master document
- Each screen carries: name, parent module, primary entry points, primary exit points, and which Universal States apply

---

## Sources

| Source | Sections used |
|--------|---------------|
| `UI-UX.txt` | §239 (complete screen map), §157–165 (navigation rules) |
| `App Flow.txt` | §4–17 (onboarding), §18–35 (AI OS), §36–111 (business modules) |
| `docs/ux/information-architecture.md` | §239 screen tree, DL-006 engine mapping |
| `docs/ux/navigation-model.md` | Tab-bar entries, More drawer, tap-depth model |
| `docs/ux/universal-screen-states.md` | 9-state definitions (Prompt 15) |

---

## Universal State Legend

All 9 states defined in `docs/ux/universal-screen-states.md` are listed below. The **States** column for each screen uses these abbreviated names.

| Abbreviation | Full name | When it applies |
|---|---|---|
| **Loading** | Loading | Any async operation: data fetch, AI analysis, save |
| **Loaded** | Loaded | Primary content rendered and actionable |
| **Empty** | Empty | Zero records in a list or collection |
| **Error** | Error | Failed fetch, save, or AI call |
| **Success** | Success | Confirmed save, action completion, or submission |
| **Offline** | Offline | No network — local data served |
| **Syncing** | Syncing | Background sync in progress |
| **Conflict** | Conflict | Local and cloud versions differ, review required |
| **Perm-denied** | Permission denied | User lacks role/permission for this screen |

A screen that **never** shows a given state is omitted from its States list (e.g., Launch never shows Empty; Receipt never shows Conflict).

---

## Naming Convention

Canonical screen name = `Module.ScreenName` (e.g., `Customers.Detail`, `Sales.NewSale`). The **Screen** column shows the display name; the **Canonical ID** column shows the dot-notation reference used in later documents.

---

## 1 — App-Level Screens (2)

These screens exist outside any module and are reached before the owner workspace loads.

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Launch | `App.Launch` | App | Cold start, warm start from background | Security (always) | Loading, Error |
| Security | `App.Security` | App | App.Launch, background resume (>15 min), deep-link cold start | Onboarding (first launch), AI OS Awakening (returning user), destination screen (deep link) | Loading, Error |

---

## 2 — Onboarding Screens (9)

Shown during first installation only (`App Flow §4–17`). After completion, never presented again unless the user resets or reinstalls.

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Language | `Onboarding.Language` | Onboarding | App.Security (first launch), Settings.Language (change) | Onboarding.Account | Loading, Loaded |
| Account | `Onboarding.Account` | Onboarding | Onboarding.Language | Onboarding.Security (new account) or AI OS Awakening (login) | Loading, Error |
| Business | `Onboarding.Business` | Onboarding | Onboarding.Account (post-verification) | Onboarding.Industry | Loading, Error |
| Industry | `Onboarding.Industry` | Onboarding | Onboarding.Business | Onboarding.Size | Loaded |
| Size | `Onboarding.Size` | Onboarding | Onboarding.Industry | Onboarding.Location | Loaded |
| Location | `Onboarding.Location` | Onboarding | Onboarding.Size | Onboarding.Configuration | Loading, Loaded, Error |
| Configuration | `Onboarding.Configuration` | Onboarding | Onboarding.Location | Onboarding.AI (data import optional sub-flow first) | Loaded |
| AI | `Onboarding.AI` | Onboarding | Onboarding.Configuration (after optional import) | Onboarding.Security | Loaded |
| Security | `Onboarding.Security` | Onboarding | Onboarding.AI, Onboarding.Account | AI OS Awakening (first entry) | Loading, Error |

**Note on Onboarding.Security vs App.Security:** Onboarding.Security is the *setup* step (creates PIN/biometric). App.Security is the *verification* screen on every subsequent launch. They share visual components but serve different flows.

---

## 3 — AI OS Screens (10)

The AI OS is an **overlay layer**, not a navigation destination. It floats above business screens and is reachable from any context (`UI-UX §163`). AI OS screens do not push onto the business navigation stack; dismissing any AI OS screen returns the user to the underlying business screen.

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Awakening | `AIOS.Awakening` | AI OS | App.Security (post-auth), any screen (Voice tab tap first time after auth) | AIOS.Briefing | Loading |
| Briefing | `AIOS.Briefing` | AI OS | AIOS.Awakening, returning to foreground (>15 min) | Home (dismiss), AIOS.Resources, AIOS.Insights, any linked business screen | Loading, Loaded, Empty, Error, Offline |
| Resources | `AIOS.Resources` | AI OS | AIOS.Briefing, Voice tab (contextual) | AIOS.Briefing, Home, any linked business screen | Loading, Loaded, Empty, Error, Offline |
| Insights | `AIOS.Insights` | AI OS | AIOS.Briefing, AIOS.Resources, contextual "Ask AI" button on any screen | AIOS.Evidence, AIOS.Recommendations, AIOS.Actions, underlying screen | Loading, Loaded, Empty, Error, Offline |
| Voice | `AIOS.Voice` | AI OS | Voice tab tap (any screen), Quick Action "Ask AI" | AIOS.Chat, AIOS.Insights, AIOS.Actions, underlying screen | Loading, Error, Offline |
| Chat | `AIOS.Chat` | AI OS | Voice tab long-press, AIOS.Voice (switch to text), any "Ask AI" button | AIOS.Evidence, AIOS.Insights, AIOS.Actions, underlying screen | Loading, Loaded, Empty, Error, Offline |
| Evidence | `AIOS.Evidence` | AI OS | AIOS.Insights (tap "Why?"), AIOS.Chat response link | AIOS.Insights, source business screen (deep link) | Loading, Loaded, Error |
| Recommendations | `AIOS.Recommendations` | AI OS | AIOS.Briefing, AIOS.Insights | AIOS.Actions, AIOS.Evidence, underlying screen | Loading, Loaded, Empty |
| Actions | `AIOS.Actions` | AI OS | AIOS.Recommendations, AIOS.Voice command, AIOS.Chat command | AIOS.Results, underlying screen (cancelled) | Loading, Error, Perm-denied |
| Results | `AIOS.Results` | AI OS | AIOS.Actions (after execution) | Underlying business screen, AIOS.Briefing | Loaded, Error |

**AI OS state machine note:** The 13-state AI OS state machine (DORMANT → COMPLETED/ERROR) governs these screens. See `docs/ux/ai-os-state-machine.md`. The Universal States listed above describe data-fetching and permission conditions, not the AI OS animation states.

---

## 4 — Home (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Home | `Home.Home` | Home | Bottom tab 1 (always), AIOS.Briefing dismiss, Onboarding.Security completion, back navigation to root | Any bottom tab, any Quick Action destination, any Recent Activity item, AIOS.Awakening | Loading, Loaded, Error, Offline, Syncing |

---

## 5 — Customers (5)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| List | `Customers.List` | Customers | More drawer → Customers, AIOS action link, deep link | Customers.Search, Customers.Detail, Customers.Add | Loading, Loaded, Empty, Error, Offline, Syncing, Perm-denied |
| Search | `Customers.Search` | Customers | Customers.List (search icon), global Search screen | Customers.Detail, Customers.Add | Loading, Loaded, Empty, Error |
| Detail | `Customers.Detail` | Customers | Customers.List (tap row), Customers.Search result, AIOS evidence link, notification deep link | Customers.Edit, Sales.NewSale (with customer pre-selected), Payments.Add | Loading, Loaded, Error, Offline, Syncing, Conflict, Perm-denied |
| Add | `Customers.Add` | Customers | Customers.List (+ button), Home Quick Action, AIOS action, More drawer quick action | Customers.Detail (on save), Customers.List (cancel) | Loading, Error, Success, Offline, Perm-denied |
| Edit | `Customers.Edit` | Customers | Customers.Detail (edit button) | Customers.Detail (on save or cancel) | Loading, Error, Success, Offline, Conflict, Perm-denied |

---

## 6 — Suppliers (4)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| List | `Suppliers.List` | Suppliers | More drawer → Suppliers, AIOS action link | Suppliers.Detail, Suppliers.Add | Loading, Loaded, Empty, Error, Offline, Syncing, Perm-denied |
| Detail | `Suppliers.Detail` | Suppliers | Suppliers.List (tap row), Purchases.NewPurchase (supplier link), notification deep link | Suppliers.Edit, Purchases.NewPurchase (with supplier pre-selected), Payments.Add | Loading, Loaded, Error, Offline, Syncing, Conflict, Perm-denied |
| Add | `Suppliers.Add` | Suppliers | Suppliers.List (+ button), Purchases.NewPurchase (inline add), AIOS action | Suppliers.Detail (on save), Suppliers.List (cancel) | Loading, Error, Success, Offline, Perm-denied |
| Edit | `Suppliers.Edit` | Suppliers | Suppliers.Detail (edit button) | Suppliers.Detail (on save or cancel) | Loading, Error, Success, Offline, Conflict, Perm-denied |

---

## 7 — Products (4)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| List | `Products.List` | Products | More drawer → Products, AIOS action link, Sales.Cart (browse products) | Products.Detail, Products.Add | Loading, Loaded, Empty, Error, Offline, Syncing, Perm-denied |
| Detail | `Products.Detail` | Products | Products.List (tap row), Inventory.Stock (product link), notification deep link | Products.Edit, Inventory.Overview (stock view) | Loading, Loaded, Error, Offline, Syncing, Conflict, Perm-denied |
| Add | `Products.Add` | Products | Products.List (+ button), Sales.Cart (inline add), AIOS action | Products.Detail (on save), Products.List (cancel) | Loading, Error, Success, Offline, Perm-denied |
| Edit | `Products.Edit` | Products | Products.Detail (edit button) | Products.Detail (on save or cancel) | Loading, Error, Success, Offline, Conflict, Perm-denied |

---

## 8 — Inventory (7)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Overview | `Inventory.Overview` | Inventory | More drawer → Inventory, AIOS Briefing (stock alert), Home Alerts | Inventory.Stock, Inventory.LowStock, Inventory.Locations, Inventory.Transfers, Inventory.Adjustments, Inventory.History | Loading, Loaded, Error, Offline, Syncing |
| Stock | `Inventory.Stock` | Inventory | Inventory.Overview (Stock tab), Products.Detail (stock link) | Inventory.Adjustments, Products.Detail, Inventory.History | Loading, Loaded, Empty, Error, Offline, Syncing, Conflict |
| Low Stock | `Inventory.LowStock` | Inventory | Inventory.Overview (Low Stock tab), AIOS Briefing alert, notification deep link | Inventory.Stock (item), Inventory.Adjustments, Purchases.NewPurchase | Loading, Loaded, Empty, Error, Offline |
| Locations | `Inventory.Locations` | Inventory | Inventory.Overview (Locations tab) | Inventory.Transfers | Loading, Loaded, Empty, Error, Perm-denied |
| Transfers | `Inventory.Transfers` | Inventory | Inventory.Overview (Transfers tab), Inventory.Locations | Inventory.Overview (on confirm) | Loading, Loaded, Empty, Error, Success, Offline, Perm-denied |
| Adjustments | `Inventory.Adjustments` | Inventory | Inventory.Overview (Adjustments tab), Inventory.Stock, Inventory.LowStock | Inventory.Stock (on confirm) | Loading, Error, Success, Offline, Perm-denied |
| History | `Inventory.History` | Inventory | Inventory.Overview (History tab), Inventory.Stock (movements) | Inventory.Stock (tap item), relevant transaction screen | Loading, Loaded, Empty, Error, Offline |

---

## 9 — Sales (7)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Overview | `Sales.Overview` | Sales | Transactions tab → Sales tab, AIOS Briefing (sales summary link) | Sales.List, Sales.NewSale | Loading, Loaded, Error, Offline, Syncing |
| List | `Sales.List` | Sales | Transactions tab (All/Sales filter), Sales.Overview | Sales.Receipt (tap row), Sales.NewSale | Loading, Loaded, Empty, Error, Offline, Syncing |
| New Sale | `Sales.NewSale` | Sales | Sales.Overview (+ New), Home Quick Action, Transactions tab (+ Add), AIOS action | Sales.Cart (next step), Sales.List (cancel) | Loading, Error, Offline, Perm-denied |
| Cart | `Sales.Cart` | Sales | Sales.NewSale (customer selected) | Sales.Payment (next), Sales.NewSale (back), Products.List (add item) | Loading, Loaded, Empty, Error, Offline |
| Payment | `Sales.Payment` | Sales | Sales.Cart (proceed to payment) | Sales.Review (next), Sales.Cart (back) | Loading, Error, Offline |
| Review | `Sales.Review` | Sales | Sales.Payment (review step) | Sales.Receipt (confirm), Sales.Payment (back) | Loading, Error |
| Receipt | `Sales.Receipt` | Sales | Sales.Review (confirm), Sales.List (tap historical sale) | Sales.List, Home, Customers.Detail, Payments.Detail (linked payment) | Loaded, Error, Offline, Syncing, Conflict |

---

## 10 — Expenses (4)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Overview | `Expenses.Overview` | Expenses | Transactions tab → Expenses tab, AIOS Briefing (expense summary link) | Expenses.List, Expenses.Add | Loading, Loaded, Error, Offline, Syncing |
| List | `Expenses.List` | Expenses | Transactions tab (Expenses filter), Expenses.Overview | Expenses.Detail (tap row), Expenses.Add | Loading, Loaded, Empty, Error, Offline, Syncing |
| Add | `Expenses.Add` | Expenses | Expenses.List (+ button), Home Quick Action, AIOS action, Transactions tab (+ Add) | Expenses.Detail (on save), Expenses.List (cancel) | Loading, Error, Success, Offline, Perm-denied |
| Detail | `Expenses.Detail` | Expenses | Expenses.List (tap row), AIOS evidence link, notification deep link | Finance.Expenses, Documents.Bills (linked bill) | Loading, Loaded, Error, Offline, Syncing, Conflict, Perm-denied |

---

## 11 — Purchases (4)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Overview | `Purchases.Overview` | Purchases | Transactions tab → Purchases tab, More drawer, AIOS Briefing | Purchases.List, Purchases.NewPurchase | Loading, Loaded, Error, Offline, Syncing |
| List | `Purchases.List` | Purchases | Transactions tab (Purchases filter), Purchases.Overview | Purchases.Detail (tap row), Purchases.NewPurchase | Loading, Loaded, Empty, Error, Offline, Syncing |
| New Purchase | `Purchases.NewPurchase` | Purchases | Purchases.Overview (+ New), Inventory.LowStock (reorder action), AIOS action | Purchases.Detail (on save), Purchases.List (cancel) | Loading, Error, Offline, Perm-denied |
| Detail | `Purchases.Detail` | Purchases | Purchases.List (tap row), AIOS evidence link, Inventory.History | Suppliers.Detail, Documents.Bills (linked bill), Payments.Detail | Loading, Loaded, Error, Offline, Syncing, Conflict, Perm-denied |

---

## 12 — Payments (3)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| List | `Payments.List` | Payments | Transactions tab → Payments tab, Finance.Receivables, Finance.Payables | Payments.Detail (tap row), Payments.Add | Loading, Loaded, Empty, Error, Offline, Syncing |
| Add | `Payments.Add` | Payments | Payments.List (+ button), Customers.Detail (record payment), Suppliers.Detail (record payment), AIOS action | Payments.Detail (on save), previous screen (cancel) | Loading, Error, Success, Offline, Perm-denied |
| Detail | `Payments.Detail` | Payments | Payments.List (tap row), Sales.Receipt (payment link), Purchases.Detail (payment link) | Customers.Detail, Suppliers.Detail, linked transaction | Loading, Loaded, Error, Offline, Syncing, Conflict, Perm-denied |

---

## 13 — Returns (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Returns | `Returns.Returns` | Returns | Sales.Receipt (return action), Transactions tab (Returns filter), AIOS action | Refunds.Refunds (on approval), Sales.Receipt (cancel) | Loading, Loaded, Empty, Error, Success, Offline, Perm-denied |

---

## 14 — Refunds (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Refunds | `Refunds.Refunds` | Refunds | Returns.Returns (return approved), Transactions tab (Refunds filter), AIOS action | Payments.Detail (refund record), Finance.Overview | Loading, Loaded, Empty, Error, Success, Offline, Perm-denied |

---

## 15 — Finance (9)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Overview | `Finance.Overview` | Finance | More drawer → Finance, AIOS Briefing (finance summary), Reports tab (Finance) | Finance.Revenue, Finance.Expenses, Finance.Profit, Finance.CashFlow, Finance.Receivables, Finance.Payables, Finance.Accounts, Finance.Ledger | Loading, Loaded, Error, Offline, Syncing |
| Revenue | `Finance.Revenue` | Finance | Finance.Overview (Revenue tab) | Sales.List (drill down), Finance.Overview (back) | Loading, Loaded, Empty, Error, Offline, Syncing |
| Expenses | `Finance.Expenses` | Finance | Finance.Overview (Expenses tab) | Expenses.List (drill down), Finance.Overview (back) | Loading, Loaded, Empty, Error, Offline, Syncing |
| Profit | `Finance.Profit` | Finance | Finance.Overview (Profit tab) | Finance.Revenue, Finance.Expenses, Finance.Overview (back) | Loading, Loaded, Error, Offline |
| Cash Flow | `Finance.CashFlow` | Finance | Finance.Overview (Cash Flow tab) | Finance.Receivables, Finance.Payables, Payments.List | Loading, Loaded, Error, Offline |
| Receivables | `Finance.Receivables` | Finance | Finance.Overview (Receivables tab), AIOS Briefing (outstanding) | Customers.Detail, Payments.Add, Finance.Overview (back) | Loading, Loaded, Empty, Error, Offline, Syncing |
| Payables | `Finance.Payables` | Finance | Finance.Overview (Payables tab), AIOS Briefing (due payables) | Suppliers.Detail, Payments.Add, Finance.Overview (back) | Loading, Loaded, Empty, Error, Offline, Syncing |
| Accounts | `Finance.Accounts` | Finance | Finance.Overview (Accounts tab) | Finance.Ledger, Finance.Overview (back) | Loading, Loaded, Empty, Error, Offline, Perm-denied |
| Ledger | `Finance.Ledger` | Finance | Finance.Accounts (drill down), Finance.Overview (Ledger tab) | Finance.Accounts, transaction source screen (drill down) | Loading, Loaded, Empty, Error, Offline, Perm-denied |

---

## 16 — Operations (5)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Orders | `Operations.Orders` | Operations | More drawer → Operations (Orders tab) | Operations task screens, Sales.Detail | Loading, Loaded, Empty, Error, Offline, Syncing, Perm-denied |
| Tasks | `Operations.Tasks` | Operations | More drawer → Operations (Tasks tab), AIOS action | Operations.Assignments, Operations.Orders | Loading, Loaded, Empty, Error, Offline, Perm-denied |
| Processes | `Operations.Processes` | Operations | More drawer → Operations (Processes tab) | Operations.Tasks, Operations.Activity | Loading, Loaded, Empty, Error, Perm-denied |
| Assignments | `Operations.Assignments` | Operations | Operations.Tasks (assign action), Operations.Orders | Operations.Tasks (back) | Loading, Loaded, Empty, Error, Perm-denied |
| Activity | `Operations.Activity` | Operations | More drawer → Operations (Activity tab) | linked transaction or task record | Loading, Loaded, Empty, Error, Offline |

---

## 17 — Documents (5)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Invoices | `Documents.Invoices` | Documents | More drawer → Documents (Invoices tab), Sales.Receipt (view invoice), AIOS action | invoice detail or create flow, Sales.Receipt | Loading, Loaded, Empty, Error, Offline, Syncing, Perm-denied |
| Receipts | `Documents.Receipts` | Documents | More drawer → Documents (Receipts tab), Sales.Receipt (view receipt) | receipt detail, Sales.Receipt | Loading, Loaded, Empty, Error, Offline, Syncing |
| Bills | `Documents.Bills` | Documents | More drawer → Documents (Bills tab), Expenses.Detail (linked bill), Purchases.Detail (linked bill) | bill detail, Expenses.Detail, Purchases.Detail | Loading, Loaded, Empty, Error, Offline, Syncing, Perm-denied |
| Quotations | `Documents.Quotations` | Documents | More drawer → Documents (Quotations tab), AIOS action, Customers.Detail | quotation detail or create flow, Customers.Detail | Loading, Loaded, Empty, Error, Offline, Syncing, Perm-denied |
| Purchase Orders | `Documents.PurchaseOrders` | Documents | More drawer → Documents (Purchase Orders tab), Purchases.NewPurchase (generate PO), Suppliers.Detail | PO detail or create flow, Suppliers.Detail | Loading, Loaded, Empty, Error, Offline, Syncing, Perm-denied |

---

## 18 — Reports (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Reports | `Reports.Reports` | Reports | Bottom tab 4 (Reports), Home (Reports link) | Finance.Overview, Sales.Overview, Expenses.Overview, Analytics.Analytics, AIOS.Insights | Loading, Loaded, Error, Offline, Perm-denied |

---

## 19 — Analytics (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Analytics | `Analytics.Analytics` | Analytics | More drawer → Analytics, Reports.Reports (Insights tab) | AIOS.Insights, Finance.Overview, linked data screens | Loading, Loaded, Empty, Error, Offline, Perm-denied |

---

## 20 — Search (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Search | `Search.Search` | Search | Global search icon (any screen), AIOS.Chat (search results), notification deep link | destination screen of matched result | Loading, Loaded, Empty, Error |

---

## 21 — Notifications (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Notifications | `Notifications.Notifications` | Notifications | Bell icon (header, any screen), deep link | linked destination screen of each notification | Loading, Loaded, Empty, Error, Syncing |

---

## 22 — Alerts (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Alerts | `Alerts.Alerts` | Alerts | More drawer → Alerts, Home (Alerts section), AIOS.Briefing (critical alert link), notification deep link | linked destination screen (e.g., Inventory.LowStock, Finance.Receivables) | Loading, Loaded, Empty, Error, Offline |

---

## 23 — Team (4)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Members | `Team.Members` | Team | More drawer → Team (Members tab), Settings.Team | Team.Invitations (invite), member profile detail | Loading, Loaded, Empty, Error, Perm-denied |
| Invitations | `Team.Invitations` | Team | Team.Members (+ Invite), Settings.Team | Team.Members (on send or cancel) | Loading, Error, Success, Perm-denied |
| Roles | `Team.Roles` | Team | More drawer → Team (Roles tab), Settings.Team | Team.Permissions, Team.Members (assign role) | Loading, Loaded, Empty, Error, Perm-denied |
| Permissions | `Team.Permissions` | Team | Team.Roles (configure), Settings.Team | Team.Roles (back) | Loading, Loaded, Error, Perm-denied |

---

## 24 — Automation (1)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Automation | `Automation.Automation` | Automation | More drawer → Automation, AIOS.Recommendations (create rule link) | rule detail or create flow | Loading, Loaded, Empty, Error, Perm-denied |

---

## 25 — Connection Portfolio (5)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Available | `ConnectionPortfolio.Available` | Connection Portfolio | More drawer → Connection Portfolio (Available tab) | ConnectionPortfolio.Setup | Loading, Loaded, Empty, Error |
| Connected | `ConnectionPortfolio.Connected` | Connection Portfolio | More drawer → Connection Portfolio (Connected tab), Settings.Connections | ConnectionPortfolio.Sync, ConnectionPortfolio.Health | Loading, Loaded, Empty, Error, Syncing |
| Setup | `ConnectionPortfolio.Setup` | Connection Portfolio | ConnectionPortfolio.Available (connect action) | ConnectionPortfolio.Connected (on success), ConnectionPortfolio.Available (cancel) | Loading, Error, Success, Perm-denied |
| Sync | `ConnectionPortfolio.Sync` | Connection Portfolio | ConnectionPortfolio.Connected (sync action) | ConnectionPortfolio.Health, ConnectionPortfolio.Connected | Loading, Syncing, Error, Conflict |
| Health | `ConnectionPortfolio.Health` | Connection Portfolio | ConnectionPortfolio.Connected (health tab) | ConnectionPortfolio.Sync (retry), support link | Loading, Loaded, Error |

---

## 26 — Settings (13)

| Screen | Canonical ID | Parent Module | Entry Points | Exit Points | Universal States |
|--------|-------------|---------------|--------------|-------------|-----------------|
| Profile | `Settings.Profile` | Settings | More drawer → Settings → Profile | Settings hub (back) | Loading, Loaded, Error, Success |
| Business | `Settings.Business` | Settings | More drawer → Settings → Business | Settings hub (back) | Loading, Loaded, Error, Success |
| Language | `Settings.Language` | Settings | More drawer → Settings → Language | Onboarding.Language (re-select), Settings hub (back) | Loaded |
| AI | `Settings.AI` | Settings | More drawer → Settings → AI | Settings hub (back) | Loaded |
| Voice | `Settings.Voice` | Settings | More drawer → Settings → Voice | Settings hub (back) | Loading, Loaded, Error |
| Security | `Settings.Security` | Settings | More drawer → Settings → Security | Settings hub (back) | Loading, Loaded, Error, Success |
| Notifications | `Settings.Notifications` | Settings | More drawer → Settings → Notifications | Settings hub (back) | Loaded |
| Team | `Settings.Team` | Settings | More drawer → Settings → Team | Team.Members, Team.Roles, Team.Permissions | Loading, Loaded, Perm-denied |
| Devices | `Settings.Devices` | Settings | More drawer → Settings → Devices | device detail | Loading, Loaded, Empty, Error |
| Connections | `Settings.Connections` | Settings | More drawer → Settings → Connections | ConnectionPortfolio.Connected | Loading, Loaded, Empty, Error |
| Data | `Settings.Data` | Settings | More drawer → Settings → Data | Settings hub (back) | Loading, Loaded, Error, Perm-denied |
| Storage | `Settings.Storage` | Settings | More drawer → Settings → Storage | Settings hub (back) | Loading, Loaded, Error |
| About | `Settings.About` | Settings | More drawer → Settings → About | Settings hub (back) | Loaded |

---

## Summary Count

| Module | Screen count |
|--------|-------------|
| App-level | 2 |
| Onboarding | 9 |
| AI OS | 10 |
| Home | 1 |
| Customers | 5 |
| Suppliers | 4 |
| Products | 4 |
| Inventory | 7 |
| Sales | 7 |
| Expenses | 4 |
| Purchases | 4 |
| Payments | 3 |
| Returns | 1 |
| Refunds | 1 |
| Finance | 9 |
| Operations | 5 |
| Documents | 5 |
| Reports | 1 |
| Analytics | 1 |
| Search | 1 |
| Notifications | 1 |
| Alerts | 1 |
| Team | 4 |
| Automation | 1 |
| Connection Portfolio | 5 |
| Settings | 13 |
| **Total** | **109** |

---

## State Coverage Notes

### States that are universally excluded

- **Empty** never applies to: single-record screens (Detail, Add, Edit, Receipt, individual Settings sub-screens), process screens (Launch, Security, Awakening), or single-entity screens that always show something.
- **Success** applies only to screens that complete a write action: Add, Edit, Transfer, Adjustment, Invitation, Payment.Add. It does not apply to list or detail screens.
- **Conflict** applies only to screens that display a record that can be edited on multiple devices simultaneously: Detail screens, Edit screens, Receipt, Finance.Accounts, and connection sync.
- **Syncing** applies to screens that show aggregate lists of financial records; it reflects the background sync queue indicator, not a blocking state.

### Financial records: special sync rules

Per `docs/ux/offline-sync-state-language.md` Rule F5: financial records (Sales.Receipt, Expenses.Detail, Purchases.Detail, Payments.Detail, Finance.Ledger) must not display **Syncing → Synced** optimistically. The Synced indicator appears only after cloud confirmation. These screens therefore show **Syncing** as a persistent visible state until cloud acknowledgment.

### AI OS screens: Offline behavior

AI OS screens fall back to cached briefing content when offline. AIOS.Voice and AIOS.Chat show an **Offline** banner but remain operable for local-memory queries. Real-time intelligence requires connectivity.

---

## Relationship to Other Documents

| Topic | Canonical source |
|-------|-----------------|
| AI OS 13-state machine | `docs/ux/ai-os-state-machine.md` |
| 9 Universal State specs | `docs/ux/universal-screen-states.md` |
| 6 sync state specs | `docs/ux/offline-sync-state-language.md` |
| AI action confirmation pattern | `docs/ux/ai-action-confirmation-ux.md` |
| New-user journey (Prompts 22) | `docs/ux/journey-new-user.md` |
| Returning-user journey (Prompt 23) | `docs/ux/journey-returning-user.md` |
| Sale transaction journey (Prompt 25) | `docs/ux/journey-sale-transaction.md` |
| Business-size adaptive rules | `docs/ux/business-size-adaptive-ux.md` |
| Navigation tap-depth model | `docs/ux/navigation-model.md` |
| Accessibility/multilingual rules | `docs/ux/accessibility-multilingual-rules.md` |
