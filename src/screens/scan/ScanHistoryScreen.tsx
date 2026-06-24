import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { K, toMetabolicType, MetabolicType } from "../../constants/colors";
import { fonts } from "../../constants/typography";
import { useApp } from "../../context/AppContext";
import {
  getScoreHistory,
  ScoreHistory,
  ScoreHistoryMonth,
} from "../../services/profile";
import { logEvent } from "../../services/braze";
import type { MainStackParamList } from "../../navigation/MainNavigator";

// Per-type gradient stops (kept in sync with ProfileScreen's TYPE_GRADIENT_STOPS).
const TYPE_GRADIENT_STOPS: Record<
  MetabolicType,
  { anchor: string; mid: string; outer: string }
> = {
  Burner: { anchor: "#361416", mid: "#A45937", outer: "#D6B5A5" },
  Rebounder: { anchor: "#2D2435", mid: "#5D5470", outer: "#A89DC0" },
  Ember: { anchor: "#3A1A1F", mid: "#4F5760", outer: "#A8B8BE" },
  Chameleon: { anchor: "#4A1E2D", mid: "#6B5A4A", outer: "#A8B585" },
  Explorer: { anchor: "#4A2A4F", mid: "#8A7060", outer: "#D8B247" },
};

type Tab = "scans" | "surveys";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HeaderGradient({ type }: { type: MetabolicType }) {
  const stops = TYPE_GRADIENT_STOPS[type];
  const id = `scanHistHdr_${type}`;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="120%" rx="90%" ry="120%" fx="50%" fy="120%">
            <Stop offset="0" stopColor={stops.anchor} />
            <Stop offset="0.55" stopColor={stops.mid} />
            <Stop offset="1" stopColor={stops.outer} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export function ScanHistoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const [tab, setTab] = useState<Tab>("scans");
  const [history, setHistory] = useState<ScoreHistory | null>(null);
  const [loading, setLoading] = useState(true);

  const metabolicType: MetabolicType =
    toMetabolicType(state.user.metabolicType) ?? "Explorer";

  useEffect(() => {
    logEvent("scanHistory_main");
    let alive = true;
    getScoreHistory()
      .then((h) => {
        if (alive) setHistory(h);
      })
      .catch(() => {
        if (alive) setHistory({ scans: [], surveys: [] });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const groups: ScoreHistoryMonth[] = useMemo(
    () => (tab === "scans" ? (history?.scans ?? []) : (history?.surveys ?? [])),
    [tab, history],
  );

  const noun = tab === "scans" ? "scan" : "survey";

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <HeaderGradient type={metabolicType} />
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <BackIcon color={K.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Score History</Text>
          <View style={styles.headerIconBtn} />
        </View>

        {/* Segmented toggle */}
        <View style={styles.toggle}>
          {(["scans", "surveys"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.toggleItem, active && styles.toggleItemActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: active ? K.brown : K.white },
                  ]}
                >
                  {t === "scans" ? "Scans" : "Surveys"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={TYPE_GRADIENT_STOPS[metabolicType].mid} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No {noun}s yet</Text>
          <Text style={styles.emptyBody}>
            {tab === "scans"
              ? "Your face scans will show up here once you start scanning."
              : "Your daily check-ins will show up here once you start logging."}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          {groups.map((group) => (
            <View key={group.monthKey} style={styles.monthBlock}>
              <View style={styles.monthHead}>
                <Text style={styles.monthName}>{group.month}</Text>
                <Text style={styles.monthCount}>
                  {group.count} {noun}
                  {group.count === 1 ? "" : "s"}
                </Text>
              </View>
              <View style={styles.card}>
                {group.entries.map((entry, i) => (
                  <View key={entry.date}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.row}>
                      <Text style={styles.rowDate}>{entry.label}</Text>
                      <View style={styles.scorePill}>
                        <Text style={styles.scoreText}>{entry.score}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: K.white },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fonts.catalogue,
    fontSize: 18,
    color: K.white,
    letterSpacing: -0.18,
  },
  toggle: {
    flexDirection: "row",
    marginTop: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    padding: 4,
  },
  toggleItem: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleItemActive: { backgroundColor: K.bone },
  toggleText: { fontFamily: fonts.catalogueMedium, fontSize: 15 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.catalogue,
    fontSize: 20,
    color: K.brown,
  },
  emptyBody: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: "#7e6869",
    textAlign: "center",
    lineHeight: 20,
  },
  scrollBody: { padding: 24, gap: 24 },
  monthBlock: { gap: 12 },
  monthHead: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  monthName: {
    fontFamily: fonts.catalogue,
    fontSize: 18,
    color: K.brown,
    letterSpacing: -0.18,
  },
  monthCount: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: "#9C8E8E",
  },
  card: {
    backgroundColor: K.bone,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#D8CFC4" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  rowDate: {
    fontFamily: fonts.dmSans,
    fontSize: 15,
    color: K.brown,
  },
  scorePill: {
    minWidth: 40,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(54,20,22,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontFamily: fonts.catalogue,
    fontSize: 16,
    color: K.brown,
  },
});
