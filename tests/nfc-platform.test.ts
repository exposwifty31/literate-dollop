import { beforeEach, describe, expect, it, vi } from "vitest";

describe("nfc-platform", () => {
  beforeEach(async () => {
    vi.resetModules();
    const nfc = await import("react-native-nfc-manager");
    nfc.default.isSupported = vi.fn(async () => false);
  });

  it("readNfcOnce rejects when NFC is unsupported", async () => {
    const { readNfcOnce } = await import("@/lib/nfc-platform");
    await expect(readNfcOnce({})).rejects.toThrow("nfc_unsupported");
  });
});
