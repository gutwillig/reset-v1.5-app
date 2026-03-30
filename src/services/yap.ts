import { apiClient } from "./apiClient";

export interface YapEligibility {
  eligible: boolean;
  yapSessionId?: string;
  nudgeCopy?: {
    title: string;
    message: string;
    isReprompt: boolean;
  };
  heldUntil?: string;
}

export async function getYapEligibility(): Promise<YapEligibility> {
  return apiClient<YapEligibility>("/api/yap/eligibility");
}

export async function dismissYap(yapSessionId: string): Promise<void> {
  await apiClient("/api/yap/dismiss", {
    method: "POST",
    body: JSON.stringify({ yapSessionId }),
  });
}

export interface YapStartResult {
  success: boolean;
  accessToken: string;
  yapSessionId: string;
}

export async function startYapSession(
  yapSessionId: string,
): Promise<YapStartResult> {
  return apiClient<YapStartResult>("/api/yap/start", {
    method: "POST",
    body: JSON.stringify({ yapSessionId }),
  });
}
