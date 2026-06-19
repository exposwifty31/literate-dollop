import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";

import { setAuthStateRef } from "@/lib/sync-engine";

export function useSyncAuthBridgeWithClerk(): void {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setAuthStateRef(() => ({
      isSignedIn: !!isSignedIn,
      isOfflineSession: false,
    }));
  }, [isLoaded, isSignedIn]);
}

export function useSyncAuthBridgeWithoutClerk(): void {
  useEffect(() => {
    setAuthStateRef(() => ({ isSignedIn: true, isOfflineSession: false }));
  }, []);
}
