import { apiClient } from "./apiClient";

export interface Layer1 {
  primaryBucket: string | null;
  secondaryBucket: string | null;
  energyPattern: string | null;
  cravingType: string | null;
  dietaryRestrictions: string[];
  tasteCluster: string | null;
}

export interface Layer2 {
  energyLog: { date: string; energy: string }[];
  stressTags: { date: string; tags: string[] }[];
  sleepLog: { date: string; hours: number | null; quality: string | null }[];
  mealFeedback: any[];
  timingConsistency: number;
  planAdherence: number;
  confidenceLayer2: number;
}

export interface Layer3 {
  scanHistory: any[];
  latestScan: any | null;
  biometricTrend: string | null;
  scanCount: number;
  confidenceLayer3: number;
}

export interface Confidence {
  layer1: number;
  layer2: number;
  layer3: number;
  composite: number;
  esterTier: "Pattern Acknowledgment" | "Observation" | "Interpretation" | "Prediction";
}

export interface OnboardingState {
  quizAnswers: Record<string, string>;
  onboardingStep: string | null;
  onboardingComplete: boolean;
}

export interface UserProfile {
  userId: string;
  layer1: Layer1;
  layer2: Layer2;
  layer3: Layer3;
  confidence: Confidence;
  onboarding: OnboardingState;
}

export async function getProfile(): Promise<UserProfile> {
  return apiClient<UserProfile>("/api/profile");
}

export interface UpdateProfileData {
  primaryBucket?: string;
  secondaryBucket?: string;
  energyPattern?: string;
  cravingType?: string;
  dietaryRestrictions?: string[];
  tasteCluster?: string;
  quizAnswers?: Record<string, string>;
  onboardingStep?: string;
  onboardingComplete?: boolean;
}

export async function updateProfile(
  data: UpdateProfileData,
): Promise<{ message: string }> {
  return apiClient("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
