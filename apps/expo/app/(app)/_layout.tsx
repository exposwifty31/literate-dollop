import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

const hasClerkPublishableKey = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (hasClerkPublishableKey) {
    if (!isLoaded) {
      return null;
    }
    if (!isSignedIn) {
      return <Redirect href="/(auth)/sign-in" />;
    }
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
