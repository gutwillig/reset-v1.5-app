import { useState, useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { getYapEligibility, dismissYap, YapEligibility } from "../services/yap";
import { NudgeContent } from "../components/NudgeSlot";

interface YapNudgeResult {
  nudge: ReturnType<typeof NudgeContent.yapSession> | null;
  yapSessionId: string | null;
  loading: boolean;
}

export function useYapNudge(
  onStartYap: (yapSessionId: string) => void,
): YapNudgeResult {
  const [eligibility, setEligibility] = useState<YapEligibility | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkEligibility = useCallback(async () => {
    try {
      const result = await getYapEligibility();
      setEligibility(result);
    } catch {
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  // Re-check when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkEligibility();
      }
    });
    return () => sub.remove();
  }, [checkEligibility]);

  const handleDismiss = useCallback(async () => {
    if (eligibility?.yapSessionId) {
      setDismissed(true);
      await dismissYap(eligibility.yapSessionId);
    }
  }, [eligibility]);

  const handleStart = useCallback(() => {
    if (eligibility?.yapSessionId) {
      onStartYap(eligibility.yapSessionId);
    }
  }, [eligibility, onStartYap]);

  if (
    !eligibility?.eligible ||
    dismissed ||
    !eligibility.nudgeCopy ||
    !eligibility.yapSessionId
  ) {
    return { nudge: null, yapSessionId: null, loading };
  }

  const nudge = NudgeContent.yapSession(
    handleStart,
    eligibility.nudgeCopy.message,
  );
  // Override dismiss handler
  nudge._onDismiss = handleDismiss;

  return {
    nudge,
    yapSessionId: eligibility.yapSessionId,
    loading,
  };
}
