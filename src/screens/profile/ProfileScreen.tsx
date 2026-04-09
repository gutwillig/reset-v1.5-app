import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/MainNavigator";
import { K, TC } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import { TYPE_CONFIGS } from "../../constants/types";
import { Avatar, Button } from "../../components";
import { useApp } from "../../context/AppContext";
import { getProfile, UserProfile } from "../../services/profile";
import { useBiometricFreshness } from "../../hooks/useBiometricFreshness";

type SubscriptionTier = "pro" | "free" | "none";

function buildLpdEntries(profile: UserProfile): Array<{ date: string; note: string }> {
  const entries: Array<{ date: string; note: string; sortKey: number }> = [];

  for (const entry of profile.layer2.energyLog) {
    const d = new Date(entry.date);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const noteMap: Record<string, string> = {
      high: "High energy reported. Meals are fueling well.",
      steady: "Steady energy. Your pattern is holding.",
      okay: "Moderate energy. Watching for patterns.",
      low: "Low energy flagged. Adjusting tomorrow's meals.",
    };
    entries.push({ date: dateStr, note: noteMap[entry.energy] || `Energy: ${entry.energy}`, sortKey: d.getTime() });
  }

  for (const entry of profile.layer2.stressTags) {
    if (entry.tags.length > 0) {
      const d = new Date(entry.date);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      entries.push({ date: dateStr, note: `Stress signals: ${entry.tags.join(", ")}`, sortKey: d.getTime() });
    }
  }

  return entries
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, 10)
    .map(({ date, note }) => ({ date, note }));
}

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { state, resetState } = useApp();
  const metabolicType = state.user.metabolicType || "Explorer";
  const typeConfig = TYPE_CONFIGS[metabolicType];
  const colors = TC[metabolicType];

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(() => {
    getProfile().then(setProfile).catch(() => null);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Re-fetch profile when screen regains focus (e.g. after scan)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadProfile);
    return unsubscribe;
  }, [navigation, loadProfile]);

  // Determine subscription tier
  const tier: SubscriptionTier = (state.biometrics || (profile?.layer3.scanCount ?? 0) > 0) ? "pro" : "free";
  const hasScan = !!state.biometrics || (profile?.layer3.scanCount ?? 0) > 0;

  // LPD entries from live data
  const lpdEntries = profile && profile.layer2.energyLog.length > 0
    ? buildLpdEntries(profile)
    : [{ date: "—", note: "No check-in data yet. Complete a check-in to start building your pattern." }];

  // Scan history from live data
  const scanHistoryRaw = profile?.layer3.scanHistory ?? [];
  const scanEntries = scanHistoryRaw
    .slice(-10)
    .reverse()
    .map((scan: Record<string, any>, i: number) => {
      const raw = scan.scannedAt ?? scan.timestamp ?? scan.date;
      const dateLabel = raw
        ? new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : `Scan ${scanHistoryRaw.length - i}`;
      return {
        date: dateLabel,
        stressIndex: scan.stressIndex ?? scan.stress_index ?? 0,
        wellness: scan.wellness ?? Math.round(
          ((scan.parasympatheticActivity ?? 50) * 0.6) + (((scan.hrvSdnn ?? 40) / 80) * 40)
        ),
      };
    });

  // Biometric freshness gate (24-hour window)
  const lastScanAt = profile?.layer3?.latestScan?.scannedAt ?? null;
  const { isFresh: biometricsFresh, ageLabel } = useBiometricFreshness(lastScanAt);

  // Signal card values — overlay real scan data only when fresh
  const latestScan = biometricsFresh ? profile?.layer3.latestScan : null;
  const stressValue = latestScan ? `${latestScan.stressIndex ?? latestScan.stress_index}` : typeConfig.signals.stress;
  const recoveryValue = latestScan
    ? `${latestScan.parasympatheticActivity ?? latestScan.parasympathetic_activity ?? "—"}`
    : typeConfig.signals.recovery;
  const energyValue = typeConfig.signals.energy;

  const handleResetProfile = () => {
    Alert.alert(
      "Reset Profile",
      "This will clear all your data and restart the onboarding process. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetState },
      ]
    );
  };

  const handleSettingsPress = () => {
    (navigation as any).navigate("Settings");
  };

  const getSignalColor = (level: string) => {
    switch (level) {
      case "high":
        return K.err;
      case "moderate":
      case "fluctuating":
        return K.ochre;
      case "low":
      case "stable":
      case "building":
      case "fast":
        return K.ok;
      case "slow":
        return K.ochre;
      default:
        return K.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Card Header */}
        <View style={[styles.typeCard, { backgroundColor: colors.bg }]}>
          <Text style={[styles.typeLabel, { color: colors.text + "80" }]}>
            YOUR TYPE
          </Text>
          <Text style={[styles.typeName, { color: colors.text }]}>
            {typeConfig.title}
          </Text>
          <Text style={[styles.typeTagline, { color: colors.text + "CC" }]}>
            {typeConfig.tagline}
          </Text>
          <View style={styles.typeDescription}>
            <Text style={[styles.typeDescText, { color: colors.text + "AA" }]}>
              {typeConfig.description}
            </Text>
          </View>
        </View>

        {/* Confidence Score */}
        {profile?.confidence && (
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>
              Ester confidence: {Math.round(profile.confidence.composite)}%
            </Text>
            <Text style={styles.confidenceTier}>
              {profile.confidence.esterTier}
            </Text>
          </View>
        )}

        {/* Signal Cards Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR SIGNALS</Text>
          {!biometricsFresh && hasScan && (
            <TouchableOpacity
              style={styles.staleBanner}
              onPress={() => navigation.navigate("Scan", { mode: "rescan" })}
            >
              <Text style={styles.staleBannerText}>
                {ageLabel
                  ? `Last reading: ${ageLabel}. Tap to refresh your signals.`
                  : "Your signals need a fresh reading. Tap to scan."}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.signalGrid}>
            {/* Stress Card */}
            <View style={styles.signalCard}>
              {tier === "free" && <BlurOverlay />}
              <View style={[styles.signalIndicator, { backgroundColor: getSignalColor(latestScan ? "high" : typeConfig.signals.stress) }]} />
              <Text style={styles.signalCardLabel}>Stress</Text>
              <Text style={styles.signalCardValue}>{latestScan ? `Stress: ${stressValue}` : stressValue}</Text>
            </View>
            {/* Energy Card */}
            <View style={styles.signalCard}>
              {tier === "free" && <BlurOverlay />}
              <View style={[styles.signalIndicator, { backgroundColor: getSignalColor(typeConfig.signals.energy) }]} />
              <Text style={styles.signalCardLabel}>Energy</Text>
              <Text style={styles.signalCardValue}>{energyValue}</Text>
            </View>
            {/* Recovery Card */}
            <View style={styles.signalCard}>
              {tier === "free" && <BlurOverlay />}
              <View style={[styles.signalIndicator, { backgroundColor: getSignalColor(latestScan ? "building" : typeConfig.signals.recovery) }]} />
              <Text style={styles.signalCardLabel}>Recovery</Text>
              <Text style={styles.signalCardValue}>{latestScan ? `Recovery: ${recoveryValue}` : recoveryValue}</Text>
            </View>
          </View>
          {tier === "free" && (
            <TouchableOpacity style={styles.upgradeHint}>
              <Text style={styles.upgradeHintText}>Upgrade to unlock full signal tracking</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Living Pattern Document */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LIVING PATTERN DOCUMENT</Text>
            {tier === "free" && (
              <View style={styles.frozenBadge}>
                <Text style={styles.frozenText}>FROZEN</Text>
              </View>
            )}
          </View>
          <View style={styles.lpdContainer}>
            {tier === "free" && <BlurOverlay />}
            {lpdEntries.map((entry, i) => (
              <View key={i} style={styles.lpdEntry}>
                <View style={styles.lpdDate}>
                  <Text style={styles.lpdDateText}>{entry.date}</Text>
                </View>
                <Text style={styles.lpdNote}>{entry.note}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Scan History (only show if user has scanned) */}
        {hasScan && scanEntries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SCAN HISTORY</Text>
              <TouchableOpacity
                style={styles.newScanButton}
                onPress={() => navigation.navigate("Scan", { mode: "rescan" })}
              >
                <Text style={styles.newScanButtonText}>New Scan</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.scanHistory}>
              {scanEntries.map((scan, i) => (
                <View key={i} style={styles.scanEntry}>
                  <Text style={styles.scanDate}>{scan.date}</Text>
                  <View style={styles.scanMetrics}>
                    <View style={styles.scanMetric}>
                      <Text style={styles.scanMetricValue}>{scan.stressIndex}</Text>
                      <Text style={styles.scanMetricLabel}>Stress</Text>
                    </View>
                    <View style={styles.scanMetric}>
                      <Text style={styles.scanMetricValue}>{scan.wellness}</Text>
                      <Text style={styles.scanMetricLabel}>Wellness</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings Link */}
        <TouchableOpacity style={styles.settingsLink} onPress={handleSettingsPress}>
          <Text style={styles.settingsIcon}>⚙️</Text>
          <Text style={styles.settingsText}>Settings</Text>
          <Text style={styles.settingsArrow}>→</Text>
        </TouchableOpacity>

        {/* Account actions */}
        <View style={styles.actions}>
          <Button
            title="Reset Profile"
            variant="ghost"
            onPress={handleResetProfile}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Blur overlay for Free tier
function BlurOverlay() {
  return (
    <View style={styles.blurOverlay}>
      <View style={styles.blurContent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: K.white,
  },
  content: {
    paddingBottom: 100,
  },
  typeCard: {
    margin: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  typeLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  typeName: {
    ...typography.h1,
    fontSize: 32,
    marginBottom: 4,
  },
  typeTagline: {
    ...typography.body,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  typeDescription: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  typeDescText: {
    ...typography.bodySmall,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: K.textMuted,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  staleBanner: {
    backgroundColor: K.bone,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  staleBannerText: {
    ...typography.caption,
    color: K.ochre,
    fontWeight: "500",
    textAlign: "center",
  },
  newScanButton: {
    backgroundColor: K.ochre,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  newScanButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: K.background,
  },
  frozenBadge: {
    backgroundColor: K.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  frozenText: {
    fontSize: 9,
    color: K.textMuted,
    fontWeight: "600",
    letterSpacing: 1,
  },
  signalGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  signalCard: {
    flex: 1,
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  signalIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  signalCardLabel: {
    ...typography.caption,
    color: K.textMuted,
    marginBottom: 2,
  },
  signalCardValue: {
    ...typography.bodyMedium,
    color: K.brown,
    textTransform: "capitalize",
  },
  upgradeHint: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  upgradeHintText: {
    ...typography.caption,
    color: K.ochre,
  },
  lpdContainer: {
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  lpdEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: K.border,
  },
  lpdDate: {
    width: 50,
  },
  lpdDateText: {
    ...typography.caption,
    color: K.textMuted,
    fontWeight: "600",
  },
  lpdNote: {
    ...typography.bodySmall,
    color: K.brown,
    flex: 1,
  },
  scanHistory: {
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  scanEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: K.border,
  },
  scanDate: {
    ...typography.bodySmall,
    color: K.brown,
  },
  scanMetrics: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  scanMetric: {
    alignItems: "center",
  },
  scanMetricValue: {
    ...typography.bodyMedium,
    color: K.brown,
    fontWeight: "600",
  },
  scanMetricLabel: {
    ...typography.caption,
    color: K.textMuted,
    fontSize: 10,
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  settingsText: {
    ...typography.bodyMedium,
    color: K.brown,
    flex: 1,
  },
  settingsArrow: {
    ...typography.body,
    color: K.textMuted,
  },
  actions: {
    paddingHorizontal: spacing.lg,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  confidenceLabel: {
    ...typography.caption,
    color: K.textMuted,
  },
  confidenceTier: {
    ...typography.caption,
    color: K.ochre,
    fontWeight: "600",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(243, 239, 227, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  blurContent: {
    // Placeholder for actual blur effect
  },
});
