import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("network", () => {
  beforeEach(async () => {
    vi.resetModules();
    const netinfo = await import("@react-native-community/netinfo");
    netinfo.__setNetInfoConnected(true);
  });

  afterEach(async () => {
    const netinfo = await import("@react-native-community/netinfo");
    netinfo.__setNetInfoConnected(true);
  });

  it("isOnline reflects NetInfo state", async () => {
    const netinfo = await import("@react-native-community/netinfo");
    const { isOnline, primeNetworkState } = await import("@/lib/network");
    await primeNetworkState();
    expect(isOnline()).toBe(true);
    netinfo.__setNetInfoConnected(false);
    expect(isOnline()).toBe(false);
  });

  it("setForcedOfflineForTests overrides NetInfo", async () => {
    const netinfo = await import("@react-native-community/netinfo");
    const { isOnline, primeNetworkState, setForcedOfflineForTests } = await import("@/lib/network");
    await primeNetworkState();
    netinfo.__setNetInfoConnected(true);
    setForcedOfflineForTests(true);
    expect(isOnline()).toBe(false);
    setForcedOfflineForTests(false);
  });

  it("subscribeOnline notifies on change", async () => {
    const netinfo = await import("@react-native-community/netinfo");
    const { subscribeOnline, primeNetworkState } = await import("@/lib/network");
    await primeNetworkState();
    const seen: boolean[] = [];
    const unsub = subscribeOnline((online) => seen.push(online));
    netinfo.__setNetInfoConnected(false);
    netinfo.__setNetInfoConnected(true);
    unsub();
    expect(seen).toContain(false);
    expect(seen).toContain(true);
  });
});
