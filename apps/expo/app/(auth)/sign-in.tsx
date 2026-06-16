import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  clerkApiEnvMismatchWarning,
  isClerkActive,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";

function ClerkSignInForm() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!isLoaded || !signIn) return;
    setSubmitting(true);
    setError(null);
    try {
      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/(app)/(tabs)");
      } else {
        setError("Additional verification required — complete sign-in in Clerk dashboard.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      const mismatch = clerkApiEnvMismatchWarning();
      if (mismatch && /couldn't find your account/i.test(message)) {
        setError(`${message} Check apps/expo/.env — ${mismatch}`);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VetTrack</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        autoCapitalize="none"
        autoComplete="password"
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={submitting || !email || !password}
        onPress={onSubmit}
        style={styles.button}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function SignInScreen() {
  if (!isClerkActive) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>VetTrack</Text>
        <Text style={styles.body}>
          {isClerkConfigured
            ? "Sign-in requires an iOS or Android development build (not web preview)."
            : "Clerk is not configured. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in apps/expo/.env."}
        </Text>
        <Link href="/(app)/(tabs)" style={styles.skip}>
          Continue without Clerk (dev)
        </Link>
      </View>
    );
  }

  return <ClerkSignInForm />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#b00020",
  },
  skip: {
    color: "#687076",
    marginTop: 16,
    textAlign: "center",
  },
});
