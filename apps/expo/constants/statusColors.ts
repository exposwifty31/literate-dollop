import { t } from "@/lib/i18n";
import type { EquipmentStatus } from "@/types/equipment";

export const STATUSES: readonly EquipmentStatus[] = [
  "ok",
  "issue",
  "maintenance",
  "sterilized",
  "critical",
  "needs_attention",
] as const;

export const STATUS_HEX_COLORS: Record<EquipmentStatus, string> = {
  ok: "#16a34a",
  issue: "#dc2626",
  maintenance: "#d97706",
  sterilized: "#0891b2",
  critical: "#b91c1c",
  needs_attention: "#c2410c",
};

export function statusLabel(status: EquipmentStatus): string {
  switch (status) {
    case "ok":
      return t.status.ok;
    case "issue":
      return t.status.issue;
    case "maintenance":
      return t.status.maintenance;
    case "sterilized":
      return t.status.sterilized;
    case "critical":
      return t.status.critical;
    case "needs_attention":
      return t.status.needs_attention;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
