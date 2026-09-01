# Phase 4 Wireframes — Vepari AI

Phase 4 of the governance prompts sequence. Six design canvas artifacts covering the primary mobile surfaces of Vepari AI (390×844 px, wireframe fidelity).

Each entry links to the published Claude Design canvas and lists its artboards.

---

## Prompt 33 — Security and Launch Flow

**Artifact:** https://claude.ai/code/artifact/a7ba0712-e752-416a-993b-eba3c1adbdca  
**Source:** `p33/`

Covers the complete security entry sequence including all failure states per UI-UX §16–18.

| Artboard | Description |
|---|---|
| `Main.dc.html` | App launch screen — logo, tagline, loading dots |
| `SessionCheck.dc.html` | Session gate — <15 min vs >15 min branching logic |
| `Biometric.dc.html` | Biometric happy path — fingerprint/face unlock |
| `BiometricFail.dc.html` | Biometric failure — attempt counter, fallback to PIN |
| `PIN.dc.html` | PIN entry — 6-dot indicator, 3×4 keypad |
| `PINLockout.dc.html` | 30-second cooldown after 5 wrong PINs |
| `PINAccountLocked.dc.html` | Account lock after 10 wrong PINs — OTP recovery |

---

## Prompt 34 — AI OS Home Surface

**Artifact:** https://claude.ai/code/artifact/6f567cb6-8c37-4dfc-8fdb-e8700c1c756d  
**Source:** `p34/`

Reduces 8-card marketing layout to one portrait phone screen with progressive disclosure (UI-UX §144).

| Artboard | Description |
|---|---|
| `Main.dc.html` | Home screen — AI state pill, briefing preview, KPIs, voice card, quick actions, 5-tab nav |
| `Decisions.dc.html` | What was kept above fold vs. deferred — decision rationale table |

---

## Prompt 35 — Briefing Screen

**Artifact:** https://claude.ai/code/artifact/c55a0da5-112b-4ab4-8575-74e54d294e11  
**Source:** `p35/`

"While you were away" briefing — 7-item structure across 4 priority tiers distinguished by color and left border (not just list order).

| Artboard | Description |
|---|---|
| `Main.dc.html` | Full briefing (390×1100) — Critical/Important/Actionable/Informational tiers |
| `Empty.dc.html` | "All caught up" empty state |

---

## Prompt 36 — Home Screen Components

**Artifact:** https://claude.ai/code/artifact/27374d19-a6d0-4695-83b9-44d49a6ef444  
**Source:** `p36/`

Today's KPIs, voice card, configurable Quick Actions (PRD §46), and 5-tab bottom nav specification.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Home screen with KPI chips, voice entry card, configurable quick actions |
| `QuickConfig.dc.html` | Quick Actions bottom sheet — drag-to-reorder, toggle switches, slot badges |
| `NavSpec.dc.html` | Bottom nav specification — Voice tab 56×56dp elevated 10dp, 3dp white ring |

---

## Prompt 37 — Finance Drill-down

**Artifact:** https://claude.ai/code/artifact/6c9a66a1-a53c-41aa-b692-8186ba6e252c  
**Source:** `p37/`

Finance Overview with full 5-level drill-down (UI-UX §74) plus Accounting journal view (UI-UX §73–75).

| Artboard | Description |
|---|---|
| `Summary.dc.html` | Finance Overview — period tabs, KPI chips, bar chart, category list (Level 1) |
| `Category.dc.html` | Category drill-down — Sales breakdown, donut chart, account list (Level 2) |
| `Account.dc.html` | Account detail — Priya Textiles, credit bar, transaction list (Level 3) |
| `Transaction.dc.html` | Transaction detail — Invoice #1042, action buttons, source link (Level 4) |
| `Source.dc.html` | Source record — receipt attachment, audit log (Level 5) |
| `Accounting.dc.html` | Accounting journal — P&L/Balance/Journal/GST tabs, double-entry view |

---

## Prompt 38 — Transactions List and Add Sale Flow

**Artifact:** https://claude.ai/code/artifact/569e8981-99d8-46a2-98d8-98babcb0cc7c  
**Source:** `p38/`

