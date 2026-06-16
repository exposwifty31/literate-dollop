import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Slot } from 'expo-router';

const hasClerkPublishableKey = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!hasClerkPublishableKey) {
    return <Slot />;
  }

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Slot />;
}
