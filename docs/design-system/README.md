# Vepari AI Design System — Phase 5 Reference

Single source of truth for all design tokens and component specifications.
Phase 6 (screens) and Phase 9 (production implementation) work from this directory directly.

## Files

| File | Purpose |
|------|---------|
| [`tokens.ts`](./tokens.ts) | **Implementation source** — import this in React Native components. All token values live here. |
| [`catalog.html`](./catalog.html) | **Browsable reference** — open in any browser; Storybook-style catalog with live rendered specimens. |

## Token Categories

| Category | Tokens | Source prompt |
|----------|--------|--------------|
| Brand primitives | 6 locked hex values | P46 |
| Dark mode primitives | 10 warm brown-black dm- values | P56 |
| Semantic colors (light) | 21 tokens | P46 |
| Semantic colors (dark) | 14-slot alias table | P56 |
| Typography | 13 type scale tokens, 6 font families | P45 |
| Spacing scale | 12 step tokens (base 4dp) | P47 |
| Semantic spacing | 11 aliases (screenMargin, cardPadding, etc.) | P47 |
| Corner radius | 7 levels (xs–full + ai=24) | P47 |
| Elevation | 6 layers with warm Deep Brown shadows | P47 |
| Motion / Spring | 5 spring presets + AI Core state values | P51 |
| Bottom navigation | Exact px/dp spec (80dp bar, 48dp FAB) | P53 |
| Accessibility audit | WCAG AA pass/fail table | P46 |
| Localization | String-expansion rules, locale constants | P52 |

## Brand Primitives (locked)

```
Deep Brown   #3B2F2A   brand.brown    — primary text, nav, buttons
Heritage Gold #C8A96B  brand.gold     — accent, active states (decorative only on light bg)
Olive Green  #5A6B4F   brand.olive    — success states
Terracotta   #B45B4A   brand.terra    — warning/accent
Warm Beige   #F2E8D6   brand.beige    — surface subtle
Ivory White  #FAF7F2   brand.ivory    — primary background
AI Indigo    #4A3D6B   colors.ai      — derived; AI surfaces only (internal, not marketing)
```

Teal/cool blue-green was dropped (DEC-P46) — conflicts with warm palette. Do not reintroduce.

## WCAG AA Alerts

- **Heritage Gold FAILS** as text on all light surfaces (1.85–2.25:1). Use decoratively only.
  Exception: gold text on Deep Brown background passes (4.78:1).
- **Terracotta** passes large text on Ivory White (4.33:1) but fails normal text (< 4.5:1).
- Safe combinations: Deep Brown on Ivory (12.4:1), Deep Brown on White (14.1:1).

## Dark Mode

Token prefix `dm-` / exported as `brandDark` and `colorsDark`. Implementation deferred to Phase 7.
Dark palette uses warm brown-blacks — never slate or cool grays.

## Usage in React Native

```typescript
import { colors, typeScale, spacing, radius, elevation, motion } from '../docs/design-system/tokens';

// Never use raw hex — always reference a token
backgroundColor: colors.surface,          // ✓
backgroundColor: '#FFFFFF',               // ✗

// Type scale
fontSize: typeScale.body.size,
lineHeight: typeScale.body.size * typeScale.body.lineHeightEn,

// Spacing
paddingHorizontal: spacing.screenMargin,  // 20dp
paddingVertical: spacing.cardPadding,     // 16dp

// Motion (React Native Reanimated)
withSpring(1, motion.spring1)             // Snappy ~180ms
withSpring(1, motion.spring2)             // Gentle ~320ms
withSpring(1, motion.spring3)             // AI Breath ~1200ms
```

## Governing Decisions

- DL-001: Cinzel Semibold (wordmark only) + Inter Variable (UI) — Lora was not selected for UI
- DL-010: Full Indic script font-per-script mapping (Noto Sans family)
- DEC-P46: Teal dropped
- DEC-P48: Valence ≠ Direction on StatCard (independent props)
- `docs/decisions/decision-log.md` — authoritative decision log

## Status

Populated during Phase 5. Last updated: P57 (design system compilation).
