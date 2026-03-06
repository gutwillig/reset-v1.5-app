import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { K } from "../constants/colors";
import { typography, radius } from "../constants/typography";

interface PillProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "outline";
}

export function Pill({
  label,
  selected = false,
  onPress,
  style,
  variant = "default",
}: PillProps) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        variant === "outline" && styles.pillOutline,
        selected && styles.pillSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: K.border,
    backgroundColor: K.bone,
  },
  pillOutline: {
    backgroundColor: "transparent",
    borderColor: K.brown,
  },
  pillSelected: {
    backgroundColor: K.brown,
    borderColor: K.brown,
  },
  label: {
    ...typography.bodyMedium,
    color: K.brown,
    textAlign: "center",
  },
  labelSelected: {
    color: K.bone,
  },
});
