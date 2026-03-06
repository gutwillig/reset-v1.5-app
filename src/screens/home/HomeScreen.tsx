import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/MainNavigator";
import { K } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import {
  EsterGreeting,
  MealCardSlot,
  CheckIn,
  NudgeSlot,
  NudgeContent,
} from "../../components";
import type { Meal } from "../../components";
import { useApp } from "../../context/AppContext";

// Mock meal data generator
function generateMealsForSlot(time: "breakfast" | "lunch" | "dinner", metabolicType: string): Meal[] {
  const mealsByTime: Record<string, Meal[]> = {
    breakfast: [
      {
        id: "b1",
        name: "Protein Scramble",
        whyLine: "Protein-forward to stabilize your morning and prevent afternoon crashes.",
        calories: 420,
        protein: 32,
        prepTime: 15,
        time: "breakfast",
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
      },
      {
        id: "b2",
        name: "Greek Yogurt Bowl",
        whyLine: "High protein, low sugar start. Keeps blood sugar stable.",
        calories: 380,
        protein: 28,
        prepTime: 5,
        time: "breakfast",
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
      },
      {
        id: "b3",
        name: "Avocado Toast + Eggs",
        whyLine: "Healthy fats and protein. Sets your metabolism right.",
        calories: 450,
        protein: 22,
        prepTime: 10,
        time: "breakfast",
        imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop",
      },
    ],
    lunch: [
      {
        id: "l1",
        name: "Grilled Chicken Salad",
        whyLine: "Balanced macros to carry you through the afternoon slump.",
        calories: 520,
        protein: 42,
        prepTime: 20,
        time: "lunch",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      },
      {
        id: "l2",
        name: "Salmon Bowl",
        whyLine: "Omega-3s support your brain. Keeps energy steady.",
        calories: 580,
        protein: 38,
        prepTime: 25,
        time: "lunch",
        imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
      },
      {
        id: "l3",
        name: "Turkey Wrap",
        whyLine: "Light but filling. Won't weigh you down.",
        calories: 460,
        protein: 35,
        prepTime: 10,
        time: "lunch",
        imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
      },
    ],
    dinner: [
      {
        id: "d1",
        name: "Herb-Crusted Salmon",
        whyLine: "Calming omega-3s for evening. Helps you wind down.",
        calories: 540,
        protein: 40,
        prepTime: 30,
        time: "dinner",
        imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop",
      },
      {
        id: "d2",
        name: "Chicken Stir-Fry",
        whyLine: "Light on digestion. Vegetables support recovery.",
        calories: 480,
        protein: 36,
        prepTime: 25,
        time: "dinner",
        imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
      },
      {
        id: "d3",
        name: "Mediterranean Plate",
        whyLine: "Anti-inflammatory. Supports restful sleep.",
        calories: 520,
        protein: 32,
        prepTime: 20,
        time: "dinner",
        imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
      },
    ],
  };

  return mealsByTime[time] || [];
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { state } = useApp();
  const metabolicType = state.user.metabolicType || "Explorer";
  const userName = state.user.name || undefined;

  // UI State
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [nudge, setNudge] = useState<ReturnType<typeof NudgeContent.observation> | null>(
    NudgeContent.observation("You've been consistent with breakfast this week. Your morning energy should be improving.")
  );

  // Get meals for each slot
  const breakfastMeals = generateMealsForSlot("breakfast", metabolicType);
  const lunchMeals = generateMealsForSlot("lunch", metabolicType);
  const dinnerMeals = generateMealsForSlot("dinner", metabolicType);

  // Ester greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleMealPress = (meal: Meal) => {
    // Navigate to recipe detail when card is tapped
    navigation.navigate("RecipeDetail", { meal });
  };

  const handleRecipePress = (meal: Meal) => {
    navigation.navigate("RecipeDetail", { meal });
  };

  const handleEsterChatPress = () => {
    navigation.navigate("EsterChat", { context: "general" });
  };

  const handleMealChatPress = (meal: Meal) => {
    navigation.navigate("EsterChat", { context: "meal", meal });
  };

  const handleFeedback = (mealId: string, feedback: "up" | "down", tags?: string[]) => {
    console.log("Feedback:", mealId, feedback, tags);
  };

  const handleCheckInComplete = (data: any) => {
    console.log("Check-in complete:", data);
    // Keep showing Ester's response
  };

  const handleNudgeDismiss = () => {
    setNudge(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SLOT: Greeting (tappable to open chat) */}
        <View style={styles.greetingSlot}>
          <EsterGreeting
            message={getGreeting()}
            userName={userName}
            onPress={handleEsterChatPress}
          />
        </View>

        {/* SLOT: Nudge (one per session, dismissible) */}
        {nudge && (
          <View style={styles.nudgeSlot}>
            <NudgeSlot content={nudge} onDismiss={handleNudgeDismiss} />
          </View>
        )}

        {/* SLOT: Check-in prompt */}
        {showCheckIn && (
          <View style={styles.checkInSlot}>
            <CheckIn
              onComplete={handleCheckInComplete}
              onDismiss={() => setShowCheckIn(false)}
            />
          </View>
        )}

        {/* SLOT: Meal Cards - Breakfast */}
        <MealCardSlot
          label="Breakfast"
          meals={breakfastMeals}
          onMealPress={handleMealPress}
          onFeedback={handleFeedback}
          onChatPress={handleMealChatPress}
          onRecipePress={handleRecipePress}
        />

        {/* SLOT: Meal Cards - Lunch */}
        <MealCardSlot
          label="Lunch"
          meals={lunchMeals}
          onMealPress={handleMealPress}
          onFeedback={handleFeedback}
          onChatPress={handleMealChatPress}
          onRecipePress={handleRecipePress}
        />

        {/* SLOT: Meal Cards - Dinner */}
        <MealCardSlot
          label="Dinner"
          meals={dinnerMeals}
          onMealPress={handleMealPress}
          onFeedback={handleFeedback}
          onChatPress={handleMealChatPress}
          onRecipePress={handleRecipePress}
        />

        {/* Daily summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>TODAY'S NUTRITION</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {breakfastMeals[0].calories + lunchMeals[0].calories + dinnerMeals[0].calories}
              </Text>
              <Text style={styles.summaryUnit}>calories</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {breakfastMeals[0].protein + lunchMeals[0].protein + dinnerMeals[0].protein}g
              </Text>
              <Text style={styles.summaryUnit}>protein</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>3</Text>
              <Text style={styles.summaryUnit}>meals</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: K.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  greetingSlot: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  nudgeSlot: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  checkInSlot: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  summary: {
    marginHorizontal: spacing.lg,
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  summaryLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: K.textMuted,
    fontWeight: "600",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    ...typography.h2,
    color: K.brown,
  },
  summaryUnit: {
    ...typography.caption,
    color: K.textMuted,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: K.border,
  },
});
