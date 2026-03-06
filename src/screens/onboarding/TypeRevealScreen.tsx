import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TC, MetabolicType } from "../../constants/colors";
import { typography } from "../../constants/typography";
import {
  TYPE_CONFIGS,
  determineType,
  getTypeRevealText,
} from "../../constants/types";
import { Button, Avatar } from "../../components";
import { useApp } from "../../context/AppContext";

type Props = NativeStackScreenProps<any, "TypeReveal">;

export function TypeRevealScreen({ navigation }: Props) {
  const { state, setMetabolicType } = useApp();
  const hasScan = !!state.biometrics;

  // Get quiz answers
  const q1 = (state.user.quizAnswers.q1 as "afternoon_evening" | "random") || "afternoon_evening";
  const q2 = (state.user.quizAnswers.q2 as "crash" | "drift") || "crash";

  // Determine type from quiz
  const metabolicType = state.user.metabolicType || determineType(q1, q2);
  const typeConfig = TYPE_CONFIGS[metabolicType];
  const colors = TC[metabolicType];

  // Get path-specific reveal text
  const revealText = getTypeRevealText(q1, q2, hasScan);

  // Set type if not already set
  useEffect(() => {
    if (!state.user.metabolicType) {
      setMetabolicType(metabolicType);
    }
  }, []);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    navigation.navigate("Share");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          {/* Avatar and Ester message */}
          <View style={styles.esterSection}>
            <Avatar size={44} />
            <View style={styles.esterBubble}>
              <Text style={[styles.esterText, { color: colors.text }]}>
                {revealText}
              </Text>
            </View>
          </View>

          {/* Type reveal card */}
          <Animated.View
            style={[
              styles.typeCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={[styles.typeLabel, { color: colors.text + "80" }]}>
              YOUR TYPE
            </Text>
            <Text style={[styles.typeName, { color: colors.text }]}>
              {typeConfig.title}
            </Text>
            <Text style={[styles.typeTagline, { color: colors.text + "CC" }]}>
              {typeConfig.tagline}
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.text + "30" }]} />

            <Text style={[styles.typeDescription, { color: colors.text + "CC" }]}>
              {typeConfig.description}
            </Text>
          </Animated.View>

          {/* Traits */}
          <Animated.View
            style={[
              styles.traitsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {typeConfig.traits.map((trait, index) => (
              <View key={index} style={styles.traitRow}>
                <View style={[styles.traitDot, { backgroundColor: colors.text + "60" }]} />
                <Text style={[styles.traitText, { color: colors.text }]}>
                  {trait}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.bottom}>
          <Button
            title="Continue"
            onPress={handleContinue}
            style={[
              styles.button,
              { backgroundColor: colors.text === "#FFFFFF" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" },
            ]}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  esterSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 32,
  },
  esterBubble: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
  },
  esterText: {
    fontSize: 14,
    lineHeight: 22,
  },
  typeCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  typeLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "600",
    marginBottom: 12,
  },
  typeName: {
    ...typography.h1,
    fontSize: 38,
    marginBottom: 8,
  },
  typeTagline: {
    ...typography.body,
    fontSize: 15,
  },
  divider: {
    width: 50,
    height: 2,
    marginVertical: 24,
  },
  typeDescription: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  traitsSection: {
    marginTop: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 18,
  },
  traitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  traitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  traitText: {
    ...typography.body,
    fontSize: 14,
  },
  bottom: {
    padding: 24,
  },
  button: {
    borderWidth: 0,
  },
});
