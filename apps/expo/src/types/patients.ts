/**
 * @deprecated LEGACY — patient CRUD and ER screens cut from June 2026 scope.
 * Retained only while legacy call-sites are cleaned up. Do not add new usages.
 * Minimal hospitalization status union (display / ER); patient CRUD removed.
 */
export type HospitalizationStatus =
  | "admitted"
  | "observation"
  | "critical"
  | "recovering"
  | "discharged"
  | "deceased";
