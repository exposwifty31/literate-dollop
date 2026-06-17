import { describe, expect, it } from "vitest";
import type { PendingSync } from "@vettrack/contracts";
import {
  buildLocalEntityStateByEquipmentId,
  extractEquipmentIdFromPendingSync,
  filterPendingSyncRowsForEquipment,
  resolveLocalEntityState,
} from "@/lib/local-entity-sync-state";

function row(partial: Partial<PendingSync>): PendingSync {
  return {
    id: 1,
    type: "update",
    endpoint: "/api/equipment/eq-1",
    method: "PATCH",
    body: "{}",
    createdAt: new Date(),
    retries: 0,
    status: "pending",
    clientTimestamp: Date.now(),
    clientMutationId: "m",
    idempotencyKey: "k",
    schemaVersion: 2,
    updatedAt: new Date(),
    structuredError: null,
    conflictPayload: null,
    ...partial,
  };
}

describe("extractEquipmentIdFromPendingSync", () => {
  it("reads the id from the endpoint path", () => {
    expect(extractEquipmentIdFromPendingSync(row({ endpoint: "/api/equipment/eq-9/scan" }))).toBe("eq-9");
  });

  it("falls back to the request body equipmentId", () => {
    const r = row({ endpoint: "/api/other", body: JSON.stringify({ equipmentId: "eq-2" }) });
    expect(extractEquipmentIdFromPendingSync(r)).toBe("eq-2");
  });

  it("returns null when no equipment id is present", () => {
    expect(extractEquipmentIdFromPendingSync(row({ endpoint: "/api/other", body: "{}" }))).toBeNull();
  });
});

describe("resolveLocalEntityState", () => {
  it("is synced when no rows match", () => {
    expect(resolveLocalEntityState("eq-1", [])).toBe("synced");
  });

  it("prioritizes conflict over dead and pending", () => {
    const rows = [
      row({ id: 1, status: "pending" }),
      row({ id: 2, status: "dead" }),
      row({ id: 3, status: "conflict" }),
    ];
    expect(resolveLocalEntityState("eq-1", rows)).toBe("conflict");
  });

  it("reports pending_sync for in-flight rows", () => {
    expect(resolveLocalEntityState("eq-1", [row({ status: "processing" })])).toBe("pending_sync");
  });

  it("maps dead rows to sync_failed", () => {
    expect(resolveLocalEntityState("eq-1", [row({ status: "dead" })])).toBe("sync_failed");
  });
});

describe("filter + map helpers", () => {
  it("filters rows for one equipment id", () => {
    const rows = [row({ id: 1, endpoint: "/api/equipment/eq-1" }), row({ id: 2, endpoint: "/api/equipment/eq-2" })];
    expect(filterPendingSyncRowsForEquipment("eq-1", rows).map((r) => r.id)).toEqual([1]);
  });

  it("builds a per-equipment state map", () => {
    const rows = [
      row({ id: 1, endpoint: "/api/equipment/eq-1", status: "pending" }),
      row({ id: 2, endpoint: "/api/equipment/eq-2", status: "conflict" }),
    ];
    const map = buildLocalEntityStateByEquipmentId(rows);
    expect(map.get("eq-1")).toBe("pending_sync");
    expect(map.get("eq-2")).toBe("conflict");
  });
});
