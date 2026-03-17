import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { K } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import type { Meal } from "../../components";
import {
  getMealDetail,
  getMealIngredients,
  MealDetail,
  MealIngredient,
} from "../../services/meals";

type RecipeRouteParams = {
  RecipeDetail: {
    meal: Meal;
  };
};

function parseInstructions(instructions: string | null): string[] {
  if (!instructions) return [];
  // Try numbered steps first (e.g., "1. Do this\n2. Do that")
  const numbered = instructions.match(/\d+\.\s+[^\n]+/g);
  if (numbered && numbered.length > 1) {
    return numbered.map((s) => s.replace(/^\d+\.\s*/, "").trim());
  }
  // Fall back to splitting by sentences
  return instructions
    .split(/\.(?:\s|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

export function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RecipeRouteParams, "RecipeDetail">>();
  const { meal } = route.params;

  const [detail, setDetail] = useState<MealDetail | null>(null);
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const [mealDetail, mealIngredients] = await Promise.all([
          getMealDetail(meal.id),
          getMealIngredients(meal.id),
        ]);
        setDetail(mealDetail);
        setIngredients(mealIngredients);
      } catch {
        // Keep meal card data as fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipe();
  }, [meal.id]);

  const handleClose = () => {
    navigation.goBack();
  };

  const steps = parseInstructions(detail?.instructions ?? null);
  const servings = detail?.servingsMin ?? 1;
  const calories = detail?.calories ?? meal.calories;
  const protein = detail?.proteinGrams ?? meal.protein;
  const carbs = detail?.carbsGrams ?? 0;
  const fat = detail?.fatGrams ?? 0;
  const fiber = detail?.fiberGrams ?? 0;
  const prepTime = detail?.prepTime ?? meal.prepTime;
  const description = detail?.description ?? meal.whyLine;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>{"\u00D7"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={K.textMuted} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero image */}
          <View style={styles.heroContainer}>
            {meal.imageUrl ? (
              <Image source={{ uri: meal.imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text style={styles.heroPlaceholderText}>🍽️</Text>
              </View>
            )}
          </View>

          {/* Title section */}
          <View style={styles.titleSection}>
            <Text style={styles.mealName}>{meal.name}</Text>
            {description ? (
              <Text style={styles.whyLine}>{description}</Text>
            ) : null}

            {/* Quick info */}
            <View style={styles.quickInfo}>
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>{prepTime} min</Text>
              </View>
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>
                  {servings} {servings === 1 ? "serving" : "servings"}
                </Text>
              </View>
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>{Math.round(Number(calories))} cal</Text>
              </View>
            </View>
          </View>

          {/* Nutrition breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NUTRITION</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(Number(protein))}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(Number(carbs))}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(Number(fat))}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(Number(fiber))}g</Text>
                <Text style={styles.nutritionLabel}>Fiber</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INGREDIENTS</Text>
              <View style={styles.ingredientsList}>
                {ingredients.map((ing) => (
                  <View key={ing.id} style={styles.ingredientRow}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientText}>
                      {ing.representText || `${ing.quantity} ${ing.measurement} ${ing.ingredient.name}`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Instructions */}
          {steps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INSTRUCTIONS</Text>
              <View style={styles.stepsList}>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: K.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: K.border,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: K.bone,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 24,
    color: K.brown,
    fontWeight: "300",
    marginTop: -2,
  },
  headerTitle: {
    ...typography.bodyMedium,
    color: K.brown,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  heroContainer: {
    height: 220,
    backgroundColor: K.bone,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroPlaceholderText: {
    fontSize: 64,
  },
  titleSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: K.border,
  },
  mealName: {
    ...typography.h1,
    fontSize: 28,
    color: K.brown,
    marginBottom: spacing.xs,
  },
  whyLine: {
    ...typography.body,
    color: K.textMuted,
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
  quickInfo: {
    flexDirection: "row",
    gap: spacing.md,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: K.bone,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: 4,
  },
  infoBadgeText: {
    ...typography.caption,
    color: K.brown,
    fontWeight: "500",
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: K.border,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: K.textMuted,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nutritionItem: {
    alignItems: "center",
    flex: 1,
  },
  nutritionValue: {
    ...typography.h3,
    color: K.brown,
    marginBottom: 2,
  },
  nutritionLabel: {
    ...typography.caption,
    color: K.textMuted,
  },
  ingredientsList: {
    gap: spacing.sm,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: K.ochre,
    marginTop: 7,
  },
  ingredientText: {
    ...typography.body,
    color: K.brown,
    flex: 1,
  },
  stepsList: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: K.brown,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    ...typography.bodyMedium,
    color: K.bone,
    fontWeight: "600",
    fontSize: 14,
  },
  stepText: {
    ...typography.body,
    color: K.brown,
    flex: 1,
    lineHeight: 24,
  },
});
