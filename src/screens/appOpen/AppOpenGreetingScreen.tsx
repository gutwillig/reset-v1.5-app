import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../../context/AppContext";
import { K, toMetabolicType } from "../../constants/colors";
import { fonts, spacing, radius } from "../../constants/typography";
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
import { getProfile, type UserProfile } from "../../services/profile";
import { getCheckInHistory, type CheckInEntry } from "../../services/checkIn";
import { useBiometricFreshness } from "../../hooks/useBiometricFreshness";
import { useAppPalette } from "../../hooks/useAppPalette";
import type { AppOpenStackParamList } from "../../navigation/AppOpenNavigator";

export function AppOpenGreetingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppOpenStackParamList>>();
  const { state } = useApp();
  const insets = useSafeAreaInsets();
  const palette = useAppPalette();
  const { evening, outerBg, innerBg, textColor, subtleText, nestedBg, statusBarStyle } =
    palette;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<CheckInEntry[]>([]);

  useEffect(() => {
    Promise.all([
      getProfile().catch(() => null),
      getCheckInHistory(30).catch(() => []),
    ]).then(([prof, history]) => {
      setProfile(prof);
      setCheckInHistory(history);
    });
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

  const mascotSource = evening
    ? require("../../../assets/images/mascot-shape-bone.png")
    : require("../../../assets/images/mascot-shape-ochre.png");

  const score = profile?.confidence?.composite ?? null;
  const hasScore = score !== null && score > 0;
  const typeLabel =
    toMetabolicType(profile?.layer1?.primaryBucket) ?? metabolicType;
  const latestScanAt = profile?.layer3?.latestScan?.scannedAt ?? null;
  const latestCheckInAt = checkInHistory[0]?.date ?? null;
  const { isFresh } = useBiometricFreshness(latestScanAt, latestCheckInAt);
  const showScore = hasScore && isFresh;
  const daysToFullConfidence =
    score !== null && score < 100
      ? Math.max(1, Math.ceil(100 - score))
      : 0;

  return (
    <View style={[styles.root, { backgroundColor: outerBg }]}>
      <StatusBar barStyle={statusBarStyle} translucent />
      <View
        style={[
          styles.safe,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={[styles.card, { backgroundColor: innerBg }]}>
          <View style={styles.mascotWrap} pointerEvents="none">
            <Image
              source={mascotSource}
              style={[styles.mascotImage, styles.mascotTransform]}
              resizeMode="contain"
            />
          </View>
          <View style={styles.contentColumn}>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { color: textColor }]}>
                {greeting.nameGreeting}
              </Text>
              <Text style={[styles.body, { color: textColor }]}>
                {greeting.message}
              </Text>
              <Text style={[styles.scoreLead, { color: textColor }]}>
                {showScore
                  ? "Here's your metabolic score for today:"
                  : hasScore
                    ? "Your score is out of date — let's refresh it:"
                    : "Let's start gathering your data:"}
              </Text>
            </View>
            {showScore ? (
              <View
                style={[styles.scoreCard, { backgroundColor: nestedBg }]}
              >
                <Text style={[styles.scoreNumber, { color: textColor }]}>
                  {Math.round(score!)}
                </Text>
                <Text style={[styles.scoreLabel, { color: subtleText }]}>
                  {typeLabel}
                </Text>
                <View style={styles.confidenceRow}>
                  <Text style={[styles.confidenceLabel, { color: subtleText }]}>
                    Confidence
                  </Text>
                  <View
                    style={[
                      styles.confidenceTrack,
                      { backgroundColor: evening ? K.brown : K.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.confidenceFill,
                        {
                          width: `${Math.max(4, Math.round(score!))}%`,
                          backgroundColor: K.ochre,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.confidenceValue, { color: textColor }]}>
                    {Math.round(score!)}%
                  </Text>
                </View>
                {daysToFullConfidence > 0 ? (
                  <Text
                    style={[styles.confidenceHint, { color: subtleText }]}
                  >
                    Gathering data — {daysToFullConfidence} days til 100%
                    confidence
                  </Text>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.scoreCard,
                  styles.updateCard,
                  { backgroundColor: nestedBg },
                ]}
                onPress={() => navigation.navigate("DataGate")}
                activeOpacity={0.85}
              >
                <Text style={[styles.updateTitle, { color: textColor }]}>
                  Tap to update
                </Text>
                <Text style={[styles.updateSub, { color: subtleText }]}>
                  {hasScore
                    ? "A quick scan or survey refreshes your score."
                    : "A quick scan or survey unlocks your score."}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.arrowButton, { borderColor: textColor }]}
              onPress={() => navigation.navigate("DataGate")}
              activeOpacity={0.8}
            >
              <Text style={[styles.arrowIcon, { color: textColor }]}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  card: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  mascotWrap: {
    position: "absolute",
    top: -60,
    left: -80,
    width: 360,
    height: 360,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotImage: {
    width: "100%",
    height: "100%",
  },
  mascotTransform: {
    transform: [{ rotate: "-155.06deg" }, { scaleY: -1 }],
  },
  contentColumn: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 120,
    gap: spacing.lg,
  },
  textBlock: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.dmSansBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
  },
  body: {
    fontFamily: fonts.dmSans,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.16,
  },
  scoreLead: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    letterSpacing: -0.14,
  },
  scoreCard: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  scoreNumber: {
    fontFamily: fonts.dmSansBold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.5,
  },
  scoreLabel: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    width: "100%",
  },
  confidenceLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: -0.12,
  },
  confidenceTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 3,
  },
  confidenceValue: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    minWidth: 36,
    textAlign: "right",
  },
  confidenceHint: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    marginTop: spacing.xs,
    letterSpacing: -0.12,
  },
  updateCard: {
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  updateTitle: {
    fontFamily: fonts.dmSansBold,
    fontSize: 22,
    letterSpacing: -0.22,
  },
  updateSub: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  ctaRow: {
    position: "absolute",
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  arrowButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowIcon: {
    fontSize: 28,
    fontWeight: "400",
  },
});
