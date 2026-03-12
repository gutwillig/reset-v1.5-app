import { updateProfile } from "./profile";
import { TYPE_CONFIGS } from "../constants/types";
import type { MetabolicType } from "../constants/colors";

// Q1×Q2 matrix → secondary bucket
const SECONDARY_BUCKET: Record<string, Record<string, MetabolicType>> = {
  afternoon_evening: {
    crash: "Restorer",  // Burner primary → Restorer secondary
    drift: "Explorer",  // Defender primary → Explorer secondary
  },
  random: {
    crash: "Shifter",   // Restorer primary → Shifter secondary
    drift: "Shifter",   // Explorer primary → Shifter secondary
  },
};

/**
 * Push all onboarding data to backend profile after account creation.
 * Call this after successful registration/login during onboarding.
 */
export async function syncOnboardingToBackend(params: {
  metabolicType?: MetabolicType;
  quizAnswers: Record<string, string>;
  tastePreferences: string[];
  dietaryRestrictions: string[];
}): Promise<void> {
  const { metabolicType, quizAnswers, tastePreferences, dietaryRestrictions } = params;

  const q1 = quizAnswers.q1 as string | undefined;
  const q2 = quizAnswers.q2 as string | undefined;

  // Derive secondary bucket from Q1×Q2 matrix
  const secondaryBucket =
    q1 && q2 ? SECONDARY_BUCKET[q1]?.[q2] ?? null : null;

  // Derive energy pattern and craving type from type config
  const typeConfig = metabolicType ? TYPE_CONFIGS[metabolicType] : null;

  await updateProfile({
    primaryBucket: metabolicType ?? undefined,
    secondaryBucket: secondaryBucket ?? undefined,
    energyPattern: typeConfig?.signals.energy ?? undefined,
    cravingType: typeConfig?.internalBucket ?? undefined,
    dietaryRestrictions,
    tasteCluster: tastePreferences[0] ?? undefined, // First selection is primary cluster
    quizAnswers,
    onboardingStep: "Account",
    onboardingComplete: true,
  });
}
