import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/crypto/encryption.service';

export type ProviderCategory = 'ACCOUNTING' | 'PAYMENTS' | 'ECOMMERCE' | 'LOGISTICS' | 'BANKING' | 'COMMUNICATION';
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  description: string;
  logoSymbol: string;
  authType: 'OAUTH' | 'API_KEY' | 'WEBHOOK';
  isAvailable: boolean;
  comingSoon: boolean;
}

export interface Connection {
  id: string;
  businessId: string;
  providerId: string;
  providerName: string;
  status: ConnectionStatus;
  connectedAt: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
}

const PROVIDERS: Provider[] = [
  { id: 'tally', name: 'Tally Prime', category: 'ACCOUNTING', description: 'Sync your ledger data with Tally Prime', logoSymbol: 'T', authType: 'WEBHOOK', isAvailable: false, comingSoon: true },
  { id: 'zoho_books', name: 'Zoho Books', category: 'ACCOUNTING', description: 'Two-way sync with Zoho Books accounting', logoSymbol: 'Z', authType: 'OAUTH', isAvailable: false, comingSoon: true },
  { id: 'razorpay', name: 'Razorpay', category: 'PAYMENTS', description: 'Import Razorpay payment settlements automatically', logoSymbol: 'R', authType: 'API_KEY', isAvailable: false, comingSoon: true },
  { id: 'phonepe_biz', name: 'PhonePe Business', category: 'PAYMENTS', description: 'Sync PhonePe transaction history', logoSymbol: 'P', authType: 'OAUTH', isAvailable: false, comingSoon: true },
  { id: 'flipkart', name: 'Flipkart Seller', category: 'ECOMMERCE', description: 'Import Flipkart orders and settlements', logoSymbol: 'F', authType: 'API_KEY', isAvailable: false, comingSoon: true },
  { id: 'amazon_seller', name: 'Amazon Seller', category: 'ECOMMERCE', description: 'Sync Amazon Seller Central orders', logoSymbol: 'A', authType: 'OAUTH', isAvailable: false, comingSoon: true },
  { id: 'shiprocket', name: 'Shiprocket', category: 'LOGISTICS', description: 'Manage shipments and track deliveries', logoSymbol: 'S', authType: 'API_KEY', isAvailable: false, comingSoon: true },
  { id: 'icici_bank', name: 'ICICI Bank', category: 'BANKING', description: 'Import bank statements automatically', logoSymbol: 'I', authType: 'OAUTH', isAvailable: false, comingSoon: true },
  { id: 'hdfc_bank', name: 'HDFC Bank', category: 'BANKING', description: 'Import HDFC bank transactions', logoSymbol: 'H', authType: 'OAUTH', isAvailable: false, comingSoon: true },
  { id: 'whatsapp_business', name: 'WhatsApp Business', category: 'COMMUNICATION', description: 'Send invoices and alerts via WhatsApp', logoSymbol: 'W', authType: 'API_KEY', isAvailable: false, comingSoon: true },
];

interface ConnectionRow {
  id: string;
  businessId: string;
  providerId: string;
  providerName: string;
  status: string;
  credentials: unknown;
  connectedAt: Date | null;
  lastSyncAt: Date | null;
  errorMessage: string | null;
}

// Map a DB row to the client-facing Connection — NEVER includes credentials.
function toDomain(row: ConnectionRow): Connection {
  return {
    id: row.id,
    businessId: row.businessId,
    providerId: row.providerId,
    providerName: row.providerName,
    status: row.status as ConnectionStatus,
    connectedAt: row.connectedAt ? row.connectedAt.toISOString() : null,
    lastSyncAt: row.lastSyncAt ? row.lastSyncAt.toISOString() : null,
    errorMessage: row.errorMessage,
  };
}

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  getProviders(): Provider[] {
    return PROVIDERS;
  }

  async listConnections(businessId: string): Promise<Connection[]> {
    const rows = await this.prisma.connection.findMany({ where: { businessId } });
    return rows.map(r => toDomain(r as ConnectionRow));
  }

  async getConnection(businessId: string, connectionId: string): Promise<Connection> {
    const row = await this.prisma.connection.findFirst({ where: { id: connectionId, businessId } });
    if (!row) throw new NotFoundException('Connection not found');
    return toDomain(row as ConnectionRow);
  }

  async createConnection(businessId: string, providerId: string): Promise<Connection> {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new NotFoundException('Provider not found');

    const row = await this.prisma.connection.create({
      data: { businessId, providerId, providerName: provider.name, status: 'PENDING' },
    });
    return toDomain(row as ConnectionRow);
  }

  /**
   * Store integration credentials encrypted at rest (AES-256-GCM). Keys stay
   * clear so we know which credentials exist; values are ciphertext. Marks the
   * connection CONNECTED. Raw secrets are never persisted or returned.
   */
  async setCredentials(
    businessId: string,
    connectionId: string,
    credentials: Record<string, string>,
  ): Promise<Connection> {
    await this.getConnection(businessId, connectionId); // tenant-scoped existence
    const encrypted = this.encryption.encryptMap(credentials);
    const row = await this.prisma.connection.update({
      where: { id: connectionId },
      data: {
        credentials: encrypted as unknown as object,
        status: 'CONNECTED',
        connectedAt: new Date(),
        errorMessage: null,
      },
    });
    return toDomain(row as ConnectionRow);
  }

  /** Internal: load and decrypt credentials for sync/health. Never exposed via API. */
  async getDecryptedCredentials(businessId: string, connectionId: string): Promise<Record<string, string>> {
    const row = await this.prisma.connection.findFirst({ where: { id: connectionId, businessId } });
    if (!row) throw new NotFoundException('Connection not found');
    const stored = (row.credentials as Record<string, string> | null) ?? {};
    return this.encryption.decryptMap(stored);
  }

  async triggerSync(businessId: string, connectionId: string): Promise<{ message: string; connectionId: string }> {
    await this.getConnection(businessId, connectionId); // tenant-scoped existence
    await this.prisma.connection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date(), status: 'CONNECTED' },
    });
    return { message: 'Sync triggered', connectionId };
  }

  async deleteConnection(businessId: string, connectionId: string): Promise<void> {
    await this.getConnection(businessId, connectionId); // tenant-scoped existence
    await this.prisma.connection.delete({ where: { id: connectionId } });
  }
}
