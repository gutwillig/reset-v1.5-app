import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { Avatar, Button } from "../../components";
import { useApp } from "../../context/AppContext";
import type { MainStackParamList } from "../../navigation/MainNavigator";

type Props = NativeStackScreenProps<MainStackParamList, "ScanResults">;

interface BiometricRowProps {
  icon: string;
  label: string;
  value: string | number;
  delay: number;
}

function BiometricRow({ icon, label, value, delay }: BiometricRowProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </Animated.View>
  );
}

export function ScanResultsScreen({ navigation }: Props) {
  const { state } = useApp();
  const biometrics = state.biometrics;

  if (!biometrics) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.content}>
          <Text style={styles.esterText}>No scan data available.</Text>
        </View>
        <View style={styles.bottom}>
          <Button title="Done" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.esterSection}>
          <Avatar size={40} />
          <View style={styles.esterBubble}>
            <Text style={styles.esterText}>
              Updated your biological profile. My model just got sharper.
            </Text>
          </View>
        </View>

        <View style={styles.results}>
          <Text style={styles.sectionTitle}>YOUR SCAN RESULTS</Text>

          <BiometricRow
            icon="🧘"
            label="Stress Index"
            value={biometrics.stressIndex}
            delay={0}
          />
          <BiometricRow
            icon="🫀"
            label="Vascular Age"
            value={`+${biometrics.vascularAge} yrs`}
            delay={150}
          />
          <BiometricRow
            icon="💓"
            label="Heart Rate"
            value={`${biometrics.heartRate} BPM`}
            delay={300}
          />
          <BiometricRow
            icon="✨"
            label="Wellness"
            value={`${biometrics.wellness}/100`}
            delay={450}
          />
        </View>
      </View>

      <View style={styles.bottom}>
        <Button title="Done" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: K.cream,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  esterSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 28,
  },
  esterBubble: {
    flex: 1,
    backgroundColor: K.warmGray,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
  },
  esterText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: K.text,
  },
  results: {
    backgroundColor: K.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: K.border,
  },
  sectionTitle: {
    fontSize: 10,
    color: K.faded,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: K.border,
  },
  rowIcon: {
    fontSize: 26,
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: K.sub,
    marginBottom: 2,
  },
  rowValue: {
    ...typography.h3,
    fontSize: 22,
  },
  bottom: {
    padding: 24,
    paddingBottom: 40,
  },
});
