import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView } from "expo-camera";
import { K } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { useApp } from "../../context/AppContext";

type Props = NativeStackScreenProps<any, "Scan">;

const { width } = Dimensions.get("window");

// Scan phases per spec
const SCAN_PHASES = [
  {
    id: "aligning",
    label: "Aligning",
    duration: 5000,
    ester: "Got you. Hold still — I'm reading your signals.",
  },
  {
    id: "reading",
    label: "Reading signals",
    duration: 15000,
    ester: "I can see your pulse. Reading deeper...",
  },
  {
    id: "mapping",
    label: "Mapping markers",
    duration: 10000,
    ester: "Stress index... vascular age... wellness score...",
  },
];

const TOTAL_DURATION = SCAN_PHASES.reduce((acc, phase) => acc + phase.duration, 0);

export function ScanScreen({ navigation }: Props) {
  const { setBiometrics } = useApp();
  const [phase, setPhase] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [showMarkers, setShowMarkers] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const markerFadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for heart rate
  useEffect(() => {
    const bpm = heartRate;
    const beatDuration = 60000 / bpm;

    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.15,
        duration: beatDuration * 0.15,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: beatDuration * 0.85,
        useNativeDriver: true,
      }),
    ]);

    const loop = Animated.loop(pulse);
    loop.start();

    return () => loop.stop();
  }, [heartRate]);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: TOTAL_DURATION,
      useNativeDriver: false,
    }).start();
  }, []);

  // Phase progression
  useEffect(() => {
    let elapsed = 0;
    const timers: NodeJS.Timeout[] = [];

    SCAN_PHASES.forEach((phaseData, index) => {
      if (index > 0) {
        const timer = setTimeout(() => {
          setPhase(index);
        }, elapsed);
        timers.push(timer);
      }
      elapsed += phaseData.duration;
    });

    // Show markers in phase 3 (mapping)
    const markerTimer = setTimeout(() => {
      setShowMarkers(true);
      Animated.timing(markerFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, SCAN_PHASES[0].duration + SCAN_PHASES[1].duration);
    timers.push(markerTimer);

    // Finish scan
    const finishTimer = setTimeout(() => {
      // Generate mock biometric data
      const biometrics = {
        stressIndex: Math.floor(Math.random() * 20) + 60, // 60-80
        heartRate: Math.floor(Math.random() * 15) + 70, // 70-85
        wellness: Math.floor(Math.random() * 20) + 55, // 55-75
        vascularAge: Math.floor(Math.random() * 6) + 2, // +2 to +8 years
      };
      setBiometrics(biometrics);
      navigation.replace("ScanReveal");
    }, TOTAL_DURATION);
    timers.push(finishTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  // Simulate heart rate variation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(68, Math.min(82, prev + change));
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const currentPhase = SCAN_PHASES[phase];

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="front">
        <View style={styles.overlay}>
          {/* Top status */}
          <View style={styles.topStatus}>
            <Text style={styles.statusLabel}>READING</Text>
          </View>

          {/* Face guide */}
          <View style={styles.faceGuide}>
            <View style={styles.faceOutline}>
              {/* Subtle pulse effect on face outline */}
              <Animated.View
                style={[
                  styles.facePulse,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
            </View>
          </View>

          {/* Heart rate display */}
          <View style={styles.hrContainer}>
            <Animated.Text
              style={[
                styles.hrValue,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {heartRate}
            </Animated.Text>
            <Text style={styles.hrLabel}>BPM</Text>
          </View>

          {/* Markers appearing in phase 3 */}
          {showMarkers && (
            <Animated.View style={[styles.markers, { opacity: markerFadeAnim }]}>
              <View style={styles.marker}>
                <Text style={styles.markerLabel}>Stress</Text>
                <Text style={styles.markerValue}>72</Text>
              </View>
              <View style={styles.marker}>
                <Text style={styles.markerLabel}>Wellness</Text>
                <Text style={styles.markerValue}>61</Text>
              </View>
              <View style={styles.marker}>
                <Text style={styles.markerLabel}>Vasc. Age</Text>
                <Text style={styles.markerValue}>+4</Text>
              </View>
            </Animated.View>
          )}

          {/* Phase info and Ester */}
          <View style={styles.bottomInfo}>
            <View style={styles.phaseIndicators}>
              {SCAN_PHASES.map((p, i) => (
                <View
                  key={p.id}
                  style={[
                    styles.phaseIndicator,
                    i === phase && styles.phaseIndicatorActive,
                    i < phase && styles.phaseIndicatorComplete,
                  ]}
                >
                  <Text
                    style={[
                      styles.phaseLabel,
                      i === phase && styles.phaseLabelActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.esterBox}>
              <Text style={styles.esterText}>{currentPhase.ester}</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth }]}
                />
              </View>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0806",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  topStatus: {
    alignItems: "center",
    paddingTop: 60,
  },
  statusLabel: {
    fontSize: 10,
    color: K.mustard + "80",
    letterSpacing: 3,
    fontWeight: "600",
  },
  faceGuide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  faceOutline: {
    width: 180,
    height: 240,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: K.mustard + "50",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  facePulse: {
    width: 160,
    height: 220,
    borderRadius: 80,
    backgroundColor: K.mustard + "08",
  },
  hrContainer: {
    position: "absolute",
    top: 120,
    right: 24,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  hrValue: {
    fontSize: 32,
    fontWeight: "300",
    color: K.err,
    fontFamily: "System",
  },
  hrLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  markers: {
    position: "absolute",
    top: 200,
    left: 24,
    gap: 8,
  },
  marker: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markerLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  markerValue: {
    fontSize: 18,
    fontWeight: "300",
    color: K.mustardLight,
    marginTop: 2,
  },
  bottomInfo: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  phaseIndicators: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  phaseIndicator: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  phaseIndicatorActive: {
    backgroundColor: K.mustard + "30",
  },
  phaseIndicatorComplete: {
    backgroundColor: K.ok + "30",
  },
  phaseLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  phaseLabelActive: {
    color: K.mustard,
  },
  esterBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  esterText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
    fontStyle: "italic",
  },
  progressContainer: {
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: K.mustard,
  },
});
