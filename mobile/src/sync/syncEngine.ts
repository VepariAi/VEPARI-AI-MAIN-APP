// Offline-first sync engine.
// Records mutations to SQLite when offline; flushes them to the backend when online.
// No token/secret ever stored in SQLite — only business event payloads.

import { getDb } from '@/database/db';
import { getApiClient } from '@/services/api';

export type MutationType = 'CREATE_SALE' | 'CREATE_EXPENSE' | 'ADJUST_CREDIT' | 'ADJUST_PAYABLE' | 'ADJUST_STOCK';

export interface PendingMutation {
  id: string;
  type: MutationType;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

const MAX_RETRIES = 5;

// ── Queue a mutation for later sync ──────────────────────────────────────────

export function enqueueMutation(
  type: MutationType,
  payload: Record<string, unknown>,
): void {
  const db = getDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  db.executeSync(
    `INSERT INTO pending_mutations (id, entity, payload, created_at, retry_count)
     VALUES (?, ?, ?, ?, 0)`,
    [id, type, JSON.stringify({ type, payload }), Date.now()],
  );
}

// ── Read all pending mutations from SQLite ────────────────────────────────────

function loadPending(): PendingMutation[] {
  const db = getDb();
  const result = db.executeSync(
    `SELECT id, entity, payload, created_at, retry_count
     FROM pending_mutations
     WHERE retry_count < ?
     ORDER BY created_at ASC
     LIMIT 100`,
    [MAX_RETRIES],
  );
  return (result.rows ?? []).map(row => {
    let parsed: { type: MutationType; payload: Record<string, unknown> } = {
      type: 'CREATE_SALE',
      payload: {},
    };
    try {
      parsed = JSON.parse(row['payload'] as string) as typeof parsed;
    } catch { /* ignore malformed */ }
    return {
      id: row['id'] as string,
      type: parsed.type,
      payload: parsed.payload,
      createdAt: Number(row['created_at']),
      retryCount: Number(row['retry_count']),
    };
  });
}

// ── Remove successfully synced mutations ─────────────────────────────────────

function deleteSynced(ids: string[]): void {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.executeSync(`DELETE FROM pending_mutations WHERE id IN (${placeholders})`, ids);
}

// ── Increment retry count for rejected mutations ──────────────────────────────

function incrementRetry(ids: string[]): void {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.executeSync(
    `UPDATE pending_mutations SET retry_count = retry_count + 1 WHERE id IN (${placeholders})`,
    ids,
  );
}

// ── Flush pending mutations to the backend ────────────────────────────────────

export async function flushMutations(businessId: string): Promise<{
  flushed: number;
  failed: number;
}> {
  const pending = loadPending();
  if (pending.length === 0) return { flushed: 0, failed: 0 };

  const mutations = pending.map(m => ({
    id: m.id,
    type: m.type,
    payload: m.payload,
    createdAt: m.createdAt,
  }));

  const result = await getApiClient().post<{ accepted: string[]; rejected: Array<{ id: string; reason: string }> }>(
    `/businesses/${businessId}/sync/mutations`,
    { mutations },
  );

  deleteSynced(result.accepted);
  incrementRetry(result.rejected.map(r => r.id));

  return {
    flushed: result.accepted.length,
    failed: result.rejected.length,
  };
}

// ── Count queued mutations ────────────────────────────────────────────────────

export function getPendingCount(): number {
  const db = getDb();
  const result = db.executeSync(`SELECT COUNT(*) as cnt FROM pending_mutations WHERE retry_count < ?`, [MAX_RETRIES]);
  const row = (result.rows ?? [])[0];
  return row ? Number(row['cnt']) : 0;
}
