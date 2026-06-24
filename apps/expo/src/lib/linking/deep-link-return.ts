import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { useEffect, useState } from "react";

export const SCAN_DEEP_LINK_PATH = "/scan";

/** Maps vettrack-expo://scan (and legacy vettrack://scan) to the Expo Router path. */
export function pathFromDeepLinkUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  const parsed = Linking.parse(url);
  const normalizedPath = parsed.path?.replace(/^\//, "") || parsed.hostname || undefined;

  if (normalizedPath === "scan") {
    return SCAN_DEEP_LINK_PATH;
  }

  if (normalizedPath) {
    return `/${normalizedPath}`;
  }

  return undefined;
}

export function buildSignInHref(returnTo?: string): Href {
  if (!returnTo) {
    return "/(auth)/sign-in";
  }
  return {
    pathname: "/(auth)/sign-in",
    params: { returnTo },
  };
}

export function resolvePostAuthHref(returnTo: string | string[] | undefined): Href {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (value === SCAN_DEEP_LINK_PATH) {
    return SCAN_DEEP_LINK_PATH;
  }
  return "/(app)/(tabs)";
}

/** Remembers the first deep-link path seen before Clerk finishes loading. */
export function usePendingDeepLinkReturn(): string | undefined {
  const [returnPath, setReturnPath] = useState<string | undefined>();

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      const path = pathFromDeepLinkUrl(url);
      if (path) setReturnPath(path);
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      const path = pathFromDeepLinkUrl(url);
      if (path) setReturnPath(path);
    });

    return () => subscription.remove();
  }, []);

  return returnPath;
}
