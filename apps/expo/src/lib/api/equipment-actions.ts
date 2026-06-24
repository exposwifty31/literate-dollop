import type {
  CreateEquipmentRequest,
  Equipment,
  EquipmentStatus,
  QuickScanToggleResult,
} from "@/types/equipment";
import { request } from "@/lib/api";

export async function patchEquipmentStatus(
  id: string,
  status: EquipmentStatus,
  version?: number,
): Promise<Equipment> {
  return request<Equipment>(`/api/equipment/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status, version }),
  });
}

export async function checkoutEquipment(id: string): Promise<QuickScanToggleResult> {
  return request<QuickScanToggleResult>(`/api/equipment/${encodeURIComponent(id)}/checkout`, {
    method: "POST",
  });
}

export async function returnEquipment(id: string): Promise<QuickScanToggleResult> {
  return request<QuickScanToggleResult>(`/api/equipment/${encodeURIComponent(id)}/return`, {
    method: "POST",
    body: JSON.stringify({ isPluggedIn: false }),
  });
}

export async function createEquipment(data: CreateEquipmentRequest): Promise<Equipment> {
  return request<Equipment>("/api/equipment", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
