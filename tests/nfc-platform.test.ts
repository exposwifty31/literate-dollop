import { beforeEach, describe, expect, it, vi } from "vitest";

import { Ndef } from "react-native-nfc-manager";

describe("nfc-platform", () => {
  beforeEach(async () => {
    vi.resetModules();
    const nfc = await import("react-native-nfc-manager");
    nfc.default.isSupported = vi.fn(async () => false);
    nfc.default.getTag = vi.fn(async () => ({ id: "04123456", ndefMessage: [] }));
  });

  it("readNfcOnce rejects when NFC is unsupported", async () => {
    const { readNfcOnce } = await import("@/lib/nfc-platform");
    await expect(readNfcOnce({})).rejects.toThrow("nfc_unsupported");
  });

  it("readNfcOnce extracts text from NDEF text records", async () => {
    const equipmentId = "abc-123";
    const textPayload = [2, ..."en".split("").map((c) => c.charCodeAt(0)), ...equipmentId.split("").map((c) => c.charCodeAt(0))];

    const nfc = await import("react-native-nfc-manager");
    nfc.default.isSupported = vi.fn(async () => true);
    nfc.default.getTag = vi.fn(async () => ({
      id: "04123456",
      ndefMessage: [
        {
          tnf: Ndef.TNF_WELL_KNOWN,
          type: "T",
          payload: textPayload,
        },
      ],
    }));

    const { readNfcOnce } = await import("@/lib/nfc-platform");
    await expect(readNfcOnce({ timeoutMs: 100 })).resolves.toEqual({
      text: equipmentId,
      url: null,
      tagId: "04123456",
    });
  });

  it("readNfcOnce extracts text when NDEF type is a byte array", async () => {
    const equipmentId = "abc-123";
    const textPayload = [2, ..."en".split("").map((c) => c.charCodeAt(0)), ...equipmentId.split("").map((c) => c.charCodeAt(0))];

    const nfc = await import("react-native-nfc-manager");
    nfc.default.isSupported = vi.fn(async () => true);
    nfc.default.getTag = vi.fn(async () => ({
      id: "04123456",
      ndefMessage: [
        {
          tnf: Ndef.TNF_WELL_KNOWN,
          type: [0x54],
          payload: textPayload,
        },
      ],
    }));

    const { readNfcOnce } = await import("@/lib/nfc-platform");
    await expect(readNfcOnce({ timeoutMs: 100 })).resolves.toEqual({
      text: equipmentId,
      url: null,
      tagId: "04123456",
    });
  });
});
