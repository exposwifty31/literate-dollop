export type MessageType = "regular" | "broadcast" | "system";

export interface MessageReaction {
  userId: string;
  emoji: "👍" | "✅" | "👀";
}

export interface MessageAck {
  userId: string;
  status: "acknowledged" | "snoozed";
}

export interface ShiftMessage {
  id: string;
  shiftSessionId: string;
  clinicId: string;
  senderId: string | null;
  senderName: string | null;
  senderRole: string | null;
  body: string;
  type: MessageType;
  broadcastKey: string | null;
  systemEventType: string | null;
  systemEventPayload: Record<string, unknown> | null;
  roomTag: string | null;
  isUrgent: boolean;
  mentionedUserIds: string[];
  pinnedAt: string | null;
  pinnedByUserId: string | null;
  createdAt: string;
  acks: MessageAck[];
  reactions: MessageReaction[];
}

export interface MessagesResponse {
  messages: ShiftMessage[];
  pinnedMessage: ShiftMessage | null;
  typing: string[];
  onlineUserIds: string[];
}

export interface PostMessageInput {
  body: string;
  type: "regular" | "broadcast";
  broadcastKey?: string;
  roomTag?: string;
  isUrgent?: boolean;
  mentionedUserIds?: string[];
}

/**
 * Broadcast template identifiers. The rendered label/subtitle copy lives in
 * `locales/*.json` (accessed via `t.*`) and is wired in when the shift-chat
 * UI is built — source must stay free of hardcoded Hebrew (i18n invariant).
 *
 * The web reference (`src/features/shift-chat/types.ts`) inlined Hebrew
 * strings here; that copy was intentionally dropped on import.
 */
export const BROADCAST_KEYS = ["department_close"] as const;

export type BroadcastKey = (typeof BROADCAST_KEYS)[number];
