import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("rooms API", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchRoomsList calls GET /api/rooms", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchRoomsList } = await import("@/lib/api/rooms");
    const result = await fetchRoomsList();

    expect(fetchMock).toHaveBeenCalled();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("/api/rooms");
    expect(result).toEqual([]);
  });

  it("fetchRoomsList returns an array of rooms", async () => {
    const mockRooms = [
      {
        id: "room-1",
        name: "ICU Room A",
        floor: "2nd Floor",
        syncStatus: "synced",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        totalEquipment: 5,
        availableCount: 3,
        inUseCount: 2,
      },
    ];
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(mockRooms), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchRoomsList } = await import("@/lib/api/rooms");
    const result = await fetchRoomsList();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("room-1");
    expect(result[0]?.name).toBe("ICU Room A");
  });

  it("fetchRoomById calls GET /api/rooms/:id", async () => {
    const roomId = "test-room-123";
    const mockRoom = {
      id: roomId,
      name: "Surgery Room 1",
      syncStatus: "synced",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(mockRoom), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchRoomById } = await import("@/lib/api/rooms");
    const result = await fetchRoomById(roomId);

    expect(fetchMock).toHaveBeenCalled();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain(`/api/rooms/${roomId}`);
    expect(result.id).toBe(roomId);
  });

  it("fetchRoomById URL-encodes the room ID", async () => {
    const roomId = "room with spaces/and-slash";
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: roomId,
            name: "Test",
            syncStatus: "synced",
            createdAt: "",
            updatedAt: "",
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchRoomById } = await import("@/lib/api/rooms");
    await fetchRoomById(roomId);

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain(encodeURIComponent(roomId));
    expect(url).not.toContain("room with spaces");
  });
});
