/**
 * Vepari AI — Design Token System
 * Phase 5 single source of truth. Phase 6 and Phase 9 import from here.
 * No raw hex values in component code — use these tokens only.
 *
 * Sources: P45 (typography) · P46 (color) · P47 (spacing/radius/elevation)
 *          P51 (motion) · P52 (locale) · P53 (bottom-nav) · P54 (stat-card)
 *          P55 (accessibility) · P56 (dark mode)
 */

// ─── Brand Primitives (do not use in component code — use semantic tokens) ───

export const brand = {
  brown:  '#3B2F2A',  // Deep Brown — primary brand
  gold:   '#C8A96B',  // Heritage Gold — secondary accent
  olive:  '#5A6B4F',  // Olive Green — success / positive
  terra:  '#B45B4A',  // Terracotta — warning / alert / destructive-light
  beige:  '#F2E8D6',  // Warm Beige — background surface
  ivory:  '#FAF7F2',  // Ivory White — screen canvas
} as const;

// ─── Dark Mode Primitives (warm brown-black, not slate) ──────────────────────
// P56: 12 dm- tokens. Implementation deferred to Phase 7.

export const brandDark = {
  dmBg:      '#1E1810',  // App canvas (dark)
  dmSurface: '#2C231B',  // Card / list bg (dark)
  dmCard:    '#382D23',  // Elevated card bg (dark)
  dmBrown:   '#E8DDD4',  // Text on dark
  dmGold:    '#D4A853',  // Heritage Gold (dark-adjusted, ≥4.5:1 on dm-surface)
  dmOlive:   '#7A9B6A',  // Olive green (dark-adjusted)
  dmTerra:   '#C4705F',  // Terracotta (dark-adjusted)
  dmIndigo:  '#8B7FB8',  // AI Indigo (dark-adjusted)
  dmBorder:  '#4A3C30',  // Borders on dark
  dmMuted:   '#A09080',  // Muted / secondary text (dark)
} as const;

// ─── Semantic Color Tokens — Light Mode ──────────────────────────────────────
// P46: 21 semantic slots. Every rendered color must map to one of these.

export const colors = {
  // Brand roles
  primary:          '#3B2F2A',  // Brand primary action (Deep Brown)
  primaryOn:        '#FAF7F2',  // Text on primary bg (Ivory White)
  secondary:        '#C8A96B',  // Secondary action / highlight (Heritage Gold)
  accent:           '#B45B4A',  // Warm accent / destructive-light (Terracotta)

  // Status
  success:          '#5A6B4F',  // Positive outcome (Olive Green)
  successSurface:   '#EEF2EB',  // Olive Green 10% tint
  warning:          '#B45B4A',  // Caution / low stock (Terracotta)
  warningSurface:   '#FAF0EC',  // Terracotta 10% tint
  error:            '#A0312A',  // Error / out-of-stock (Terracotta dark)
  errorSurface:     '#FAECEA',  // Error 8% tint
  info:             '#C8A96B',  // Informational (Heritage Gold)

  // AI-specific (internal only, not marketing)
  ai:               '#4A3D6B',  // AI Indigo (derived: blend Deep Brown + Gold, shifted 30° cool)
  aiSurface:        '#F0EDF8',  // AI Indigo 8% tint

  // Backgrounds
  background:       '#FAF7F2',  // App canvas (Ivory White)
  surface:          '#FFFFFF',  // Cards, inputs, panels
  surfaceSubtle:    '#F2E8D6',  // Counter cards, chips, filter tabs (Warm Beige)

  // Text
  textPrimary:      '#3B2F2A',  // All headings, primary labels
  textSecondary:    '#8A7060',  // Subtitles, metadata, timestamps (Brown 55%)
  textDisabled:     '#C0AFA5',  // Disabled labels (Brown 30%)

  // Borders
  border:           '#E8DDD0',  // Cards, inputs, dividers
  borderSubtle:     '#F2E8D6',  // List row bottoms, section dividers

  // Scrim
  scrim:            'rgba(59,47,42,0.50)',  // Behind --elevation-modal
  scrimAi:          'rgba(74,61,107,0.04)', // Ambient tint for AI overlay layer
} as const;

