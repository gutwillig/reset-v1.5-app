import { apiClient } from "./apiClient";

export interface MealWhyResponse {
  text: string;
  cached: boolean;
}

export async function getMealWhy(mealId: string): Promise<MealWhyResponse> {
  return apiClient<MealWhyResponse>(`/api/meals/${mealId}/why`, {
    method: "POST",
  });
}
