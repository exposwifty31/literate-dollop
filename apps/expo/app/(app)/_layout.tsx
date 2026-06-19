import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

import { isClerkActive } from '@/lib/auth/clerk-config';
import { buildSignInHref, usePendingDeepLinkReturn } from '@/lib/linking/deep-link-return';

function AppStack() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ title: 'Scan' }} />
    </Stack>
  );
}

function AppLayoutWithClerk() {
  const { isSignedIn, isLoaded } = useAuth();
  const pendingReturn = usePendingDeepLinkReturn();

  if (!isLoaded) {
    return null;
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
