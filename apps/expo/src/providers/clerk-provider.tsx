import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { type ReactNode, useEffect } from "react";

import { setAuthHeaderProvider } from "@/lib/auth/get-auth-headers";
import { clerkTokenCache } from "@/lib/auth/token-cache";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthHeaderBridge({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setAuthHeaderProvider(async () => {
      const token = await getToken();
      if (!token) return {} as Record<string, string>;
      return { Authorization: `Bearer ${token}` };
    });
  }, [getToken, isLoaded]);

  return children;
}

export function VetTrackClerkProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    console.warn(
      "[clerk] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY missing — auth disabled until configured",
    );
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={clerkTokenCache}>
      <AuthHeaderBridge>{children}</AuthHeaderBridge>
    </ClerkProvider>
  );
}
