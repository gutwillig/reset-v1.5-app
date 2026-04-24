import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/MainNavigator";
import { K, toMetabolicType } from "../../constants/colors";
import { fonts, typography, spacing } from "../../constants/typography";
import {
  getDailyPlan,
  getCachedDailyPlan,
  cacheDailyPlan,
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../../services/meals";
import type { DailyPlan } from "../../services/meals";
import {
  submitCheckIn,
  getTodayCheckIn,
  getCheckInHistory,
} from "../../services/checkIn";
import type { CheckInEntry } from "../../services/checkIn";
import { getProfile, type UserProfile } from "../../services/profile";
import { getResetScore, type ResetScore } from "../../services/resetScore";
import {
  generateGreeting,
  generateSimpleGreeting,
  getDayNumber,
  detectLapseTier,
  computeDaysSinceLastCheckIn,
} from "../../services/greetings";
import type {
  GreetingContext,
  GreetingResult,
} from "../../services/greetings";
import { useApp } from "../../context/AppContext";
import { useAppPalette } from "../../hooks/useAppPalette";
import {
  MealTabsSection,
  MealPlanPromoCard,
  HomeHeader,
  CheckInCard,
  PastEntryTiles,
  CheckInV2,
  ScoreCard,
  ConfidenceCard,
  GreetingBlock,
} from "../../components/homeV2";
import type { Meal } from "../../components";

export function HomeScreenV2() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { state } = useApp();
  const { innerBg, textColor } = useAppPalette();

  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [favoritedMeals, setFavoritedMeals] = useState<Set<string>>(new Set());
  const [checkInHistory, setCheckInHistory] = useState<CheckInEntry[]>([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resetScore, setResetScore] = useState<ResetScore | null>(null);

  useEffect(() => {
    getDailyPlan()
      .then((plan) => {
        setDailyPlan(plan);
        cacheDailyPlan(plan);
      })
      .catch(async () => {
        const cached = await getCachedDailyPlan();
        if (cached) setDailyPlan(cached);
      });

    getFavorites()
      .then((favs) => setFavoritedMeals(new Set(favs.map((f) => f.id))))
      .catch(() => {});

    getCheckInHistory(30)
      .then((history) => setCheckInHistory(history))
      .catch(() => {});

    getTodayCheckIn()
      .then((res) => {
        if (res.checkIn) setCheckedInToday(true);
      })
      .catch(() => {});

    getProfile()
      .then(setProfile)
      .catch(() => {});

    getResetScore()
      .then((res) => {
        if (res.status === "active" && res.score) setResetScore(res.score);
      })
      .catch(() => {});
  }, []);

  const handleCheckInComplete = useCallback(
    async (data: {
      energy: string | null;
      stress: string | null;
      sleepHours: number | null;
      sleepQuality: string | null;
    }): Promise<string | undefined> => {
      try {
        const result = await submitCheckIn({
          energy: data.energy ?? "okay",
          stressTags: data.stress ? [data.stress] : [],
          sleepHours: data.sleepHours ?? undefined,
          sleepQuality: data.sleepQuality ?? undefined,
        });
        setCheckedInToday(true);
        const history = await getCheckInHistory(30).catch(() => []);
        setCheckInHistory(history);
        return result.esterResponse;
      } catch {
        return undefined;
      }
    },
    [],
  );

  const handleMealPress = useCallback(
    (meal: Meal) => {
      navigation.navigate("RecipeDetail", { meal });
    },
    [navigation],
  );

  const handleDeepRead = useCallback(
    (meal: Meal) => {
      navigation.navigate("EsterChat", { context: "meal", meal });
    },
    [navigation],
  );

  const handleScanAgain = useCallback(() => {
    navigation.navigate("Scan", { mode: "rescan" });
  }, [navigation]);

  const handleSeeInsights = useCallback(() => {
    // Destination TBD — design calls for an insights surface we haven't built.
  }, []);

  const userName =
    state.auth.authUser?.firstName || state.user.name || undefined;
  const dayNumber = getDayNumber(state.auth.authUser?.createdAt);
  const hasScanLocal = !!state.biometrics;
  const metabolicType =
    toMetabolicType(profile?.layer1?.primaryBucket) ??
    toMetabolicType(state.user.metabolicType) ??
    "Explorer";

  const greeting: GreetingResult = (() => {
    const hasScan = hasScanLocal || (profile?.layer3?.scanCount ?? 0) > 0;
    const base = { metabolicType, hasScan, dayNumber, userName };
    if (!profile) return generateSimpleGreeting(base);

    const daysSinceLastCheckIn = computeDaysSinceLastCheckIn(checkInHistory);
    const checkInCount = profile.layer2.energyLog.length;
    const mealFeedbackCount = profile.layer2.mealFeedback.length;
    const lastEnergy =
      profile.layer2.energyLog.length > 0
        ? profile.layer2.energyLog[0].energy
        : null;
    const lastStress =
      profile.layer2.stressTags.length > 0
        ? profile.layer2.stressTags[0].tags
        : [];
    const lastSleepEntry =
      profile.layer2.sleepLog.length > 0 ? profile.layer2.sleepLog[0] : null;
    const lastCheckInAt =
      checkInHistory.length > 0 ? checkInHistory[0].date : null;
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
      isGlanceOnly:
        dayNumber >= 5 && checkInCount === 0 && mealFeedbackCount === 0,
      lapseTier: detectLapseTier(daysSinceLastCheckIn),
      mealFeedbackCount,
    };

    return generateGreeting(ctx);
  })();

  const score = resetScore?.score ?? null;
  const confidence = profile?.confidence?.composite ?? null;
  const daysToFullConfidence =
    confidence !== null && confidence < 100
      ? Math.max(1, Math.ceil(100 - confidence))
      : 0;
  const latestScanAt = profile?.layer3?.latestScan?.scannedAt ?? null;
  const trendDelta =
    resetScore && resetScore.previousDayScore !== null
      ? Math.round(resetScore.score - resetScore.previousDayScore)
      : null;

  const handleFavoriteToggle = useCallback(async (mealId: string) => {
    const wasFavorited = favoritedMeals.has(mealId);
    setFavoritedMeals((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(mealId);
      else next.add(mealId);
      return next;
    });
    try {
      if (wasFavorited) await removeFavorite(mealId);
      else await addFavorite(mealId);
    } catch {
      setFavoritedMeals((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(mealId);
        else next.delete(mealId);
        return next;
      });
    }
  }, [favoritedMeals]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: innerBg }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          dateLabel={new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          })}
        />

        <GreetingBlock
          nameGreeting={greeting.nameGreeting}
          message={greeting.message}
        />

        <ScoreCard
          score={score}
          latestScanAt={latestScanAt}
          trendDelta={trendDelta}
          onScanAgain={handleScanAgain}
          onSeeInsights={handleSeeInsights}
        />

        <ConfidenceCard confidence={confidence} daysToFull={daysToFullConfidence} />

        {showCheckInForm ? (
          <CheckInV2
            onComplete={handleCheckInComplete}
            onDismiss={() => setShowCheckInForm(false)}
          />
        ) : !checkedInToday ? (
          <CheckInCard onPress={() => setShowCheckInForm(true)} />
        ) : null}

        <PastEntryTiles entries={checkInHistory.slice(0, 2)} />

        <MealPlanPromoCard />

        <Text style={[styles.sectionHeading, { color: textColor }]}>Recipes for you</Text>

        <MealTabsSection
          breakfast={dailyPlan?.breakfast ?? []}
          lunch={dailyPlan?.lunch ?? []}
          dinner={dailyPlan?.dinner ?? []}
          favoritedMealIds={favoritedMeals}
          onMealPress={handleMealPress}
          onFavoriteToggle={handleFavoriteToggle}
          onDeepRead={handleDeepRead}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  placeholder: {
    padding: spacing.xl,
    alignItems: "center",
  },
  placeholderLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: K.textMuted,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  placeholderText: {
    ...typography.body,
    color: K.textMuted,
    textAlign: "center",
  },
  sectionHeading: {
    fontFamily: fonts.dmSans,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.32,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  checkInSlot: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
});
