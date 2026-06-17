import type { SqlExecutor, SqlRunResult } from "@/lib/offline/pending-sync-store";

type Row = Record<string, unknown>;

/**
 * Minimal in-memory SQL executor for PendingSyncStore integration tests.
 * Supports only the statements issued by pending-sync-store.ts.
 */
export function createTestSqlExecutor(): SqlExecutor {
  let rows: Row[] = [];
  let nextId = 1;

  function findRow(id: unknown): Row | undefined {
    return rows.find((row) => row.id === id);
  }

  return {
    async execAsync(sql: string): Promise<void> {
      if (sql.includes("CREATE TABLE")) return;
      if (sql.includes("CREATE INDEX")) return;
      throw new Error(`Unsupported exec SQL in test executor: ${sql}`);
    },

    async runAsync(sql: string, ...params: unknown[]): Promise<SqlRunResult> {
      const normalized = sql.replace(/\s+/g, " ").trim();

      if (normalized.startsWith("INSERT INTO pending_sync")) {
        const row: Row = {
          id: nextId++,
          type: params[0],
          endpoint: params[1],
          method: params[2],
          body: params[3],
          created_at: params[4],
          retries: params[5],
          status: params[6],
          client_timestamp: params[7],
          client_mutation_id: params[8],
          idempotency_key: params[9],
          schema_version: params[10],
          updated_at: params[11],
          structured_error: params[12],
          clinic_id: params[13],
          user_id: params[14],
          optimistic_data: params[15],
          error_message: params[16],
          equipment_name: params[17],
          conflict_payload: params[18],
        };
        rows.push(row);
        return { lastInsertRowId: row.id as number, changes: 1 };
      }

      if (normalized.startsWith("UPDATE pending_sync SET") && normalized.includes("WHERE id = ?")) {
        const id = params[params.length - 1];
        const row = findRow(id);
        if (!row) return { lastInsertRowId: 0, changes: 0 };
        const values = params.slice(0, -1);
        const fields = [
          "type",
          "endpoint",
          "method",
          "body",
          "created_at",
          "retries",
          "status",
          "client_timestamp",
          "client_mutation_id",
          "idempotency_key",
          "schema_version",
          "updated_at",
          "structured_error",
          "clinic_id",
          "user_id",
          "optimistic_data",
          "error_message",
          "equipment_name",
          "conflict_payload",
        ];
        fields.forEach((field, index) => {
          row[field] = values[index];
        });
        return { lastInsertRowId: row.id as number, changes: 1 };
      }

      if (normalized.includes("SET status = 'pending'") && normalized.includes("status = 'processing'")) {
        let changes = 0;
        for (const row of rows) {
          if (row.status === "processing") {
            row.status = "pending";
            row.updated_at = params[0];
            changes += 1;
          }
        }
        return { lastInsertRowId: 0, changes };
      }

      if (normalized.startsWith("DELETE FROM pending_sync WHERE id = ?")) {
        const before = rows.length;
        rows = rows.filter((row) => row.id !== params[0]);
        return { lastInsertRowId: 0, changes: before - rows.length };
      }

      if (normalized.startsWith("DELETE FROM pending_sync WHERE status = 'dead'")) {
        const before = rows.length;
        rows = rows.filter(
          (row) => !(row.status === "dead" && String(row.created_at) < String(params[0])),
        );
        return { lastInsertRowId: 0, changes: before - rows.length };
      }

      if (normalized === "DELETE FROM pending_sync WHERE status = 'synced'") {
        const before = rows.length;
        rows = rows.filter((row) => row.status !== "synced");
        return { lastInsertRowId: 0, changes: before - rows.length };
      }

      if (
        normalized.includes("UPDATE pending_sync") &&
        normalized.includes("WHERE id = ?") &&
        normalized.includes("client_timestamp = ?")
      ) {
        const id = params[params.length - 1];
        const row = findRow(id);
        if (!row) return { lastInsertRowId: 0, changes: 0 };
        [
          "client_timestamp",
          "created_at",
          "body",
          "optimistic_data",
          "equipment_name",
          "retries",
          "updated_at",
        ].forEach((field, index) => {
          row[field] = params[index];
        });
        return { lastInsertRowId: row.id as number, changes: 1 };
      }

      throw new Error(`Unsupported run SQL in test executor: ${normalized}`);
    },

    async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
      const normalized = sql.replace(/\s+/g, " ").trim();

      if (normalized === "SELECT * FROM pending_sync WHERE id = ?") {
        return (findRow(params[0]) as T | undefined) ?? null;
      }

      if (
        normalized.includes("FROM pending_sync") &&
        normalized.includes("status = 'pending'") &&
        normalized.includes("LIMIT 1")
      ) {
        const match = rows.find(
          (row) =>
            row.status === "pending" &&
            row.endpoint === params[0] &&
            row.method === params[1] &&
            row.type === params[2],
        );
        return (match as T | undefined) ?? null;
      }

      throw new Error(`Unsupported getFirst SQL in test executor: ${normalized}`);
    },

    async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
      const normalized = sql.replace(/\s+/g, " ").trim();

      if (normalized.includes("conflict_payload IS NOT NULL")) {
        return [...rows]
          .filter((row) => row.conflict_payload != null)
          .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))) as T[];
      }

      if (normalized.includes("ORDER BY created_at ASC")) {
        return [...rows].sort((a, b) =>
          String(a.created_at).localeCompare(String(b.created_at)),
        ) as T[];
      }

      if (normalized.includes("WHERE status = 'pending'") && normalized.includes("client_timestamp")) {
        return rows
          .filter((row) => row.status === "pending")
          .sort((a, b) => Number(a.client_timestamp) - Number(b.client_timestamp)) as T[];
      }

      if (normalized.includes("WHERE status = 'processing'")) {
        return rows.filter((row) => row.status === "processing").map((row) => ({ id: row.id })) as T[];
      }

      throw new Error(`Unsupported getAll SQL in test executor: ${normalized}`);
    },
  };
}
