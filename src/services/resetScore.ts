import { apiClient } from "./apiClient";

export interface ResetScore {
  score: number;
  date: string;
  scanComponent: number;
  checkInComponent: number;
  baselineScore: number;
  previousDayScore: number | null;
  confidence: number;
  archetype: string;
}

export interface ResetScoreResponse {
  status: "active" | "pending";
  score?: ResetScore;
  message?: string;
}

export async function getResetScore(): Promise<ResetScoreResponse> {
  return apiClient<ResetScoreResponse>("/api/reset-score");
}
