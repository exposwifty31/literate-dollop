import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { Shift, ShiftRole, UserRole } from "@/types";
import type { AuthoritySnapshot } from "@/types/shared/authority";
import { setAuthState, setCurrentClinicId } from "@/lib/auth-store";
import { isValidJwt, setClerkTokenGetter } from "@/lib/auth-fetch";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import {
  restoreOfflineSession,
  saveOfflineSession,
  clearOfflineSession,
} from "@/lib/offline-session";
import { authFetchUsersMe, authPostUsersSync } from "@/lib/api";
import { setAuthStateRef, clearHaltQueue, processQueue } from "@/lib/sync-engine";
import { isOnline } from "@/lib/network";

/**
 * Auth provider — ported from web `use-auth`. Changes for Expo:
 *   - `@clerk/clerk-react` → `@clerk/clerk-expo`
 *   - `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` → `process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
 *   - `window` / `safeReloadPage` removed (no DOM; sign-out resets state and the
 *     router/guard handles redirect)
 *   - offline-sync telemetry calls dropped (telemetry layer not yet ported)
 * Multi-tenant + role invariants are preserved: clinicId comes from the server
 * `/api/users/me` response and role is whatever the server resolves.
 */
export type UserStatus = "pending" | "active" | "blocked" | null;
export type AccessDeniedReason =
  | "MISSING_CLINIC_ID"
  | "DB_FALLBACK_DISABLED"
  | "TENANT_CONTEXT_MISSING"
  | "TENANT_MISMATCH"
  | "INSUFFICIENT_ROLE"
  | "ACCOUNT_DELETED"
  | "ACCOUNT_BLOCKED"
  | "ACCOUNT_PENDING_APPROVAL"
  | null;

interface AuthState {
  userId: string | null;
  email: string | null;
  name: string | null;
  role: UserRole;
  secondaryRole: string | null;
  effectiveRole: UserRole | ShiftRole;
  roleSource: "shift" | "permanent";
  activeShift: Shift | null;
  resolvedAt: string | null;
  status: UserStatus;
  accessDeniedReason: AccessDeniedReason;
  isLoaded: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isOfflineSession: boolean;
  /** Server-derived — clinic-wide ER lock toggle (owner allowlist when configured). */
  canManageErMode: boolean;
  /** Phase 2A: advisory-only authority snapshot from /api/users/me. Not enforced. */
  authority?: AuthoritySnapshot;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshAuth: () => void;
}

interface SyncedUserResponse {
  id: string;
  clinicId?: string;
  email: string;
  name: string;
  role: UserRole;
  secondaryRole?: string | null;
  effectiveRole?: UserRole | ShiftRole;
  roleSource?: "shift" | "permanent";
  activeShift?: Shift | null;
  resolvedAt?: string;
  status: UserStatus;
  canManageErMode?: boolean;
  authority?: AuthoritySnapshot;
  error?: string;
  reason?: string;
  message?: string;
}

const SIGNED_OUT_STATE: AuthState = {
  userId: null,
  email: null,
  name: null,
  role: "technician",
  secondaryRole: null,
  effectiveRole: "technician",
  roleSource: "permanent",
  activeShift: null,
  resolvedAt: null,
  status: null,
  accessDeniedReason: null,
  isLoaded: false,
  isSignedIn: false,
  isAdmin: false,
  isOfflineSession: false,
  canManageErMode: false,
};

const AuthContext = createContext<AuthContextType>({
  ...SIGNED_OUT_STATE,
  signOut: async () => {},
  refreshAuth: () => {},
});

function isClerkConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

function offlineStateFromSnapshot(snapshot: ReturnType<typeof restoreOfflineSession>): AuthState | null {
  if (!snapshot) return null;
  setAuthState({
    userId: snapshot.userId,
    email: snapshot.email,
    name: snapshot.name,
    bearerToken: snapshot.token,
  });
  setCurrentClinicId(snapshot.clinicId);
  return {
    userId: snapshot.userId,
    email: snapshot.email,
    name: snapshot.name,
    role: snapshot.role as UserRole,
    secondaryRole: null,
    effectiveRole: snapshot.role as UserRole,
    roleSource: "permanent",
    activeShift: null,
    resolvedAt: null,
    status: snapshot.status as UserStatus,
    accessDeniedReason: null,
    isLoaded: true,
    isSignedIn: true,
    isAdmin: snapshot.role === "admin",
    isOfflineSession: true,
    canManageErMode: false,
  };
}

