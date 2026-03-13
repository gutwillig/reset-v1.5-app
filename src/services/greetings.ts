import { MetabolicType } from "../constants/colors";
import { TYPE_CONFIGS } from "../constants/types";

interface GreetingContext {
  metabolicType: MetabolicType;
  hasScan: boolean;
  dayNumber: number;
  userName?: string;
}

// Deterministic daily index — same value all day, changes with the date
function dailyIndex(count: number): number {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % count;
}

// Time-of-day prefix
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Day 1 greetings — first impression after onboarding
function getDay1Greeting(ctx: GreetingContext): string {
  const type = TYPE_CONFIGS[ctx.metabolicType];
  if (ctx.hasScan) {
    return `I've seen your scan. ${type.whyLineSeed} Let's start here.`;
  }
  return `Based on what you told me, I think I know what's happening. ${type.whyLineSeed}`;
}

// Day 2–4 greetings — behavioral discovery arc (skip users)
function getEarlyDayGreeting(ctx: GreetingContext): string {
  const lines: Record<number, string[]> = {
    2: [
      "Day 2. I'm watching how your body responds to yesterday's meals.",
      "Back again. That's the pattern I need to see.",
      "Day 2 — your feedback from yesterday is already shaping today's plan.",
    ],
    3: [
      "Three days in. I'm starting to see your rhythm.",
      "Day 3. Your pattern is getting clearer.",
      "I've got three days of data now. Here's what I'm noticing.",
    ],
    4: [
      "Day 4. Your body is settling into a rhythm I can work with.",
      "Four days. Enough to stop guessing, start knowing.",
      "I've seen enough to start getting specific.",
    ],
  };

  const dayLines = lines[ctx.dayNumber] || lines[4];
  return dayLines[dailyIndex(dayLines.length)];
}

// Day 5–7 greetings — building confidence
function getMidWeekGreeting(ctx: GreetingContext): string {
  const type = TYPE_CONFIGS[ctx.metabolicType];
  const lines = [
    `Your ${type.name.toLowerCase()} pattern is holding. Today's plan is dialed in.`,
    "Almost a full week. Your data is telling a clear story now.",
    `I'm getting confident in your pattern. Today's meals are tuned for a ${type.name.toLowerCase()}.`,
  ];
  return lines[dailyIndex(lines.length)];
}

// Day 8+ greetings
function getOngoingGreeting(ctx: GreetingContext): string {
  const type = TYPE_CONFIGS[ctx.metabolicType];
  if (ctx.hasScan) {
    // Pro users get cross-day pattern references
    const lines = [
      `Your signals are trending well. Today's plan builds on that.`,
      `I see the pattern from this week. Adjusting today's meals accordingly.`,
      `Your ${type.signals.stress} stress signal is informing today's plan.`,
    ];
    return lines[dailyIndex(lines.length)];
  }

  // Free users get single bucket-level line
  return type.whyLineSeed;
}

// Main greeting generator
export function generateGreeting(ctx: GreetingContext): {
  timeGreeting: string;
  message: string;
} {
  const timeGreeting = getTimeGreeting();

  let message: string;

  if (ctx.dayNumber <= 1) {
    message = getDay1Greeting(ctx);
  } else if (ctx.dayNumber <= 4) {
    message = getEarlyDayGreeting(ctx);
  } else if (ctx.dayNumber <= 7) {
    message = getMidWeekGreeting(ctx);
  } else {
    message = getOngoingGreeting(ctx);
  }

  return { timeGreeting, message };
}

// Calculate day number from account creation date
export function getDayNumber(createdAt?: string): number {
  if (!createdAt) return 1;
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1); // Day 1 = creation day
}
