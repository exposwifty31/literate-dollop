export function notifySyncPaused(_message: string, _detail?: string): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn("[sync]", _message, _detail ?? "");
  }
}

export function notifySyncPermanentFailure(_message: string): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn("[sync:failure]", _message);
  }
}
