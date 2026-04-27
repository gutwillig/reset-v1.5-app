import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { fonts, spacing } from "../../constants/typography";
import { useAppPalette } from "../../hooks/useAppPalette";

interface CheckInCardProps {
  onPress: () => void;
  onSkip?: () => void;
  onRemind?: () => void;
}

export function CheckInCard({ onPress, onSkip, onRemind }: CheckInCardProps) {
  const { nestedBg, textColor, subtleText } = useAppPalette();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: nestedBg }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: subtleText }]}>Today's Entry</Text>
        <View style={styles.pills}>
          <TouchableOpacity
            style={[styles.pill, { borderColor: textColor }]}
            onPress={onSkip}
            activeOpacity={0.85}
          >
            <Text style={[styles.pillLabel, { color: textColor }]}>Skip today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, { borderColor: textColor }]}
            onPress={onRemind}
            activeOpacity={0.85}
          >
            <Text style={[styles.pillLabel, { color: textColor }]}>Remind Me</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.promptRow}>
        <Text style={[styles.prompt, { color: subtleText }]}>What went well today?</Text>
        <Text style={[styles.arrow, { color: subtleText }]}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 4,
    gap: spacing.xl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: -0.12,
  },
  pills: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: "center",
  },
  pillLabel: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
  },
  promptRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  prompt: {
    flex: 1,
    fontFamily: fonts.dmSans,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.32,
  },
  arrow: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "400",
  },
});
