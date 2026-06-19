import type { Equipment, ScanEquipmentRequest, ScanLog } from "@/types/equipment";
import { request } from "@/lib/api";

export type ScanEquipmentResult =
  | { kind: "synced"; equipment: Equipment; scanLog: ScanLog }
  | { kind: "queued"; equipmentId: string; pendingSyncId: number; queuedAt: number };

type ScanApiResponse = {
  equipment: Equipment;
  scanLog: ScanLog;
  undoToken?: string;
};

export async function scanEquipment(
  equipmentId: string,
  body: ScanEquipmentRequest,
  clientTimestamp: number = Date.now(),
): Promise<ScanEquipmentResult> {
  const optimistic = {
    kind: "queued" as const,
    equipmentId,
    queuedAt: clientTimestamp,
  };

  let pendingSyncId = -1;
  const result = await request<ScanApiResponse | typeof optimistic>(
    `/api/equipment/${equipmentId}/scan`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "X-Client-Timestamp": String(clientTimestamp) },
    },
    {
      offlineType: "scan",
      clientTimestamp,
      optimisticResult: optimistic,
      onEnqueued: (id) => {
        pendingSyncId = id;
      },
    },
  );

  if (result && typeof result === "object" && "kind" in result && result.kind === "queued") {
    return {
      kind: "queued",
      equipmentId,
      pendingSyncId,
      queuedAt: clientTimestamp,
    };
  }

  const synced = result as ScanApiResponse;
  return { kind: "synced", equipment: synced.equipment, scanLog: synced.scanLog };
}
