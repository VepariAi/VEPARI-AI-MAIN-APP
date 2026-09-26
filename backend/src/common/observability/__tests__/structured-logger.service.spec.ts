// Unit tests for StructuredLogger + redact — PROMPT 210.

import { StructuredLogger, redact } from '../structured-logger.service';
import { runWithContext } from '../correlation';

describe('redact', () => {
  it('redacts sensitive keys', () => {
    const out = redact({ username: 'ram', password: 'secret123', token: 'abc' }) as Record<string, unknown>;
    expect(out['username']).toBe('ram');
    expect(out['password']).toBe('[REDACTED]');
    expect(out['token']).toBe('[REDACTED]');
  });

  it('redacts nested sensitive keys', () => {
    const out = redact({ user: { name: 'x', apiKey: 'k' } }) as { user: Record<string, unknown> };
    expect(out.user['name']).toBe('x');
    expect(out.user['apiKey']).toBe('[REDACTED]');
  });

  it('handles arrays and primitives', () => {
    expect(redact([1, 2, 3])).toEqual([1, 2, 3]);
    expect(redact('plain')).toBe('plain');
    expect(redact(null)).toBeNull();
  });

  it('stops at max depth without throwing', () => {
    const deep: Record<string, unknown> = {};
    let cur = deep;
    for (let i = 0; i < 20; i++) {
      cur['next'] = {};
      cur = cur['next'] as Record<string, unknown>;
    }
    expect(() => redact(deep)).not.toThrow();
  });
});

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let stdout: jest.SpyInstance;
  let stderr: jest.SpyInstance;

  beforeEach(() => {
    process.env['LOG_LEVEL'] = 'debug';
    logger = new StructuredLogger();
    stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdout.mockRestore();
    stderr.mockRestore();
  });

  it('emits a JSON info line to stdout', () => {
    logger.info('hello', { count: 3 });
    expect(stdout).toHaveBeenCalledTimes(1);
    const line = JSON.parse((stdout.mock.calls[0]![0] as string).trim());
    expect(line.level).toBe('info');
    expect(line.msg).toBe('hello');
    expect(line.meta.count).toBe(3);
  });

  it('emits errors to stderr', () => {
    logger.error('boom');
    expect(stderr).toHaveBeenCalledTimes(1);
    const line = JSON.parse((stderr.mock.calls[0]![0] as string).trim());
    expect(line.level).toBe('error');
  });

  it('includes correlation id from context', () => {
    runWithContext({ correlationId: 'corr-123', startTime: Date.now() }, () => {
      logger.info('with-context');
    });
    const line = JSON.parse((stdout.mock.calls[0]![0] as string).trim());
    expect(line.correlationId).toBe('corr-123');
  });

  it('redacts sensitive meta fields', () => {
    logger.info('login', { phone: '9999', password: 'nope' });
    const line = JSON.parse((stdout.mock.calls[0]![0] as string).trim());
    expect(line.meta.password).toBe('[REDACTED]');
    expect(line.meta.phone).toBe('9999');
  });
});
