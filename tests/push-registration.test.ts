import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerNativePush } from "@/lib/push/push-registration";
import { setRealtimeFlagsForTests } from "@/lib/realtime/realtime-config";

describe("registerNativePush", () => {
  afterEach(() => {
    setRealtimeFlagsForTests(null);
    vi.unstubAllGlobals();
  });

  it("is a no-op when native push is disabled (default)", async () => {
    setRealtimeFlagsForTests({ nativePushEnabled: false });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const getToken = vi.fn();

    const result = await registerNativePush({ getToken });

    expect(result).toEqual({ status: "disabled" });
    expect(getToken).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("when enabled", () => {
    beforeEach(() => {
      setRealtimeFlagsForTests({ nativePushEnabled: true });
    });

    it("POSTs the token to the native subscription endpoint", async () => {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ id: "sub-1" }),
      }));
      vi.stubGlobal("fetch", fetchMock);

      const result = await registerNativePush({
        getToken: async () => ({ token: "tok-abc", platform: "ios", deviceId: "dev-1" }),
      });

      expect(result).toEqual({ status: "registered", subscriptionId: "sub-1" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/push-subscriptions/native");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({
        token: "tok-abc",
        platform: "ios",
        deviceId: "dev-1",
      });
    });

    it("returns unavailable when no token is provided", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await registerNativePush({ getToken: async () => null });

      expect(result).toEqual({ status: "unavailable" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns an error result when the token provider throws", async () => {
      vi.stubGlobal("fetch", vi.fn());
      const result = await registerNativePush({
        getToken: async () => {
          throw new Error("permission denied");
        },
      });

      expect(result.status).toBe("error");
      if (result.status === "error") expect(result.error.message).toBe("permission denied");
    });

    it("returns an error result when the request fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: false,
          status: 500,
          json: async () => ({ error: "boom" }),
        })),
      );

      const result = await registerNativePush({
        getToken: async () => ({ token: "t", platform: "android" }),
      });

      expect(result.status).toBe("error");
    });
  });
});
