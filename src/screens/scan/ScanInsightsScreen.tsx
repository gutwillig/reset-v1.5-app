import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { fonts } from "../../constants/typography";
import { useApp } from "../../context/AppContext";
import { getProfile, UserProfile } from "../../services/profile";
import { getCachedDailyPlan, type DailyPlan } from "../../services/meals";
import { getScanInsightsMessage } from "../../services/scanInsights";
import type { MainStackParamList } from "../../navigation/MainNavigator";

const FALLBACK_BLURB =
  "Your score reflects what your scan picked up today. Here's the breakdown.";

type ScanRecord = {
  scannedAt?: string;
  stressIndex?: number | null;
  hrvSdnn?: number | null;
  ageEstimate?: number | null;
  vascularAge?: number | null;
  heartRate?: number | null;
  wellness?: number | null;
} & Record<string, unknown>;

interface MetricValue {
  current: number | null;
  previous: number | null;
}

function pickStress(scan: ScanRecord | null): number | null {
  if (!scan) return null;
  const v = scan.stressIndex;
  return typeof v === "number" ? Math.round(v) : null;
}

function pickHrv(scan: ScanRecord | null): number | null {
  if (!scan) return null;
  const v = scan.hrvSdnn;
  return typeof v === "number" ? Math.round(v) : null;
}

function pickVascularAge(scan: ScanRecord | null): number | null {
  if (!scan) return null;
  // Prefer the derived offset stored locally, fall back to raw ageEstimate
  // minus a 30-year baseline (matches deriveBiometrics in ScanScreen).
  if (typeof scan.vascularAge === "number") return Math.round(scan.vascularAge);
  if (typeof scan.ageEstimate === "number")
    return Math.max(0, Math.round(scan.ageEstimate - 30));
  return null;
}

