import { Meal } from "../components/MealCard";
import { MetabolicType } from "../constants/colors";

// Meal data organized by metabolic type
export const MEALS_BY_TYPE: Record<MetabolicType, Meal[]> = {
  Burner: [
    {
      id: "burner-breakfast",
      name: "Power Protein Bowl",
      whyLine: "Protein-forward to stabilize your morning and prevent afternoon crashes.",
      calories: 420,
      protein: 28,
      prepTime: 10,
      time: "breakfast",
    },
    {
      id: "burner-lunch",
      name: "Grilled Chicken Salad",
      whyLine: "Balanced macros to carry you through the afternoon slump.",
      calories: 520,
      protein: 42,
      prepTime: 20,
      time: "lunch",
    },
    {
      id: "burner-dinner",
      name: "Salmon & Vegetables",
      whyLine: "Omega-3s to calm stress hormones. Helps you wind down.",
      calories: 580,
      protein: 38,
      prepTime: 30,
      time: "dinner",
    },
    {
      id: "burner-snack",
      name: "Almonds & Apple",
      whyLine: "Quick protein hit without spiking blood sugar.",
      calories: 220,
      protein: 8,
      prepTime: 2,
      time: "snack",
    },
  ],
  Defender: [
    {
      id: "defender-breakfast",
      name: "Overnight Oats",
      whyLine: "Calorie-sufficient — your body needs fuel, not restriction.",
      calories: 380,
      protein: 14,
      prepTime: 5,
      time: "breakfast",
    },
    {
      id: "defender-lunch",
      name: "Mediterranean Bowl",
      whyLine: "Anti-inflammatory. Rebuilds metabolic trust.",
      calories: 480,
      protein: 18,
      prepTime: 15,
      time: "lunch",
    },
    {
      id: "defender-dinner",
      name: "Lean Turkey Stir-fry",
      whyLine: "Steady fuel. Never deficit-framed.",
      calories: 520,
      protein: 32,
      prepTime: 25,
      time: "dinner",
    },
    {
      id: "defender-snack",
      name: "Veggie Sticks & Hummus",
      whyLine: "Satisfying without restriction mindset.",
      calories: 180,
      protein: 6,
      prepTime: 3,
      time: "snack",
    },
  ],
  Restorer: [
    {
      id: "restorer-breakfast",
      name: "Avocado Toast",
      whyLine: "Iron and magnesium to rebuild what's been missing.",
      calories: 360,
      protein: 16,
      prepTime: 10,
      time: "breakfast",
    },
    {
      id: "restorer-lunch",
      name: "Healing Soup Bowl",
      whyLine: "Micronutrient restoration. Never suggest eating less.",
      calories: 340,
      protein: 22,
      prepTime: 20,
      time: "lunch",
    },
    {
      id: "restorer-dinner",
      name: "Baked Cod with Greens",
      whyLine: "Gentle protein. Supports recovery without overwhelming.",
      calories: 440,
      protein: 34,
      prepTime: 25,
      time: "dinner",
    },
    {
      id: "restorer-snack",
      name: "Chamomile & Walnuts",
      whyLine: "Calming nutrients. Supports your rebuild phase.",
      calories: 160,
      protein: 4,
      prepTime: 2,
      time: "snack",
    },
  ],
  Shifter: [
    {
      id: "shifter-breakfast",
      name: "Smoothie Bowl",
      whyLine: "Timed to your cycle. Adaptable portions.",
      calories: 400,
      protein: 12,
      prepTime: 8,
      time: "breakfast",
    },
    {
      id: "shifter-lunch",
      name: "Buddha Bowl",
      whyLine: "Heavier now, lighter next week. Phase-aware.",
      calories: 460,
      protein: 16,
      prepTime: 20,
      time: "lunch",
    },
    {
      id: "shifter-dinner",
      name: "Chicken & Wild Rice",
      whyLine: "Works with your rhythm, not against it.",
      calories: 540,
      protein: 38,
      prepTime: 30,
      time: "dinner",
    },
    {
      id: "shifter-snack",
      name: "Trail Mix",
      whyLine: "Flexible fuel for variable days.",
      calories: 200,
      protein: 6,
      prepTime: 1,
      time: "snack",
    },
  ],
  Explorer: [
    {
      id: "explorer-breakfast",
      name: "Acai Bowl",
      whyLine: "Balanced baseline. I'll learn your pattern from here.",
      calories: 380,
      protein: 8,
      prepTime: 10,
      time: "breakfast",
    },
    {
      id: "explorer-lunch",
      name: "Poke Bowl",
      whyLine: "Clean fuel while I learn your signals.",
      calories: 480,
      protein: 32,
      prepTime: 15,
      time: "lunch",
    },
    {
      id: "explorer-dinner",
      name: "Thai Curry",
      whyLine: "Variety helps me see what works for you.",
      calories: 560,
      protein: 28,
      prepTime: 25,
      time: "dinner",
    },
    {
      id: "explorer-snack",
      name: "Mango & Coconut",
      whyLine: "Light and adaptable. Feedback-responsive.",
      calories: 180,
      protein: 2,
      prepTime: 2,
      time: "snack",
    },
  ],
};

// Get meals for a specific type
export function getMealsForType(type: MetabolicType): Meal[] {
  return MEALS_BY_TYPE[type] || MEALS_BY_TYPE.Explorer;
}

// Get daily meals (breakfast, lunch, dinner) for a type
export function getDailyMeals(type: MetabolicType): Meal[] {
  const meals = getMealsForType(type);
  return meals.filter((meal) => meal.time !== "snack");
}

// Get snacks for a type
export function getSnacks(type: MetabolicType): Meal[] {
  const meals = getMealsForType(type);
  return meals.filter((meal) => meal.time === "snack");
}
