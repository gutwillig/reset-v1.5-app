import { useMemo } from "react";

const STALE_HOURS = 24;

export interface BiometricFreshnessResult {
  /** Whether any biometric source has data newer than 24 hours */
  isFresh: boolean;
  /** Hours since the most recent biometric reading, or null if no data */
  hoursSinceUpdate: number | null;
  /** Human-readable label like "2h ago" or "3d ago" */
  ageLabel: string | null;
}

/**
 * Shared freshness gate for biometric data across all surfaces.
 * Accepts timestamps from any biometric source (scan, HealthKit, Oura).
 * Returns whether data is fresh enough to display.
 */
export function useBiometricFreshness(
  ...timestamps: (string | null | undefined)[]
): BiometricFreshnessResult {
  return useMemo(() => {
    const validTimestamps = timestamps
      .filter((t): t is string => !!t)
      .map((t) => new Date(t).getTime())
      .filter((t) => !isNaN(t));

    if (validTimestamps.length === 0) {
      return { isFresh: false, hoursSinceUpdate: null, ageLabel: null };
    }

    const mostRecent = Math.max(...validTimestamps);
    const hoursSinceUpdate = (Date.now() - mostRecent) / (1000 * 60 * 60);
    const isFresh = hoursSinceUpdate < STALE_HOURS;

    let ageLabel: string;
    if (hoursSinceUpdate < 1) {
      ageLabel = "just now";
    } else if (hoursSinceUpdate < 24) {
      ageLabel = `${Math.floor(hoursSinceUpdate)}h ago`;
    } else {
      const days = Math.floor(hoursSinceUpdate / 24);
      ageLabel = `${days}d ago`;
    }

    return { isFresh, hoursSinceUpdate, ageLabel };
  }, [timestamps.join(",")]);
}