Transactions list grouped by day and complete Add Sale flow with all 4 payment options.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Transactions list — All/Sales/Expenses/Payments tabs, day-grouped rows |
| `Customer.dc.html` | Add Sale Step 1 — Walk-in or account selection |
| `Items.dc.html` | Add Sale Step 2 — Added items with edit/remove, sub-total |
| `ItemAdd.dc.html` | Add Item sub-flow — product search, stock levels, quantity stepper |
| `Pricing.dc.html` | Add Sale Step 3 — Order summary, discount toggle, GST note |
| `Payment.dc.html` | Add Sale Step 4 — Cash / UPI / Card / Credit (all 4 options shown) |
| `Confirm.dc.html` | Sale confirmed — Invoice number, summary, WhatsApp share, print receipt |

---

---

## Prompt 39 — Customers and Suppliers

**Artifact:** https://claude.ai/code/artifact/f4a1af87-304c-4d32-ab1e-8d7c7a5a6297  
**Source:** `p39/`

Customer and supplier list/detail/edit screens. Credit-limit and due-balance on every row; AI insights inline on detail screens.

| Artboard | Description |
|---|---|
| `CustomerList.dc.html` | Customer list — All/Credit/Active/Inactive tabs, credit mini-bar per row |
| `SupplierList.dc.html` | Supplier list — All/Due/Active tabs, amount due with status badge |
| `CustomerDetail.dc.html` | Customer detail — outstanding, credit bar, AI insights card (blue), transactions |
| `SupplierDetail.dc.html` | Supplier detail — amount due, 3 amount cards, AI insights card (amber), transactions |
| `CustomerEdit.dc.html` | Add/Edit customer — business info, credit settings, auto-reminders toggle |

---

## Prompt 40 — Inventory

**Artifact:** https://claude.ai/code/artifact/7e2d35b4-c9b8-4581-a0c5-78249075e113  
**Source:** `p40/`

Inventory overview with Low/Out counters, product detail with stock movement history, and stock management forms.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Inventory overview — Total/Low/Out counters, 3-layer state distinction (icon bg + bar + badge) |
| `ProductDetail.dc.html` | Product detail — stock level, reorder threshold, 30-day movement history |
| `StockAdjust.dc.html` | Stock adjustment — add/remove/set exact, reason category, quantity stepper, preview |
| `StockTransfer.dc.html` | Stock transfer — branch-to-branch, transfer preview with post-transfer stock shown |

---

## Prompt 41 — Reports

**Artifact:** https://claude.ai/code/artifact/24fdbd45-2032-4dc3-b3f9-3ec7a905e59b  
**Source:** `p41/`

Reports list with AI Insights 2×2 grid, plus P&L report exemplar showing all UI-UX §80 elements.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Reports list — 2×2 AI insights grid, period selector, 6 report types with values |
| `PnLReport.dc.html` | P&L report — 3-metric summary, 6-month bar chart, category table, drill-down hint, export, Ask AI |

---

## Prompt 42 — Alerts and AI Conversation

**Artifact:** https://claude.ai/code/artifact/b1591ec0-153d-4e33-a5c6-4bf2ad5dfb99  
**Source:** `p42/`

Alerts center with actionable rows and full-screen AI conversation view with voice bar at bottom.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Alerts center — All/Important/Info tabs, 7 alert rows with action links |
| `AIChat.dc.html` | AI conversation — chat bubbles, suggested replies, voice bar at bottom with hold-to-speak mic |

---

## Prompt 43 — Settings

**Artifact:** https://claude.ai/code/artifact/c33b91cb-f55c-498f-ae83-29b6b8eec24d  
**Source:** `p43/`

Full Settings list (all UI-UX §94 rows) and Business Profile edit form.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Settings list — Business, Operations, App sections; toggle rows, new badge, delete row |
| `BusinessProfile.dc.html` | Business Profile edit — logo, business type chips, GSTIN verification, GST filing, address |

---

## Prompt 44 — Reusable Component States

**Artifact:** https://claude.ai/code/artifact/0a21a6ba-1487-4409-b7fe-0bd19ae74f5c  
**Source:** `p44/`

Six reusable component states. Every screen in Prompts 33–43 references these instead of per-screen redraw.

| Artboard | Description |
|---|---|
| `Main.dc.html` | Overview — all 6 states with reference grid linking P33–P43 screens |
| `EmptyState.dc.html` | Empty — icon, headline, one-line desc, CTA; 3 context variations; anatomy guide |
| `ErrorState.dc.html` | Error — full-screen, inline, field-level validation; plain language + error code |
| `LoadingState.dc.html` | Loading — list skeleton shimmer, banner+chart skeleton; anatomy rules |
| `OfflineState.dc.html` | Offline — amber banner, cached data with stale label, write queue |
| `ConflictState.dc.html` | Conflict — side-by-side diff, keep mine / keep theirs / merge actions |
| `PermissionState.dc.html` | Permission Denied — role gate, plan gate with upgrade CTA, inline lock rows |

