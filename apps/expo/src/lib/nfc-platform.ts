import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";

export type NfcReadPayload = { text: string | null; url: string | null; tagId: string | null };

let nativeSupportCache: boolean | null = null;

function tagIdToHex(id: string | number[] | undefined): string | null {
  if (!id) return null;
  if (typeof id === "string") return id;
  return id.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toUint8Array(payload: number[] | Uint8Array): Uint8Array {
  return payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
}

function ndefRecordType(type: number[] | string): string {
  if (typeof type === "string") return type;
  return String.fromCharCode(...type);
}

/** react-native-nfc-manager returns a string; tolerate legacy object shapes in tests. */
function ndefTextFromDecoded(decoded: unknown): string {
  if (typeof decoded === "string") return decoded;
  if (decoded && typeof decoded === "object" && "text" in decoded) {
    const text = (decoded as { text: unknown }).text;
    return typeof text === "string" ? text : "";
  }
  return "";
}

function parseNdefPayload(
  payload: NfcReadPayload,
  records: NdefRecord[] | undefined,
): NfcReadPayload {
  if (!records?.length) return payload;
  for (const record of records) {
    if (record.tnf === Ndef.TNF_WELL_KNOWN && record.type) {
      const type = ndefRecordType(record.type);
      if (type === "U") {
        const url = Ndef.uri.decodePayload(toUint8Array(record.payload));
        if (url) payload.url = url;
      } else if (type === "T") {
        const text = ndefTextFromDecoded(Ndef.text.decodePayload(toUint8Array(record.payload)));
        if (text) {
          payload.text = text;
        }
      }
    }
  }
  return payload;
}

type NdefRecord = {
  tnf: number;
  type?: number[] | string;
  payload: number[] | Uint8Array;
};

export async function isNfcSupported(): Promise<boolean> {
  try {
    const supported = await NfcManager.isSupported();
    nativeSupportCache = supported;
    return supported;
  } catch {
    nativeSupportCache = false;
    return false;
  }
}

export function isNfcSupportedSync(): boolean {
  return nativeSupportCache === true;
}

export async function primeNfcSupportCache(): Promise<void> {
  nativeSupportCache = await isNfcSupported();
}

export function readNfcOnce(options: {
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<NfcReadPayload> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  return readNfcOnceNative(timeoutMs, options.signal);
}

async function readNfcOnceNative(timeoutMs: number, signal?: AbortSignal): Promise<NfcReadPayload> {
  if (!(await isNfcSupported())) {
    throw new Error("nfc_unsupported");
  }

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    let settled = false;
    const timeout = setTimeout(() => {
      finish(() => reject(new Error("timeout")));
    }, timeoutMs);

    const onAbort = () => {
      finish(() => reject(new DOMException("Aborted", "AbortError")));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
      void (async () => {
        try {
          await NfcManager.cancelTechnologyRequest();
        } catch {
          // Ignore cleanup errors.
        }
        fn();
      })();
    };

    void (async () => {
      try {
        await NfcManager.start();
        await NfcManager.requestTechnology(NfcTech.Ndef);
        const tag = await NfcManager.getTag();
        const payload = parseNdefPayload(
          {
            text: null,
            url: null,
            tagId: tagIdToHex(tag?.id),
          },
          tag?.ndefMessage as NdefRecord[] | undefined,
        );
        finish(() => resolve(payload));
      } catch (err) {
        finish(() => reject(err));
      }
    })();
  });
}
