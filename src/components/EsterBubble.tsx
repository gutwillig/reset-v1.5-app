import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from "react-native";
import { K } from "../constants/colors";
import { typography, spacing, radius } from "../constants/typography";
import { Avatar, AvatarState } from "./Avatar";

export type EsterVariant = "greeting" | "inline" | "observation" | "nudge";

interface EsterBubbleProps {
  message: string;
  variant?: EsterVariant;
  avatarState?: AvatarState;
  showAvatar?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Ester Component System
 *
 * 4 Variants:
 * - greeting: Large bubble for Home screen, prominent avatar
 * - inline: Small bubble after check-in or quick responses
 * - observation: Card style for nudge slot, observational messages
 * - nudge: Card with action prompt, used for prompts like Yap Session
 */
export function EsterBubble({
  message,
  variant = "greeting",
  avatarState = "neutral",
  showAvatar = true,
  style,
}: EsterBubbleProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <View style={[styles.container, config.containerStyle, style]}>
      {showAvatar && (
        <Avatar size={config.avatarSize} state={avatarState} />
      )}
      <View style={[styles.bubble, config.bubbleStyle, !showAvatar && styles.bubbleNoAvatar]}>
        <Text style={[styles.text, config.textStyle]} numberOfLines={config.maxLines}>
          {message}
        </Text>
      </View>
    </View>
  );
}

// Variant configurations
const VARIANT_CONFIG: Record<EsterVariant, {
  avatarSize: number;
  containerStyle: ViewStyle;
  bubbleStyle: ViewStyle;
  textStyle: object;
  maxLines?: number;
}> = {
  greeting: {
    avatarSize: 48,
    containerStyle: {
      alignItems: "flex-start",
    },
    bubbleStyle: {
      backgroundColor: K.bone,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderTopLeftRadius: 4,
    },
    textStyle: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 26,
    },
    maxLines: undefined,
  },
  inline: {
    avatarSize: 32,
    containerStyle: {
      alignItems: "flex-start",
    },
    bubbleStyle: {
      backgroundColor: K.bone,
      padding: spacing.md,
      borderRadius: radius.md,
      borderTopLeftRadius: 4,
    },
    textStyle: {
      ...typography.bodySmall,
      fontSize: 14,
      lineHeight: 20,
    },
    maxLines: 3,
  },
  observation: {
    avatarSize: 36,
    containerStyle: {
      alignItems: "flex-start",
    },
    bubbleStyle: {
      backgroundColor: K.blue,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderTopLeftRadius: 4,
    },
    textStyle: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: K.brown,
    },
    maxLines: undefined,
  },
  nudge: {
    avatarSize: 40,
    containerStyle: {
      alignItems: "flex-start",
    },
    bubbleStyle: {
      backgroundColor: K.ochre,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderTopLeftRadius: 4,
    },
    textStyle: {
      ...typography.bodyMedium,
      fontSize: 15,
      lineHeight: 22,
      color: K.brown,
    },
    maxLines: undefined,
  },
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.md,
  },
  bubble: {
    flex: 1,
  },
  bubbleNoAvatar: {
    borderTopLeftRadius: radius.lg,
  },
  text: {
    color: K.text,
  },
});

// Additional component for greeting variant with larger presence
export function EsterGreeting({
  message,
  userName,
  avatarState = "neutral",
  onPress,
}: {
  message: string;
  userName?: string;
  avatarState?: AvatarState;
  onPress?: () => void;
}) {
  const greeting = userName ? `${message}, ${userName}.` : message;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={greetingStyles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Avatar size={56} state={avatarState} />
      <View style={greetingStyles.content}>
        <Text style={greetingStyles.label}>ESTER</Text>
        <Text style={greetingStyles.message}>{greeting}</Text>
        {onPress && (
          <View style={greetingStyles.chatHint}>
            <Text style={greetingStyles.chatHintText}>Tap to chat →</Text>
          </View>
        )}
      </View>
    </Container>
  );
}

const greetingStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: K.bone,
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    color: K.textMuted,
    fontWeight: "600",
    marginBottom: 4,
  },
  message: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 26,
    color: K.brown,
  },
  chatHint: {
    marginTop: spacing.sm,
  },
  chatHintText: {
    ...typography.caption,
    color: K.ochre,
    fontWeight: "600",
  },
});

// Observation card variant for nudge slot
export function EsterObservation({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <View style={observationStyles.card}>
      <View style={observationStyles.header}>
        <Avatar size={32} state="observing" />
        <Text style={observationStyles.label}>Ester noticed</Text>
      </View>
      <Text style={observationStyles.message}>{message}</Text>
    </View>
  );
}

const observationStyles = StyleSheet.create({
  card: {
    backgroundColor: K.blue,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: K.brown,
    opacity: 0.7,
  },
  message: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: K.brown,
  },
});
