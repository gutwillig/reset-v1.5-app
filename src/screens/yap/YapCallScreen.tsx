import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from "react-native";
import { Voice, Call } from "@twilio/voice-react-native-sdk";
import { K } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import { Avatar } from "../../components/Avatar";
import { startYapSession } from "../../services/yap";
import * as BrazeService from "../../services/braze";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/MainNavigator";

type Props = NativeStackScreenProps<MainStackParamList, "YapCall">;

type CallState = "connecting" | "active" | "ended" | "error";

export function YapCallScreen({ navigation, route }: Props) {
  const { yapSessionId } = route.params;
  const [callState, setCallState] = useState<CallState>("connecting");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callRef = useRef<Call | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for active call
  useEffect(() => {
    if (callState === "active") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callState, pulseAnim]);

  // Duration timer
  useEffect(() => {
    if (callState === "active") {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Connect call on mount
  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        const result = await startYapSession(yapSessionId);
        if (!mounted) return;

        const voice = new Voice();
        const call = await voice.connect(result.accessToken, {
          params: {
            yapSessionId: result.yapSessionId,
          },
        });

        callRef.current = call;

        call.on(Call.Event.Connected, () => {
          if (mounted) {
            setCallState("active");
            BrazeService.logEvent("yap_session_started");
          }
        });

        call.on(Call.Event.Disconnected, () => {
          if (mounted) setCallState("ended");
        });

        call.on(Call.Event.ConnectFailure, (error: unknown) => {
          if (mounted) {
            setCallState("error");
            setErrorMessage(
              error instanceof Error ? error.message : "Connection failed",
            );
          }
        });
      } catch (err) {
        if (mounted) {
          setCallState("error");
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to start session",
          );
        }
      }
    }

    connect();

    return () => {
      mounted = false;
      if (callRef.current) {
        callRef.current.disconnect();
      }
    };
  }, [yapSessionId]);

  const handleMuteToggle = useCallback(() => {
    if (callRef.current) {
      const newMuted = !isMuted;
      callRef.current.mute(newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const handleEndCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
    setCallState("ended");
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yap Session</Text>
        {callState === "active" && (
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        )}
      </View>

      {/* Center content */}
      <View style={styles.center}>
        {callState === "connecting" && (
          <>
            <Avatar size={80} state="neutral" />
            <Text style={styles.statusText}>Connecting to Ester...</Text>
          </>
        )}

        {callState === "active" && (
          <>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Avatar size={80} state="observing" />
            </Animated.View>
            <Text style={styles.statusText}>Ester is listening</Text>
            <View style={styles.phaseIndicator}>
              <View style={styles.phaseDotActive} />
              <View
                style={duration > 90 ? styles.phaseDotActive : styles.phaseDot}
              />
              <View
                style={
                  duration > 270 ? styles.phaseDotActive : styles.phaseDot
                }
              />
            </View>
          </>
        )}

        {callState === "ended" && (
          <>
            <Avatar size={80} state="celebrating" />
            <Text style={styles.statusText}>Session complete</Text>
            <Text style={styles.subText}>
              Thanks for sharing. Your meals will get sharper.
            </Text>
          </>
        )}

        {callState === "error" && (
          <>
            <Avatar size={80} state="neutral" />
            <Text style={styles.statusText}>Something went wrong</Text>
            <Text style={styles.subText}>{errorMessage}</Text>
          </>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {callState === "active" && (
          <>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isMuted && styles.controlButtonActive,
              ]}
              onPress={handleMuteToggle}
            >
              <Text style={styles.controlIcon}>{isMuted ? "🔇" : "🎙️"}</Text>
              <Text style={styles.controlLabel}>
                {isMuted ? "Unmute" : "Mute"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endCallButton}
              onPress={handleEndCall}
            >
              <Text style={styles.endCallIcon}>📞</Text>
              <Text style={styles.endCallLabel}>End</Text>
            </TouchableOpacity>
          </>
        )}

        {(callState === "ended" || callState === "error") && (
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: K.bone,
  },
  header: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.bodyMedium,
    color: K.brown,
    fontWeight: "600",
    fontSize: 18,
  },
  duration: {
    ...typography.caption,
    color: K.textMuted,
    marginTop: 4,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statusText: {
    ...typography.bodyMedium,
    color: K.brown,
    fontSize: 18,
    marginTop: spacing.md,
  },
  subText: {
    ...typography.body,
    color: K.textMuted,
    textAlign: "center",
    maxWidth: 280,
  },
  phaseIndicator: {
    flexDirection: "row",
    gap: 8,
    marginTop: spacing.sm,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: K.textMuted,
    opacity: 0.3,
  },
  phaseDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: K.ochre,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
  },
  controlButton: {
    alignItems: "center",
    gap: 6,
  },
  controlButtonActive: {
    opacity: 0.6,
  },
  controlIcon: {
    fontSize: 28,
  },
  controlLabel: {
    ...typography.caption,
    color: K.brown,
  },
  endCallButton: {
    alignItems: "center",
    gap: 6,
    backgroundColor: K.err,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
  },
  endCallIcon: {
    fontSize: 24,
  },
  endCallLabel: {
    ...typography.caption,
    color: K.white,
    fontSize: 11,
  },
  backButton: {
    backgroundColor: K.brown,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  backButtonText: {
    ...typography.button,
    color: K.bone,
  },
});
