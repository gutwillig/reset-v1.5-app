import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { K } from "../../constants/colors";
import { fonts, spacing } from "../../constants/typography";
import { useAppPalette } from "../../hooks/useAppPalette";
import { ScoreRing } from "../survey/ScoreRing";

interface ScoreCardProps {
  score: number | null;
  latestScanAt: string | null;
  trendDelta?: number | null;
  onScanAgain: () => void;
}

const RING_MAX_WIDTH = 320;
// Outer margin (spacing.lg each side) + inner padding (spacing.md each side).
const CARD_HORIZONTAL_CHROME = spacing.lg * 2 + spacing.md * 2;

function scoreMood(score: number): string {
  if (score >= 80) return "Looking good, looking good!";
  if (score >= 60) return "Trending in the right direction.";
  if (score >= 40) return "A steady read on you.";
  return "We're still getting to know you.";
}

function formatLastScan(iso: string | null): string {
  if (!iso) return "No scan yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "No scan yet";

  const now = new Date();
  const time = date
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .toLowerCase()
    .replace(/\s/g, "");

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return `Last scan: Today at ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return `Last scan: Yesterday at ${time}`;

  const dateLabel = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return `Last scan: ${dateLabel} at ${time}`;
}

export function ScoreCard({
  score,
  latestScanAt,
  trendDelta = null,
  onScanAgain,
}: ScoreCardProps) {
  const { nestedBg, textColor, subtleText, evening } = useAppPalette();
  const { width: windowWidth } = useWindowDimensions();
  const hasScore = score !== null && score > 0;
  const displayedScore = hasScore ? Math.round(score!) : 0;
  const ringWidth = Math.min(
    RING_MAX_WIDTH,
    Math.max(200, windowWidth - CARD_HORIZONTAL_CHROME),
  );
  const accent = evening ? "#B8D0D6" : K.brown;

  return (
    <View style={[styles.card, { backgroundColor: nestedBg }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: textColor }]}>
            Today's Reset Score
          </Text>
          <Text style={[styles.mood, { color: subtleText }]}>
            {scoreMood(displayedScore)}
          </Text>
        </View>
        {trendDelta !== null && trendDelta !== undefined ? (
          <View style={styles.trend}>
            <Text style={[styles.trendArrow, { color: K.ochre }]}>▲</Text>
            <Text style={[styles.trendText, { color: textColor }]}>
              up by {Math.abs(trendDelta)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.ringWrap}>
        <ScoreRing
          score={displayedScore}
          animate={false}
          width={ringWidth}
          numberColor={accent}
          needleColor={accent}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onScanAgain}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnPrimaryText]}>Scan Again</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.timestamp, { color: subtleText }]}>
        {formatLastScan(latestScanAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 4,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    gap: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.dmSans,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  mood: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: -0.12,
  },
  trend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trendArrow: {
    fontSize: 14,
  },
  trendText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    letterSpacing: -0.16,
  },
  ringWrap: {
    alignItems: "center",
    width: "100%",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: K.white,
  },
  btnPrimaryText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: K.brown,
  },
  timestamp: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: -0.12,
  },
});
