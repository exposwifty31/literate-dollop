import type {
  PendingSync,
  PendingSyncCreateInput,
  PendingSyncStructuredError,
  PendingSyncType,
} from "@vettrack/contracts";
import {
  DEAD_LETTER_RETENTION_MS,
  PENDING_SYNC_SCHEMA_VERSION,
} from "@vettrack/contracts";
import { PENDING_SYNC_SCHEMA_SQL } from "@/lib/offline/pending-sync-sql";

export type SqlRunResult = {
  lastInsertRowId: number;
  changes: number;
};

export interface SqlExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<SqlRunResult>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
}

type PendingSyncRow = {
  id: number;
  type: string;
  endpoint: string;
  method: string;
  body: string;
  created_at: string;
  retries: number;
  status: string;
  client_timestamp: number;
  client_mutation_id: string;
  idempotency_key: string;
  schema_version: number;
  updated_at: string;
  structured_error: string | null;
  clinic_id: string | null;
  user_id: string | null;
  optimistic_data: string | null;
  error_message: string | null;
  equipment_name: string | null;
  conflict_payload: string | null;
};

function newQueueUuid(): string {
  return globalThis.crypto.randomUUID();
}

function rowToPendingSync(row: PendingSyncRow): PendingSync {
  return {
    id: row.id,
    type: row.type as PendingSyncType,
    endpoint: row.endpoint,
    method: row.method,
    body: row.body,
    createdAt: new Date(row.created_at),
    retries: row.retries,
    status: row.status as PendingSync["status"],
    clientTimestamp: row.client_timestamp,
    clientMutationId: row.client_mutation_id,
    idempotencyKey: row.idempotency_key,
    schemaVersion: row.schema_version,
    updatedAt: new Date(row.updated_at),
    structuredError: row.structured_error
      ? (JSON.parse(row.structured_error) as PendingSyncStructuredError)
      : null,
    clinicId: row.clinic_id ?? undefined,
    userId: row.user_id ?? undefined,
    optimisticData: row.optimistic_data ?? undefined,
    errorMessage: row.error_message ?? undefined,
    equipmentName: row.equipment_name ?? undefined,
    conflictPayload: row.conflict_payload ? JSON.parse(row.conflict_payload) : null,
  };
}

function materializeRow(op: PendingSyncCreateInput): Omit<PendingSync, "id"> {
  const now = new Date();
  return {
    ...op,
    clientMutationId: newQueueUuid(),
    idempotencyKey: newQueueUuid(),
    schemaVersion: PENDING_SYNC_SCHEMA_VERSION,
    updatedAt: now,
    structuredError: null,
    conflictPayload: null,
  };
}

const DEDUP_SYNC_TYPES = new Set<PendingSyncType>([
  "checkout",
  "return",
  "return_with_charge",
]);

export class PendingSyncStore {
  constructor(private readonly db: SqlExecutor) {}

  async init(): Promise<void> {
    await this.db.execAsync(PENDING_SYNC_SCHEMA_SQL);
  }
  async getPendingSync(id: number): Promise<PendingSync | undefined> {
    const row = await this.db.getFirstAsync<PendingSyncRow>(
      "SELECT * FROM pending_sync WHERE id = ?",
      id,
    );
    return row ? rowToPendingSync(row) : undefined;
  }

  async getAllPendingSync(): Promise<PendingSync[]> {
    const rows = await this.db.getAllAsync<PendingSyncRow>(
      "SELECT * FROM pending_sync ORDER BY created_at ASC",
    );
    return rows.map(rowToPendingSync);
  }

  async getPendingQueue(): Promise<PendingSync[]> {
    const rows = await this.db.getAllAsync<PendingSyncRow>(
      `SELECT * FROM pending_sync
       WHERE status = 'pending'
       ORDER BY client_timestamp ASC`,
    );
    return rows.map(rowToPendingSync);
  }

