import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

import { isClerkActive } from '@/lib/auth/clerk-config';

function AppStack() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppLayoutWithClerk() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <AppStack />;
}

export default function AppLayout() {
  if (!isClerkActive) {
    return <AppStack />;
  }

  return <AppLayoutWithClerk />;
}
