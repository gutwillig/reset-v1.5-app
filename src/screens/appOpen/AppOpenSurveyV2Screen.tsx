import React, { useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { submitCheckIn } from "../../services/checkIn";
import { SurveyHeader } from "../../components/survey/SurveyHeader";
import { ContinueButton } from "../../components/survey/ContinueButton";
import { FeelingSlider } from "../../components/survey/FeelingSlider";
import {
  MultipleChoiceList,
  MultipleChoiceOption,
} from "../../components/survey/MultipleChoiceList";
import { NumberStepper } from "../../components/survey/NumberStepper";
import type { AppOpenStackParamList } from "../../navigation/AppOpenNavigator";

const STRESS_OPTIONS: MultipleChoiceOption[] = [
  { id: "work", label: "Work" },
  { id: "sleep", label: "Sleep" },
  { id: "family", label: "Family" },
  { id: "health", label: "Health" },
  { id: "none", label: "None" },
];

function sliderToEnergy(value: number): "low" | "okay" | "steady" | "high" {
  if (value < 25) return "low";
  if (value < 55) return "okay";
  if (value < 80) return "steady";
  return "high";
}

export function AppOpenSurveyV2Screen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppOpenStackParamList>>();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [feeling, setFeeling] = useState(50);
  const [stress, setStress] = useState<string | null>(null);
  const [sleepHours, setSleepHours] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const exitToHome = () => {
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "Tabs" }] }),
    );
  };

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
      return;
    }
    setStep((s) => s - 1);
  };

  const handleContinue = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    try {
      const stressTags = stress && stress !== "none" ? [stress] : [];
      await submitCheckIn({
        energy: sliderToEnergy(feeling),
        stressTags,
        sleepHours,
      });
    } catch {
      // Non-blocking: proceed to EncourageScan regardless so the flow completes.
    } finally {
      setSubmitting(false);
      navigation.replace("EncourageScan");
    }
  };

  const canContinue = (() => {
    if (step === 1) return true;
    if (step === 2) return stress !== null;
    if (step === 3) return sleepHours >= 1 && sleepHours <= 14;
    return false;
  })();

  const title = (() => {
    if (step === 1) return "How's your energy today?";
    if (step === 2) return "Any stress sources today?";
    return "How many hours of sleep did you get last night?";
  })();

  const renderBody = () => {
    if (step === 1) return <FeelingSlider value={feeling} onChange={setFeeling} />;
    if (step === 2)
      return (
        <MultipleChoiceList
          options={STRESS_OPTIONS}
          selectedId={stress}
          onSelect={setStress}
        />
      );
    return (
      <NumberStepper
        value={sleepHours}
        min={1}
        max={14}
        unitLabel="hours"
        onChange={setSleepHours}
      />
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" translucent />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SurveyHeader
          step={step}
          totalSteps={3}
          title={title}
          canGoBack={step > 1}
          onBack={handleBack}
          onClose={exitToHome}
        />

        <View style={styles.body}>{renderBody()}</View>
      </ScrollView>

      <View style={[styles.footer, { bottom: insets.bottom + 16 }]}>
        <ContinueButton
          onPress={handleContinue}
          disabled={!canContinue || submitting}
          label={submitting ? "Saving…" : "Continue"}
        />
        {submitting ? (
          <ActivityIndicator
            size="small"
            color={K.brown}
            style={styles.savingSpinner}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: K.white,
  },
  content: {
    paddingTop: 30,
    paddingHorizontal: 44,
    paddingBottom: 120,
    gap: 30,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 24,
  },
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    alignItems: "center",
  },
  savingSpinner: {
    marginTop: 8,
  },
});
