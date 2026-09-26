// Unit tests for ConnectionsService (Prisma/MySQL + encrypted credentials) — DL-011.
// PrismaService and EncryptionService are mocked.

import { ConnectionsService } from '../connections.service';
import { NotFoundException } from '@nestjs/common';

const BIZ = 'biz-conn';

function connRow(over: Record<string, unknown> = {}) {
  return {
    id: 'conn-1',
    businessId: BIZ,
    providerId: 'razorpay',
    providerName: 'Razorpay',
    status: 'PENDING',
    credentials: null,
    connectedAt: null,
    lastSyncAt: null,
    errorMessage: null,
    ...over,
  };
}

function makePrisma() {
  return {
    connection: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => connRow(data)),
      update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => connRow({ ...data })),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
}

// Fake encryption via base64 round-trip so ciphertext never contains the raw
// secret (mirrors the real service's property without doing real crypto).
function makeEncryption() {
  return {
    encryptMap: jest.fn((m: Record<string, string>) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(m)) out[k] = Buffer.from(v, 'utf8').toString('base64');
      return out;
    }),
    decryptMap: jest.fn((m: Record<string, string>) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(m)) out[k] = Buffer.from(v, 'base64').toString('utf8');
      return out;
    }),
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>, enc = makeEncryption()) {
  return new ConnectionsService(
    prisma as unknown as ConstructorParameters<typeof ConnectionsService>[0],
    enc as unknown as ConstructorParameters<typeof ConnectionsService>[1],
  );
}

describe('ConnectionsService.getProviders', () => {
  it('returns the provider catalogue', () => {
    const providers = makeService(makePrisma()).getProviders();
    expect(providers.length).toBeGreaterThan(0);
    expect(providers.find(p => p.id === 'razorpay')).toBeDefined();
  });
});

describe('ConnectionsService.createConnection', () => {
  it('creates a PENDING connection for a known provider', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    const conn = await svc.createConnection(BIZ, 'razorpay');
    expect(conn.status).toBe('PENDING');
    expect(conn.providerName).toBe('Razorpay');
    // Client-facing object must not carry credentials.
    expect(conn).not.toHaveProperty('credentials');
  });

  it('rejects an unknown provider', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.createConnection(BIZ, 'nonexistent')).rejects.toThrow(NotFoundException);
  });
});

describe('ConnectionsService.setCredentials', () => {
  it('encrypts credentials before storing and marks CONNECTED', async () => {
    const prisma = makePrisma();
    (prisma.connection.findFirst as jest.Mock).mockResolvedValue(connRow());
    const enc = makeEncryption();
    const svc = makeService(prisma, enc);

    await svc.setCredentials(BIZ, 'conn-1', { key_id: 'rzp_123', key_secret: 'shh' });

    expect(enc.encryptMap).toHaveBeenCalledWith({ key_id: 'rzp_123', key_secret: 'shh' });
    const updateArg = (prisma.connection.update as jest.Mock).mock.calls[0][0];
    // Stored values must be ciphertext, never the raw secret.
    const stored = updateArg.data.credentials as Record<string, string>;
    expect(JSON.stringify(stored)).not.toContain('rzp_123');
    expect(JSON.stringify(stored)).not.toContain('shh');
    // …and must decode back to the originals.
    expect(Buffer.from(stored['key_id']!, 'base64').toString('utf8')).toBe('rzp_123');
    expect(updateArg.data.status).toBe('CONNECTED');
  });

  it('throws NotFound for a connection in another business', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.setCredentials(BIZ, 'nope', { k: 'v' })).rejects.toThrow(NotFoundException);
  });
});

describe('ConnectionsService.getDecryptedCredentials', () => {
  it('decrypts stored credentials for internal use', async () => {
    const prisma = makePrisma();
    (prisma.connection.findFirst as jest.Mock).mockResolvedValue(
      connRow({
        credentials: {
          key_id: Buffer.from('rzp_123', 'utf8').toString('base64'),
          key_secret: Buffer.from('shh', 'utf8').toString('base64'),
        },
      }),
    );
    const svc = makeService(prisma);
    const creds = await svc.getDecryptedCredentials(BIZ, 'conn-1');
    expect(creds).toEqual({ key_id: 'rzp_123', key_secret: 'shh' });
  });

  it('returns an empty map when no credentials stored', async () => {
    const prisma = makePrisma();
    (prisma.connection.findFirst as jest.Mock).mockResolvedValue(connRow());
    const svc = makeService(prisma);
    expect(await svc.getDecryptedCredentials(BIZ, 'conn-1')).toEqual({});
  });
});

describe('ConnectionsService list/get/delete are tenant-scoped', () => {
  it('getConnection scopes by id + businessId', async () => {
    const prisma = makePrisma();
    (prisma.connection.findFirst as jest.Mock).mockResolvedValue(connRow());
    const svc = makeService(prisma);
    await svc.getConnection(BIZ, 'conn-1');
    expect((prisma.connection.findFirst as jest.Mock).mock.calls[0][0].where).toEqual({ id: 'conn-1', businessId: BIZ });
  });

  it('deleteConnection checks existence then deletes', async () => {
    const prisma = makePrisma();
    (prisma.connection.findFirst as jest.Mock).mockResolvedValue(connRow());
    const svc = makeService(prisma);
    await svc.deleteConnection(BIZ, 'conn-1');
    expect(prisma.connection.delete).toHaveBeenCalledWith({ where: { id: 'conn-1' } });
  });

  it('deleteConnection throws NotFound when missing', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.deleteConnection(BIZ, 'nope')).rejects.toThrow(NotFoundException);
  });
});
