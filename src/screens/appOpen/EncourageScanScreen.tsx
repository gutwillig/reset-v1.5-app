import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { fonts } from "../../constants/typography";
import { SurveyHeader } from "../../components/survey/SurveyHeader";
import { ContinueButton } from "../../components/survey/ContinueButton";
import { getProfile } from "../../services/profile";
import { useSwipeToAdvance } from "../../hooks/useSwipeToAdvance";
import type { AppOpenStackParamList } from "../../navigation/AppOpenNavigator";

export function EncourageScanScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppOpenStackParamList>>();
  const insets = useSafeAreaInsets();
  const [confidence, setConfidence] = useState<number | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => setConfidence(p?.confidence?.composite ?? null))
      .catch(() => {});
  }, []);

  const exitToHome = () => {
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "Tabs" }] }),
    );
  };

  const handleScan = () => {
    const parent = navigation.getParent();
    parent?.navigate("Scan", { mode: "rescan", returnTo: "ScoreReveal" });
  };

  const handleSkip = () => {
    navigation.replace("ScoreReveal");
  };

  const swipeHandlers = useSwipeToAdvance({
    axis: "down",
    onAdvance: handleSkip,
  });

  const confidencePct =
    confidence !== null ? Math.max(0, Math.min(100, Math.round(confidence))) : 50;
  const daysToFull =
    confidence !== null && confidence < 100
      ? Math.max(1, Math.ceil(100 - confidence))
      : 0;

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top", "bottom"]}
      {...swipeHandlers}
    >
      <StatusBar barStyle="dark-content" translucent />

      <View style={styles.content}>
        <SurveyHeader
          step={3}
          totalSteps={3}
          title={"Your score's almost ready!\n\nWe've got a good read on you, but completing a face scan can make your results even more accurate."}
          canGoBack
          onBack={() => navigation.goBack()}
          onClose={exitToHome}
        />

        <View style={styles.confidenceCard}>
          <View style={styles.confidenceLeft}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <Text style={styles.confidenceValue}>{confidencePct}%</Text>
          </View>
          <View style={styles.confidenceRight}>
            <Text style={styles.confidenceHint}>
              We're still learning your signals.
            </Text>
            {daysToFull > 0 ? (
              <Text style={styles.confidenceSub}>
                Estimated {daysToFull} days til near 100% confidence
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { bottom: insets.bottom + 16 }]}>
        <ContinueButton label="Complete scan" onPress={handleScan} />
        <ContinueButton
          label="No thanks, show me my score"
          variant="ghost"
          onPress={handleSkip}
          style={styles.skipBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: K.white,
  },
  content: {
    paddingTop: 30,
    paddingHorizontal: 44,
    gap: 30,
  },
  confidenceCard: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
    backgroundColor: "#E9F0F2",
    borderRadius: 4,
    padding: 16,
  },
  confidenceLeft: {
    gap: 8,
  },
  confidenceLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: -0.12,
    color: K.brown,
  },
  confidenceValue: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    letterSpacing: -0.16,
    color: K.brown,
  },
  confidenceRight: {
    flex: 1,
    gap: 7,
  },
  confidenceHint: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    letterSpacing: -0.14,
    color: K.brown,
  },
  confidenceSub: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    letterSpacing: -0.12,
    color: K.sub,
  },
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    gap: 8,
  },
  skipBtn: {
    marginTop: 0,
  },
});
