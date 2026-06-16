import { describe, expect, it } from "vitest";
import {
  DEAD_LETTER_RETENTION_MS,
  PENDING_SYNC_MAX_RETRIES,
  PENDING_SYNC_SCHEMA_VERSION,
  type PendingSync,
  type PendingSyncType,
} from "@vettrack/contracts";

const QUEUE_TYPES: PendingSyncType[] = [
  "scan",
  "seen",
  "create",
  "update",
  "delete",
  "checkout",
  "return",
  "return_with_charge",
];

describe("@vettrack/contracts pending-sync shapes", () => {
  it("queue types exclude emergency-only operations", () => {
    for (const type of QUEUE_TYPES) {
      expect(type).not.toMatch(/code.?blue|emergency/i);
    }
    expect(QUEUE_TYPES).not.toContain("start" as PendingSyncType);
  });

  it("exports frozen retry and schema constants", () => {
    expect(PENDING_SYNC_MAX_RETRIES).toBe(5);
    expect(PENDING_SYNC_SCHEMA_VERSION).toBe(2);
    expect(DEAD_LETTER_RETENTION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("PendingSync row requires queue metadata fields", () => {
    const row: PendingSync = {
      type: "scan",
      endpoint: "/api/equipment/eq-1/scan",
      method: "POST",
      body: "{}",
      createdAt: new Date(),
      retries: 0,
      status: "pending",
      clientTimestamp: Date.now(),
      clientMutationId: "mut-1",
      idempotencyKey: "idem-1",
      schemaVersion: PENDING_SYNC_SCHEMA_VERSION,
      updatedAt: new Date(),
      structuredError: null,
    };
    expect(row.status).toBe("pending");
    expect(row.schemaVersion).toBe(2);
  });
});
