import { Platform } from "react-native";

const rawClerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";

/** Reject secret keys — Clerk publishable keys are pk_test_* / pk_live_* only. */
function assertValidClerkPublishableKey(key: string): string {
  if (!key) return "";
  if (key.startsWith("sk_")) {
    throw new Error(
      "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY must be a publishable key (pk_test_* or pk_live_*), " +
        "not a secret key (sk_*). Copy the Publishable key from Clerk Dashboard → API Keys.",
    );
  }
  if (!key.startsWith("pk_")) {
    throw new Error(
      "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_test_ or pk_live_. " +
        "Get it from Clerk Dashboard → API Keys.",
    );
  }
  return key;
}

export const clerkPublishableKey = assertValidClerkPublishableKey(rawClerkKey);

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

/**
 * Production API + pk_test Clerk is a common misconfig: demo users (e.g. reviewer@vettrack.uk)
 * live on clerk.vettrack.uk (pk_live_*), not a separate dev Clerk application.
 */
export function clerkApiEnvMismatchWarning(): string | null {
  if (!clerkPublishableKey || !apiUrl) return null;
  const targetsProductionApi =
    apiUrl.includes("vettrack.uk") && !apiUrl.includes("staging");
  const usesTestClerk = clerkPublishableKey.startsWith("pk_test_");
  if (targetsProductionApi && usesTestClerk) {
    return (
      "Clerk key is pk_test_* but EXPO_PUBLIC_API_URL is production. " +
      "Use pk_live_* from clerk.vettrack.uk (same as vettrack VITE_CLERK_PUBLISHABLE_KEY)."
    );
  }
  return null;
}

/** Key present in .env (any platform). */
export const isClerkConfigured = clerkPublishableKey.length > 0;

/**
 * Clerk auth runs on iOS/Android dev builds only.
 * Expo web preview skips Clerk (Phase 1 — use a development build on device).
 */
export const isClerkActive = isClerkConfigured && Platform.OS !== "web";
