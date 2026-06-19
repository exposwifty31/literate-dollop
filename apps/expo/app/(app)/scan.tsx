import { StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

/**
 * Deep-link landing for vettrack://scan (Control Widget + Phase 3 NFC entry).
 */
export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Equipment scan</Text>
      <Text style={[styles.body, { color: colors.text }]}>
        Opened from the VetTrack Control Widget or Home. NFC scan flow ships in Phase 3.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.85,
    textAlign: "center",
  },
});
