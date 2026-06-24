import { StyleSheet, Text, View } from "react-native";

import type { EquipmentStatus } from "@/types/equipment";
import { statusColors } from "../tokens";
import { radii as tokenRadii, spacing as tokenSpacing, typography as tokenTypography } from "../tokens";

interface StatusBadgeProps {
  status: EquipmentStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const bg = statusColors[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: tokenRadii.full,
          paddingHorizontal: tokenSpacing[2],
          paddingVertical: tokenSpacing[1],
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize: tokenTypography.size.xs,
            fontWeight: tokenTypography.weight.semibold,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
  },
  label: {
    color: "#ffffff",
  },
});
