import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { K } from "../../constants/colors";
import { fonts, spacing } from "../../constants/typography";

interface FeelingSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const BANDS = [
  { min: 0, max: 20, label: "Struggling today", emoji: "😞" },
  { min: 20, max: 40, label: "A bit off", emoji: "😐" },
  { min: 40, max: 60, label: "Holding steady", emoji: "🙂" },
  { min: 60, max: 80, label: "Feeling good", emoji: "😊" },
  { min: 80, max: 101, label: "Super happy!", emoji: "😁" },
];

function bandFor(value: number) {
  return BANDS.find((b) => value >= b.min && value < b.max) ?? BANDS[4];
}

const CURVE_HEIGHT = 56;
// The drawn SVG path: M 2,P2 Q 50,P1 98,P2  where P2 = CURVE_HEIGHT - 8 = 48
// and P1 = 8. Y along the curve for parameter t ∈ [0,1]:
const BEZIER_START_Y = CURVE_HEIGHT - 8; // 48
const BEZIER_PEAK_Y = 8;
const CURVE_Y_AT = (t: number) =>
  (1 - t) ** 2 * BEZIER_START_Y +
  2 * (1 - t) * t * BEZIER_PEAK_Y +
  t ** 2 * BEZIER_START_Y;
const HANDLE_SIZE = 44;

export function FeelingSlider({ value, onChange }: FeelingSliderProps) {
  const widthRef = useRef(0);
  const grantValueRef = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        if (widthRef.current <= 0) return;
        const x = e.nativeEvent.locationX;
        const pct = Math.max(0, Math.min(100, (x / widthRef.current) * 100));
        const rounded = Math.round(pct);
        grantValueRef.current = rounded;
        onChange(rounded);
      },
      onPanResponderMove: (_, gesture) => {
        if (widthRef.current <= 0) return;
        const dxPct = (gesture.dx / widthRef.current) * 100;
        const next = Math.max(
          0,
          Math.min(100, grantValueRef.current + dxPct),
        );
        onChange(Math.round(next));
      },
    }),
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  };

  const band = bandFor(value);
  const t = Math.max(0, Math.min(1, value / 100));
  // Handle's `top` style refers to its top edge; marginTop:-HANDLE_SIZE/2
  // shifts it up by half its size so the value we set here is the handle's
  // visual center. Matching that to the curve Y centers the handle on the line.
  const handleY = CURVE_Y_AT(t);
  // Rotation matches the curve's tangent direction: tilts left at low values,
  // horizontal at the midpoint, tilts right at high values.
  const handleRotation = -15 + t * 30;

  return (
    <View style={styles.container}>
      <View style={styles.decoration}>
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{band.emoji}</Text>
        </View>
        <Text style={styles.label}>{band.label}</Text>
      </View>

      <View
        style={styles.track}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <Svg
          width="100%"
          height={CURVE_HEIGHT}
          viewBox={`0 0 100 ${CURVE_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <Path
            d={`M 2 ${CURVE_HEIGHT - 8} Q 50 8 98 ${CURVE_HEIGHT - 8}`}
            stroke={K.ochre}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
        <View
          pointerEvents="none"
          style={[
            styles.handle,
            {
              left: `${value}%`,
              top: handleY,
            },
          ]}
        >
          <View
            style={[
              styles.handleInner,
              { transform: [{ rotate: `${handleRotation}deg` }] },
            ]}
          >
            <View style={styles.handleBar} />
            <View style={styles.handleBar} />
            <View style={styles.handleBar} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 24,
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  decoration: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 16,
  },
  emojiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: K.ochre,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 80,
    lineHeight: 96,
  },
  label: {
    fontFamily: fonts.dmSans,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.32,
    color: K.brown,
    textAlign: "center",
  },
  track: {
    width: "100%",
    height: CURVE_HEIGHT + HANDLE_SIZE,
    justifyContent: "flex-start",
    position: "relative",
  },
  handle: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    marginLeft: -HANDLE_SIZE / 2,
    marginTop: -HANDLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  handleInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: K.brown,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  handleBar: {
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: K.white,
  },
});