  async addPendingSync(op: PendingSyncCreateInput): Promise<number> {
    const row = materializeRow(op);

    if (DEDUP_SYNC_TYPES.has(op.type)) {
      const existing = await this.db.getFirstAsync<PendingSyncRow>(
        `SELECT * FROM pending_sync
         WHERE status = 'pending'
           AND endpoint = ?
           AND method = ?
           AND type = ?
         LIMIT 1`,
        op.endpoint,
        op.method,
        op.type,
      );
      if (existing) {
        await this.db.runAsync(
          `UPDATE pending_sync
           SET client_timestamp = ?, created_at = ?, body = ?, optimistic_data = ?,
               equipment_name = ?, retries = 0, updated_at = ?
           WHERE id = ?`,
          op.clientTimestamp,
          op.createdAt.toISOString(),
          op.body,
          op.optimisticData ?? null,
          op.equipmentName ?? null,
          new Date().toISOString(),
          existing.id,
        );
        return existing.id;
      }
    }

    const result = await this.db.runAsync(
      `INSERT INTO pending_sync (
        type, endpoint, method, body, created_at, retries, status,
        client_timestamp, client_mutation_id, idempotency_key, schema_version,
        updated_at, structured_error, clinic_id, user_id, optimistic_data,
        error_message, equipment_name, conflict_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.type,
      row.endpoint,
      row.method,
      row.body,
      row.createdAt.toISOString(),
      row.retries,
      row.status,
      row.clientTimestamp,
      row.clientMutationId,
      row.idempotencyKey,
      row.schemaVersion,
      row.updatedAt.toISOString(),
      null,
      row.clinicId ?? null,
      row.userId ?? null,
      row.optimisticData ?? null,
      row.errorMessage ?? null,
      row.equipmentName ?? null,
      null,
    );
    return result.lastInsertRowId;
  }

  async updatePendingSync(id: number, patch: Partial<PendingSync>): Promise<void> {
    const current = await this.getPendingSync(id);
    if (!current) return;

    const next: PendingSync = {
      ...current,
      ...patch,
      updatedAt: new Date(),
    };

    await this.db.runAsync(
      `UPDATE pending_sync SET
        type = ?, endpoint = ?, method = ?, body = ?, created_at = ?, retries = ?,
        status = ?, client_timestamp = ?, client_mutation_id = ?, idempotency_key = ?,
        schema_version = ?, updated_at = ?, structured_error = ?, clinic_id = ?,
        user_id = ?, optimistic_data = ?, error_message = ?, equipment_name = ?,
        conflict_payload = ?
       WHERE id = ?`,
      next.type,
      next.endpoint,
      next.method,
      next.body,
      next.createdAt.toISOString(),
      next.retries,
      next.status,
      next.clientTimestamp,
      next.clientMutationId,
      next.idempotencyKey,
      next.schemaVersion,
      next.updatedAt.toISOString(),
      next.structuredError ? JSON.stringify(next.structuredError) : null,
      next.clinicId ?? null,
      next.userId ?? null,
      next.optimisticData ?? null,
      next.errorMessage ?? null,
      next.equipmentName ?? null,
      next.conflictPayload ? JSON.stringify(next.conflictPayload) : null,
      id,
    );
  }

  async removePendingSync(id: number): Promise<void> {
    await this.db.runAsync("DELETE FROM pending_sync WHERE id = ?", id);
  }

  async recoverProcessingPendingSync(): Promise<number> {
    const processing = await this.db.getAllAsync<{ id: number }>(
      "SELECT id FROM pending_sync WHERE status = 'processing'",
    );
    if (processing.length === 0) return 0;
    await this.db.runAsync(
      `UPDATE pending_sync
       SET status = 'pending', updated_at = ?
       WHERE status = 'processing'`,
      new Date().toISOString(),
    );
    return processing.length;
  }

  async runStartupCleanup(): Promise<void> {
    const deadCutoff = new Date(Date.now() - DEAD_LETTER_RETENTION_MS).toISOString();
    await this.db.runAsync(
      "DELETE FROM pending_sync WHERE status = 'dead' AND created_at < ?",
      deadCutoff,
    );
    await this.db.runAsync("DELETE FROM pending_sync WHERE status = 'synced'");
  }
}

export function wrapExpoSqlite(db: {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<SqlRunResult>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
}): SqlExecutor {
  return db;
}

export async function openPendingSyncStore(): Promise<PendingSyncStore> {
  const SQLite = await import("expo-sqlite");
  const db = await SQLite.openDatabaseAsync("vettrack-pending-sync.db");
  const store = new PendingSyncStore(wrapExpoSqlite(db));
  await store.init();
  return store;
}
