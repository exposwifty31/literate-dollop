/**
 * Offline mutation registry — enqueue policy resolution.
 * `online-required` entries are documentation-only (no enqueue reject via registry).
 */

export type ProducerPendingSyncType =
  | "scan"
  | "seen"
  | "create"
  | "update"
  | "delete"
  | "checkout"
  | "return"
  | "return_with_charge";

export type AllowRegistryEntry = {
  readonly key: string;
  readonly policy: "allow";
  readonly pendingType: ProducerPendingSyncType;
  readonly method: string;
  readonly pathPattern: RegExp;
  readonly conflictStrategy: "append-only" | "version-check";
};

export type OnlineRequiredRegistryEntry = {
  readonly key: string;
  readonly policy: "online-required";
  readonly reason: string;
  readonly hasEnqueueProducer: false;
};

export const offlineAllowProducers: readonly AllowRegistryEntry[] = [
  {
    key: "equipment.create",
    policy: "allow",
    pendingType: "create",
    method: "POST",
    pathPattern: /^\/api\/equipment$/,
    conflictStrategy: "version-check",
  },
  {
    key: "equipment.update",
    policy: "allow",
    pendingType: "update",
    method: "PATCH",
    pathPattern: /^\/api\/equipment\/[^/]+$/,
    conflictStrategy: "version-check",
  },
  {
    key: "equipment.delete",
    policy: "allow",
    pendingType: "delete",
    method: "DELETE",
    pathPattern: /^\/api\/equipment\/[^/]+$/,
    conflictStrategy: "version-check",
  },
  {
    key: "equipment.scan",
    policy: "allow",
    pendingType: "scan",
    method: "POST",
    pathPattern: /^\/api\/equipment\/[^/]+\/scan$/,
    conflictStrategy: "append-only",
  },
  {
    key: "equipment.seen",
    policy: "allow",
    pendingType: "seen",
    method: "POST",
    pathPattern: /^\/api\/equipment\/[^/]+\/seen$/,
    conflictStrategy: "append-only",
  },
  {
    key: "equipment.checkout",
    policy: "allow",
    pendingType: "checkout",
    method: "POST",
    pathPattern: /^\/api\/equipment\/[^/]+\/checkout$/,
    conflictStrategy: "version-check",
  },
  {
    key: "equipment.return",
    policy: "allow",
    pendingType: "return",
    method: "POST",
    pathPattern: /^\/api\/equipment\/[^/]+\/return$/,
    conflictStrategy: "version-check",
  },
  {
    key: "equipment.return_with_charge",
    policy: "allow",
    pendingType: "return_with_charge",
    method: "POST",
    pathPattern: /^\/api\/equipment\/[^/]+\/return$/,
    conflictStrategy: "version-check",
  },
] as const;

export const offlineOnlineRequiredDomains: readonly OnlineRequiredRegistryEntry[] = [
  {
    key: "code_blue.mutations",
    policy: "online-required",
    reason: "Emergency mutations cannot be queued offline (classifyEmergencyEndpoint)",
    hasEnqueueProducer: false,
  },
] as const;

function normalizePathname(endpoint: string): string {
  try {
    return new URL(endpoint, "http://localhost").pathname;
  } catch {
    return endpoint.split("?")[0];
  }
}

export function resolveAllowRegistryEntry(op: {
  type: string;
  endpoint: string;
  method: string;
}): AllowRegistryEntry | undefined {
  const pathname = normalizePathname(op.endpoint);
  const method = op.method.toUpperCase();
  return offlineAllowProducers.find(
    (entry) =>
      entry.pendingType === op.type && entry.method === method && entry.pathPattern.test(pathname),
  );
}

export const PRODUCTION_ENQUEUE_PRODUCER_TYPES: readonly ProducerPendingSyncType[] =
  offlineAllowProducers.map((e) => e.pendingType);

export function sampleEndpointForAllowEntry(entry: AllowRegistryEntry): string {
  if (entry.pendingType === "create") return "/api/equipment";
  const suffixByType: Partial<Record<ProducerPendingSyncType, string>> = {
    scan: "/scan",
    seen: "/seen",
    checkout: "/checkout",
    return: "/return",
    return_with_charge: "/return",
  };
  const suffix = suffixByType[entry.pendingType] ?? "";
  if (entry.pendingType === "update" || entry.pendingType === "delete") {
    return "/api/equipment/eq-sample";
  }
  return `/api/equipment/eq-sample${suffix}`;
}
