import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, StyleProp } from "react-native";
import { K, ButtonColors } from "../constants/colors";
import { typography, radius } from "../constants/typography";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "standard" | "wide";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "standard",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    size === "wide" && styles.wide,
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "ghost" && styles.ghost,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === "primary" && styles.textPrimary,
    variant === "secondary" && styles.textSecondary,
    variant === "ghost" && styles.textGhost,
    disabled && styles.textDisabled,
  ];

  const spinnerColor = variant === "primary" ? K.bone : K.brown;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.full, // Pill-shaped per Full Nelson
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  wide: {
    paddingHorizontal: 48,
  },
  primary: {
    backgroundColor: ButtonColors.primary.background,
  },
  secondary: {
    backgroundColor: ButtonColors.secondary.background,
  },
  ghost: {
    backgroundColor: ButtonColors.ghost.background,
    borderWidth: 1,
    borderColor: ButtonColors.ghost.border,
  },
  disabled: {
    backgroundColor: ButtonColors.disabled.background,
  },
  text: {
    ...typography.button,
  },
  textPrimary: {
    color: ButtonColors.primary.text,
  },
  textSecondary: {
    color: ButtonColors.secondary.text,
  },
  textGhost: {
    color: ButtonColors.ghost.text,
  },
  textDisabled: {
    color: ButtonColors.disabled.text,
  },
});
