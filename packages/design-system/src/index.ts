/**
 * @vepari/design-system — design tokens and component primitives.
 * Shared between mobile and any future web surfaces.
 * Components are thin wrappers; no business logic lives here.
 */

// ── Color tokens (match prototype CSS variables) ──────────────────────────────

export const Colors = {
  brown: '#3B2F2A',
  gold: '#C8A96B',
  ivory: '#FAF7F2',
  beige: '#F2E8D6',
  olive: '#5A6B4F',
  terra: '#B45B4A',
  indigo: '#4A3D6B',
  border: '#EDE5D8',
  muted: '#8A7060',
  dim: '#C0AFA5',
  white: '#FFFFFF',
  black: '#000000',
  // Semantic
  success: '#5A6B4F',
  error: '#B45B4A',
  warning: '#C8A96B',
} as const;

export type ColorKey = keyof typeof Colors;

// ── Typography ────────────────────────────────────────────────────────────────

export const Typography = {
  fontFamily: {
    sans: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: Colors.brown,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ── Screen dimensions (canonical phone frame from prototype) ──────────────────

export const Screen = {
  width: 390,
  height: 844,
} as const;
