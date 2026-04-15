import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { TASTE_CLUSTERS } from "../../constants/types";
import { EsterBubble, Button } from "../../components";
import { useApp } from "../../context/AppContext";

type Props = NativeStackScreenProps<any, "Taste">;

export function TasteScreen({ navigation }: Props) {
  const { setTastePreferences } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
  };

  const handleContinue = () => {
    if (selected) {
      setTastePreferences([selected]);
    } else {
      // "Surprise me" defaults to simple-familiar
      setTastePreferences(["simple"]);
    }
    navigation.navigate("Restrict");
  };

  const handleSurprise = () => {
    setTastePreferences(["simple"]);
    navigation.navigate("Restrict");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <EsterBubble message="I know how to feed your metabolism. What sounds good tonight?" />

        <View style={styles.grid}>
          {TASTE_CLUSTERS.map((cluster) => {
            const isSelected = selected === cluster.id;
            return (
              <TouchableOpacity
                key={cluster.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(cluster.id)}
                activeOpacity={0.8}
              >
                <Image
                  source={cluster.image}
                  style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                  <Text style={[styles.cardName, isSelected && styles.cardNameSelected]}>
                    {cluster.name}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.surpriseButton} onPress={handleSurprise}>
          <Text style={styles.surpriseText}>Surprise me</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <Button
          title={selected ? "Good taste. Continue" : "Continue"}
          onPress={handleContinue}
          disabled={!selected}
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
    flex: 1,
    padding: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
  },
  card: {
    width: "47%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: K.white,
    borderWidth: 2,
    borderColor: K.border,
  },
  cardSelected: {
    borderColor: K.maroon,
  },
  cardImage: {
    width: "100%",
    height: 100,
    backgroundColor: K.warmGray,
  },
  cardContent: {
    padding: 12,
  },
  cardName: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: K.text,
  },
  cardNameSelected: {
    color: K.maroon,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: K.maroon,
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: {
    color: K.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  surpriseButton: {
    alignItems: "center",
    marginTop: 20,
  },
  surpriseText: {
    ...typography.body,
    color: K.sub,
  },
  bottom: {
    padding: 24,
    paddingBottom: 40,
  },
});
