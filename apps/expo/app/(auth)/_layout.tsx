import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Slot } from 'expo-router';

import { isClerkActive } from '@/lib/auth/clerk-config';

function AuthLayoutWithClerk() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Slot />;
}

export default function AuthLayout() {
  if (!isClerkActive) {
    return <Slot />;
  }

  return <AuthLayoutWithClerk />;
}
