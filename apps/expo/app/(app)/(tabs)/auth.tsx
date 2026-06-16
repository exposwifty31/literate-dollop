import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { fetchUsersMe, type UsersMeResponse } from "@/lib/api";
import { isClerkActive } from "@/lib/auth/clerk-config";

function ClerkAuthStatus() {
  const { signOut } = useAuth();
  const [me, setMe] = useState<UsersMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await fetchUsersMe();
      setMe(profile);
    } catch (err) {
      setMe(null);
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <SignedOut>
        <Text style={styles.body}>Sign in to attach Clerk tokens to API requests.</Text>
        <Link href="/(auth)/sign-in" style={styles.link}>
          Go to sign in
        </Link>
      </SignedOut>
      <SignedIn>
        <Text style={styles.body}>Authenticated — call /api/users/me with Bearer token.</Text>
        <Pressable accessibilityRole="button" onPress={loadMe} style={styles.button}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Fetch /api/users/me</Text>
          )}
        </Pressable>
        {me ? (
          <Text style={styles.result} testID="users-me-result">
            {me.email ?? me.id}
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => signOut()} style={styles.secondary}>
          <Text style={styles.secondaryText}>Sign out</Text>
        </Pressable>
      </SignedIn>
    </View>
  );
}

function DevAuthStatus() {
  const [me, setMe] = useState<UsersMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await fetchUsersMe();
      setMe(profile);
    } catch (err) {
      setMe(null);
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.body}>Clerk disabled — API calls run without Bearer token.</Text>
      <Pressable accessibilityRole="button" onPress={loadMe} style={styles.button}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Fetch /api/users/me</Text>
        )}
      </Pressable>
      {me ? (
        <Text style={styles.result} testID="users-me-result">
          {me.email ?? me.id}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function AuthStatusScreen() {
  return isClerkActive ? <ClerkAuthStatus /> : <DevAuthStatus />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 24,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  link: {
    color: "#0a7ea4",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondary: {
    marginTop: 8,
    paddingVertical: 8,
  },
  secondaryText: {
    color: "#687076",
    textAlign: "center",
  },
  result: {
    fontFamily: "SpaceMono",
    fontSize: 14,
  },
  error: {
    color: "#b00020",
  },
});
