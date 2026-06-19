import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("alerts API helper", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchAlerts calls GET /api/alerts and returns items", async () => {
    const mockItems = [
      {
        type: "issue",
        severity: "critical",
        equipmentId: "eq-1",
        equipmentName: "Autoclave A",
        detail: "Active issue — not yet resolved",
      },
      {
        type: "overdue",
        severity: "high",
        equipmentId: "eq-2",
        equipmentName: "Defibrillator B",
        daysOverdue: 3,
      },
    ];

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ items: mockItems, total: 2 }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchAlerts } = await import("@/lib/api/alerts");
    const result = await fetchAlerts();

    expect(fetchMock).toHaveBeenCalled();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("/api/alerts");
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items[0]?.equipmentId).toBe("eq-1");
    expect(result.items[1]?.type).toBe("overdue");
  });

  it("fetchAlerts propagates network errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Network error"); }));

    const { fetchAlerts } = await import("@/lib/api/alerts");
    await expect(fetchAlerts()).rejects.toThrow();
  });
});
