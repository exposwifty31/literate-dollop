import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { type ReactNode, useEffect } from "react";

import { Platform } from "react-native";

import {
  clerkApiEnvMismatchWarning,
  clerkPublishableKey,
  isClerkActive,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";
import { setAuthHeaderProvider } from "@/lib/auth/get-auth-headers";

function AuthHeaderBridge({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setAuthHeaderProvider(async () => ({}));
      return;
    }
    setAuthHeaderProvider(async () => {
      const token = await getToken();
      if (!token) return {} as Record<string, string>;
      return { Authorization: `Bearer ${token}` };
    });
  }, [getToken, isLoaded, isSignedIn]);

  return children;
}

export function VetTrackClerkProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const mismatch = clerkApiEnvMismatchWarning();
    if (mismatch) {
      console.warn(`[clerk] ${mismatch}`);
    }
  }, []);

  if (!isClerkActive) {
    if (isClerkConfigured && Platform.OS === "web") {
      console.warn(
        "[clerk] Web preview skips Clerk — use an iOS/Android development build for sign-in.",
      );
    } else if (!isClerkConfigured) {
      console.warn(
        "[clerk] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY missing — auth disabled until configured",
      );
    }
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <AuthHeaderBridge>{children}</AuthHeaderBridge>
    </ClerkProvider>
  );
}
