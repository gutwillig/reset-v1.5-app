import { MetabolicType } from "./colors";

export interface TypeConfig {
  name: MetabolicType;
  internalBucket: string;
  title: string;
  tagline: string;
  description: string;
  corePhilosophy: string;
  whyLineSeed: string;
  traits: string[];
  signals: {
    stress: "high" | "moderate" | "low";
    energy: "fluctuating" | "stable" | "building";
    recovery: "fast" | "moderate" | "slow";
  };
}

export const TYPE_CONFIGS: Record<MetabolicType, TypeConfig> = {
  Burner: {
    name: "Burner",
    internalBucket: "Stress-Driven",
    title: "The Burner",
    tagline: "Your metabolism runs hot under stress.",
    description: "Your body burns energy fast when stressed. Protein-forward meals stabilize your afternoon and prevent the crash that shapes your hunger.",
    corePhilosophy: "Protein-forward, anti-cortisol, never skip meals",
    whyLineSeed: "Protein-forward to stabilize your afternoon.",
    traits: ["Fast metabolism", "Afternoon energy dips", "Stress-driven eating"],
    signals: {
      stress: "high",
      energy: "fluctuating",
      recovery: "fast",
    },
  },
  Rebounder: {
    name: "Rebounder",
    internalBucket: "Rebounder",
    title: "The Rebounder",
    tagline: "Your body learned to fight back against restriction.",
    description: "Your metabolism has adapted to protect itself. Calorie-sufficient meals help your metabolism find its rhythm again — never deficit-framed.",
    corePhilosophy: "Calorie-sufficient, NEVER deficit-framed",
    whyLineSeed: "Calorie-sufficient — your body needs fuel, not restriction.",
    traits: ["Protective metabolism", "Steady energy needs", "Recovery-focused"],
    signals: {
      stress: "moderate",
      energy: "stable",
      recovery: "moderate",
    },
  },
  Ember: {
    name: "Ember",
    internalBucket: "Depleted",
    title: "The Ember",
    tagline: "Your body needs to rebuild what's been missing.",
    description: "Your system's been stretched thin. It needs consistent micronutrient support — never suggest eating less.",
    corePhilosophy: "Micronutrient restoration, never suggest eating less",
    whyLineSeed: "Iron and magnesium to rebuild what's been missing.",
    traits: ["Nutrient-depleted", "Low baseline energy", "Recovery-focused"],
    signals: {
      stress: "low",
      energy: "building",
      recovery: "slow",
    },
  },
  Chameleon: {
    name: "Chameleon",
    internalBucket: "Cycler",
    title: "The Chameleon",
    tagline: "Your metabolism follows its own rhythm.",
    description: "Your body responds to natural cycles. Phase-aware, rhythm-based meal timing works with your biology, not against it.",
    corePhilosophy: "Phase-aware, rhythm-based meal timing",
    whyLineSeed: "Timed to your cycle. Heavier now, lighter next week.",
    traits: ["Cyclical patterns", "Variable hunger", "Rhythm-sensitive"],
    signals: {
      stress: "moderate",
      energy: "fluctuating",
      recovery: "moderate",
    },
  },
  Explorer: {
    name: "Explorer",
    internalBucket: "Unstructured",
    title: "The Explorer",
    tagline: "Your signals are quiet — easier for me to read.",
    description: "Your metabolic signals aren't loud yet. A balanced baseline lets me learn your pattern fast from your feedback.",
    corePhilosophy: "Balanced baseline, learn fast from feedback",
    whyLineSeed: "Balanced baseline. I'll learn your pattern from here.",
    traits: ["Quiet signals", "Adaptable metabolism", "Feedback-responsive"],
    signals: {
      stress: "low",
      energy: "stable",
      recovery: "fast",
    },
  },
};

// Quiz state for tracking answers and branching
export interface QuizState {
  q1: "afternoon_evening" | "random" | null;
  q2: "crash" | "drift" | null;
}

// Cold Read Question 1: The Mirror
export const QUIZ_Q1 = {
  id: "q1",
  esterPrompt: "When your eating goes off track, does it usually happen in the afternoon/evening, or is it more random?",
  options: [
    { id: "afternoon_evening", label: "Afternoon / evening", value: "afternoon_evening" },
    { id: "random", label: "Random", value: "random" },
  ],
};

// Cold Read Question 2: The Twist (depends on Q1)
export function getQuizQ2(q1Answer: "afternoon_evening" | "random") {
  const bridges: Record<string, { bridge: string; options: typeof QUIZ_Q1.options }> = {
    afternoon_evening: {
      bridge: "That pattern usually means your body is running out of fuel — not willpower, fuel. Does it feel like a crash or more of a drift?",
      options: [
        { id: "crash", label: "I crash hard", value: "crash" },
        { id: "drift", label: "I drift into it", value: "drift" },
      ],
    },
    random: {
      bridge: "Unpredictable crashes usually mean your body isn't holding fuel well. Does it hit suddenly or is it more gradual?",
      options: [
        { id: "crash", label: "Hits suddenly", value: "crash" },
        { id: "drift", label: "More gradual", value: "drift" },
      ],
    },
  };

  return {
    id: "q2",
    esterPrompt: bridges[q1Answer].bridge,
    options: bridges[q1Answer].options,
  };
}

