import { apiClient } from "./apiClient";

export interface ScanInsightsMealItem {
  name: string;
  whyLine?: string | null;
}

export interface ScanInsightsMealSlots {
  breakfast?: ScanInsightsMealItem[];
  lunch?: ScanInsightsMealItem[];
  dinner?: ScanInsightsMealItem[];
}

export interface ScanInsightsMessage {
  text: string;
  cached: boolean;
  scannedAt: string | null;
}

export async function getScanInsightsMessage(
  mealSlots?: ScanInsightsMealSlots,
): Promise<ScanInsightsMessage> {
  return apiClient<ScanInsightsMessage>("/api/profile/scan-insights/message", {
    method: "POST",
    body: JSON.stringify({ mealSlots: mealSlots ?? null }),
  });
}
