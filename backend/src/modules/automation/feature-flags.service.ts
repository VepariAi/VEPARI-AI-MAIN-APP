// Feature flag service — PROMPT 19x (Phase 19).
// Server-side feature flag evaluation; flags are defined as env vars or
// in-memory overrides (no external flag service dependency for MVP).
// Evaluation is per-business and per-user; no flag state is sent to the client.

import { Injectable, Logger } from '@nestjs/common';

// ── Flag definitions ─────────────────────────────────────────────────────────

export type FeatureFlagKey =
  | 'AI_TOOL_CALLING'
  | 'GROWTH_RECOMMENDATIONS'
  | 'SCHEME_MATCHING'
  | 'TRANSLITERATION'
  | 'ADVANCED_ANALYTICS'
  | 'MULTI_USER_TEAM'
  | 'EXPORT_PDF'
  | 'VOICE_LATENCY_OPT'
  | 'REALTIME_SYNC'
  | 'BETA_FEATURES';

export interface FeatureFlagContext {
  businessId?: string;
  userId?: string;
  plan?: string;  // e.g. 'free', 'pro', 'enterprise'
}

export interface FlagEvaluation {
  key: FeatureFlagKey;
  enabled: boolean;
  reason: string;
}

// ── Defaults (override via env or test injection) ─────────────────────────────

const DEFAULT_FLAG_STATE: Record<FeatureFlagKey, boolean> = {
  AI_TOOL_CALLING:          true,
  GROWTH_RECOMMENDATIONS:   true,
  SCHEME_MATCHING:          true,
  TRANSLITERATION:          true,
  ADVANCED_ANALYTICS:       true,
  MULTI_USER_TEAM:          true,
  EXPORT_PDF:               true,
  VOICE_LATENCY_OPT:        false, // experimental
  REALTIME_SYNC:            false, // experimental
  BETA_FEATURES:            false,
};

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly overrides = new Map<FeatureFlagKey, boolean>();

  /**
   * Evaluate a single feature flag for a given context.
   * Evaluation order: test override → env var → default.
   */
  isEnabled(key: FeatureFlagKey, context: FeatureFlagContext = {}): boolean {
    return this.evaluate(key, context).enabled;
  }

  evaluate(key: FeatureFlagKey, context: FeatureFlagContext = {}): FlagEvaluation {
    // 1. Runtime override (for testing/admin)
    if (this.overrides.has(key)) {
      const enabled = this.overrides.get(key)!;
      return { key, enabled, reason: 'override' };
    }

    // 2. Environment variable (FEATURE_<KEY>=true|false)
    const envKey = `FEATURE_${key}`;
    const envVal = process.env[envKey];
    if (envVal !== undefined) {
      const enabled = envVal.toLowerCase() === 'true' || envVal === '1';
      return { key, enabled, reason: `env:${envKey}` };
    }

    // 3. Plan-based rules (enterprise always gets everything)
    if (context.plan === 'enterprise') {
      return { key, enabled: true, reason: 'plan:enterprise' };
    }

    // 4. Default
    const enabled = DEFAULT_FLAG_STATE[key] ?? false;
    return { key, enabled, reason: 'default' };
  }

  /** Evaluate multiple flags at once. */
  evaluateAll(keys: FeatureFlagKey[], context: FeatureFlagContext = {}): FlagEvaluation[] {
    return keys.map(k => this.evaluate(k, context));
  }

  /** Override a flag at runtime (useful for testing or admin kill-switches). */
  setOverride(key: FeatureFlagKey, enabled: boolean): void {
    this.logger.log(`Feature flag override: ${key} = ${enabled}`);
    this.overrides.set(key, enabled);
  }

  /** Remove a runtime override, reverting to env/default. */
  clearOverride(key: FeatureFlagKey): void {
    this.overrides.delete(key);
  }

  /** Clear all runtime overrides. */
  clearAllOverrides(): void {
    this.overrides.clear();
  }
}
