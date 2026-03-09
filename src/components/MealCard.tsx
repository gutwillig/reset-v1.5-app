import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { K, MetabolicType } from "../constants/colors";
import { typography, spacing, radius } from "../constants/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48; // Account for padding
const CARD_GAP = 12;

export interface Meal {
  id: string;
  name: string;
  whyLine: string; // Max 15 words
  calories: number;
  protein: number;
  prepTime: number; // in minutes
  time: "breakfast" | "lunch" | "dinner" | "snack";
  imageUrl?: string;
}

// Feedback tags when thumbs down is selected
const FEEDBACK_TAGS = [
  { id: "complex", label: "Too complex" },
  { id: "taste", label: "Didn't like taste" },
  { id: "long", label: "Too long" },
  { id: "not_full", label: "Didn't keep me full" },
];

interface MealCardProps {
  meal: Meal;
  metabolicType?: MetabolicType;
  onPress?: () => void;
  onFeedback?: (feedback: "up" | "down", tags?: string[]) => void;
  onChatPress?: () => void;
  onRecipePress?: () => void;
}

export function MealCard({ meal, metabolicType, onPress, onFeedback, onChatPress, onRecipePress }: MealCardProps) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [showTags, setShowTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleThumbsUp = () => {
    setFeedback("up");
    setShowTags(false);
    onFeedback?.("up");
  };

  const handleThumbsDown = () => {
    setFeedback("down");
    setShowTags(true);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const submitFeedback = () => {
    onFeedback?.("down", selectedTags);
    setShowTags(false);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>🍽️</Text>
          </View>
        )}
        {/* Prep time badge */}
        <View style={styles.prepBadge}>
          <Text style={styles.prepText}>{meal.prepTime} min</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name}>{meal.name}</Text>

        {/* Nutrition badge */}
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionBadge}>
            <Text style={styles.nutritionText}>{meal.calories} cal</Text>
          </View>
          <View style={styles.nutritionBadge}>
            <Text style={styles.nutritionText}>{meal.protein}g protein</Text>
          </View>
        </View>

        {/* Personalized Why Section */}
        {metabolicType && (
          <View style={styles.whySection}>
            <Text style={styles.whyHeader}>For {metabolicType}s:</Text>
            <Text style={styles.whyExplanation}>{meal.whyLine}</Text>
          </View>
        )}

        {/* Feedback row */}
        <View style={styles.feedbackRow}>
          <TouchableOpacity
            style={[
              styles.thumbButton,
              feedback === "up" && styles.thumbButtonActive,
            ]}
            onPress={handleThumbsUp}
          >
            <Text style={styles.thumbIcon}>👍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.thumbButton,
              feedback === "down" && styles.thumbButtonActive,
            ]}
            onPress={handleThumbsDown}
          >
            <Text style={styles.thumbIcon}>👎</Text>
          </TouchableOpacity>
          {onRecipePress && (
            <TouchableOpacity
              style={styles.recipeButton}
              onPress={onRecipePress}
            >
              <Text style={styles.recipeButtonText}>Recipe</Text>
            </TouchableOpacity>
          )}
          {onChatPress && (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={onChatPress}
            >
              <Text style={styles.chatButtonText}>Ask Ester</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Feedback tags (shown after thumbs down) */}
        {showTags && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>What didn't work?</Text>
            <View style={styles.tagsRow}>
              {FEEDBACK_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagPill,
                    selectedTags.includes(tag.id) && styles.tagPillSelected,
                  ]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag.id) && styles.tagTextSelected,
                    ]}
                  >
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedTags.length > 0 && (
              <TouchableOpacity style={styles.submitButton} onPress={submitFeedback}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// MealCardSlot - Horizontal swipeable container for 3 meal cards
interface MealCardSlotProps {
  meals: Meal[];
  label: string;
  metabolicType?: MetabolicType;
  onMealPress?: (meal: Meal) => void;
  onFeedback?: (mealId: string, feedback: "up" | "down", tags?: string[]) => void;
  onChatPress?: (meal: Meal) => void;
  onRecipePress?: (meal: Meal) => void;
}

export function MealCardSlot({ meals, label, metabolicType, onMealPress, onFeedback, onChatPress, onRecipePress }: MealCardSlotProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + CARD_GAP));
    setActiveIndex(index);
  };

  return (
    <View style={slotStyles.container}>
      <View style={slotStyles.header}>
        <Text style={slotStyles.label}>{label}</Text>
        <View style={slotStyles.dots}>
          {meals.map((_, i) => (
            <View
              key={i}
              style={[slotStyles.dot, i === activeIndex && slotStyles.dotActive]}
            />
          ))}
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        contentContainerStyle={slotStyles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {meals.map((meal) => (
          <View key={meal.id} style={slotStyles.cardWrapper}>
            <MealCard
              meal={meal}
              metabolicType={metabolicType}
              onPress={() => onMealPress?.(meal)}
              onFeedback={(fb, tags) => onFeedback?.(meal.id, fb, tags)}
              onChatPress={onChatPress ? () => onChatPress(meal) : undefined}
              onRecipePress={onRecipePress ? () => onRecipePress(meal) : undefined}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: K.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: K.border,
    width: CARD_WIDTH,
  },
  imageContainer: {
    height: 160,
    backgroundColor: K.bone,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 48,
  },
  prepBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: K.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  prepText: {
    ...typography.caption,
    color: K.brown,
    fontWeight: "600",
  },
  whySection: {
    backgroundColor: K.bone,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  whyHeader: {
    ...typography.caption,
    color: K.ochre,
    fontWeight: "700",
    marginBottom: 2,
  },
  whyExplanation: {
    ...typography.bodySmall,
    color: K.brown,
    fontStyle: "italic",
    lineHeight: 18,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.h3,
    fontSize: 18,
    color: K.brown,
    marginBottom: 4,
  },
  nutritionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nutritionBadge: {
    backgroundColor: K.bone,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  nutritionText: {
    ...typography.caption,
    color: K.brown,
    fontWeight: "500",
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  thumbButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: K.bone,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbButtonActive: {
    backgroundColor: K.ochre,
  },
  thumbIcon: {
    fontSize: 20,
  },
  recipeButton: {
    marginLeft: "auto",
    backgroundColor: K.bone,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: K.brown,
  },
  recipeButtonText: {
    ...typography.caption,
    color: K.brown,
    fontWeight: "600",
  },
  chatButton: {
    backgroundColor: K.blue,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  chatButtonText: {
    ...typography.caption,
    color: K.brown,
    fontWeight: "600",
  },
  tagsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: K.border,
  },
  tagsLabel: {
    ...typography.caption,
    color: K.textMuted,
    marginBottom: spacing.sm,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagPill: {
    backgroundColor: K.bone,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: K.border,
  },
  tagPillSelected: {
    backgroundColor: K.ochre,
    borderColor: K.ochre,
  },
  tagText: {
    ...typography.caption,
    color: K.brown,
  },
  tagTextSelected: {
    fontWeight: "600",
  },
  submitButton: {
    marginTop: spacing.md,
    backgroundColor: K.brown,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  submitText: {
    ...typography.caption,
    color: K.bone,
    fontWeight: "600",
  },
});

const slotStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: K.brown,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: K.border,
  },
  dotActive: {
    backgroundColor: K.ochre,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
});
