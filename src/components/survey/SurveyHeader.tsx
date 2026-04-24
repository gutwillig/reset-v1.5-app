import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { K } from "../../constants/colors";
import { fonts, spacing } from "../../constants/typography";

interface SurveyHeaderProps {
  step: number;
  totalSteps: number;
  label?: string;
  title: string;
  canGoBack: boolean;
  onBack: () => void;
  onClose: () => void;
}

const TRACK_WIDTH = 52.71;

export function SurveyHeader({
  step,
  totalSteps,
  label = "TODAY'S CHECK-IN",
  title,
  canGoBack,
  onBack,
  onClose,
}: SurveyHeaderProps) {
  const progress = Math.min(Math.max(step / totalSteps, 0), 1);
  const fillWidth = Math.max(4, progress * TRACK_WIDTH);

  return (
    <View style={styles.wrapper}>
      <View style={styles.chromeRow}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={10}
            style={[styles.iconBtn, styles.iconBtnLeft]}
            activeOpacity={0.7}
          >
            <Text style={styles.backGlyph}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.iconBtn, styles.iconBtnLeft]} />
        )}

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: fillWidth }]} />
        </View>

        <TouchableOpacity
          onPress={onClose}
          hitSlop={10}
          style={[styles.iconBtn, styles.iconBtnRight]}
          activeOpacity={0.7}
        >
          <Text style={styles.closeGlyph}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 30,
  },
  chromeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  iconBtnLeft: {
    alignItems: "flex-start",
  },
  iconBtnRight: {
    alignItems: "flex-end",
  },
  backGlyph: {
    fontSize: 22,
    color: K.brown,
    fontWeight: "400",
  },
  closeGlyph: {
    fontSize: 18,
    color: K.brown,
    fontWeight: "400",
  },
  progressTrack: {
    height: 4,
    width: TRACK_WIDTH,
    borderRadius: 4,
    backgroundColor: K.border,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: K.ochre,
    borderRadius: 4,
  },
  textBlock: {
    gap: 10,
  },
  label: {
    fontFamily: fonts.dmSansBold,
    fontSize: 12,
    letterSpacing: -0.12,
    color: K.sub,
  },
  title: {
    fontFamily: fonts.dmSans,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
    color: K.brown,
  },
});
