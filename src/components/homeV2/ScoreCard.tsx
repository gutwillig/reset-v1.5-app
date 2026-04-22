import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { K } from "../../constants/colors";
import { fonts, spacing, radius } from "../../constants/typography";
import { useAppPalette } from "../../hooks/useAppPalette";

interface ScoreCardProps {
  score: number | null;
  typeLabel: string;
  daysToFullConfidence?: number;
  onLearnMore: () => void;
}

export function ScoreCard({
  score,
  typeLabel,
  daysToFullConfidence = 0,
  onLearnMore,
}: ScoreCardProps) {
  const { nestedBg, textColor, subtleText, borderColor } = useAppPalette();
  const hasScore = score !== null && score > 0;
  const rounded = hasScore ? Math.round(score!) : 0;
  const fillWidth = Math.max(4, rounded);

  return (
    <View style={[styles.card, { backgroundColor: nestedBg }]}>
      <View style={styles.row}>
        <Text style={[styles.number, { color: textColor }]}>
          {hasScore ? rounded : "—"}
        </Text>
        <View style={styles.side}>
          <Text style={[styles.label, { color: subtleText }]}>Metabolic score</Text>
          <Text style={[styles.type, { color: textColor }]}>{typeLabel}</Text>
        </View>
      </View>

      <View style={styles.confidenceRow}>
        <Text style={[styles.confidenceLabel, { color: subtleText }]}>Confidence</Text>
        <View style={[styles.confidenceTrack, { backgroundColor: borderColor }]}>
          <View
            style={[
              styles.confidenceFill,
              { width: `${fillWidth}%` },
            ]}
          />
        </View>
        <Text style={[styles.confidenceValue, { color: textColor }]}>{rounded}%</Text>
      </View>

      {daysToFullConfidence > 0 ? (
        <Text style={[styles.confidenceHint, { color: subtleText }]}>
          Gathering data — {daysToFullConfidence} days til 100% confidence
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.learnMore}
        onPress={onLearnMore}
        activeOpacity={0.7}
      >
        <Text style={[styles.learnMoreText, { color: textColor }]}>
          How is this calculated? Ask Ester →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  number: {
    fontFamily: fonts.dmSansBold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2,
  },
  side: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  type: {
    fontFamily: fonts.dmSansBold,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confidenceLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
  },
  confidenceTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: K.ochre,
  },
  confidenceValue: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    minWidth: 36,
    textAlign: "right",
  },
  confidenceHint: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
  },
  learnMore: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
  },
  learnMoreText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
