import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { K } from "../constants/colors";
import { typography, spacing, radius } from "../constants/typography";
import { EsterBubble } from "./EsterBubble";

// Check-in data
const ENERGY_OPTIONS = [
  { id: "low", label: "Low", emoji: "😴" },
  { id: "okay", label: "Okay", emoji: "😐" },
  { id: "steady", label: "Steady", emoji: "🙂" },
  { id: "high", label: "High", emoji: "⚡" },
];

const STRESS_OPTIONS = [
  { id: "work", label: "Work", emoji: "💼" },
  { id: "sleep", label: "Sleep", emoji: "😴" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "health", label: "Health", emoji: "🏥" },
  { id: "none", label: "None", emoji: "✨" },
];

const SLEEP_QUALITY = [
  { id: "poor", label: "Poor" },
  { id: "okay", label: "Okay" },
  { id: "good", label: "Good" },
  { id: "great", label: "Great" },
];

interface CheckInData {
  energy: string | null;
  stress: string | null;
  sleepHours: number | null;
  sleepQuality: string | null;
}

interface CheckInProps {
  onComplete: (data: CheckInData) => void;
  onDismiss?: () => void;
}

export function CheckIn({ onComplete, onDismiss }: CheckInProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CheckInData>({
    energy: null,
    stress: null,
    sleepHours: null,
    sleepQuality: null,
  });
  const [showEsterResponse, setShowEsterResponse] = useState(false);

  const handleEnergySelect = (id: string) => {
    setData((prev) => ({ ...prev, energy: id }));
    setStep(2);
  };

  const handleStressSelect = (id: string) => {
    setData((prev) => ({ ...prev, stress: id }));
    setStep(3);
  };

  const handleSleepSelect = (hours: number, quality: string) => {
    const finalData = { ...data, sleepHours: hours, sleepQuality: quality };
    setData(finalData);
    setShowEsterResponse(true);
    onComplete(finalData);
  };

  const handleSkipSleep = () => {
    setShowEsterResponse(true);
    onComplete(data);
  };

  // Get Ester's response based on check-in data
  const getEsterResponse = () => {
    if (data.energy === "low" && data.stress !== "none") {
      return "Got it. I'll factor that into today's meals — protein-forward to stabilize your afternoon.";
    }
    if (data.energy === "high" && data.stress === "none") {
      return "Great energy today! I'll keep your meals balanced to maintain it.";
    }
    if (data.stress === "work") {
      return "Work stress is real. I've got some calming foods planned for dinner.";
    }
    return "Thanks for checking in. I'll use this to tune your meals today.";
  };

  if (showEsterResponse) {
    return (
      <View style={styles.container}>
        <EsterBubble
          message={getEsterResponse()}
          variant="inline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              s === step && styles.stepDotActive,
              s < step && styles.stepDotComplete,
            ]}
          />
        ))}
      </View>

      {/* Step 1: Energy */}
      {step === 1 && (
        <View style={styles.stepContent}>
          <Text style={styles.question}>How's your energy today?</Text>
          <View style={styles.options}>
            {ENERGY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pill,
                  data.energy === option.id && styles.pillSelected,
                ]}
                onPress={() => handleEnergySelect(option.id)}
              >
                <Text style={styles.pillEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.pillLabel,
                    data.energy === option.id && styles.pillLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Step 2: Stress */}
      {step === 2 && (
        <View style={styles.stepContent}>
          <Text style={styles.question}>Any stress sources today?</Text>
          <View style={styles.options}>
            {STRESS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pill,
                  data.stress === option.id && styles.pillSelected,
                ]}
                onPress={() => handleStressSelect(option.id)}
              >
                <Text style={styles.pillEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.pillLabel,
                    data.stress === option.id && styles.pillLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Step 3: Sleep (optional) */}
      {step === 3 && (
        <View style={styles.stepContent}>
          <Text style={styles.question}>How'd you sleep?</Text>
          <View style={styles.sleepRow}>
            <Text style={styles.sleepLabel}>Hours:</Text>
            <View style={styles.hoursOptions}>
              {[5, 6, 7, 8, 9].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.hourPill,
                    data.sleepHours === h && styles.hourPillSelected,
                  ]}
                  onPress={() => setData((prev) => ({ ...prev, sleepHours: h }))}
                >
                  <Text
                    style={[
                      styles.hourText,
                      data.sleepHours === h && styles.hourTextSelected,
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {data.sleepHours && (
            <View style={styles.qualityRow}>
              <Text style={styles.sleepLabel}>Quality:</Text>
              <View style={styles.qualityOptions}>
                {SLEEP_QUALITY.map((q) => (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.qualityPill,
                      data.sleepQuality === q.id && styles.qualityPillSelected,
                    ]}
                    onPress={() => handleSleepSelect(data.sleepHours!, q.id)}
                  >
                    <Text
                      style={[
                        styles.qualityText,
                        data.sleepQuality === q.id && styles.qualityTextSelected,
                      ]}
                    >
                      {q.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipSleep}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dismiss button */}
      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.lg,
    position: "relative",
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: K.border,
  },
  stepDotActive: {
    width: 20,
    backgroundColor: K.ochre,
  },
  stepDotComplete: {
    backgroundColor: K.brown,
  },
  stepContent: {
    alignItems: "center",
  },
  question: {
    ...typography.bodyMedium,
    color: K.brown,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: K.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: K.border,
    gap: 6,
  },
  pillSelected: {
    backgroundColor: K.ochre,
    borderColor: K.ochre,
  },
  pillEmoji: {
    fontSize: 16,
  },
  pillLabel: {
    ...typography.bodySmall,
    color: K.brown,
  },
  pillLabelSelected: {
    fontWeight: "600",
  },
  sleepRow: {
    width: "100%",
    marginBottom: spacing.md,
  },
  sleepLabel: {
    ...typography.caption,
    color: K.textMuted,
    marginBottom: spacing.sm,
  },
  hoursOptions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  hourPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: K.white,
    borderWidth: 1,
    borderColor: K.border,
    justifyContent: "center",
    alignItems: "center",
  },
  hourPillSelected: {
    backgroundColor: K.ochre,
    borderColor: K.ochre,
  },
  hourText: {
    ...typography.bodyMedium,
    color: K.brown,
  },
  hourTextSelected: {
    fontWeight: "700",
  },
  qualityRow: {
    width: "100%",
    marginBottom: spacing.md,
  },
  qualityOptions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  qualityPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: K.white,
    borderWidth: 1,
    borderColor: K.border,
  },
  qualityPillSelected: {
    backgroundColor: K.ochre,
    borderColor: K.ochre,
  },
  qualityText: {
    ...typography.bodySmall,
    color: K.brown,
  },
  qualityTextSelected: {
    fontWeight: "600",
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    ...typography.bodySmall,
    color: K.textMuted,
  },
  dismissButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: K.white,
    justifyContent: "center",
    alignItems: "center",
  },
  dismissText: {
    fontSize: 18,
    color: K.textMuted,
    fontWeight: "300",
  },
});