// ─── Semantic Color Tokens — Dark Mode (P56, 14-slot alias table) ────────────
// Wired in Phase 7 via useColorScheme. Structure mirrors light mode.

export const colorsDark = {
  primary:          '#E8DDD4',  // dm-brown
  primaryOn:        '#1E1810',  // dm-bg
  secondary:        '#D4A853',  // dm-gold (4.5:1 on dm-surface)
  accent:           '#C4705F',  // dm-terra
  success:          '#7A9B6A',  // dm-olive
  successSurface:   '#2A3825',  // olive 15% on dm-bg
  warning:          '#C4705F',  // dm-terra
  warningSurface:   '#3A2820',  // terra 12% on dm-bg
  error:            '#D4604E',  // terra +8 lightness
  errorSurface:     '#3D201C',  // error 10% on dm-bg
  info:             '#D4A853',  // dm-gold
  ai:               '#8B7FB8',  // dm-indigo
  aiSurface:        '#2A2538',  // indigo 15% on dm-bg
  background:       '#1E1810',  // dm-bg
  surface:          '#2C231B',  // dm-surface
  surfaceSubtle:    '#382D23',  // dm-card
  textPrimary:      '#E8DDD4',  // dm-brown
  textSecondary:    '#A09080',  // dm-muted
  textDisabled:     '#5C4C40',  // dm-muted dimmed
  border:           '#4A3C30',  // dm-border
  borderSubtle:     '#3A3028',  // dm-border subtle
  scrim:            'rgba(10,6,3,0.70)',
  scrimAi:          'rgba(139,127,184,0.08)',
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
// P45: 13 type tokens. All sizes in sp (scale-independent pixels).

export const fontFamily = {
  en:   "'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif",
  hi:   "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Mangal', sans-serif",
  ta:   "'Noto Sans Tamil', 'Latha', sans-serif",
  te:   "'Noto Sans Telugu', 'Gautami', sans-serif",
  kn:   "'Noto Sans Kannada', sans-serif",
  body: "'Noto Sans Devanagari', 'Inter Variable', 'Inter', system-ui, sans-serif",
  // Switch to en-first when locale = 'en': 'Inter Variable', 'Inter', system-ui
} as const;

export const typeScale = {
  displayXl: { size: 28, weight: '700', lineHeightEn: 1.20, lineHeightHi: 1.40, letterSpacing: -0.5 },
  display:    { size: 22, weight: '700', lineHeightEn: 1.20, lineHeightHi: 1.40, letterSpacing: -0.3 },
  titleXl:    { size: 20, weight: '700', lineHeightEn: 1.25, lineHeightHi: 1.45, letterSpacing: -0.2 },
  titleLg:    { size: 18, weight: '700', lineHeightEn: 1.30, lineHeightHi: 1.50, letterSpacing: -0.1 },
  titleMd:    { size: 16, weight: '700', lineHeightEn: 1.35, lineHeightHi: 1.55, letterSpacing:  0.0 },
  titleSm:    { size: 15, weight: '600', lineHeightEn: 1.40, lineHeightHi: 1.60, letterSpacing:  0.0 },
  bodyLg:     { size: 14, weight: '500', lineHeightEn: 1.40, lineHeightHi: 1.60, letterSpacing:  0.0 },
  body:       { size: 14, weight: '400', lineHeightEn: 1.45, lineHeightHi: 1.65, letterSpacing:  0.0 },
  bodySm:     { size: 13, weight: '400', lineHeightEn: 1.45, lineHeightHi: 1.65, letterSpacing:  0.0 },
  labelLg:    { size: 12, weight: '600', lineHeightEn: 1.35, lineHeightHi: 1.50, letterSpacing: +0.1 },
  label:      { size: 11, weight: '600', lineHeightEn: 1.30, lineHeightHi: 1.50, letterSpacing: +0.3 },
  caption:    { size: 11, weight: '400', lineHeightEn: 1.40, lineHeightHi: 1.60, letterSpacing: +0.2 },
  overline:   { size: 10, weight: '700', lineHeightEn: 1.30, lineHeightHi: 1.50, letterSpacing: +0.8, textTransform: 'uppercase' as const },
} as const;

// Weight fallback for Noto Sans Devanagari (no 500 bundled):
// 400 → 400 direct, 500 → 400, 600 → 700, 700 → 700 direct

// ─── Spacing ─────────────────────────────────────────────────────────────────
// P47: Base unit 4dp. All values multiples of 4.

export const space = {
  1:  4,   // Icon inner padding, micro gaps, border-width
  2:  8,   // Chip padding, badge padding, icon-to-text gap
  3:  12,  // List row vertical padding, button vertical padding
  4:  16,  // Card padding, form field, section gap, modal padding
  5:  20,  // Screen horizontal margin, FAB bottom offset
  6:  24,  // Section header top margin, card-to-card vertical gap
  8:  32,  // Large section gap
  10: 40,  // AI Core inner ring diameter, bottom sheet handle-to-title
  12: 48,  // Button height, input height, list row min-height
  14: 56,  // Bottom nav bar height, top app-bar height, Voice FAB size
  16: 64,  // Large avatar, AI Core outer ring diameter
  20: 80,  // AI Core total footprint (ring + glow), hero icon containers
} as const;

// Semantic spacing aliases
export const spacing = {
  screenMargin:      space[5],   // 20dp — left/right screen edge inset
  cardPadding:       space[4],   // 16dp — card content inset
  listRowPaddingV:   space[3],   // 12dp — list row vertical padding
  listRowPaddingH:   space[5],   // 20dp — aligns with screen margin
  sectionGap:        space[6],   // 24dp — gap between major sections
  buttonHeight:      space[12],  // 48dp — all primary buttons
  inputHeight:       space[12],  // 48dp — text fields, search bars
  chipHeight:        32,         // 32dp — filter tabs, period chips
  iconSm:            16,         // 16dp — inline icons
  icon:              24,         // 24dp — standard action icons, nav icons
  iconLg:            32,         // 32dp — card leading icons, badge icons
  touchTargetMin:    44,         // 44dp — minimum touch area (iOS HIG / WCAG 2.1)
  navBarHeight:      80,         // 80dp — bottom nav total height (with Voice FAB footprint)
  voiceFabSize:      56,         // 56dp — Voice FAB diameter (spec: 48dp btn in P53 mock, 56dp canonical)
  voiceFabRing:       3,         //  3dp — white ring around Voice FAB
  voiceFabElevation: 10,         // 10dp — Voice FAB elevation
} as const;

// ─── Corner Radius ───────────────────────────────────────────────────────────
// P47: 7 levels

export const radius = {
  xs:   4,     // Badge, pill, code token
  sm:   8,     // Button, chip, filter tab, text field, icon button
  md:   12,    // Card, MetricCard, alert banner, toast
  lg:   16,    // Dialog, modal container, bottom sheet inner area
  xl:   20,    // Bottom sheet top corners, drawer
  ai:   24,    // AI Briefing card, AI Insight, AI chat bubble
  full: 9999,  // Avatar, FAB, Voice button, toggle thumb
} as const;

// ─── Elevation / Shadows ─────────────────────────────────────────────────────
// P47: Warm Deep Brown shadows (not pure black).

export const elevation = {
  // React Native shadow props
  0: {
    shadowColor:   'transparent',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },
  1: {
    // Cards, MetricCards, inputs
    shadowColor:   '#3B2F2A',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius:  3,
    elevation:     1,
  },
  2: {
    // Dropdowns, menus, sticky headers
    shadowColor:   '#3B2F2A',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  8,
    elevation:     2,
  },
  3: {
    // FAB, bottom sheet, toast, snackbar
    shadowColor:   '#3B2F2A',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius:  16,
    elevation:     3,
  },
  ai: {
    // AI Core ring, AI Briefing, AI Insight panel
    shadowColor:   '#4A3D6B',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius:  24,
    elevation:     4,
  },
  modal: {
    // Modal dialogs, full-screen sheets
    shadowColor:   '#3B2F2A',
    shadowOffset:  { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius:  32,
    elevation:     5,
  },
} as const;

// z-index bands
export const zIndex = {
  base:     0,
  surface:  1,     // 1–9
  elevated: 10,    // 10–49
  floating: 50,    // 50–99
  ai:       100,   // 100–149
  modal:    150,   // 150+
} as const;

// ─── Motion — Spring Presets (P51) ───────────────────────────────────────────
// React Native Reanimated: withSpring(value, preset)

export const motion = {
  // Spring 1 — Snappy (UI controls: button press, chip select, tab indicator)
  spring1: { stiffness: 400, damping: 40, mass: 1 },  // ~180ms settle, ~2% overshoot

  // Spring 2 — Gentle (cards, sheets, screen push/pop)
  spring2: { stiffness: 200, damping: 28, mass: 1 },  // ~320ms settle, ~4% overshoot

  // Spring 3 — AI Breath (AI Core ring pulse — Listening state)
  spring3: { stiffness: 80,  damping: 12, mass: 1 },  // ~1200ms settle, ~8-10% overshoot

  // Spring 4 — Voice Amplitude (waveform bars driven by RMS, 30fps)
  spring4: { stiffness: 200, damping: 20, mass: 0.8 }, // ~220ms settle

  // Spring 5 — Inertial Scroll: use React Native ScrollView default (decay 0.998)

  // Reduced-motion fallback durations (ms)
  reducedDuration: {
    instant:   0,    // Micro-interactions — instant cut
    minimal:  100,   // Button press opacity fade
    short:    120,   // Toast, icon state changes
    medium:   150,   // Bottom sheet scrim, screen crossfade
    standard: 200,   // Sheet entry, panel appear
  },

  // AI Core state animations
  aiCore: {
    idle:      { scale: 1.0, glowBlur: 12, glowOpacity: 0.12 },
    listening: { scale: 1.06, glowBlur: 28, glowOpacity: 0.27 }, // Spring 3 pulse
    speaking:  { scale: 1.04, glowBlur: 22, glowOpacity: 0.22 }, // Spring 3 sustained
  },

  // Parallax: scrollY × 0.4 for Home hero (disable on prefers-reduced-motion)
  parallaxRate: 0.4,

  // List stagger: index × 40ms, max 8 items (rest instant)
  listStaggerMs: 40,
  listStaggerMax: 8,
} as const;

// ─── Bottom Navigation (P53) ─────────────────────────────────────────────────

export const bottomNav = {
  height:              80,   // Total bar height (dp)
  barBackground:       '#FFFFFF',
  barBorderTop:        '#EDE5DC',
  barShadow:           '0 -2px 12px rgba(59,47,42,0.08)',
  tabWidth:            44,   // Each tab touch target width
  labelSize:           9,    // sp — nav tab labels
  labelWeightDefault:  '500',
  labelWeightActive:   '700',
  labelColorDefault:   '#9A8A82',
  labelColorActive:    '#3B2F2A',
  iconSize:            24,
  activeDot:           { size: 4, color: '#C8A96B' },  // Heritage Gold dot under active tab

  // Voice FAB (center tab)
  voice: {
    size:             48,   // dp — button diameter (in mock; canonical is 56dp for spec)
    background:       '#3B2F2A',
    backgroundActive: '#C8A96B',
    ring:              3,   // dp — white outer ring
    elevation:        10,   // dp
    shadow:           '0 4px 10px rgba(59,47,42,0.35), 0 2px 4px rgba(59,47,42,0.20)',
    shadowActive:     '0 4px 10px rgba(200,169,107,0.45), 0 2px 4px rgba(200,169,107,0.25)',
  },

  // navBarOverflow: 'visible' required in React Navigation tabBarStyle
} as const;

// ─── StatCard Component (P54) ─────────────────────────────────────────────────

export interface StatCardProps {
  label: string;           // 'Revenue' | 'Expenses' | 'Net Profit'
  value: string;           // Pre-formatted: '₹8.4L', '₹1.2Cr'
  direction: 'up' | 'down' | 'neutral';
  valence: 'favorable' | 'unfavorable' | 'neutral';
  changePercent: number;
  period: string;
  onPress?: () => void;
}

export const statCard = {
  width:            '100%',
  minHeight:        80,    // dp
  padding:          spacing.cardPadding,
  radius:           radius.md,
  background:       colors.surface,
  border:           `1px solid ${colors.border}`,
  labelColor:       colors.textSecondary,
  labelSize:        typeScale.label.size,
  valueColor:       colors.textPrimary,
  valueWeight:      '700',
  valueSize:        typeScale.display.size,
  trendColors: {
    favorable:   colors.success,
    unfavorable: colors.error,
    neutral:     colors.textSecondary,
  },
} as const;

// ─── WCAG AA Accessibility Audit Results (P55) ────────────────────────────────
// For developer reference only. These are MEASURED values — do not alter.

export const accessibilityAudit = {
  // WCAG 2.1 AA thresholds
  normalTextThreshold:   4.5,
  largeTextThreshold:    3.0,
  uiComponentThreshold:  3.0,
  touchTargetMin:        44, // dp

  // Heritage Gold (#C8A96B) contrast ratios — FAILS on all light backgrounds
  heritageGoldOnIvory:   { ratio: 2.25, passes: false, use: 'decorative only' },
  heritageGoldOnWhite:   { ratio: 2.10, passes: false, use: 'decorative only' },
  heritageGoldOnBeige:   { ratio: 1.85, passes: false, use: 'decorative only' },

  // Gold PASSES only on Deep Brown background (use for text-on-dark)
  heritageGoldOnBrown:   { ratio: 4.78, passes: true,  use: 'text on primary bg' },

  // Terracotta on Ivory White — borderline for large text
  terracottaOnIvory:     { ratio: 4.33, passes: true,  note: 'normal text AA: barely passes 4.33 > 4.5? NO — fails normal, PASSES large (3.0)' },

  // Safe text combinations for component code
  safe: {
    deepBrownOnIvory:    { ratio: 12.4, use: 'primary text on canvas' },
    deepBrownOnWhite:    { ratio: 14.1, use: 'primary text on card' },
    brown55OnIvory:      { ratio:  5.2, use: 'secondary text on canvas' },
    oliveOnIvory:        { ratio:  4.9, use: 'success label on canvas' },
    goldOnBrown:         { ratio:  4.8, use: 'accent on primary bg' },
  },
} as const;

// ─── Localization Constants (P52) ────────────────────────────────────────────

export const locale = {
  supported: ['en-IN', 'hi-IN', 'mr-IN', 'ta-IN', 'te-IN', 'kn-IN'] as const,

  // Button expansion: labels NEVER truncate
  // Full-width: wrap to max 2 lines. Auto-width: grow width or stack.
  buttonMaxLines: 2,

  // Nav tab labels: max 6 chars per locale (escalate to translations team if exceeded)
  navLabelMaxChars: 6,

  // Indic expansion estimates vs English
  expansion: {
    'hi-IN': { visualWidthExpansion: '+60–90%', glyphWidth: '+80–120%' },
    'ta-IN': { visualWidthExpansion: '+80–120%', note: 'Complex ligatures at 11sp' },
  },
} as const;

// ─── Dark Mode (P56) — Implementation Deferred to Phase 7 ───────────────────
// Gold text on dark surfaces: restricted. See colorsDark.secondary (~4.5:1 on dm-surface).
// Toggle: Settings screen > Appearance > Theme. useColorScheme hook in Phase 7.

export const darkModeSpec = {
  goldOnDmSurface:   { ratio: 4.5, passes: true,  use: 'labels, values' },
  goldOnDmCard:      { ratio: 3.9, passes: false, note: 'large text only (≥18sp or 14sp bold)' },
  goldOnDmBg:        { ratio: 5.1, passes: true,  use: 'labels on bg' },
  phaseDeferred:     7, // Full implementation: useColorScheme, toggle, screen QA
} as const;

// ─── Re-export as unified namespace ──────────────────────────────────────────

export const designTokens = {
  brand,
  brandDark,
  colors,
  colorsDark,
  fontFamily,
  typeScale,
  space,
  spacing,
  radius,
  elevation,
  zIndex,
  motion,
  bottomNav,
  statCard,
  accessibilityAudit,
  locale,
  darkModeSpec,
} as const;

export default designTokens;
