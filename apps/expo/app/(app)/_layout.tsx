import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { CutoverBanner } from '@/components/CutoverBanner';
import { isClerkActive } from '@/lib/auth/clerk-config';
import { t } from '@/lib/i18n';
import { buildSignInHref, usePendingDeepLinkReturn } from '@/lib/linking/deep-link-return';

function AppStack() {
  return (
    <View style={{ flex: 1 }}>
      <CutoverBanner />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: t.scanScreen.title }} />
        <Stack.Screen name="equipment/[id]" options={{ title: t.nav.equipment }} />
      </Stack>
    </View>
  );
}

function AppLayoutWithClerk() {
  const { isSignedIn, isLoaded } = useAuth();
  const pendingReturn = usePendingDeepLinkReturn();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <ActivityIndicator />
        <Text>{t.auth.guard.loadingApp}</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href={buildSignInHref(pendingReturn)} />;
  }

  return <AppStack />;
}

export default function AppLayout() {
  if (!isClerkActive) {
    return <AppStack />;
  }

  return <AppLayoutWithClerk />;
}