---

## Prompt 45 — Typography Tokens

**Artifact:** https://claude.ai/code/artifact/316583a7-a26f-48bc-850b-5b737e5e84b9
**Source:** `p45/`

13-step type scale covering every text style in Prompts 33–44 wireframes. Inter (variable) for English, Noto Sans Devanagari for Hindi/Marathi, Indic weight fallback map, line-height rationale.

| Artboard | Description |
|---|---|
| `TypeScale.dc.html` | Font stacks, 13-token type scale (display-xl to overline), Indic weight map, line-height rationale |

---

## Prompt 46 — Brand Color Tokens

**Artifact:** https://claude.ai/code/artifact/bc9a3966-6af4-4ff1-988d-2c8b9e10cfd0
**Source:** `p46/`

6 confirmed brand colors as 21 semantic tokens. Teal accent seen in Screens.png resolved: dropped (conflicts with warm palette, no unmet semantic role).

| Artboard | Description |
|---|---|
| `ColorTokens.dc.html` | Brand palette swatches, teal resolution, 21 semantic token map (primary/secondary/accent/success/warning/error/info/ai/background/surface/text/border) |

---

## Prompt 47 — Spacing, Corner Radius and Elevation

**Artifact:** https://claude.ai/code/artifact/01d55378-d6e5-4f8a-9b32-bac857cffce0
**Source:** `p47/`

4dp-base spacing scale, semantic spacing aliases, 7 corner-radius levels, 6 elevation layers with warm-brown shadows.

| Artboard | Description |
|---|---|
| `SpacingElevation.dc.html` | 12 space tokens, semantic aliases (--screen-margin/--card-padding/etc.), 7 radius levels (xs 4dp to full 9999dp plus AI 24dp), 6 elevation layers (Base/Surface/Elevated/Floating/AI Overlay/Modal) |

---

## Prompt 48 — Component Spec

**Artifact:** https://claude.ai/code/artifact/94261d9a-4e04-4b61-9209-8e1bbfe0157a
**Source:** `p48/`

Full spec for 26 components across Actions, Inputs, Containers, Identity, Overlays, Feedback, and Data Visualization groups. Every state per UI-UX §197–198.

| Artboard | Description |
|---|---|
| `ComponentSpec.dc.html` | Button, IconButton, TextField, SearchField, Select, Checkbox, Switch, Card, MetricCard, ListItem, Avatar, Badge, Chip, Tabs, BottomSheet, Modal/Dialog, Toast, Banner, Progress, Skeleton, EmptyState, ErrorState, Chart, Table, DocumentPreview — all states |

---

## Prompt 49 — AI Visual Components

**Artifact:** https://claude.ai/code/artifact/6c544cd6-6265-4b6e-b5f9-ae392e1e7256
**Source:** `p49/`

AI Core layered-rings motif with 6 physics/motion states (Idle/Listening/Processing/Speaking/Error/Offline), plus all AI UI components from UI-UX §199.

| Artboard | Description |
|---|---|
| `AIVisuals.dc.html` | AI Core (ring anatomy + 6 motion states with animation physics), AI Status Pill, AI Briefing Card (4 priority tiers), AI Insight Card, AI Evidence Panel, AI Recommendation Card, AI Action Card, AI Approval, AI Result, AI Voice Waveform, AI Conversation Bubble |

---

## Prompt 50 — Icon Set Specification

**Artifact:** https://claude.ai/code/artifact/5cd84b6b-cb9a-418f-9e1a-8dd34c86e08c
**Source:** `p50/`

Complete icon set specification: construction rules, 10 AI Engine brand icons, 5 nav icons, 30+ module and action icons, label-pairing rule.

| Artboard | Description |
|---|---|
| `IconSpec.dc.html` | 24dp grid spec (2dp stroke, round cap/join, 2dp corner radius), engine icon mapping for all 10 confirmed engines, nav icons, module/action icon catalog, size token reference, label-pairing rule per UI-UX §194 |

---

*Phase 4 wireframe aesthetic: 390×844 px mobile, system-ui font, white/light-gray (#f5f5f5) backgrounds, blue (#2563eb) primary, red (#ef4444) error, green (#22c55e) success. No fake iOS chrome.*

*Phase 5 token spec aesthetic: 860px wide reference documents, brand background #FAF7F2 (Ivory White), text #3B2F2A (Deep Brown). All color and spacing values use the semantic token set defined in Prompts 45–47.*
