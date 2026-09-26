import { getDb } from '../db';
import type { Repository } from '../types';

export interface SyncCheckpoint {
  id: string;
  entity: string;
  lastSyncedAt: number;
  serverVersion: number;
}

// op-sqlite 9.3.0 returns rows as plain objects (rows is a normalised array).
function rowToCheckpoint(row: Record<string, unknown>): SyncCheckpoint {
  return {
    id: row['id'] as string,
    entity: row['entity'] as string,
    lastSyncedAt: row['last_synced_at'] as number,
    serverVersion: row['server_version'] as number,
  };
}

export class SyncCheckpointRepository implements Repository<SyncCheckpoint> {
  async findById(id: string): Promise<SyncCheckpoint | null> {
    const db = getDb();
    const result = await db.execute(
      `SELECT id, entity, last_synced_at, server_version
         FROM sync_checkpoints WHERE id = ?;`,
      [id],
    );
    const row = result.rows[0];
    return row ? rowToCheckpoint(row) : null;
  }

  async findAll(): Promise<SyncCheckpoint[]> {
    const db = getDb();
    const result = await db.execute(
      `SELECT id, entity, last_synced_at, server_version FROM sync_checkpoints;`,
    );
    return result.rows.map(rowToCheckpoint);
  }

  async save(checkpoint: SyncCheckpoint): Promise<void> {
    const db = getDb();
    await db.execute(
      `INSERT INTO sync_checkpoints (id, entity, last_synced_at, server_version)
         VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         entity = excluded.entity,
         last_synced_at = excluded.last_synced_at,
         server_version = excluded.server_version;`,
      [checkpoint.id, checkpoint.entity, checkpoint.lastSyncedAt, checkpoint.serverVersion],
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.execute(`DELETE FROM sync_checkpoints WHERE id = ?;`, [id]);
  }
}
