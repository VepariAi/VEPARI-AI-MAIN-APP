// Unit tests for the Connection Portfolio engine — PROMPTS 231-235, 238.

import { AdapterRegistry } from '../adapters/adapter-registry.service';
import { ConnectionSyncService } from '../connection-sync.service';
import { WebhookProcessorService } from '../webhook-processor.service';
import { OAuthFlowService } from '../oauth-flow.service';
import type { ConnectionAdapter } from '../adapters/adapter.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';

function stubAdapter(over: Partial<ConnectionAdapter> = {}): ConnectionAdapter {
  return {
    providerId: 'stub',
    name: 'Stub',
    category: 'PAYMENTS',
    authType: 'API_KEY',
    async sync() { return { records: [{ externalId: 'x1', kind: 'payment', occurredAt: 'now', amountInPaise: 100, raw: {} }] }; },
    async handleWebhook() { return { accepted: true, records: [] }; },
    async healthCheck() { return { healthy: true }; },
    ...over,
  };
}

describe('AdapterRegistry', () => {
  it('registers and resolves adapters', () => {
    const reg = new AdapterRegistry();
    const a = stubAdapter();
    reg.register(a);
    expect(reg.has('stub')).toBe(true);
    expect(reg.get('stub')).toBe(a);
    expect(reg.list()).toHaveLength(1);
  });

  it('throws for an unknown provider', () => {
    const reg = new AdapterRegistry();
    expect(() => reg.get('missing')).toThrow(NotFoundException);
  });
});

describe('ConnectionSyncService', () => {
  it('runs a successful sync and returns normalized records', async () => {
    const reg = new AdapterRegistry();
    reg.register(stubAdapter());
    const svc = new ConnectionSyncService(reg);
    const result = await svc.runSync({ businessId: 'b', connectionId: 'c', providerId: 'stub', credentials: {} });
    expect(result.status).toBe('ok');
    expect(result.recordCount).toBe(1);
  });

  it('maps a *_not_configured error to degraded, not failed', async () => {
    const reg = new AdapterRegistry();
    reg.register(stubAdapter({ async sync() { throw new Error('provider_not_configured'); } }));
    const svc = new ConnectionSyncService(reg);
    const result = await svc.runSync({ businessId: 'b', connectionId: 'c', providerId: 'stub', credentials: {} });
    expect(result.status).toBe('degraded');
  });

  it('returns failed (not throw) for an unknown provider', async () => {
    const svc = new ConnectionSyncService(new AdapterRegistry());
    const result = await svc.runSync({ businessId: 'b', connectionId: 'c', providerId: 'nope', credentials: {} });
    expect(result.status).toBe('failed');
    expect(result.error).toBe('no_adapter');
  });

  it('maps a hard adapter error to failed', async () => {
    const reg = new AdapterRegistry();
    reg.register(stubAdapter({ async sync() { throw new Error('boom'); } }));
    const svc = new ConnectionSyncService(reg);
    const result = await svc.runSync({ businessId: 'b', connectionId: 'c', providerId: 'stub', credentials: {} });
    expect(result.status).toBe('failed');
  });

  it('reports health with a degraded flag', async () => {
    const reg = new AdapterRegistry();
    reg.register(stubAdapter({ async healthCheck() { return { healthy: false, detail: 'down' }; } }));
    const svc = new ConnectionSyncService(reg);
    const report = await svc.checkHealth('stub', 'c', {});
    expect(report.healthy).toBe(false);
    expect(report.degraded).toBe(true);
    expect(report.detail).toBe('down');
  });
});

describe('WebhookProcessorService', () => {
  it('rejects an unknown provider without reaching an adapter', async () => {
    const svc = new WebhookProcessorService(new AdapterRegistry());
    const outcome = await svc.process({ providerId: 'nope', rawBody: '{}', headers: {}, secret: 's' });
    expect(outcome.accepted).toBe(false);
    expect(outcome.reason).toBe('unknown_provider');
  });

  it('delegates to the adapter for a known provider', async () => {
    const reg = new AdapterRegistry();
    reg.register(stubAdapter());
    const svc = new WebhookProcessorService(reg);
    const outcome = await svc.process({ providerId: 'stub', rawBody: '{}', headers: {}, secret: 's' });
    expect(outcome.accepted).toBe(true);
  });
});

describe('OAuthFlowService', () => {
  const base = {
    providerId: 'zoho_books',
    businessId: 'b1',
    connectionId: 'c1',
    clientId: 'client-abc',
    authorizeEndpoint: 'https://accounts.zoho.in/oauth/v2/auth',
    redirectUri: 'https://api.vepari.ai/v1/connections/oauth/callback',
    scopes: ['ZohoBooks.fullaccess.all'],
  };

  beforeEach(() => { process.env['OAUTH_STATE_SECRET'] = 'state-secret'; });

  it('builds an authorize URL with a signed state and round-trips it', () => {
    const svc = new OAuthFlowService();
    const { url, state } = svc.buildAuthorizeUrl(base);
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=client-abc');
    expect(url).toContain(`state=`);
    const payload = svc.validateState(state);
    expect(payload.businessId).toBe('b1');
    expect(payload.connectionId).toBe('c1');
    expect(payload.providerId).toBe('zoho_books');
  });

  it('rejects a tampered state', () => {
    const svc = new OAuthFlowService();
    const { state } = svc.buildAuthorizeUrl(base);
    const tampered = state.slice(0, -2) + (state.endsWith('aa') ? 'bb' : 'aa');
    expect(() => svc.validateState(tampered)).toThrow(BadRequestException);
  });

  it('rejects an expired state', () => {
    const svc = new OAuthFlowService();
    const { state } = svc.buildAuthorizeUrl(base);
    expect(() => svc.validateState(state, -1)).toThrow(BadRequestException);
  });

  it('rejects a malformed state', () => {
    const svc = new OAuthFlowService();
    expect(() => svc.validateState('garbage')).toThrow(BadRequestException);
  });
});