// Cold Read Question 3: The Setup (depends on Q1 + Q2)
export function getQuizQ3Setup(q1: "afternoon_evening" | "random", q2: "crash" | "drift") {
  const setups: Record<string, Record<string, string>> = {
    afternoon_evening: {
      crash: "I think your body is sending a stress signal that's shaping your hunger. I can tell you more — but I'd need to see it to be sure.",
      drift: "There's a pattern driving your evening eating. It's metabolic, not emotional. I'd need to see it to be sure.",
    },
    random: {
      crash: "Something metabolic is leaking energy at irregular intervals. I can tell you more — but I'd need to see it.",
      drift: "Your signals are quiet, which makes it harder for you to read but easier for me. I'd need to see it to be sure.",
    },
  };

  return setups[q1][q2];
}

// Type determination based on quiz answers (4 paths)
export function determineType(q1: "afternoon_evening" | "random", q2: "crash" | "drift"): MetabolicType {
  // Path mapping based on spec:
  // afternoon_evening + crash → Burner or Ember
  // afternoon_evening + drift → Rebounder or Explorer
  // random + crash → Ember or Chameleon
  // random + drift → Explorer or Chameleon

  if (q1 === "afternoon_evening") {
    if (q2 === "crash") {
      return "Burner";
    } else {
      return "Rebounder";
    }
  } else {
    // random
    if (q2 === "crash") {
      return "Ember";
    } else {
      return "Explorer";
    }
  }
}

// Get reveal text based on quiz path
export function getTypeRevealText(q1: "afternoon_evening" | "random", q2: "crash" | "drift", hasScan: boolean): string {
  if (hasScan) {
    if (q1 === "afternoon_evening" && q2 === "crash") {
      return "Your stress pattern is running high, and your energy's reacting to it. I know how to feed you.";
    }
    if (q1 === "afternoon_evening" && q2 === "drift") {
      return "Your scan confirms it — your body has learned to expect fuel at certain times. That gradual pull isn't hunger, it's metabolic memory.";
    }
    if (q1 === "random" && q2 === "crash") {
      return "Your energy's coming in waves right now. I'll smooth that out through how you eat.";
    }
    return "Your signals are quiet on the scan too — which actually makes my job easier. I can see the baseline clearly now.";
  }

  // Quiz-only reveal
  if (q1 === "afternoon_evening" && q2 === "crash") {
    return "Your pattern suggests your body is running hot under stress. The crashes aren't willpower — they're metabolic.";
  }
  if (q1 === "afternoon_evening" && q2 === "drift") {
    return "Your pattern suggests your body has been defending against restriction. It's metabolic, not emotional.";
  }
  if (q1 === "random" && q2 === "crash") {
    return "Your pattern suggests energy is leaking at irregular intervals. Your body isn't holding fuel as well as it could.";
  }
  return "Your signals are quiet — which makes it easier for me to learn your pattern. I'll adapt quickly from your feedback.";
}

// Taste clusters (4 options in 2x2 grid)
import type { ImageSourcePropType } from "react-native";

export interface TasteCluster {
  id: string;
  name: string;
  characteristics: string;
  image: ImageSourcePropType;
}

export const TASTE_CLUSTERS: TasteCluster[] = [
  {
    id: "comfort",
    name: "Chicken Pesto Pasta",
    characteristics: "Higher density, carb-inclusive, warm, familiar",
    image: require("../../assets/taste-clusters/comfort.jpg"),
  },
  {
    id: "fresh",
    name: "Grilled Salmon Bowl",
    characteristics: "Lower density, vegetable-led, light preparations",
    image: require("../../assets/taste-clusters/fresh.jpg"),
  },
  {
    id: "simple",
    name: "Chicken + Sweet Potato",
    characteristics: "Minimal ingredients (≤5), common proteins",
    image: require("../../assets/taste-clusters/simple.jpg"),
  },
  {
    id: "adventurous",
    name: "Miso Chicken Wraps",
    characteristics: "Complex flavors, international, unusual ingredients",
    image: require("../../assets/taste-clusters/adventurous.jpg"),
  },
];

// Dietary restrictions (inline pills)
export const DIETARY_RESTRICTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-free" },
  { id: "dairy_free", label: "Dairy-free" },
  { id: "nut_allergy", label: "Nut allergy" },
  { id: "shellfish", label: "Shellfish" },
  { id: "none", label: "None" },
];

// Confidence tiers
export const CONFIDENCE_TIERS = {
  PATTERN_ACK: { min: 35, max: 45, name: "Pattern Acknowledgment" },
  OBSERVATION: { min: 46, max: 65, name: "Observation" },
  INTERPRETATION: { min: 66, max: 80, name: "Interpretation" },
  PREDICTION: { min: 81, max: 100, name: "Prediction" },
};

export function getConfidenceTier(confidence: number) {
  if (confidence <= 45) return CONFIDENCE_TIERS.PATTERN_ACK;
  if (confidence <= 65) return CONFIDENCE_TIERS.OBSERVATION;
  if (confidence <= 80) return CONFIDENCE_TIERS.INTERPRETATION;
  return CONFIDENCE_TIERS.PREDICTION;
}
