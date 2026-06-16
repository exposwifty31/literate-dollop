import type { PendingSyncEnqueueOp } from "@vettrack/contracts";
import {
  classifyEmergencyEndpoint,
  type EmergencyEndpointClass,
} from "@/lib/offline-emergency-block";
import { resolveAllowRegistryEntry } from "@/lib/offline-mutation-registry";

export type { PendingSyncEnqueueOp };

export class OfflineEmergencyMutationBlockedError extends Error {
  endpointClass: EmergencyEndpointClass;

  constructor(endpointClass: EmergencyEndpointClass) {
    super(`Offline emergency mutation blocked (${endpointClass})`);
    this.name = "OfflineEmergencyMutationBlockedError";
    this.endpointClass = endpointClass;
  }
}

export const OFFLINE_SYNC_UNREGISTERED_CODE = "OFFLINE_SYNC_UNREGISTERED" as const;

export type OfflineSyncUnregisteredPayload = {
  code: typeof OFFLINE_SYNC_UNREGISTERED_CODE;
  pendingType: string;
  endpoint: string;
  method: string;
};

export class UnknownOfflineMutationError extends Error {
  readonly payload: OfflineSyncUnregisteredPayload;

  constructor(payload: OfflineSyncUnregisteredPayload) {
    super(
      `Unregistered offline mutation (${payload.method} ${payload.pendingType} ${payload.endpoint})`,
    );
    this.name = "UnknownOfflineMutationError";
    this.payload = payload;
  }
}

export function buildOfflineSyncUnregisteredPayload(
  op: PendingSyncEnqueueOp,
): OfflineSyncUnregisteredPayload {
  return {
    code: OFFLINE_SYNC_UNREGISTERED_CODE,
    pendingType: op.type,
    endpoint: op.endpoint,
    method: op.method.toUpperCase(),
  };
}

/** Single choke-point policy gate for `addPendingSync`. */
export function assertPendingSyncEnqueueAllowed(op: PendingSyncEnqueueOp): void {
  const method = op.method.toUpperCase();
  const emergencyClass = classifyEmergencyEndpoint(op.endpoint, method);
  if (emergencyClass) {
    throw new OfflineEmergencyMutationBlockedError(emergencyClass);
  }

  if (resolveAllowRegistryEntry({ type: op.type, endpoint: op.endpoint, method })) {
    return;
  }

  const payload = buildOfflineSyncUnregisteredPayload(op);
  console.warn("[offline-policy] offline_sync_unknown_mutation", {
    event: "offline_sync_unknown_mutation",
    pendingType: payload.pendingType,
    method: payload.method,
    endpoint: payload.endpoint,
  });
  throw new UnknownOfflineMutationError(payload);
}
