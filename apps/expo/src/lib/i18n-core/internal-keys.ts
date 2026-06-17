/**
 * Shared predicate for "internal" (non-rendering) translation key paths.
 *
 * Phase 6 §5 invariant 13: `_meta.*` is a reserved namespace for
 * non-rendering metadata (terminology notes, plan markers, doc strings —
 * JSON does not support comments, so these live in the dictionary).
 * Values under `_meta.*` are included in en.json ↔ he.json parity but
 * are NEVER resolved by user-facing helpers.
 *
 * Rule: a key path is "internal" if ANY of its dot-segments starts with
 * an underscore. This covers `_meta`, `_meta.appointmentsPageTerminology`,
 * `foo._bar`, and any future `_*` metadata namespace.
 */
export function isInternalKey(keyPath: string): boolean {
  if (!keyPath) return false;
  const segments = keyPath.split(".");
  for (const segment of segments) {
    if (segment.startsWith("_")) return true;
  }
  return false;
}
