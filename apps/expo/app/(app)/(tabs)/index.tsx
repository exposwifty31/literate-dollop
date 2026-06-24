import { useAuth, useUser } from "@clerk/clerk-expo";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { isClerkActive } from "@/lib/auth/clerk-config";
import { t } from "@/lib/i18n";
import { fetchCurrentShift } from "@/lib/api/shift";
import type { ShiftHandoverSummary } from "@/types/equipment";

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

function ShiftSummaryCard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [shift, setShift] = useState<ShiftHandoverSummary | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const loadShift = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchCurrentShift();
      setShift(result);
    } catch {
      // Silently ignore — home screen should not break if shift API fails
      setShift(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShift();
  }, [loadShift]);

  if (loading) {
    return (
      <View style={styles.shiftCard}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  }

  // shift === undefined means never loaded; null means no shift window; non-null with
  // openShiftSession === null means a shift window exists but no active session to hand off.
  const hasSession = shift != null && shift.openShiftSession !== null;

  const startTime =
    hasSession && shift.openShiftSession
      ? new Date(shift.openShiftSession.startedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const unreturnedCount = shift ? shift.unreturned.length : 0;

  return (
    <View style={styles.shiftCard}>
      {shift == null ? (
        <Text style={[styles.shiftNoActive, { color: colors.text }]}>
          {t.shiftCard.noActiveShift}
        </Text>
      ) : (
        <>
          {startTime ? (
            <Text style={[styles.shiftMeta, { color: colors.text }]}>
              {t.shiftCard.shiftStartedAt(startTime)}
            </Text>
          ) : null}
          <Text style={[styles.shiftItems, { color: colors.text }]}>
            {t.shiftCard.itemsOut(unreturnedCount)}
          </Text>
          {hasSession ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/shift/handoff")}
              style={({ pressed }) => [
                styles.endShiftButton,
                { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
              ]}
              testID="home-end-shift-cta"
            >
              <Text style={styles.endShiftButtonText}>{t.shiftCard.endShiftCta}</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.home.appName}</Text>
      <Text style={styles.subtitle}>{t.home.phaseSubtitle}</Text>

      <ShiftSummaryCard />

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
  shiftCard: {
    backgroundColor: "#f4f6f8",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  shiftNoActive: {
    fontSize: 15,
    color: "#687076",
  },
  shiftMeta: {
    fontSize: 13,
    color: "#687076",
  },
  shiftItems: {
    fontSize: 15,
    fontWeight: "500",
  },
  endShiftButton: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  endShiftButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
