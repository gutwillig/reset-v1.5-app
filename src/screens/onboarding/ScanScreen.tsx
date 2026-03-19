import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "expo-camera";
import { ShenaiSdkView } from "react-native-shenai-sdk";
import { K } from "../../constants/colors";
import { useApp } from "../../context/AppContext";
import Constants from "expo-constants";
import {
  initShenAI,
  shutdownShenAI,
  startScan,
  stopScan,
  getScanResults,
  getFaceStateValue,
  isReady,
  getRealtimeHeartRate,
  getMeasureState,
  getMeasureProgress,
  getViolatedCondition,
  type ScanResults,
  type FaceState,
} from "../../services/shenai";

type Props = NativeStackScreenProps<any, "Scan">;

const SHEN_API_KEY =
  Constants.expoConfig?.extra?.shenAiApiKey ?? "";

const SCAN_PHASES = [
  {
    id: "aligning",
    label: "Aligning",
    ester: "Got you. Hold still — I'm reading your signals.",
  },
  {
    id: "reading",
    label: "Reading signals",
    ester: "I can see your pulse. Reading deeper...",
  },
  {
    id: "mapping",
    label: "Mapping markers",
    ester: "Stress index... vascular age... wellness score...",
  },
];

const POSITION_TIMEOUT = 30000;
const FACE_LOST_THRESHOLD = 5000;
const MIN_SIGNAL_QUALITY = 0.3;

type ScreenState =
  | "initializing"
  | "positioning"
  | "measuring"
  | "complete"
  | "error";

interface FailureInfo {
  type:
    | "face_not_detected"
    | "poor_lighting"
    | "too_much_movement"
    | "scan_timeout"
    | "camera_error"
    | "low_signal_quality";
  message: string;
}

const FAILURE_MESSAGES: Record<FailureInfo["type"], string> = {
  face_not_detected:
    "I can't see you clearly. Try facing the camera directly.",
  poor_lighting: "It's a bit dark. Try moving to better light.",
  too_much_movement: "Hold still for me — I need a steady read.",
  scan_timeout: "Taking longer than expected. Let's try again.",
  camera_error: "Camera hiccup. Let me try again.",
  low_signal_quality: "The reading wasn't strong enough. One more try?",
};

function deriveBiometrics(results: ScanResults) {
  const parasympathetic = results.parasympatheticActivity ?? 50;
  const hrvSdnn = results.hrvSdnn ?? 40;
  const wellness = Math.round(
    Math.min(100, Math.max(0, parasympathetic * 0.6 + (hrvSdnn / 80) * 40)),
  );

  const vascularAge = results.ageEstimate
    ? Math.round(results.ageEstimate - 30)
    : Math.floor(Math.random() * 6) + 2;

  return {
    stressIndex: results.stressIndex ?? 65,
    heartRate: results.heartRate,
    wellness,
    vascularAge: Math.max(0, vascularAge),
    raw: results,
  };
}