function trendPercent(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function ScanInsightsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [blurb, setBlurb] = useState<string | null>(null);
  const [blurbLoading, setBlurbLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let plan: DailyPlan | null = null;
      try {
        plan = await getCachedDailyPlan();
      } catch {
        plan = null;
      }
      const mealSlots = plan
        ? {
            breakfast: plan.breakfast.map((m) => ({ name: m.name, whyLine: m.whyLine })),
            lunch: plan.lunch.map((m) => ({ name: m.name, whyLine: m.whyLine })),
            dinner: plan.dinner.map((m) => ({ name: m.name, whyLine: m.whyLine })),
          }
        : undefined;
      try {
        const res = await getScanInsightsMessage(mealSlots);
        if (!cancelled) setBlurb(res.text || FALLBACK_BLURB);
      } catch {
        if (!cancelled) setBlurb(FALLBACK_BLURB);
      } finally {
        if (!cancelled) setBlurbLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const history = (profile?.layer3?.scanHistory ?? []) as ScanRecord[];
  // History is appended in service.recordScan, so the last entry is freshest.
  const latestFromHistory = history.length > 0 ? history[history.length - 1] : null;
  const previous = history.length > 1 ? history[history.length - 2] : null;

  // Local biometrics (from the in-memory ShenAI result) is the most up-to-date
  // source for the *current* scan; fall back to the persisted history if the
  // user landed here without a session-cached scan (e.g. after relaunch).
  const currentSource: ScanRecord | null = state.biometrics
    ? {
        stressIndex: state.biometrics.stressIndex,
        hrvSdnn: state.biometrics.raw?.hrvSdnn ?? null,
        vascularAge: state.biometrics.vascularAge,
        heartRate: state.biometrics.heartRate,
        wellness: state.biometrics.wellness,
      }
    : latestFromHistory;

  const stress: MetricValue = {
    current: pickStress(currentSource),
    previous: pickStress(previous),
  };
  const hrv: MetricValue = {
    current: pickHrv(currentSource),
    previous: pickHrv(previous),
  };
  const vasc: MetricValue = {
    current: pickVascularAge(currentSource),
    previous: pickVascularAge(previous),
  };

  const handleClose = () => navigation.goBack();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleClose}
            hitSlop={8}
            accessibilityLabel="Close"
          >
            <Text style={styles.headerIconGlyph}>✕</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Scan Insights</Text>
          </View>

          {/* Right-side actions in design (share/bookmark) are visual only for v1 */}
          <View style={styles.headerRightSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ester message */}
        <View style={styles.esterBlock}>
          <View style={styles.esterEyebrowRow}>
            <View style={styles.esterEyebrowDot} />
            <Text style={styles.esterEyebrowText}>Message from Ester</Text>
          </View>
          <View style={styles.esterCard}>
            <Image
              source={require("../../../assets/images/ester-logo.png")}
              style={styles.esterAvatar}
              resizeMode="cover"
            />
            <View style={styles.esterTextWrap}>
              {blurbLoading ? (
                <View style={styles.esterLoadingRow}>
                  <ActivityIndicator size="small" color={K.brown} />
                  <Text style={styles.esterLoadingText}>
                    Thinking through your scan…
                  </Text>
                </View>
              ) : (
                <Text style={styles.esterText}>{blurb ?? FALLBACK_BLURB}</Text>
              )}
            </View>
          </View>
        </View>

        {/* About today's scan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About today's scan</Text>
          <Text style={styles.sectionBody}>
            These signals come straight from your latest face scan. They feed
            into your Reset score and help me understand how you're doing today.
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricsRow}>
              <MetricCard
                label="Stress Index"
                current={stress.current}
                previous={stress.previous}
                betterDirection="down"
              />
              <MetricCard
                label="Heart Rate Variability"
                unit="ms"
                current={hrv.current}
                previous={hrv.previous}
                betterDirection="up"
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard
                label="Vascular Age"
                unit="yrs"
                current={vasc.current}
                previous={vasc.previous}
                betterDirection="down"
                showPlus
              />
              <View style={styles.metricSpacer} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

interface MetricCardProps {
  label: string;
  current: number | null;
  previous: number | null;
  unit?: string;
  // For semantic coloring later if we want it; unused in v1 (gray neutral).
  betterDirection?: "up" | "down";
  showPlus?: boolean;
}

function MetricCard({
  label,
  current,
  previous,
  unit,
  showPlus,
}: MetricCardProps) {
  const delta = trendPercent(current, previous);
  const valueDisplay = current === null ? "—" : `${showPlus ? "+" : ""}${current}`;

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricBottomRow}>
        <Text style={styles.metricValue}>
          {valueDisplay}
          {unit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
        </Text>
        <View style={styles.metricTrend}>
          {delta === null ? (
            <Text style={styles.metricTrendNeutral}>—</Text>
          ) : delta === 0 ? (
            <Text style={styles.metricTrendNeutral}>0%</Text>
          ) : (
            <>
              <Text style={styles.metricTrendArrow}>
                {delta > 0 ? "▲" : "▼"}
              </Text>
              <Text style={styles.metricTrendText}>{Math.abs(delta)}%</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: K.white,
  },
  // Header
  headerSafe: {
    backgroundColor: K.white,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 21,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconGlyph: {
    fontSize: 18,
    color: K.brown,
    fontFamily: fonts.dmSans,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: fonts.dmSans,
    fontSize: 20,
    letterSpacing: -0.2,
    color: K.brown,
  },
  headerRightSpacer: {
    width: 40,
    height: 40,
  },
  // Content
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    gap: 30,
  },
  // Ester message
  esterBlock: {
    gap: 6,
  },
  esterEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  esterEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: K.ochre,
  },
  esterEyebrowText: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: -0.12,
    color: K.brown,
  },
  esterCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: K.bone,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  esterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: K.brown,
  },
  esterTextWrap: {
    flex: 1,
    paddingTop: 2,
    paddingLeft: 4,
    justifyContent: "center",
  },
  esterText: {
    fontFamily: fonts.dmSans,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.16,
    color: K.brown,
  },
  esterLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 22,
  },
  esterLoadingText: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    letterSpacing: -0.14,
    color: K.sub,
  },
  // Section
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: fonts.dmSans,
    fontSize: 24,
    letterSpacing: -0.24,
    color: K.brown,
  },
  sectionBody: {
    fontFamily: fonts.dmSans,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.16,
    color: K.brown,
  },
  metricsGrid: {
    gap: 8,
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: K.bone,
    borderRadius: 4,
    padding: 16,
    gap: 16,
    minHeight: 110,
  },
  metricSpacer: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    letterSpacing: -0.14,
    color: K.brown,
  },
  metricBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  metricValue: {
    fontFamily: fonts.dmSansBold,
    fontSize: 32,
    letterSpacing: -0.32,
    color: K.brown,
    lineHeight: 36,
  },
  metricUnit: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    letterSpacing: -0.14,
  },
  metricTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 3,
  },
  metricTrendArrow: {
    fontSize: 12,
    color: K.brown,
  },
  metricTrendText: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    letterSpacing: -0.14,
    color: K.brown,
  },
  metricTrendNeutral: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    letterSpacing: -0.14,
    color: K.sub,
  },
});
