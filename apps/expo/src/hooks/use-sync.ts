import { useEffect, useRef } from "react";

import { primeNetworkState, subscribeOnline } from "@/lib/network";
import { processQueue } from "@/lib/sync-engine";

const DEBOUNCE_MS = 500;

export function useSync(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void primeNetworkState().then(() => {
      scheduleProcessQueue();
    });

    const unsubscribe = subscribeOnline((online) => {
      if (online) scheduleProcessQueue();
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    function scheduleProcessQueue() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void processQueue();
      }, DEBOUNCE_MS);
    }
  }, []);
}
