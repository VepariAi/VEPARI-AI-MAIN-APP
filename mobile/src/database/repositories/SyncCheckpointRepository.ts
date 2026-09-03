import type { Scalar } from '@op-engineering/op-sqlite';
import { getDb } from '../db';
import type { Repository } from '../types';

export interface SyncCheckpoint {
  id: string;
  entity: string;
  lastSyncedAt: number;
  serverVersion: number;
}

function rowToCheckpoint(row: Record<string, Scalar>): SyncCheckpoint {
  return {
    id: row['id'] as string,
    entity: row['entity'] as string,
    lastSyncedAt: row['last_synced_at'] as number,
    serverVersion: row['server_version'] as number,
  };
}

export class SyncCheckpointRepository implements Repository<SyncCheckpoint> {
  findById(id: string): Promise<SyncCheckpoint | null> {
    const db = getDb();
    const result = db.executeSync(
      `SELECT id, entity, last_synced_at, server_version
         FROM sync_checkpoints WHERE id = ?;`,
      [id],
    );
    const row = result.rows[0];
    return Promise.resolve(row ? rowToCheckpoint(row) : null);
  }

  findAll(): Promise<SyncCheckpoint[]> {
    const db = getDb();
    const result = db.executeSync(
      `SELECT id, entity, last_synced_at, server_version FROM sync_checkpoints;`,
    );
    return Promise.resolve(result.rows.map(rowToCheckpoint));
  }

  save(checkpoint: SyncCheckpoint): Promise<void> {
    const db = getDb();
    db.executeSync(
      `INSERT INTO sync_checkpoints (id, entity, last_synced_at, server_version)
         VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         entity = excluded.entity,
         last_synced_at = excluded.last_synced_at,
         server_version = excluded.server_version;`,
      [checkpoint.id, checkpoint.entity, checkpoint.lastSyncedAt, checkpoint.serverVersion],
    );
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    const db = getDb();
    db.executeSync(`DELETE FROM sync_checkpoints WHERE id = ?;`, [id]);
    return Promise.resolve();
  }
}
