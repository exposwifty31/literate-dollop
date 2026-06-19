import { useEffect, useRef } from "react";

import { primeNetworkState, subscribeOnline } from "@/lib/network";
import { processQueue } from "@/lib/sync-engine";

const DEBOUNCE_MS = 500;

export function useSync(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    function scheduleProcessQueue() {
      if (!isMounted) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!isMounted) return;
        timerRef.current = null;
        void processQueue();
      }, DEBOUNCE_MS);
    }

    void primeNetworkState().then(() => {
      if (isMounted) scheduleProcessQueue();
    });

    const unsubscribe = subscribeOnline((online) => {
      if (online) scheduleProcessQueue();
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
}
