import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  EMERGENCY_OFFLINE_BLOCK_MUTATIONS,
  normalizeEmergencyPathname,
  type EmergencyEndpointClass,
} from "@vettrack/contracts";

export type { EmergencyEndpointClass };

const BUFFER_KEY = "vt_offline_emergency_buffer_v1";
const BUFFER_MAX = 200;

type LocalBufferEntry = {
  ts: number;
  endpointClass: EmergencyEndpointClass;
  reason: "offline";
};

export function classifyEmergencyEndpoint(
  url: string,
  method: string,
): EmergencyEndpointClass | null {
  const upperMethod = method.toUpperCase();
  const pathname = normalizeEmergencyPathname(url);

  for (const entry of EMERGENCY_OFFLINE_BLOCK_MUTATIONS) {
    if (upperMethod === entry.method && entry.pathPattern.test(pathname)) {
      return entry.class;
    }
  }
  return null;
}

async function readBuffer(): Promise<LocalBufferEntry[]> {
  const raw = await AsyncStorage.getItem(BUFFER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is LocalBufferEntry => {
        if (!e || typeof e !== "object") return false;
        const obj = e as Record<string, unknown>;
        return (
          typeof obj.ts === "number" &&
          typeof obj.endpointClass === "string" &&
          ["start", "log", "end", "presence"].includes(obj.endpointClass) &&
          obj.reason === "offline"
        );
      })
      .slice(-BUFFER_MAX);
  } catch {
    return [];
  }
}

async function writeBuffer(entries: LocalBufferEntry[]): Promise<void> {
  const trimmed = entries.slice(-BUFFER_MAX);
  try {
    await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(trimmed));
  } catch {
    // Best-effort only (quota, etc.).
  }
}

export async function recordEmergencyBlockLocally(
  endpointClass: EmergencyEndpointClass,
): Promise<void> {
  const current = await readBuffer();
  current.push({ ts: Date.now(), endpointClass, reason: "offline" });
  await writeBuffer(current);
}

export async function _readEmergencyBlockBufferForTests(): Promise<
  readonly LocalBufferEntry[]
> {
  return readBuffer();
}

export async function _clearEmergencyBlockBufferForTests(): Promise<void> {
  await AsyncStorage.removeItem(BUFFER_KEY);
}
