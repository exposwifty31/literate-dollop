export const UNIVERSAL_LINK_ORIGIN = "https://vettrack.uk";
export const UNIVERSAL_LINK_HOST = "vettrack.uk";

export function extractEquipmentId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/");
    const idx = parts.indexOf("equipment");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    if (!trimmed.includes(" ") && trimmed.length > 0) return trimmed;
    return null;
  }
}
