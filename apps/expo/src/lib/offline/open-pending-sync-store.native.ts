import type { SqlExecutor } from "@/lib/offline/pending-sync-store";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import * as SQLite from "expo-sqlite";

function wrapExpoSqlite(db: SQLite.SQLiteDatabase): SqlExecutor {
  return db;
}

export async function openPendingSyncStore(): Promise<PendingSyncStore> {
  const db = await SQLite.openDatabaseAsync("vettrack-pending-sync.db");
  const store = new PendingSyncStore(wrapExpoSqlite(db));
  await store.init();
  return store;
}
