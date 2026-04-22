import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, spacing } from "../../constants/typography";
import { useAppPalette } from "../../hooks/useAppPalette";
import { Mascot } from "./Mascot";

interface HomeHeaderProps {
  dateLabel: string;
  dayLabel?: string;
  title?: string;
}

export function HomeHeader({
  dateLabel,
  dayLabel = "Reset Day",
  title = "Today",
}: HomeHeaderProps) {
  const { evening, textColor, subtleText } = useAppPalette();
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <View style={styles.metaRow}>
          <Text style={[styles.metaDate, { color: textColor }]}>{dateLabel}</Text>
          <Text style={[styles.metaDay, { color: subtleText }]}>{dayLabel}</Text>
        </View>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </View>
      <View style={styles.mascotWrap}>
        <Mascot size={260} variant={evening ? "bone" : "ochre"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: 0,
    gap: spacing.md,
    minHeight: 180,
  },
  textBlock: {
    flex: 1,
    gap: 4,
    paddingTop: 0,
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
  },
  metaDate: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    lineHeight: 19,
  },
  metaDay: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    lineHeight: 19,
  },
  title: {
    fontFamily: fonts.dmSans,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.32,
  },
  mascotWrap: {
    marginTop: -78,
    marginRight: -42,
  },
});
