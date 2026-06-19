import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { isClerkActive } from "@/lib/auth/clerk-config";
import { t } from "@/lib/i18n";

function SignedInHome() {
  const { user } = useUser();

  return (
    <Text style={styles.subtitle} testID="home-signed-in-email">
      {t.home.signedInAs(user?.primaryEmailAddress?.emailAddress ?? t.home.signedInUnknown)}
    </Text>
  );
}

function ClerkSignedInBanner() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return null;
  return <SignedInHome />;
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.home.appName}</Text>
      <Text style={styles.subtitle}>{t.home.phaseSubtitle}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.home.phase1Title}</Text>
        {t.home.phase1Items.map((item) => (
          <Text key={item} style={styles.bullet}>
            • {item}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.home.phase3Title}</Text>
        {t.home.phase3Items.map((item) => (
          <Text key={item} style={styles.bullet}>
            • {item}
          </Text>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.home.scanCta}
        onPress={() => router.push("/scan")}
        style={({ pressed }) => [styles.scanButton, { opacity: pressed ? 0.85 : 1 }]}
        testID="home-scan-cta"
      >
        <Text style={styles.scanButtonText}>{t.home.scanCta}</Text>
      </Pressable>

      {isClerkActive ? <ClerkSignedInBanner /> : null}

      <Text style={styles.hint}>{t.home.hint}</Text>
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
  scanButton: {
    backgroundColor: "#0a7ea4",
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  hint: {
    color: "#687076",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});
