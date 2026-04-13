export type DayPart = "morning" | "afternoon" | "evening";

export const DAY_PART_THRESHOLDS = {
  MORNING_END_HOUR: 11,
  AFTERNOON_END_HOUR: 17,
} as const;

export function getCurrentDayPart(now: Date = new Date()): DayPart {
  const hour = now.getHours();
  if (hour < DAY_PART_THRESHOLDS.MORNING_END_HOUR) return "morning";
  if (hour < DAY_PART_THRESHOLDS.AFTERNOON_END_HOUR) return "afternoon";
  return "evening";
}
