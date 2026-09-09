// Unit tests for FeatureFlagsService — PROMPT 19x (Phase 19).
import { FeatureFlagsService } from '../feature-flags.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  beforeEach(() => {
    service = new FeatureFlagsService();
    // Clean env between tests
    delete process.env['FEATURE_AI_TOOL_CALLING'];
    delete process.env['FEATURE_BETA_FEATURES'];
  });

  it('returns default value for a known flag', () => {
    const result = service.evaluate('AI_TOOL_CALLING');
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('default');
  });

  it('returns default false for experimental flags', () => {
    const result = service.evaluate('BETA_FEATURES');
    expect(result.enabled).toBe(false);
  });

  it('respects env var override (true)', () => {
    process.env['FEATURE_BETA_FEATURES'] = 'true';
    const result = service.evaluate('BETA_FEATURES');
    expect(result.enabled).toBe(true);
    expect(result.reason).toContain('env:');
    delete process.env['FEATURE_BETA_FEATURES'];
  });

  it('respects env var override (false)', () => {
    process.env['FEATURE_AI_TOOL_CALLING'] = 'false';
    const result = service.evaluate('AI_TOOL_CALLING');
    expect(result.enabled).toBe(false);
    delete process.env['FEATURE_AI_TOOL_CALLING'];
  });

  it('runtime override takes precedence over env', () => {
    process.env['FEATURE_BETA_FEATURES'] = 'false';
    service.setOverride('BETA_FEATURES', true);
    const result = service.evaluate('BETA_FEATURES');
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('override');
    delete process.env['FEATURE_BETA_FEATURES'];
  });

  it('clearOverride reverts to env/default', () => {
    service.setOverride('BETA_FEATURES', true);
    service.clearOverride('BETA_FEATURES');
    const result = service.evaluate('BETA_FEATURES');
    expect(result.reason).toBe('default');
    expect(result.enabled).toBe(false);
  });

  it('enterprise plan always enables flags', () => {
    const result = service.evaluate('BETA_FEATURES', { plan: 'enterprise' });
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('plan:enterprise');
  });

  it('evaluateAll returns all evaluations', () => {
    const results = service.evaluateAll(['AI_TOOL_CALLING', 'BETA_FEATURES']);
    expect(results).toHaveLength(2);
    expect(results.map(r => r.key)).toContain('AI_TOOL_CALLING');
  });

  it('isEnabled is a convenient boolean alias', () => {
    expect(service.isEnabled('AI_TOOL_CALLING')).toBe(true);
    expect(service.isEnabled('BETA_FEATURES')).toBe(false);
  });
});
