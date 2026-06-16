import { useAuth, useUser } from "@clerk/clerk-expo";
import { StyleSheet, Text, View } from "react-native";

import { isClerkActive } from "@/lib/auth/clerk-config";

const PHASE_1_ITEMS = [
  "@vettrack/contracts wired",
  "PendingSyncStore + offline seam",
  "Clerk sign-in + /api/users/me",
] as const;

function SignedInHome() {
  const { user } = useUser();

  return (
    <Text style={styles.subtitle} testID="home-signed-in-email">
      Signed in as {user?.primaryEmailAddress?.emailAddress ?? "unknown"}
    </Text>
  );
}

function ClerkSignedInBanner() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return null;
  return <SignedInHome />;
}

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VetTrack</Text>
      <Text style={styles.subtitle}>Expo mobile — Phase 1 foundation</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exit criteria</Text>
        {PHASE_1_ITEMS.map((item) => (
          <Text key={item} style={styles.bullet}>
            • {item}
          </Text>
        ))}
      </View>

      {isClerkActive ? <ClerkSignedInBanner /> : null}

      <Text style={styles.hint}>
        Use the Account tab to verify API auth or sign out. Product routes ship in Phase 3+.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#687076",
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#f4f6f8",
    borderRadius: 12,
    gap: 8,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    color: "#687076",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});
