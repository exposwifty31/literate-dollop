import type { Alert } from "@/types/equipment";
import { request } from "@/lib/api";

export interface AlertsListResponse {
  items: Alert[];
  total: number;
}

export async function fetchAlerts(): Promise<AlertsListResponse> {
  return request<AlertsListResponse>("/api/alerts");
}
