import type { ShiftHandoverSummary } from "@/types/equipment";
import { request } from "@/lib/api";

export async function fetchCurrentShift(): Promise<ShiftHandoverSummary | null> {
  // GET /api/shifts/current — returns null if no active shift (404 → null)
  try {
    return await request<ShiftHandoverSummary>("/api/shifts/current");
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function submitShiftHandoff(shiftId: string): Promise<void> {
  await request<void>("/api/shifts/" + encodeURIComponent(shiftId) + "/handoff", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
