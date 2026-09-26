// Unit tests for SecurityEventService — 5-layer security, Layer 5 (audit).
// PrismaService, logger, and metrics are mocked.

import { SecurityEventService } from '../security-event.service';

function makeDeps() {
  const prisma = {
    securityEvent: {
      create: jest.fn().mockResolvedValue({ id: 'ev-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
  const metrics = { increment: jest.fn() };
  return { prisma, logger, metrics };
}

function makeService(d: ReturnType<typeof makeDeps>) {
  return new SecurityEventService(
    d.prisma as unknown as ConstructorParameters<typeof SecurityEventService>[0],
    d.logger as unknown as ConstructorParameters<typeof SecurityEventService>[1],
    d.metrics as unknown as ConstructorParameters<typeof SecurityEventService>[2],
  );
}

describe('SecurityEventService.record', () => {
  it('persists an event and increments a metric', async () => {
    const d = makeDeps();
    const svc = makeService(d);
    await svc.record({ type: 'AUTH_FAILURE', severity: 'warning', ipAddress: '1.2.3.4', detail: 'bad otp' });

    expect(d.prisma.securityEvent.create).toHaveBeenCalledTimes(1);
    const arg = (d.prisma.securityEvent.create as jest.Mock).mock.calls[0][0];
    expect(arg.data.type).toBe('AUTH_FAILURE');
    expect(arg.data.severity).toBe('warning');
    expect(arg.data.ipAddress).toBe('1.2.3.4');
    expect(d.metrics.increment).toHaveBeenCalledWith(
      'security_events_total',
      { type: 'AUTH_FAILURE', severity: 'warning' },
    );
  });

  it('omits optional fields when not provided (exactOptionalProps-safe)', async () => {
    const d = makeDeps();
    const svc = makeService(d);
    await svc.record({ type: 'INJECTION_ATTEMPT', severity: 'critical' });
    const arg = (d.prisma.securityEvent.create as jest.Mock).mock.calls[0][0];
    expect(arg.data).not.toHaveProperty('businessId');
    expect(arg.data).not.toHaveProperty('ipAddress');
  });

  it('never throws into the caller path when the DB write fails', async () => {
    const d = makeDeps();
    (d.prisma.securityEvent.create as jest.Mock).mockRejectedValue(new Error('db down'));
    const svc = makeService(d);
    await expect(svc.record({ type: 'RATE_LIMIT_BLOCK', severity: 'info' })).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });

  it('recentCritical queries critical events for a business with a bounded limit', async () => {
    const d = makeDeps();
    const svc = makeService(d);
    await svc.recentCritical('biz-1', 500);
    const arg = (d.prisma.securityEvent.findMany as jest.Mock).mock.calls[0][0];
    expect(arg.where).toEqual({ businessId: 'biz-1', severity: 'critical' });
    expect(arg.take).toBe(200); // capped
  });
});
