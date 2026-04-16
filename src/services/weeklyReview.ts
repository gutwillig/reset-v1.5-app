import { apiClient } from "./apiClient";

export interface WeeklyReviewSummary {
  checkInCount: number;
  totalSignals: number;
  usedSignals: number;
  scoreStart: number | null;
  scoreEnd: number | null;
  scoreTrend: "up" | "down" | "stable" | "insufficient";
  confidencePercent: number;
}

export interface WeeklyReviewData {
  summary: WeeklyReviewSummary;
  energy: {
    dominant: string | null;
    distribution: Record<string, number>;
  };
  stress: {
    topTags: string[];
    totalOccurrences: number;
  };
  sleep: {
    avgHours: number | null;
    dominantQuality: string | null;
  };
  meals: {
    thumbsUp: number;
    thumbsDown: number;
    mealsEaten: number;
    mealsPlanned: number;
    topFeedbackTags: string[];
  };
  weeklyInsight: string | null;
  metabolicType: string;
  scanPromptShown: boolean;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string;
  tier: "trial" | "free" | "pro";
  dayNumber: number;
  data: WeeklyReviewData;
  createdAt: string;
}

export async function getLatestWeeklyReview(): Promise<WeeklyReview | null> {
  return apiClient<WeeklyReview | null>(
    "/api/notifications/weekly-review/latest",
  );
}
