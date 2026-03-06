import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import {
  QUIZ_Q1,
  getQuizQ2,
  getQuizQ3Setup,
} from "../../constants/types";
import { EsterBubble, Pill, Button } from "../../components";
import { useApp } from "../../context/AppContext";

type Props = NativeStackScreenProps<any, "Quiz">;

type Q1Answer = "afternoon_evening" | "random";
type Q2Answer = "crash" | "drift";

export function QuizScreen({ navigation }: Props) {
  const { setQuizAnswer } = useApp();
  const [step, setStep] = useState(1);
  const [q1Answer, setQ1Answer] = useState<Q1Answer | null>(null);
  const [q2Answer, setQ2Answer] = useState<Q2Answer | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedAnswer) return;
      const answer = selectedAnswer as Q1Answer;
      setQ1Answer(answer);
      setQuizAnswer("q1", answer);
      setSelectedAnswer(null);
      setStep(2);
    } else if (step === 2) {
      if (!selectedAnswer) return;
      const answer = selectedAnswer as Q2Answer;
      setQ2Answer(answer);
      setQuizAnswer("q2", answer);
      setSelectedAnswer(null);
      setStep(3);
    } else if (step === 3) {
      // Q3 is just the setup - CTA goes to camera permission
      navigation.navigate("CameraPerm");
    }
  };

  const renderQuestion = () => {
    if (step === 1) {
      return {
        esterPrompt: QUIZ_Q1.esterPrompt,
        options: QUIZ_Q1.options,
      };
    }

    if (step === 2 && q1Answer) {
      const q2 = getQuizQ2(q1Answer);
      return {
        esterPrompt: q2.esterPrompt,
        options: q2.options,
      };
    }

    if (step === 3 && q1Answer && q2Answer) {
      const setupText = getQuizQ3Setup(q1Answer, q2Answer);
      return {
        esterPrompt: setupText,
        options: null, // Q3 has no options, just CTA
      };
    }

    return { esterPrompt: "", options: [] };
  };

  const question = renderQuestion();
  const isQ3 = step === 3;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progress}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === step && styles.progressDotActive,
                i < step && styles.progressDotComplete,
              ]}
            />
          ))}
        </View>

        {/* Ester prompt */}
        <View style={styles.esterContainer}>
          <EsterBubble message={question.esterPrompt} />
        </View>

        {/* Options (Q1 and Q2 only) */}
        {question.options && (
          <View style={styles.options}>
            {question.options.map((option) => (
              <Pill
                key={option.id}
                label={option.label}
                selected={selectedAnswer === option.value}
                onPress={() => handleSelect(option.value)}
                style={styles.option}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottom}>
        {isQ3 ? (
          <Button
            title="Let Ester see"
            onPress={handleNext}
          />
        ) : (
          <Button
            title="Continue"
            onPress={handleNext}
            disabled={!selectedAnswer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: K.white,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: K.border,
  },
  progressDotActive: {
    backgroundColor: K.ochre,
    width: 24,
  },
  progressDotComplete: {
    backgroundColor: K.brown,
  },
  esterContainer: {
    marginBottom: spacing.xl,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    width: "100%",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 40,
    backgroundColor: K.white,
  },
});
