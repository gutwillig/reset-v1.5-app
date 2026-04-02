import { useState, useCallback } from "react";
import { NudgeContent, NudgeContentData } from "../components/NudgeSlot";

interface ScanNudgeResult {
  nudge: NudgeContentData | null;
}

const SCAN_STALE_DAYS = 7;

export function useScanNudge(
  onStartScan: () => void,
  scanCount: number,
  lastScanAt: string | null,
): ScanNudgeResult {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (dismissed || scanCount === 0) {
    return { nudge: null };
  }

  // Check if scan is stale
  const daysSinceLastScan = lastScanAt
    ? Math.floor((Date.now() - new Date(lastScanAt).getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  if (daysSinceLastScan < SCAN_STALE_DAYS) {
    return { nudge: null };
  }

  const message = daysSinceLastScan >= 14
    ? `Last scan: ${daysSinceLastScan} days ago. Working from older biological data this week.`
    : "My model is less complete without a recent reading. Quick scan?";

  const nudge = NudgeContent.scanPrompt(onStartScan);
  nudge.message = message;
  nudge._onDismiss = handleDismiss;

  return { nudge };
}
