import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { DIETARY_RESTRICTIONS } from "../../constants/types";
import { EsterBubble, Pill, Button } from "../../components";
import { useApp } from "../../context/AppContext";
import { logEvent } from "../../services/braze";

type Props = NativeStackScreenProps<any, "Restrict">;

export function RestrictScreen({ navigation }: Props) {
  const { setDietaryRestrictions } = useApp();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    logEvent("onboarding_restrict");
  }, []);

  const toggleOption = (id: string) => {
    if (id === "none") {
      setSelected(["none"]);
      return;
    }

    setSelected((prev) => {
      const filtered = prev.filter((s) => s !== "none");
      return filtered.includes(id)
        ? filtered.filter((s) => s !== id)
        : [...filtered, id];
    });
  };

  const handleContinue = () => {
    logEvent("onboarding_restrict_continueCTA", {
      restrictions: selected.join(",") || "none",
    });
    setDietaryRestrictions(selected);
    navigation.navigate("Account");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <EsterBubble message="Any foods you can't eat?" />

        <View style={styles.options}>
          {DIETARY_RESTRICTIONS.map((option) => (
            <Pill
              key={option.id}
              label={option.label}
              selected={selected.includes(option.id)}
              onPress={() => toggleOption(option.id)}
              style={styles.pill}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={selected.length === 0}
        />
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
    padding: 24,
    paddingBottom: 120,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 24,
  },
  pill: {
    minWidth: "45%",
    flexGrow: 1,
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: K.cream,
  },
});
