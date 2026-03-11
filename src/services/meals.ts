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