function DevAuthProviderInner({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const offlineSnapshot = !isOnline() ? restoreOfflineSession() : null;

  const [state, setState] = useState<AuthState>(
    () => offlineStateFromSnapshot(offlineSnapshot) ?? SIGNED_OUT_STATE,
  );
  const [authRefreshNonce, setAuthRefreshNonce] = useState(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setAuthStateRef(() => ({
      isSignedIn: stateRef.current.isSignedIn,
      isOfflineSession: stateRef.current.isOfflineSession,
    }));
    return () => {
      setAuthStateRef(() => null);
    };
  }, []);

  const signOut = useCallback(async () => {
    clearOfflineSession();
    clearHaltQueue();
    setCurrentClinicId();
    setAuthState({ userId: "", email: "", name: "", bearerToken: null });
    queryClient.clear();
    setState({ ...SIGNED_OUT_STATE, isLoaded: true });
  }, [queryClient]);

  const refreshAuth = useCallback(() => {
    setState((prev) => ({ ...prev, isLoaded: false }));
    setAuthRefreshNonce((v) => v + 1);
  }, []);

  useEffect(() => {
    setClerkTokenGetter(null);
    return () => {
      setClerkTokenGetter(null);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function syncDevSession() {
      try {
        const res = await authFetchUsersMe({ signal: controller.signal });
        const data = await res.json().catch(() => ({}) as Partial<SyncedUserResponse>);
        if (!res.ok) {
          throw new Error(`DEV_AUTH_SYNC_FAILED_${res.status}`);
        }

        const dbUserId = typeof data.id === "string" ? data.id : "";
        const role = (data.role ?? "technician") as UserRole;
        const status = (data.status ?? "active") as UserStatus;
        const resolvedEmail = typeof data.email === "string" ? data.email : "";
        const resolvedName = typeof data.name === "string" ? data.name : "";
        if (!dbUserId) {
          throw new Error("Missing DB user ID in /api/users/me response");
        }

        setAuthState({ userId: dbUserId, email: resolvedEmail, name: resolvedName, bearerToken: null });
        setCurrentClinicId(typeof data.clinicId === "string" ? data.clinicId : undefined);

        clearHaltQueue();
        saveOfflineSession({
          userId: dbUserId,
          email: resolvedEmail,
          name: resolvedName,
          role,
          status: status ?? "active",
          token: "",
          clinicId: typeof data.clinicId === "string" ? data.clinicId : undefined,
        });

        setState({
          userId: dbUserId,
          email: resolvedEmail,
          name: resolvedName,
          role,
          secondaryRole: (data.secondaryRole ?? null) as string | null,
          effectiveRole: (data.effectiveRole ?? role) as UserRole | ShiftRole,
          roleSource: data.roleSource ?? "permanent",
          activeShift: data.activeShift ?? null,
          resolvedAt: data.resolvedAt ?? null,
          status,
          accessDeniedReason: null,
          isLoaded: true,
          isSignedIn: true,
          isAdmin: role === "admin" || (data.secondaryRole ?? null) === "admin",
          isOfflineSession: false,
          canManageErMode: data.canManageErMode === true,
          authority: data.authority,
        });

        processQueue().catch(() => {});
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Dev auth sync failed:", err);
        clearHaltQueue();
        setCurrentClinicId();
        setAuthState({ userId: "", email: "", name: "", bearerToken: null });
        setState({ ...SIGNED_OUT_STATE, isLoaded: true });
      }
    }

    void syncDevSession();
    return () => controller.abort();
  }, [authRefreshNonce]);

  const value = useMemo(() => ({ ...state, signOut, refreshAuth }), [state, signOut, refreshAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkModeAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken, signOut: clerkSignOut } = useClerkAuth();
  const queryClient = useQueryClient();

  const offlineSnapshot = !isOnline() ? restoreOfflineSession() : null;

  const [state, setState] = useState<AuthState>(
    () => offlineStateFromSnapshot(offlineSnapshot) ?? SIGNED_OUT_STATE,
  );
  const [authRefreshNonce, setAuthRefreshNonce] = useState(0);
  const stateRef = useRef(state);

  useEffect(() => {
    if (!isSignedIn) {
      setClerkTokenGetter(null);
      return;
    }
    setClerkTokenGetter(async () => {
      const token = await getToken();
      return typeof token === "string" ? token : null;
    });
    return () => {
      setClerkTokenGetter(null);
    };
  }, [getToken, isSignedIn]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setAuthStateRef(() => ({
      isSignedIn: stateRef.current.isSignedIn,
      isOfflineSession: stateRef.current.isOfflineSession,
    }));
    return () => {
      setAuthStateRef(() => null);
    };
  }, []);

  const signOut = useCallback(async () => {
    clearOfflineSession();
    clearHaltQueue();
    setCurrentClinicId();
    setAuthState({ userId: "", email: "", name: "", bearerToken: null });
    queryClient.clear();
    await clerkSignOut();
  }, [queryClient, clerkSignOut]);

  const refreshAuth = useCallback(() => {
    setState((prev) => ({ ...prev, isLoaded: false }));
    setAuthRefreshNonce((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      clearHaltQueue();
      setCurrentClinicId();
      setAuthState({ userId: "", email: "", name: "", bearerToken: null });
      setState({ ...SIGNED_OUT_STATE, isLoaded: true });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    async function syncSession() {
      const rawToken = await getToken();
      const token = typeof rawToken === "string" ? rawToken.trim() : "";
      const email = user?.primaryEmailAddress?.emailAddress || "";
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
      const clerkId = user?.id || "";
      setAuthState({ userId: "", email, name, bearerToken: token || null });

      const headers = {
        "Content-Type": "application/json",
        ...(isValidJwt(token) ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        let res = await authFetchUsersMe({ headers, signal: controller.signal });

        // Sync/provision only when the user is missing/unauthorized.
        if (!res.ok && (res.status === 401 || res.status === 404)) {
          res = await authPostUsersSync(
            { clerkId, email, name },
            { headers, signal: controller.signal },
          );
        }

        const data = await res.json().catch(() => ({}) as Partial<SyncedUserResponse>);

        if (res.ok) {
          const dbUserId = typeof data.id === "string" ? data.id : "";
          const role = (data.role ?? "technician") as UserRole;
          const status = (data.status ?? null) as UserStatus;
          const resolvedEmail = typeof data.email === "string" ? data.email : email;
          const resolvedName = typeof data.name === "string" ? data.name : name;
          if (!dbUserId) {
            throw new Error("Missing DB user ID in /api/users/me response");
          }

          setAuthState({
            userId: dbUserId,
            email: resolvedEmail,
            name: resolvedName,
            bearerToken: token || null,
          });
          setCurrentClinicId(typeof data.clinicId === "string" ? data.clinicId : undefined);

          clearHaltQueue();
          saveOfflineSession({
            userId: dbUserId,
            email: resolvedEmail,
            name: resolvedName,
            role,
            status: status ?? "active",
            token: token || "",
            clinicId: typeof data.clinicId === "string" ? data.clinicId : undefined,
          });

          setState({
            userId: dbUserId,
            email: resolvedEmail,
            name: resolvedName,
            role,
            secondaryRole: (data.secondaryRole ?? null) as string | null,
            effectiveRole: (data.effectiveRole ?? role) as UserRole | ShiftRole,
            roleSource: data.roleSource ?? "permanent",
            activeShift: data.activeShift ?? null,
            resolvedAt: data.resolvedAt ?? null,
            status,
            accessDeniedReason: null,
            isLoaded: true,
            isSignedIn: true,
            isAdmin: role === "admin" || (data.secondaryRole ?? null) === "admin",
            isOfflineSession: false,
            canManageErMode: data.canManageErMode === true,
            authority: data.authority,
          });

          processQueue().catch(() => {});
        } else if (res.status === 403) {
          clearHaltQueue();
          const reason = (typeof data.reason === "string" ? data.reason : null) as AccessDeniedReason;
          const resolvedStatus: UserStatus =
            reason === "ACCOUNT_BLOCKED"
              ? "blocked"
              : reason === "ACCOUNT_PENDING_APPROVAL"
                ? "pending"
                : null;
          setState((s) => ({
            ...s,
            isLoaded: true,
            isSignedIn: true,
            status: resolvedStatus,
            accessDeniedReason: reason,
            isOfflineSession: false,
            canManageErMode: false,
          }));
        } else if (res.status === 401) {
          console.error("Auth sync unauthorized:", data);
          clearHaltQueue();
          setCurrentClinicId();
          setAuthState({ userId: "", email: "", name: "", bearerToken: null });
          setState({ ...SIGNED_OUT_STATE, isLoaded: true });
        } else {
          console.error("Auth sync failed with unexpected status:", res.status, data);
          clearHaltQueue();
          setState((s) => ({
            ...s,
            isLoaded: true,
            isSignedIn: true,
            status: "pending",
            accessDeniedReason: null,
            isOfflineSession: false,
            canManageErMode: false,
          }));
        }
      } catch (err) {
        console.error("Auth Sync Error:", err);
        clearHaltQueue();
        setState((s) => ({
          ...s,
          isLoaded: true,
          isSignedIn: true,
          status: "pending",
          accessDeniedReason: null,
          isOfflineSession: false,
          canManageErMode: false,
        }));
      } finally {
        clearTimeout(timeoutId);
      }
    }

    void syncSession();
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    isLoaded,
    isSignedIn,
    user?.id,
    user?.primaryEmailAddress?.emailAddress,
    user?.firstName,
    user?.lastName,
    getToken,
    authRefreshNonce,
  ]);

  const value = useMemo(() => ({ ...state, signOut, refreshAuth }), [state, signOut, refreshAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function ClerkAuthProviderInner({ children }: { children: ReactNode }) {
  if (isClerkConfigured()) {
    return <ClerkModeAuthProvider>{children}</ClerkModeAuthProvider>;
  }
  return <DevAuthProviderInner>{children}</DevAuthProviderInner>;
}

export const useAuth = () => useContext(AuthContext);
