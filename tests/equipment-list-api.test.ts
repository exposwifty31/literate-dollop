import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("equipment-list API helpers", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchEquipmentList builds correct URL with no params", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchEquipmentList } = await import("@/lib/api/equipment-list");
    const result = await fetchEquipmentList();

    expect(fetchMock).toHaveBeenCalled();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("/api/equipment");
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("fetchEquipmentList appends search and status query params", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchEquipmentList } = await import("@/lib/api/equipment-list");
    await fetchEquipmentList({ q: "oxygen", status: "ok", page: 2, limit: 10 });

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("q=oxygen");
    expect(url).toContain("status=ok");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
  });

  it("fetchEquipmentList omits status param when status is 'all'", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchEquipmentList } = await import("@/lib/api/equipment-list");
    await fetchEquipmentList({ status: "all" });

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).not.toContain("status=");
  });

  it("fetchMyEquipment calls GET /api/equipment/my", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchMyEquipment } = await import("@/lib/api/equipment-list");
    const result = await fetchMyEquipment();

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("/api/equipment/my");
    expect(result).toEqual([]);
  });

  it("fetchEquipmentById calls GET /api/equipment/:id", async () => {
    const equipmentId = "test-eq-123";
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ id: equipmentId, name: "Test", status: "ok", createdAt: "" }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchEquipmentById } = await import("@/lib/api/equipment-list");
    const result = await fetchEquipmentById(equipmentId);

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain(`/api/equipment/${equipmentId}`);
    expect(result.id).toBe(equipmentId);
  });
});
