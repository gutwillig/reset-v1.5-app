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
  esterResponse: string;
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

export interface CheckInEntry {
  id: string;
  date: string;
  // ISO datetime when the check-in was submitted; preferred over `date` for
  // display because `date` is YYYY-MM-DD only.
  createdAt?: string;
  energy: string;
  stressTags: string[];
  sleepHours: number | null;
  sleepQuality: string | null;
}

export async function getCheckInHistory(
  limit = 30,
): Promise<CheckInEntry[]> {
  const res = await apiClient<{ checkIns: CheckInEntry[] }>(
    `/api/check-in/history?limit=${limit}`,
  );
  return res.checkIns ?? [];
}
