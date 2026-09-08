import { Injectable, NotFoundException } from '@nestjs/common';

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

// In-memory connections store — Phase 15; replace with Prisma in Phase 16
const connections = new Map<string, Map<string, Connection>>();

function businessConnections(businessId: string): Map<string, Connection> {
  if (!connections.has(businessId)) connections.set(businessId, new Map());
  return connections.get(businessId)!;
}

@Injectable()
export class ConnectionsService {
  getProviders(): Provider[] {
    return PROVIDERS;
  }

  listConnections(businessId: string): Connection[] {
    return Array.from(businessConnections(businessId).values());
  }

  getConnection(businessId: string, connectionId: string): Connection {
    const conn = businessConnections(businessId).get(connectionId);
    if (!conn) throw new NotFoundException('Connection not found');
    return conn;
  }

  createConnection(businessId: string, providerId: string): Connection {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new NotFoundException('Provider not found');

    const id = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const conn: Connection = {
      id,
      businessId,
      providerId,
      providerName: provider.name,
      status: 'PENDING',
      connectedAt: null,
      lastSyncAt: null,
      errorMessage: null,
    };

    businessConnections(businessId).set(id, conn);
    return conn;
  }

  triggerSync(businessId: string, connectionId: string): { message: string; connectionId: string } {
    const conn = this.getConnection(businessId, connectionId);
    const updated: Connection = {
      ...conn,
      lastSyncAt: new Date().toISOString(),
      status: 'CONNECTED',
    };
    businessConnections(businessId).set(connectionId, updated);
    return { message: 'Sync triggered', connectionId };
  }

  deleteConnection(businessId: string, connectionId: string): void {
    const store = businessConnections(businessId);
    if (!store.has(connectionId)) throw new NotFoundException('Connection not found');
    store.delete(connectionId);
  }
}
