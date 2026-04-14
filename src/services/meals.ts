import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "./apiClient";

const FAVORITES_KEY = "@reset_meal_favorites";

// --- Local favorites (used with mock meal data) ---

export async function getLocalFavorites(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return new Set();
  return new Set(JSON.parse(raw) as string[]);
}

export async function toggleLocalFavorite(mealId: string): Promise<boolean> {
  const favorites = await getLocalFavorites();
  const isFavorited = favorites.has(mealId);
  if (isFavorited) {
    favorites.delete(mealId);
  } else {
    favorites.add(mealId);
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  return !isFavorited;
}

// --- Backend favorites (for use when meals come from the API) ---

export interface MealFavorite {
  id: string;
  name: string;
  imageAsset: string | null;
  description: string | null;
  prepTime: number | null;
  ingredients: number;
  isBreakfast: boolean;
  isLunch: boolean;
  isDinner: boolean;
  calories: number | null;
  protein: number | null;
  primaryProtein: string | null;
  cuisineCluster: string | null;
  inflammatoryIndex: string | null;
}

export async function addFavorite(mealId: string): Promise<void> {
  await apiClient("/api/meals/favorites", {
    method: "POST",
    body: JSON.stringify({ mealId }),
  });
}

export async function removeFavorite(mealId: string): Promise<void> {
  await apiClient(`/api/meals/favorites/${mealId}`, {
    method: "DELETE",
  });
}

export async function getFavorites(
  mealType?: "breakfast" | "lunch" | "dinner",
): Promise<MealFavorite[]> {
  const params = mealType ? `?mealType=${mealType}` : "";
  return apiClient<MealFavorite[]>(`/api/meals/favorites${params}`);
}

// --- Daily Meal Plan API ---

export interface DailyPlanMeal {
  id: string;
  name: string;
  whyLine: string;
  calories: number;
  protein: number;
  prepTime: number;
  time: "breakfast" | "lunch" | "dinner" | "snack";
  imageUrl?: string;
  iliScore?: number;
  inflammatoryIndex?: "pro" | "neutral" | "anti";
  foodQuality?: "whole" | "minimally_processed" | "ultra_processed";
  primaryProtein?: string;
  cuisineCluster?: string;
}

export interface SignalAdjustments {
  stress: boolean;
  sleep: boolean;
  energy: boolean;
}

export interface DailyPlan {
  id: string;
  date: string;
  metabolicType: string;
  cyclePhase?: string;
  breakfast: DailyPlanMeal[];
  lunch: DailyPlanMeal[];
  dinner: DailyPlanMeal[];
  snack?: DailyPlanMeal;
  signalAdjustments?: SignalAdjustments;
}

const DAILY_PLAN_CACHE_KEY = "@reset_daily_plan";

export async function getDailyPlan(date?: string): Promise<DailyPlan> {
  const dateParam = date || new Date().toISOString().split("T")[0];
  return apiClient<DailyPlan>(`/api/meals/daily-plan?date=${dateParam}`);
}

export async function refreshDailyPlan(): Promise<DailyPlan> {
  return apiClient<DailyPlan>("/api/meals/daily-plan/refresh", {
    method: "POST",
  });
}

export async function getTomorrowPlan(): Promise<DailyPlan> {
  return apiClient<DailyPlan>("/api/meals/daily-plan/tomorrow");
}

export async function replaceMealInSlot(
  planId: string,
  slot: string,
  excludeMealIds: string[],
  replaceMealId: string,
): Promise<DailyPlan> {
  return apiClient<DailyPlan>("/api/meals/daily-plan/replace", {
    method: "POST",
    body: JSON.stringify({ planId, slot, excludeMealIds, replaceMealId }),
  });
}

// --- Meal Detail API ---

export interface MealDetail {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  imageAsset: string | null;
  prepTime: number | null;
  cookTimeMinutes: number | null;
  readyInMinutes: number | null;
  servingsMin: number | null;
  calories: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  carbsGrams: number | null;
  fiberGrams: number | null;
}

export interface MealIngredient {
  id: string;
  quantity: number;
  measurement: string;
  representText: string | null;
  ingredient: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

export async function getMealDetail(mealId: string): Promise<MealDetail> {
  return apiClient<MealDetail>(`/api/meals/${mealId}`);
}

export async function getMealIngredients(
  mealId: string,
): Promise<MealIngredient[]> {
  return apiClient<MealIngredient[]>(`/api/meals/${mealId}/ingredients`);
}

// --- Meal Feedback API ---

export interface MealFeedbackPayload {
  mealId: string;
  planId?: string;
  slot: string;
  feedback: "up" | "down";
  tags?: string[];
  freeText?: string;
}

export async function submitMealFeedback(
  payload: MealFeedbackPayload,
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/api/meals/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeMealFeedback(mealId: string): Promise<void> {
  await apiClient(`/api/meals/feedback/${mealId}`, { method: "DELETE" });
}

export async function getMealFeedback(
  mealIds: string[],
): Promise<Record<string, { feedback: "up" | "down"; tags: string[] }>> {
  if (mealIds.length === 0) return {};
  return apiClient<Record<string, { feedback: "up" | "down"; tags: string[] }>>(
    `/api/meals/feedback?mealIds=${mealIds.join(",")}`,
  );
}

// --- Daily Plan Offline Cache ---

export async function cacheDailyPlan(plan: DailyPlan): Promise<void> {
  await AsyncStorage.setItem(DAILY_PLAN_CACHE_KEY, JSON.stringify(plan));
}

export async function getCachedDailyPlan(): Promise<DailyPlan | null> {
  const raw = await AsyncStorage.getItem(DAILY_PLAN_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DailyPlan;
  } catch {
    return null;
  }
}
