import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { K } from "../../constants/colors";
import { fonts, spacing, radius } from "../../constants/typography";

interface MealPlanPromoCardProps {
  onPress?: () => void;
}

export function MealPlanPromoCard({ onPress }: MealPlanPromoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>
        <Text style={styles.textEmphasis}>
          Your free-for-life meal plan is waiting.{" "}
        </Text>
        <Text style={styles.textMuted}>
          Ready to answer a few quick questions?
        </Text>
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaLabel}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: K.bone,
    padding: spacing.md,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderBottomLeftRadius: 0,
    gap: spacing.md,
  },
  text: {
    width: "100%",
  },
  textEmphasis: {
    fontFamily: fonts.dmSansBold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
    color: K.brown,
  },
  textMuted: {
    fontFamily: fonts.dmSans,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
    color: K.sub,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
  },
  ctaButton: {
    backgroundColor: K.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: K.brown,
  },
  arrowButton: {
    backgroundColor: K.blue,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowIcon: {
    fontSize: 20,
    color: K.brown,
    fontWeight: "600",
  },
});
