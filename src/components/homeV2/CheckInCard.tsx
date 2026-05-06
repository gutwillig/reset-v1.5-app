import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { fonts, spacing } from "../../constants/typography";
import { useAppPalette } from "../../hooks/useAppPalette";

interface CheckInCardProps {
  onPress: () => void;
}

export function CheckInCard({ onPress }: CheckInCardProps) {
  const { nestedBg, subtleText } = useAppPalette();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: nestedBg }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Text style={[styles.label, { color: subtleText }]}>Today's Entry</Text>
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
  label: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: -0.12,
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
