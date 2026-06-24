import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("shift API", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchCurrentShift calls GET /api/shifts/current", async () => {
    const mockShift = {
      windowStart: "2024-01-01T08:00:00Z",
      windowEnd: "2024-01-01T20:00:00Z",
      windowSource: "open_shift",
      revenueCents: 0,
      averageMedicationDelaySeconds: 0,
      unreturned: [],
      expiringAssets: [],
      hotAssets: [],
      openShiftSession: {
        id: "session-123",
        startedAt: "2024-01-01T08:00:00Z",
        startedByUserId: "user-1",
        note: null,
      },
    };

    const fetchMock = vi.fn(async () => new Response(JSON.stringify(mockShift), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchCurrentShift } = await import("@/lib/api/shift");
    const result = await fetchCurrentShift();

    expect(fetchMock).toHaveBeenCalled();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("/api/shifts/current");
    expect(result).not.toBeNull();
    expect(result?.openShiftSession?.id).toBe("session-123");
  });

  it("fetchCurrentShift returns null on 404", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchCurrentShift } = await import("@/lib/api/shift");
    const result = await fetchCurrentShift();

    expect(result).toBeNull();
  });

  it("submitShiftHandoff calls POST /api/shifts/:id/handoff", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { submitShiftHandoff } = await import("@/lib/api/shift");
    await submitShiftHandoff("shift-abc-123");

    expect(fetchMock).toHaveBeenCalled();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("/api/shifts/shift-abc-123/handoff");

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("POST");
  });
});
