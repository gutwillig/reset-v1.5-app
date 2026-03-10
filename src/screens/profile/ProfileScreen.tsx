import React from "react";
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
import { K, TC } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import { TYPE_CONFIGS } from "../../constants/types";
import { Avatar, Button } from "../../components";
import { useApp } from "../../context/AppContext";

type SubscriptionTier = "pro" | "free" | "none";

// Mock LPD entries
const MOCK_LPD_ENTRIES = [
  { date: "Mar 4", note: "Steady energy after protein breakfast" },
  { date: "Mar 3", note: "Afternoon slump — adjusted lunch for tomorrow" },
  { date: "Mar 2", note: "Morning stress detected. Added calming dinner." },
  { date: "Mar 1", note: "First day. Baseline established." },
];

// Mock scan history
const MOCK_SCAN_HISTORY = [
  { date: "Mar 5, 2024", stressIndex: 68, wellness: 72 },
  { date: "Feb 26, 2024", stressIndex: 74, wellness: 65 },
  { date: "Feb 19, 2024", stressIndex: 71, wellness: 68 },
];

export function ProfileScreen() {
  const navigation = useNavigation();
  const { state, resetState } = useApp();
  const metabolicType = state.user.metabolicType || "Explorer";
  const typeConfig = TYPE_CONFIGS[metabolicType];
  const colors = TC[metabolicType];

  // Determine subscription tier
  const tier: SubscriptionTier = state.biometrics ? "pro" : "free";
  const hasScan = !!state.biometrics;

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

        {/* Signal Cards Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR SIGNALS</Text>
          <View style={styles.signalGrid}>
            {/* Stress Card */}
            <View style={styles.signalCard}>
              {tier === "free" && <BlurOverlay />}
              <View style={[styles.signalIndicator, { backgroundColor: getSignalColor(typeConfig.signals.stress) }]} />
              <Text style={styles.signalCardLabel}>Stress</Text>
              <Text style={styles.signalCardValue}>{typeConfig.signals.stress}</Text>
            </View>
            {/* Energy Card */}
            <View style={styles.signalCard}>
              {tier === "free" && <BlurOverlay />}
              <View style={[styles.signalIndicator, { backgroundColor: getSignalColor(typeConfig.signals.energy) }]} />
              <Text style={styles.signalCardLabel}>Energy</Text>
              <Text style={styles.signalCardValue}>{typeConfig.signals.energy}</Text>
            </View>
            {/* Recovery Card */}
            <View style={styles.signalCard}>
              {tier === "free" && <BlurOverlay />}
              <View style={[styles.signalIndicator, { backgroundColor: getSignalColor(typeConfig.signals.recovery) }]} />
              <Text style={styles.signalCardLabel}>Recovery</Text>
              <Text style={styles.signalCardValue}>{typeConfig.signals.recovery}</Text>
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
            {MOCK_LPD_ENTRIES.map((entry, i) => (
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
        {hasScan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SCAN HISTORY</Text>
            <View style={styles.scanHistory}>
              {MOCK_SCAN_HISTORY.map((scan, i) => (
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

        {/* My Cards Archive */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY CARDS</Text>
          <View style={styles.cardsArchive}>
            <TouchableOpacity style={styles.archiveCard}>
              <Text style={styles.archiveCardIcon}>🎯</Text>
              <Text style={styles.archiveCardLabel}>Type Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.archiveCard}>
              <Text style={styles.archiveCardIcon}>📊</Text>
              <Text style={styles.archiveCardLabel}>Scan Results</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.archiveCard}>
              <Text style={styles.archiveCardIcon}>🍽️</Text>
              <Text style={styles.archiveCardLabel}>Meal Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  cardsArchive: {
    flexDirection: "row",
    gap: spacing.md,
  },
  archiveCard: {
    flex: 1,
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
  },
  archiveCardIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  archiveCardLabel: {
    ...typography.caption,
    color: K.brown,
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
