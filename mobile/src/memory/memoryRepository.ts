import { getDb } from '@/database/db';

export type MemoryType =
  | 'sale'
  | 'expense'
  | 'credit_given'
  | 'credit_received'
  | 'stock_update'
  | 'customer_note'
  | 'supplier_note'
  | 'unknown';

export interface Memory {
  id: string;
  businessId: string;
  type: MemoryType;
  amountPaise?: number;
  description?: string;
  party?: string;
  itemName?: string;
  quantity?: number;
  rawTranscript: string;
  confidence: number;
  createdAt: number;
  synced: boolean;
}

export function saveMemory(memory: Memory): void {
  const db = getDb();
  db.executeSync(
    `INSERT OR REPLACE INTO memories
      (id, business_id, type, amount_paise, description, party, item_name,
       quantity, raw_transcript, confidence, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      memory.id,
      memory.businessId,
      memory.type,
      memory.amountPaise ?? null,
      memory.description ?? null,
      memory.party ?? null,
      memory.itemName ?? null,
      memory.quantity ?? null,
      memory.rawTranscript,
      memory.confidence,
      memory.createdAt,
      memory.synced ? 1 : 0,
    ],
  );
}

export function listRecentMemories(businessId: string, limit = 50): Memory[] {
  const db = getDb();
  const result = db.executeSync(
    `SELECT * FROM memories WHERE business_id = ? ORDER BY created_at DESC LIMIT ?`,
    [businessId, limit],
  );
  return result.rows.map(row => {
    const mem: Memory = {
      id: row['id'] as string,
      businessId: row['business_id'] as string,
      type: row['type'] as MemoryType,
      rawTranscript: row['raw_transcript'] as string,
      confidence: Number(row['confidence']),
      createdAt: Number(row['created_at']),
      synced: row['synced'] === 1,
    };
    if (row['amount_paise'] != null) mem.amountPaise = Number(row['amount_paise']);
    if (row['description'] != null) mem.description = row['description'] as string;
    if (row['party'] != null) mem.party = row['party'] as string;
    if (row['item_name'] != null) mem.itemName = row['item_name'] as string;
    if (row['quantity'] != null) mem.quantity = Number(row['quantity']);
    return mem;
  });
}
