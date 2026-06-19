import type { Equipment } from "@/types/equipment";
import { request } from "@/lib/api";

export interface EquipmentListParams {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface EquipmentListResponse {
  items: Equipment[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function fetchEquipmentList(
  params: EquipmentListParams = {},
): Promise<EquipmentListResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  const qs = query.toString();
  return request<EquipmentListResponse>(`/api/equipment${qs ? `?${qs}` : ""}`);
}

export async function fetchMyEquipment(): Promise<Equipment[]> {
  return request<Equipment[]>("/api/equipment/my");
}

export async function fetchEquipmentById(id: string): Promise<Equipment> {
  return request<Equipment>(`/api/equipment/${encodeURIComponent(id)}`);
}
