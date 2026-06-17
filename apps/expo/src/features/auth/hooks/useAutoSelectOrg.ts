import { useEffect, useRef } from "react";
import { useAuth as useClerkAuth, useOrganizationList } from "@clerk/clerk-expo";

/**
 * Auto-selects the user's first Clerk organization when none is active.
 * Ported from web `useAutoSelectOrg`; `@clerk/clerk-react` → `@clerk/clerk-expo`
 * and the Capacitor URL-loop guard is dropped (clerk-expo does not navigate via
 * URL, so the loop the web guard prevented cannot occur in the Expo runtime).
 */
export function useAutoSelectOrg() {
  const { isSignedIn, isLoaded, orgId } = useClerkAuth();
  const { isLoaded: membershipsReady, userMemberships, setActive } = useOrganizationList({
    userMemberships: true,
  });
  // One-shot guard: setActive may leave orgId unset for a while (or fail);
  // without this the effect refires on every memberships revalidation.
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (!isLoaded) return;
    if (!isSignedIn) return;
    if (!membershipsReady) return;
    if (userMemberships?.isLoading) return;
    if (orgId) return;

    const memberships = userMemberships?.data;
    if (!memberships?.length || !setActive) return;

    const firstOrgId = memberships[0]?.organization?.id;
    if (!firstOrgId) return;

    attemptedRef.current = true;
    void setActive({ organization: firstOrgId }).catch((err: unknown) => {
      console.error("[AutoSelectOrg] setActive failed", err);
    });
  }, [
    isLoaded,
    isSignedIn,
    membershipsReady,
    orgId,
    userMemberships?.data,
    userMemberships?.isLoading,
    setActive,
  ]);
}
