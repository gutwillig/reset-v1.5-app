import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { spacing } from "../../constants/typography";
import { EsterBubble, Pill, Button } from "../../components";
import { useApp } from "../../context/AppContext";

type Props = NativeStackScreenProps<any, "Goal">;

export const GOALS: { id: string; label: string }[] = [
  { id: "weight_loss", label: "Weight loss" },
  { id: "training", label: "Training for something" },
  { id: "maintain_weight", label: "Maintain weight" },
  {
    id: "understand_food_impact",
    label:
      "Be healthy and better understand the impact of different food on my body",
  },
];

export function GoalScreen({ navigation }: Props) {
  const { setGoal } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setGoal(selected);
    navigation.navigate("Quiz");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.esterContainer}>
          <EsterBubble message="Do you have any goals we can help you try and achieve?" />
        </View>

        <View style={styles.options}>
          {GOALS.map((goal) => (
            <Pill
              key={goal.id}
              label={goal.label}
              selected={selected === goal.id}
              onPress={() => setSelected(goal.id)}
              style={styles.option}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selected}
        />
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
