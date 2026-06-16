export const PENDING_SYNC_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pending_sync (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retries INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  client_timestamp INTEGER NOT NULL,
  client_mutation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  structured_error TEXT,
  clinic_id TEXT,
  user_id TEXT,
  optimistic_data TEXT,
  error_message TEXT,
  equipment_name TEXT,
  conflict_payload TEXT
);

CREATE INDEX IF NOT EXISTS idx_pending_sync_status_ts
  ON pending_sync (status, client_timestamp);
`;
