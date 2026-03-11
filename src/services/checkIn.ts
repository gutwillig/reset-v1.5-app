import { apiClient } from "./apiClient";

export interface CheckInPayload {
  energy: string;
  stressTags: string[];
  sleepHours?: number;
  sleepQuality?: string;
}

export interface CheckInResponse {
  message: string;
  checkIn: {
    id: string;
    date: string;
    energy: string;
    stressTags: string[];
    sleepHours: number | null;
    sleepQuality: string | null;
  };
  confidenceLayer2: number;
}

export async function submitCheckIn(
  data: CheckInPayload,
): Promise<CheckInResponse> {
  return apiClient<CheckInResponse>("/api/check-in", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTodayCheckIn() {
  return apiClient<{ checkIn: CheckInResponse["checkIn"] | null }>(
    "/api/check-in/today",
  );
}
