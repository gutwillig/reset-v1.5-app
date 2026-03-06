import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { K } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import type { Meal } from "../../components";

type RecipeRouteParams = {
  RecipeDetail: {
    meal: Meal;
  };
};

// Mock recipe data - would come from backend
function getRecipeForMeal(meal: Meal) {
  const recipes: Record<string, {
    servings: number;
    ingredients: string[];
    steps: string[];
    tips?: string;
    nutrition: {
      carbs: number;
      fat: number;
      fiber: number;
    };
  }> = {
    "Protein Scramble": {
      servings: 1,
      ingredients: [
        "3 large eggs",
        "2 oz smoked salmon or turkey",
        "1/4 cup spinach, chopped",
        "2 tbsp feta cheese, crumbled",
        "1 tsp olive oil",
        "Salt and pepper to taste",
      ],
      steps: [
        "Heat olive oil in a non-stick pan over medium heat.",
        "Whisk eggs in a bowl and season with salt and pepper.",
        "Pour eggs into pan and let set for 30 seconds.",
        "Gently push eggs from edges to center, letting uncooked egg flow to pan.",
        "When eggs are almost set, add spinach and protein.",
        "Fold gently and transfer to plate. Top with feta.",
      ],
      tips: "Don't overcook — remove from heat while eggs still look slightly wet. They'll finish cooking on the plate.",
      nutrition: { carbs: 2, fat: 28, fiber: 1 },
    },
    "Greek Yogurt Bowl": {
      servings: 1,
      ingredients: [
        "1 cup plain Greek yogurt",
        "1/2 cup mixed berries",
        "2 tbsp granola (low sugar)",
        "1 tbsp honey or maple syrup",
        "1 tbsp chia seeds",
        "Handful of sliced almonds",
      ],
      steps: [
        "Add Greek yogurt to a bowl.",
        "Top with mixed berries.",
        "Sprinkle granola and chia seeds.",
        "Add sliced almonds.",
        "Drizzle with honey or maple syrup.",
        "Serve immediately.",
      ],
      nutrition: { carbs: 35, fat: 12, fiber: 6 },
    },
    default: {
      servings: 1,
      ingredients: [
        "Main protein (4-6 oz)",
        "Vegetables (1-2 cups)",
        "Healthy fat (1-2 tbsp)",
        "Seasoning to taste",
      ],
      steps: [
        "Prep all ingredients.",
        "Cook protein to desired doneness.",
        "Prepare vegetables.",
        "Combine and season.",
        "Plate and serve.",
      ],
      nutrition: { carbs: 20, fat: 15, fiber: 4 },
    },
  };

  return recipes[meal.name] || recipes.default;
}

export function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RecipeRouteParams, "RecipeDetail">>();
  const { meal } = route.params;
  const recipe = getRecipeForMeal(meal);

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe</Text>
        <View style={styles.headerSpacer} />
      </View>

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
          <Text style={styles.whyLine}>{meal.whyLine}</Text>

          {/* Quick info */}
          <View style={styles.quickInfo}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeIcon}>⏱️</Text>
              <Text style={styles.infoBadgeText}>{meal.prepTime} min</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeIcon}>🍽️</Text>
              <Text style={styles.infoBadgeText}>{recipe.servings} serving</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeIcon}>🔥</Text>
              <Text style={styles.infoBadgeText}>{meal.calories} cal</Text>
            </View>
          </View>
        </View>

        {/* Nutrition breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NUTRITION</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{meal.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition.fat}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition.fiber}g</Text>
              <Text style={styles.nutritionLabel}>Fiber</Text>
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INGREDIENTS</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSTRUCTIONS</Text>
          <View style={styles.stepsList}>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        {recipe.tips && (
          <View style={styles.tipsSection}>
            <View style={styles.tipsHeader}>
              <Text style={styles.tipsIcon}>💡</Text>
              <Text style={styles.tipsTitle}>Ester's Tip</Text>
            </View>
            <Text style={styles.tipsText}>{recipe.tips}</Text>
          </View>
        )}
      </ScrollView>
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
  infoBadgeIcon: {
    fontSize: 14,
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
  tipsSection: {
    margin: spacing.lg,
    backgroundColor: K.blue,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipsIcon: {
    fontSize: 18,
  },
  tipsTitle: {
    ...typography.bodyMedium,
    color: K.brown,
    fontWeight: "600",
  },
  tipsText: {
    ...typography.body,
    color: K.brown,
    lineHeight: 22,
  },
});
