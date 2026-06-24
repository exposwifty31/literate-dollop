import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Slot, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { isClerkActive } from "@/lib/auth/clerk-config";
import { t } from "@/lib/i18n";
import { resolvePostAuthHref, usePendingDeepLinkReturn } from "@/lib/linking/deep-link-return";

function AuthLayoutWithClerk() {
  const { isSignedIn, isLoaded } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const pendingReturn = usePendingDeepLinkReturn();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
        <ActivityIndicator />
        <Text>{t.auth.guard.loadingApp}</Text>
      </View>
    );
  }

  if (isSignedIn) {
    const href = resolvePostAuthHref(returnTo ?? pendingReturn);
    return <Redirect href={href} />;
  }

  return <Slot />;
}

export default function AuthLayout() {
  if (!isClerkActive) {
    return <Slot />;
  }

  return <AuthLayoutWithClerk />;
}
