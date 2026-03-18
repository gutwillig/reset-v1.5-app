import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
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
import { useFeedbackPrompt } from "../../hooks/useFeedbackPrompt";
import { generateGreeting, getDayNumber } from "../../services/greetings";
import { getMealsForSlot } from "../../data/meals";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  getDailyPlan,
  submitMealFeedback,
  getMealFeedback,
  replaceMealInSlot,
  cacheDailyPlan,
  getCachedDailyPlan,
} from "../../services/meals";
import type { DailyPlan, DailyPlanMeal } from "../../services/meals";
import { submitCheckIn, getTodayCheckIn } from "../../services/checkIn";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { state } = useApp();
  const metabolicType = state.user.metabolicType || "Explorer";
  const hasScan = !!state.biometrics;

  // Use authenticated user name, fall back to onboarding name
  const userName =
    state.auth.authUser?.firstName ||
    state.user.name ||
    undefined;

  // Calculate day number from account creation
  const dayNumber = getDayNumber(state.auth.authUser?.createdAt);

  // Generate personalized greeting
  const greeting = generateGreeting({
    metabolicType,
    hasScan,
    dayNumber,
    userName,
  });

  // UI State
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [favoritedMeals, setFavoritedMeals] = useState<Set<string>>(new Set());
  const [nudge, setNudge] = useState<ReturnType<typeof NudgeContent.observation> | null>(
    NudgeContent.observation("You've been consistent with breakfast this week. Your morning energy should be improving.")
  );
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mealFeedback, setMealFeedback] = useState<Record<string, { feedback: "up" | "down"; tags: string[] }>>({});

  const { showPrompt, promptMeal, promptSlot, dismissPrompt, recordMealTap } = useFeedbackPrompt(dailyPlan, dayNumber);

  // Load favorites and check today's check-in on mount
  useEffect(() => {
    getFavorites()
      .then((favs) => setFavoritedMeals(new Set(favs.map((f) => f.id))))
      .catch(() => {}); // Silently fail if not authenticated yet

    getTodayCheckIn()
      .then((res) => {
        if (res.checkIn) {
          setShowCheckIn(false); // Already checked in today
        }
      })
      .catch(() => {}); // Silently fail if not authenticated yet
  }, []);

  // Load daily meal plan from API
  useEffect(() => {
    loadDailyPlan();
  }, []);

  const loadDailyPlan = async () => {
    setPlanLoading(true);
    try {
      const plan = await getDailyPlan();
      setDailyPlan(plan);
      cacheDailyPlan(plan);
      loadFeedbackForPlan(plan);
    } catch {
      // Try cached plan
      const cached = await getCachedDailyPlan();
      if (cached) {
        setDailyPlan(cached);
        loadFeedbackForPlan(cached);
      }
      // Falls through to static data if no cache
    } finally {
      setPlanLoading(false);
    }
  };

  const loadFeedbackForPlan = async (plan: DailyPlan) => {
    const allMealIds = [
      ...plan.breakfast.map((m) => m.id),
      ...plan.lunch.map((m) => m.id),
      ...plan.dinner.map((m) => m.id),
    ];
    try {
      const fb = await getMealFeedback(allMealIds);
      setMealFeedback(fb);
    } catch {
      // Non-critical — cards just won't show prior feedback
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const plan = await getDailyPlan();
      setDailyPlan(plan);
      cacheDailyPlan(plan);
      loadFeedbackForPlan(plan);
    } catch {
      // Keep current plan
    } finally {
      setRefreshing(false);
    }
  };

  // Use API plan if available, fallback to static data
  const breakfastMeals = dailyPlan?.breakfast ?? getMealsForSlot(metabolicType, "breakfast");
  const lunchMeals = dailyPlan?.lunch ?? getMealsForSlot(metabolicType, "lunch");
  const dinnerMeals = dailyPlan?.dinner ?? getMealsForSlot(metabolicType, "dinner");

  const handleMealPress = (meal: Meal) => {
    recordMealTap();
    navigation.navigate("RecipeDetail", { meal });
  };

  const handleRecipePress = (meal: Meal) => {
    navigation.navigate("RecipeDetail", { meal });
  };

  const handleNudgeDismiss = () => {
    setNudge(null);
  };

  const handleMealChatPress = (meal: Meal) => {
    navigation.navigate("EsterChat", { context: "meal", meal });
  };

  const handleFeedback = async (mealId: string, feedback: "up" | "down", tags?: string[]) => {
    // Determine the slot from the meal
    const slot = breakfastMeals.find(m => m.id === mealId) ? "breakfast"
      : lunchMeals.find(m => m.id === mealId) ? "lunch"
      : "dinner";

    // Optimistic update
    setMealFeedback((prev) => ({
      ...prev,
      [mealId]: { feedback, tags: tags || [] },
    }));

    try {
      await submitMealFeedback({
        mealId,
        planId: dailyPlan?.id,
        slot,
        feedback,
        tags,
      });
    } catch {
      // Feedback still recorded locally via optimistic update
    }
  };

  const handleFavoriteToggle = async (mealId: string) => {
    const wasFavorited = favoritedMeals.has(mealId);
    // Optimistic update
    setFavoritedMeals((prev) => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }
      return next;
    });
    try {
      if (wasFavorited) {
        await removeFavorite(mealId);
      } else {
        await addFavorite(mealId);
      }
    } catch {
      // Revert on failure
      setFavoritedMeals((prev) => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(mealId);
        } else {
          next.delete(mealId);
        }
        return next;
      });
    }
  };

  const handleReplace = async (mealId: string, slot: string) => {
    if (!dailyPlan) return;
    const currentSlotMeals = slot === "breakfast" ? breakfastMeals
      : slot === "lunch" ? lunchMeals
      : dinnerMeals;
    const excludeIds = currentSlotMeals.map(m => m.id);
    try {
      const updatedPlan = await replaceMealInSlot(dailyPlan.id, slot, excludeIds, mealId);
      setDailyPlan(updatedPlan);
      cacheDailyPlan(updatedPlan);
    } catch {
      // Keep current plan if replacement fails
    }
  };

  const handleCheckInComplete = async (data: any) => {
    try {
      await submitCheckIn({
        energy: data.energy,
        stressTags: data.stress ? [data.stress] : [],
        sleepHours: data.sleepHours ?? undefined,
        sleepQuality: data.sleepQuality ?? undefined,
      });
    } catch {
      // Check-in still shows Ester's response locally even if backend fails
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={K.ochre}
          />
        }
      >
        {/* SLOT: Greeting card - dynamic message based on signals */}
        <View style={styles.greetingSlot}>
          <EsterGreeting
            message={userName ? `${greeting.timeGreeting}, ${userName}.` : `${greeting.timeGreeting}.`}
            subMessage={greeting.message}
          />
        </View>

        {/* SLOT: Nudge (dismissible, collapses when dismissed) */}
        {nudge && (
          <View style={styles.nudgeSlot}>
            <NudgeSlot content={nudge} onDismiss={handleNudgeDismiss} />
          </View>
        )}

        {/* SLOT: Feedback prompt (shows after meals, lower priority than check-in) */}
        {showPrompt && !showCheckIn && promptMeal && (
          <View style={styles.nudgeSlot}>
            <NudgeSlot
              content={NudgeContent.feedbackPrompt(promptMeal.name)}
              onDismiss={dismissPrompt}
            />
          </View>
        )}

        {/* Loading state for meal plan */}
        {planLoading && !dailyPlan && breakfastMeals.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={K.ochre} />
            <Text style={styles.loadingText}>Loading your personalized meals...</Text>
          </View>
        )}

        {/* SLOT: Meal Cards - Breakfast */}
        <MealCardSlot
          label="Breakfast"
          meals={breakfastMeals}
          metabolicType={metabolicType}
          favoritedMealIds={favoritedMeals}
          mealFeedback={mealFeedback}
          onMealPress={handleMealPress}
          onFeedback={handleFeedback}
          onChatPress={handleMealChatPress}
          onRecipePress={handleRecipePress}
          onFavoriteToggle={handleFavoriteToggle}
          onReplace={handleReplace}
        />

        {/* SLOT: Meal Cards - Lunch */}
        <MealCardSlot
          label="Lunch"
          meals={lunchMeals}
          metabolicType={metabolicType}
          favoritedMealIds={favoritedMeals}
          mealFeedback={mealFeedback}
          onMealPress={handleMealPress}
          onFeedback={handleFeedback}
          onChatPress={handleMealChatPress}
          onRecipePress={handleRecipePress}
          onFavoriteToggle={handleFavoriteToggle}
          onReplace={handleReplace}
        />

        {/* SLOT: Meal Cards - Dinner */}
        <MealCardSlot
          label="Dinner"
          meals={dinnerMeals}
          metabolicType={metabolicType}
          favoritedMealIds={favoritedMeals}
          mealFeedback={mealFeedback}
          onMealPress={handleMealPress}
          onFeedback={handleFeedback}
          onChatPress={handleMealChatPress}
          onRecipePress={handleRecipePress}
          onFavoriteToggle={handleFavoriteToggle}
          onReplace={handleReplace}
        />

        {/* SLOT: Check-in prompt */}
        {showCheckIn && (
          <View style={styles.checkInSlot}>
            <CheckIn
              onComplete={handleCheckInComplete}
              onDismiss={() => setShowCheckIn(false)}
            />
          </View>
        )}

        {/* Daily summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>TODAY'S NUTRITION</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.ceil(breakfastMeals[0].calories + lunchMeals[0].calories + dinnerMeals[0].calories)}
              </Text>
              <Text style={styles.summaryUnit}>calories</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.ceil(breakfastMeals[0].protein + lunchMeals[0].protein + dinnerMeals[0].protein)}g
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm, // 12px gap to nudge
  },
  nudgeSlot: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md, // 16px gap to meal cards
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
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  loadingText: {
    ...typography.bodySmall,
    color: K.textMuted,
    marginTop: spacing.md,
  },
});
