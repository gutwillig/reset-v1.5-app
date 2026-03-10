import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { K } from "../constants/colors";
import { typography, spacing, radius } from "../constants/typography";
import { Avatar } from "./Avatar";

export type NudgeType = "yap" | "scan" | "observation" | "milestone" | "generic";

interface NudgeContent {
  type: NudgeType;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface NudgeSlotProps {
  content: NudgeContent | null;
  onDismiss?: () => void;
}

// Priority order: yap > scan > observation > milestone > generic
const TYPE_CONFIG: Record<NudgeType, {
  icon: string;
  backgroundColor: string;
  avatarState: "neutral" | "observing" | "celebrating";
}> = {
  yap: {
    icon: "💬",
    backgroundColor: K.ochre,
    avatarState: "neutral",
  },
  scan: {
    icon: "📸",
    backgroundColor: K.blue,
    avatarState: "observing",
  },
  observation: {
    icon: "👀",
    backgroundColor: K.blue,
    avatarState: "observing",
  },
  milestone: {
    icon: "🎉",
    backgroundColor: K.ochre,
    avatarState: "celebrating",
  },
  generic: {
    icon: "💡",
    backgroundColor: K.bone,
    avatarState: "neutral",
  },
};

export function NudgeSlot({ content, onDismiss }: NudgeSlotProps) {
  if (!content) {
    // Empty state: slot collapses, no blank space
    return null;
  }

  const config = TYPE_CONFIG[content.type];

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      {/* Dismiss button - only shown if onDismiss provided */}
      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={[styles.content, !onDismiss && styles.contentNoDismiss]}>
        <View style={styles.header}>
          <Avatar size={36} state={config.avatarState} />
          <View style={styles.headerText}>
            <Text style={styles.title}>{content.title}</Text>
          </View>
        </View>

        <Text style={styles.message}>{content.message}</Text>

        {content.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={content.action.onPress}
          >
            <Text style={styles.actionText}>{content.action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Pre-built nudge content generators
export const NudgeContent = {
  yapSession: (onPress: () => void): NudgeContent => ({
    type: "yap",
    title: "Got a minute?",
    message: "Tell me how today's meals worked for you. Quick chat — 60 seconds max.",
    action: {
      label: "Start Yap Session",
      onPress,
    },
  }),

  scanPrompt: (onPress: () => void): NudgeContent => ({
    type: "scan",
    title: "Time for a scan",
    message: "It's been a week since your last reading. Want to check your signals?",
    action: {
      label: "Start Scan",
      onPress,
    },
  }),

  observation: (message: string): NudgeContent => ({
    type: "observation",
    title: "Ester noticed",
    message,
  }),

  milestone: (achievement: string): NudgeContent => ({
    type: "milestone",
    title: "Nice work!",
    message: achievement,
  }),

  generic: (title: string, message: string, action?: { label: string; onPress: () => void }): NudgeContent => ({
    type: "generic",
    title,
    message,
    action,
  }),
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    position: "relative",
  },
  dismissButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  dismissText: {
    fontSize: 18,
    color: K.brown,
    fontWeight: "300",
  },
  content: {
    paddingRight: spacing.lg, // Account for dismiss button
  },
  contentNoDismiss: {
    paddingRight: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.bodyMedium,
    color: K.brown,
    fontWeight: "600",
  },
  message: {
    ...typography.body,
    color: K.brown,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  actionButton: {
    backgroundColor: K.brown,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  actionText: {
    ...typography.bodySmall,
    color: K.bone,
    fontWeight: "600",
  },
});
