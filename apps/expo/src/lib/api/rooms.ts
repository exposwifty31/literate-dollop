import type { Room } from "@/types/equipment";
import { request } from "@/lib/api";

export async function fetchRoomsList(): Promise<Room[]> {
  return request<Room[]>("/api/rooms");
}

export async function fetchRoomById(id: string): Promise<Room> {
  return request<Room>(`/api/rooms/${encodeURIComponent(id)}`);
}
