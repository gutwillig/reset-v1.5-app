import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { K } from "../constants/colors";
import { typography, spacing, radius } from "../constants/typography";
import { Avatar } from "./Avatar";
import { updateProfile } from "../services/profile";

interface Props {
  onComplete: () => void;
  onDismiss: () => void;
}

/**
 * Day 3 Ester prompt: "Any ingredients you can't stand?"
 * Free-text input that parses comma-separated ingredients
 * and saves to tasteExclusions[] on the user profile.
 */
export function IngredientAversionPrompt({ onComplete, onDismiss }: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      onDismiss();
      return;
    }

    setSubmitting(true);
    try {
      const exclusions = text
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await updateProfile({ tasteExclusions: exclusions });
      onComplete();
    } catch {
      // Still dismiss on error — non-critical
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar size={32} state="observing" />
        <Text style={styles.question}>
          Any ingredients you can't stand?
        </Text>
      </View>
      <Text style={styles.hint}>
        Separate with commas (e.g. cilantro, olives, mushrooms)
      </Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type ingredients..."
        placeholderTextColor={K.textMuted}
        multiline
        autoFocus
      />
      <View style={styles.actions}>
        <TouchableOpacity onPress={onDismiss} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={K.bone} />
          ) : (
            <Text style={styles.submitText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 1,
  },
  question: {
    ...typography.bodyMedium,
    color: K.brown,
    flex: 1,
  },
  hint: {
    ...typography.caption,
    color: K.textMuted,
    marginLeft: 40,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: K.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 48,
    color: K.brown,
    fontSize: 15,
    marginLeft: 40,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.sm,
    marginLeft: 40,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  skipText: {
    ...typography.caption,
    color: K.textMuted,
  },
  submitButton: {
    backgroundColor: K.brown,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 60,
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...typography.button,
    color: K.bone,
  },
});