export function ScanScreen({ navigation }: Props) {
  const { setBiometrics } = useApp();
  const [sdkReady, setSdkReady] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>("initializing");
  const [phase, setPhase] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [showMarkers, setShowMarkers] = useState(false);
  const [faceState, setFaceState] = useState<FaceState>("NOT_VISIBLE");
  const [failure, setFailure] = useState<FailureInfo | null>(null);
  const [liveMarkers, setLiveMarkers] = useState({
    stress: 0,
    wellness: 0,
    vascAge: 0,
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const markerFadeAnim = useRef(new Animated.Value(0)).current;

  const faceLostSinceRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pulse animation for heart rate
  useEffect(() => {
    if (heartRate <= 0) return;
    const beatDuration = 60000 / heartRate;

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

  // Initialize SDK on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Request camera permission first
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== "granted") {
          console.warn("[ShenAI] Camera permission denied");
          if (!cancelled) {
            setFailure({
              type: "camera_error",
              message: "Camera access is required for the scan.",
            });
            setScreenState("error");
          }
          return;
        }

        console.log("[ShenAI] Initializing with key:", SHEN_API_KEY ? "present" : "MISSING");
        await initShenAI(SHEN_API_KEY);
        console.log("[ShenAI] Init success");
        if (!cancelled) {
          setSdkReady(true);
          setScreenState("positioning");
        }
      } catch (err) {
        console.error("[ShenAI] Init failed:", err);
        if (!cancelled) {
          setFailure({
            type: "camera_error",
            message: FAILURE_MESSAGES.camera_error,
          });
          setScreenState("error");
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      shutdownShenAI();
    };
  }, []);

  // Positioning phase: poll face state and auto-start when ready
  useEffect(() => {
    if (screenState !== "positioning") return;

    positionTimeoutRef.current = setTimeout(() => {
      setFailure({
        type: "scan_timeout",
        message: FAILURE_MESSAGES.scan_timeout,
      });
      setScreenState("error");
    }, POSITION_TIMEOUT);

    const poll = setInterval(async () => {
      try {
        const face = await getFaceStateValue();
        setFaceState(face);

        if (face === "OK") {
          const ready = await isReady();
          if (ready) {
            clearInterval(poll);
            if (positionTimeoutRef.current) {
              clearTimeout(positionTimeoutRef.current);
            }
            beginMeasurement();
          }
        }
      } catch {
        // SDK polling error — continue trying
      }
    }, 500);

    return () => {
      clearInterval(poll);
      if (positionTimeoutRef.current) {
        clearTimeout(positionTimeoutRef.current);
      }
    };
  }, [screenState]);

  const beginMeasurement = useCallback(async () => {
    try {
      await startScan();
      setScreenState("measuring");
      setPhase(0);

      progressAnim.setValue(0);
    } catch {
      setFailure({
        type: "camera_error",
        message: FAILURE_MESSAGES.camera_error,
      });
      setScreenState("error");
    }
  }, []);

  // During measurement: poll state, HR, progress, face
  useEffect(() => {
    if (screenState !== "measuring") return;

    pollRef.current = setInterval(async () => {
      try {
        // Poll measurement state
        const measureState = await getMeasureState();

        if (measureState === "FINISHED") {
          if (pollRef.current) clearInterval(pollRef.current);
          await finishMeasurement();
          return;
        }

        if (measureState === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setFailure({
            type: "camera_error",
            message: FAILURE_MESSAGES.camera_error,
          });
          setScreenState("error");
          return;
        }

        // Poll progress and update phase/animation
        const progress = await getMeasureProgress();
        const normalizedProgress = progress / 100;
        progressAnim.setValue(normalizedProgress);

        // Phase transitions based on progress
        if (progress >= 66 && phase < 2) {
          setPhase(2);
          setShowMarkers(true);
          Animated.timing(markerFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        } else if (progress >= 16 && phase < 1) {
          setPhase(1);
        }

        // Poll live heart rate
        const hr = await getRealtimeHeartRate();
        if (hr && hr > 0) setHeartRate(hr);

        // Poll face state for loss detection
        const face = await getFaceStateValue();
        setFaceState(face);

        if (face !== "OK") {
          if (!faceLostSinceRef.current) {
            faceLostSinceRef.current = Date.now();
          } else if (
            Date.now() - faceLostSinceRef.current >
            FACE_LOST_THRESHOLD
          ) {
            await stopScan();
            if (pollRef.current) clearInterval(pollRef.current);
            setFailure({
              type: "face_not_detected",
              message: FAILURE_MESSAGES.face_not_detected,
            });
            setScreenState("error");
            return;
          }
        } else {
          faceLostSinceRef.current = null;
        }
      } catch {
        // Polling error — continue
      }
    }, 500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [screenState, phase]);

  const finishMeasurement = useCallback(async () => {
    try {
      console.log("[ShenAI] Measurement finished, stopping scan...");
      await stopScan();
      console.log("[ShenAI] Fetching results...");
      const results = await getScanResults();
      console.log("[ShenAI] Results:", JSON.stringify(results));

      if (!results) {
        setFailure({
          type: "camera_error",
          message: FAILURE_MESSAGES.camera_error,
        });
        setScreenState("error");
        return;
      }

      // Check signal quality
      if (results.signalQuality < MIN_SIGNAL_QUALITY) {
        setFailure({
          type: "low_signal_quality",
          message: FAILURE_MESSAGES.low_signal_quality,
        });
        setScreenState("error");
        return;
      }

      // Update live markers for display
      setLiveMarkers({
        stress: results.stressIndex ?? 0,
        wellness: Math.round(
          ((results.parasympatheticActivity ?? 50) * 0.6) +
            (((results.hrvSdnn ?? 40) / 80) * 40),
        ),
        vascAge: results.ageEstimate
          ? Math.round(results.ageEstimate - 30)
          : 4,
      });

      const biometrics = deriveBiometrics(results);
      console.log("[ShenAI] Biometrics derived, navigating...");
      setBiometrics(biometrics);
      setScreenState("complete");

      setTimeout(async () => {
        await shutdownShenAI();
        navigation.replace("ScanReveal");
      }, 1500);
    } catch (err) {
      console.error("[ShenAI] finishMeasurement error:", err);
      setFailure({
        type: "camera_error",
        message: FAILURE_MESSAGES.camera_error,
      });
      setScreenState("error");
    }
  }, [navigation, setBiometrics]);

  const handleRetry = useCallback(async () => {
    setFailure(null);
    setPhase(0);
    setShowMarkers(false);
    setHeartRate(0);
    setFaceState("NOT_VISIBLE");
    faceLostSinceRef.current = null;
    progressAnim.setValue(0);
    markerFadeAnim.setValue(0);

    try {
      await initShenAI(SHEN_API_KEY);
      setScreenState("positioning");
    } catch {
      setFailure({
        type: "camera_error",
        message: FAILURE_MESSAGES.camera_error,
      });
      setScreenState("error");
    }
  }, []);

  const handleSkip = useCallback(async () => {
    await shutdownShenAI();
    navigation.replace("TypeReveal");
  }, [navigation]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const currentPhase = SCAN_PHASES[phase];

  const getFaceGuidanceText = (): string => {
    switch (faceState) {
      case "NOT_VISIBLE":
        return "Position your face in the frame.";
      case "NOT_CENTERED":
        return "Center your face in the oval.";
      case "TOO_CLOSE":
        return "Move back a little.";
      case "TOO_FAR":
        return "Move a bit closer.";
      case "OK":
        return "Hold still — starting scan...";
      default:
        return "Position your face in the frame.";
    }
  };

  const getEsterMessage = (): string => {
    if (failure) return failure.message;
    if (screenState === "initializing") return "Setting up the scan...";
    if (screenState === "positioning") return getFaceGuidanceText();
    return currentPhase.ester;
  };

  const getStatusLabel = (): string => {
    if (failure) return "ISSUE DETECTED";
    if (screenState === "initializing") return "PREPARING";
    if (screenState === "positioning") return "POSITIONING";
    if (screenState === "complete") return "COMPLETE";
    return "READING";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* SDK camera + metrics panel */}
      {sdkReady ? (
        <ShenaiSdkView style={styles.sdkView} />
      ) : (
        <View style={styles.sdkPlaceholder} />
      )}

      {/* Our controls below the SDK */}
      <View style={styles.controlsBar}>
        <View style={styles.esterBox}>
          <Text style={styles.esterText}>{getEsterMessage()}</Text>
        </View>

        {screenState === "measuring" && (
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
        )}

        {screenState === "measuring" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
          </View>
        )}

        {failure && (
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip scan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0806",
  },
  sdkView: {
    flex: 1,
  },
  sdkPlaceholder: {
    flex: 1,
    backgroundColor: "#0C0806",
  },
  controlsBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#0C0806",
    gap: 8,
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 10,
  },
  esterText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
    fontStyle: "italic",
  },
  errorActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    flex: 1,
    backgroundColor: K.mustard,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: K.warmBlack,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
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
