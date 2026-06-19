type NetInfoListener = (state: { isConnected: boolean; isInternetReachable: boolean | null }) => void;

let connected = true;
const listeners = new Set<NetInfoListener>();

export function __setNetInfoConnected(value: boolean): void {
  connected = value;
  const state = { isConnected: value, isInternetReachable: value ? true : false };
  listeners.forEach((fn) => fn(state));
}

function addListener(listener: NetInfoListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export default {
  fetch: async () => ({
    isConnected: connected,
    isInternetReachable: connected ? true : false,
  }),
  addEventListener: (
    listenerOrType: string | NetInfoListener,
    maybeListener?: NetInfoListener,
  ) => {
    const listener =
      typeof listenerOrType === "function" ? listenerOrType : (maybeListener as NetInfoListener);
    return addListener(listener);
  },
};
