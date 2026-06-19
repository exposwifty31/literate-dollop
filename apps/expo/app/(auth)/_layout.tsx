import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Slot, useLocalSearchParams } from 'expo-router';

import { isClerkActive } from '@/lib/auth/clerk-config';
import { resolvePostAuthHref, usePendingDeepLinkReturn } from '@/lib/linking/deep-link-return';

function AuthLayoutWithClerk() {
  const { isSignedIn, isLoaded } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const pendingReturn = usePendingDeepLinkReturn();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href={resolvePostAuthHref(returnTo ?? pendingReturn)} />;
  }

  return <Slot />;
}

export default function AuthLayout() {
  if (!isClerkActive) {
    return <Slot />;
  }

  return <AuthLayoutWithClerk />;
}
