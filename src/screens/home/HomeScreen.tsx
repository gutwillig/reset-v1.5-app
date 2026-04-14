import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/MainNavigator";
import { K, toMetabolicType } from "../../constants/colors";
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
import { useYapNudge } from "../../hooks/useYapNudge";
import * as BrazeService from "../../services/braze";
import { useScanNudge } from "../../hooks/useScanNudge";
import { useBiometricFreshness } from "../../hooks/useBiometricFreshness";
import {
  generateGreeting,
  generateSimpleGreeting,
  getDayNumber,
  detectLapseTier,
  computeDaysSinceLastCheckIn,
} from "../../services/greetings";
import type { GreetingContext, GreetingResult } from "../../services/greetings";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  getDailyPlan,
  submitMealFeedback,
  getMealFeedback,
  replaceMealInSlot,
  removeMealFeedback,
  cacheDailyPlan,
  getCachedDailyPlan,
} from "../../services/meals";
import type { DailyPlan, DailyPlanMeal } from "../../services/meals";
import { submitCheckIn, getTodayCheckIn, getCheckInHistory } from "../../services/checkIn";
import type { CheckInEntry } from "../../services/checkIn";
import { getProfile } from "../../services/profile";
import type { UserProfile } from "../../services/profile";
import { IngredientAversionPrompt } from "../../components/IngredientAversionPrompt";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { state } = useApp();
  const hasScanLocal = !!state.biometrics;

  // Use authenticated user name, fall back to onboarding name
  const userName =
    state.auth.authUser?.firstName ||
    state.user.name ||
    undefined;

  // Calculate day number from account creation
  const dayNumber = getDayNumber(state.auth.authUser?.createdAt);

  // Profile + check-in history for rich greetings
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<CheckInEntry[]>([]);

  // Prefer backend profile over locally cached onboarding state (tolerates
  // legacy cached values like "Defender" that no longer exist in the union).
  const metabolicType =
    toMetabolicType(profile?.layer1?.primaryBucket) ??
    toMetabolicType(state.user.metabolicType) ??
    "Explorer";

  const loadProfile = useCallback(() => {
    Promise.all([
      getProfile().catch(() => null),
      getCheckInHistory(30).catch(() => []),
    ]).then(([prof, history]) => {
      setProfile(prof);
      setCheckInHistory(history);
    });
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Re-fetch profile when screen regains focus (e.g. after scan)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadProfile);
    return unsubscribe;
  }, [navigation, loadProfile]);

  // Build greeting context — full when profile is loaded, simple fallback otherwise
  const greeting: GreetingResult = (() => {
    const hasScan = hasScanLocal || (profile?.layer3?.scanCount ?? 0) > 0;
    const base = { metabolicType, hasScan, dayNumber, userName };

    if (!profile) {
      return generateSimpleGreeting(base);
    }

    const daysSinceLastCheckIn = computeDaysSinceLastCheckIn(checkInHistory);
    const checkInCount = profile.layer2.energyLog.length;
    const mealFeedbackCount = profile.layer2.mealFeedback.length;
    const lastEnergy = profile.layer2.energyLog.length > 0
      ? profile.layer2.energyLog[0].energy
      : null;
    const lastStress = profile.layer2.stressTags.length > 0
      ? profile.layer2.stressTags[0].tags
      : [];
    const lastSleepEntry = profile.layer2.sleepLog.length > 0
      ? profile.layer2.sleepLog[0]
      : null;

    // Recency timestamps for dynamic greetings
    const lastCheckInAt = checkInHistory.length > 0 ? checkInHistory[0].date : null;
    const lastScanAt = profile.layer3.latestScan?.scannedAt ?? null;

    const ctx: GreetingContext = {
      ...base,
      checkInCount,
      latestEnergy: lastEnergy,
      latestStressTags: lastStress,
      latestSleepQuality: lastSleepEntry?.quality ?? null,
      latestSleepHours: lastSleepEntry?.hours ?? null,
      scanCount: profile.layer3.scanCount,
      latestScan: profile.layer3.latestScan,
      esterTier: profile.confidence.esterTier ?? "Pattern Acknowledgment",
      compositeConfidence: profile.confidence.composite,
      lastCheckInAt,
      lastScanAt,
      daysSinceLastCheckIn,
      isGlanceOnly: dayNumber >= 5 && checkInCount === 0 && mealFeedbackCount === 0,
      lapseTier: detectLapseTier(daysSinceLastCheckIn),
      mealFeedbackCount,
    };

    return generateGreeting(ctx);
  })();

  // UI State
  const scrollRef = useRef<ScrollView>(null);
  const checkInY = useRef(0);
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [favoritedMeals, setFavoritedMeals] = useState<Set<string>>(new Set());
  const [observationNudge, setObservationNudge] = useState<ReturnType<typeof NudgeContent.observation> | null>(null);

  // Yap session nudge (priority over observations)
  const handleStartYap = useCallback((yapSessionId: string) => {
    navigation.navigate("YapCall", { yapSessionId });
  }, [navigation]);
  const { nudge: yapNudge } = useYapNudge(handleStartYap);

  // Scan nudge (between yap and observation)
  const handleStartScan = useCallback(() => {
    navigation.navigate("Scan", { mode: "rescan" });
  }, [navigation]);
  const { nudge: scanNudge } = useScanNudge(
    handleStartScan,
    profile?.layer3?.scanCount ?? 0,
    profile?.layer3?.latestScan?.scannedAt ?? null,
  );

  // Biometric freshness gate (24-hour window) — scan OR check-in counts as fresh
  const lastScanAt = profile?.layer3?.latestScan?.scannedAt ?? null;
  const lastCheckInDate = checkInHistory.length > 0 ? checkInHistory[0].date : null;
  const { isFresh: biometricsFresh, ageLabel } = useBiometricFreshness(lastScanAt, lastCheckInDate);
  const showStaleBanner = !biometricsFresh && (profile?.layer3?.scanCount ?? 0) > 0;

  // Priority: yap > scan > observation
  const nudge = yapNudge || scanNudge || observationNudge;
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mealFeedback, setMealFeedback] = useState<Record<string, { feedback: "up" | "down"; tags: string[] }>>({});

  const { showPrompt, promptMeal, promptSlot, dismissPrompt, recordMealTap } = useFeedbackPrompt(dailyPlan, dayNumber);

  // Day 3 ingredient aversion prompt (key is per-user)
  const userId = state.auth.authUser?.id;
  const aversionKey = `@reset_aversion_dismissed_${userId}`;
  const [showAversionPrompt, setShowAversionPrompt] = useState(false);
  useEffect(() => {
    if (dayNumber >= 3 && userId) {
      AsyncStorage.getItem(aversionKey).then((val) => {
        if (!val) {
          // Also check if user already has taste exclusions
          if (!profile?.layer1?.tasteExclusions?.length) {
            setShowAversionPrompt(true);
          }
        }
      });
    }
  }, [dayNumber, profile, userId]);

  const handleAversionComplete = () => {
    setShowAversionPrompt(false);
    AsyncStorage.setItem(aversionKey, "true");
  };

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

  // Use API plan only — no static fallback
  const breakfastMeals = dailyPlan?.breakfast ?? [];
  const lunchMeals = dailyPlan?.lunch ?? [];
  const dinnerMeals = dailyPlan?.dinner ?? [];

  const handleMealPress = (meal: Meal) => {
    recordMealTap();
    navigation.navigate("RecipeDetail", { meal });
  };

  const handleRecipePress = (meal: Meal) => {
    navigation.navigate("RecipeDetail", { meal });
  };

  const handleNudgeDismiss = () => {
    // If the active nudge is a yap nudge, use its dismiss handler
    if (yapNudge?._onDismiss) {
      yapNudge._onDismiss();
    } else {
      setObservationNudge(null);
    }
  };

  const handleMealChatPress = (meal: Meal) => {
    navigation.navigate("EsterChat", { context: "meal", meal });
  };

  const handleFeedback = async (mealId: string, feedback: "up" | "down", tags?: string[], freeText?: string) => {
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
        freeText,
      });
      BrazeService.logEvent("meal_feedback_submitted", { slot, feedback });
    } catch {
      // Feedback still recorded locally via optimistic update
    }
  };

  const handleUndoFeedback = async (mealId: string) => {
    setMealFeedback((prev) => {
      const next = { ...prev };
      delete next[mealId];
      return next;
    });
    try {
      await removeMealFeedback(mealId);
    } catch {
      // Non-critical
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
    } catch (err) {
      console.warn("[handleReplace] failed:", err);
    }
  };

  const handleCheckInComplete = async (data: any): Promise<string | undefined> => {
    try {
      const result = await submitCheckIn({
        energy: data.energy,
        stressTags: data.stress ? [data.stress] : [],
        sleepHours: data.sleepHours ?? undefined,
        sleepQuality: data.sleepQuality ?? undefined,
      });
      BrazeService.logEvent("check_in_completed", { energy: data.energy });
      return result.esterResponse;
    } catch {
      return undefined;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
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
            message={greeting.nameGreeting}
            subMessage={greeting.message}
          />
          {greeting.embedAction === "energy_checkin" && (
            <TouchableOpacity
              onPress={() => {
                setShowCheckIn(true);
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: checkInY.current, animated: true });
                }, 100);
              }}
              style={styles.embedAction}
            >
              <Text style={styles.embedActionText}>Quick check-in →</Text>
            </TouchableOpacity>
          )}
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
        {planLoading && !dailyPlan && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={K.ochre} />
            <Text style={styles.loadingText}>Loading your personalized meals...</Text>
          </View>
        )}

        {/* Empty state when no meal plan available */}
        {!planLoading && !dailyPlan && (
          <View style={styles.loadingContainer}>
            <Text style={styles.emptyStateText}>Complete onboarding to get your personalized meal plan.</Text>
          </View>
        )}

        {/* SLOT: Stale biometric data banner */}
        {showStaleBanner && (
          <TouchableOpacity
            style={styles.staleBanner}
            onPress={handleStartScan}
          >
            <Text style={styles.staleBannerText}>
              {ageLabel
                ? `Signals stale (${ageLabel}). Tap to scan.`
                : "Signals need a fresh reading. Tap to scan."}
            </Text>
          </TouchableOpacity>
        )}

        {/* SLOT: Signal adjustment indicator — suppressed when biometric data is stale */}
        {biometricsFresh && dailyPlan?.signalAdjustments && (dailyPlan.signalAdjustments.stress || dailyPlan.signalAdjustments.sleep || dailyPlan.signalAdjustments.energy) && (
          <TouchableOpacity
            style={styles.signalIndicator}
            onPress={() => navigation.navigate("EsterChat", { context: "general" })}
          >
            <Text style={styles.signalIndicatorText}>
              {dailyPlan.signalAdjustments.stress
                ? "Stress-adjusted meals today"
                : dailyPlan.signalAdjustments.sleep
                ? "Recovery-tuned meals today"
                : "Energy-focused meals today"}
            </Text>
          </TouchableOpacity>
        )}

        {/* SLOT: Chameleon phase indicator */}
        {profile?.layer1?.currentPhase && (profile?.layer1?.primaryBucket?.toLowerCase() === "chameleon" || metabolicType.toLowerCase() === "chameleon") && (
          <View style={styles.phaseIndicatorSlot}>
            <Text style={styles.phaseIndicatorTitle}>
              {profile.layer1.currentPhase === "follicular" ? "Follicular phase meals" : "Luteal phase meals"}
            </Text>
            <Text style={styles.phaseIndicatorDesc}>
              {profile.layer1.currentPhase === "follicular"
                ? "Today's meals are lighter — wider carb sources and flexible proteins to match this phase."
                : "Today's meals are higher protein with more iron-rich fuel to match what your body needs right now."}
            </Text>
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
          onUndoFeedback={handleUndoFeedback}
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
          onUndoFeedback={handleUndoFeedback}
          onChatPress={handleMealChatPress}
          onRecipePress={handleRecipePress}
          onFavoriteToggle={handleFavoriteToggle}
          onReplace={handleReplace}
        />

        {/* SLOT: Meal Cards - Dinner (hidden after eating window close) */}
        {dinnerMeals.length > 0 ? (
          <MealCardSlot
            label="Dinner"
            meals={dinnerMeals}
            metabolicType={metabolicType}
            favoritedMealIds={favoritedMeals}
            mealFeedback={mealFeedback}
            onMealPress={handleMealPress}
            onFeedback={handleFeedback}
          onUndoFeedback={handleUndoFeedback}
            onChatPress={handleMealChatPress}
            onRecipePress={handleRecipePress}
            onFavoriteToggle={handleFavoriteToggle}
            onReplace={handleReplace}
          />
        ) : dailyPlan && new Date().getHours() >= parseInt(profile?.layer1?.eatingWindowClose?.split(":")[0] ?? "18", 10) && (
          <View style={styles.windowClosedSlot}>
            <Text style={styles.windowClosedText}>
              Your evening window has closed. Your body is in recovery mode.
            </Text>
          </View>
        )}

        {/* SLOT: Day 3 Ingredient Aversion Prompt */}
        {showAversionPrompt && (
          <View style={styles.aversionSlot}>
            <IngredientAversionPrompt
              onComplete={handleAversionComplete}
              onDismiss={handleAversionComplete}
            />
          </View>
        )}

        {/* SLOT: Check-in prompt */}
        {showCheckIn && (
          <View
            style={styles.checkInSlot}
            onLayout={(e) => { checkInY.current = e.nativeEvent.layout.y; }}
          >
            <CheckIn
              onComplete={handleCheckInComplete}
              onDismiss={() => setShowCheckIn(false)}
            />
          </View>
        )}

        {/* Daily summary */}
        {breakfastMeals[0] && lunchMeals[0] && dinnerMeals[0] && (
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
        )}
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
  phaseIndicatorSlot: {
    marginHorizontal: spacing.lg,
    backgroundColor: K.bone,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  phaseIndicatorTitle: {
    ...typography.bodyMedium,
    color: K.ochre,
    fontWeight: "600",
    fontSize: 14,
  },
  phaseIndicatorDesc: {
    ...typography.caption,
    color: K.textMuted,
    marginTop: 2,
  },
  windowClosedSlot: {
    marginHorizontal: spacing.lg,
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  windowClosedText: {
    ...typography.body,
    color: K.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  signalIndicator: {
    marginHorizontal: spacing.lg,
    backgroundColor: K.blue,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  signalIndicatorText: {
    ...typography.caption,
    color: K.brown,
    fontWeight: "500",
    textAlign: "center",
  },
  staleBanner: {
    marginHorizontal: spacing.lg,
    backgroundColor: K.bone,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  staleBannerText: {
    ...typography.caption,
    color: K.ochre,
    fontWeight: "500",
    textAlign: "center",
  },
  aversionSlot: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
  embedAction: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: K.bone,
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  embedActionText: {
    ...typography.bodySmall,
    color: K.brown,
    fontWeight: "600",
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
  emptyStateText: {
    ...typography.body,
    color: K.textMuted,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
