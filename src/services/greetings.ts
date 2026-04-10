import { MetabolicType } from "../constants/colors";
import { TYPE_CONFIGS } from "../constants/types";

// ---------- Types ----------

export interface GreetingContext {
  // Core (from AppContext)
  metabolicType: MetabolicType;
  hasScan: boolean;
  dayNumber: number;
  userName?: string;

  // From profile API
  checkInCount: number;
  latestEnergy: string | null;
  latestStressTags: string[];
  latestSleepQuality: string | null;
  latestSleepHours: number | null;
  scanCount: number;
  latestScan: Record<string, any> | null;
  esterTier: string;
  compositeConfidence: number;

  // Recency timestamps (ISO strings)
  lastCheckInAt: string | null;
  lastScanAt: string | null;

  // Derived
  daysSinceLastCheckIn: number | null;
  isGlanceOnly: boolean;
  lapseTier: 0 | 1 | 2 | 3 | 4;
  mealFeedbackCount: number;
}

export interface GreetingResult {
  nameGreeting: string;
  message: string;
  embedAction?: "energy_checkin";
}

// ---------- Banned opener guard ----------

const BANNED_PREFIXES = [
  "Good morning",
  "Good afternoon",
  "Good evening",
  "Welcome back",
  "How are you today",
  "Let's have a great day",
];

/** Banned phrases that must never appear in any greeting (PRD 16.4). */
const BANNED_GREETING_PHRASES = [
  "great job",
  "good work",
  "good job",
  "cheat day",
  "bad food",
  "get back on track",
  "we missed you",
  "you've been away",
  "you've been gone",
  "low cal",
  "low-cal",
  "clean eating",
  "guilt-free",
  "goal weight",
  "target weight",
  "before and after",
  "bmi",
  "body mass index",
  "body fat %",
  "body fat percentage",
  "body shape index",
  "body roundness index",
  "waist-to-height ratio",
  "conicity index",
];

function validateNoBannedOpener(text: string): void {
  const lower = text.toLowerCase();
  for (const prefix of BANNED_PREFIXES) {
    if (lower.startsWith(prefix.toLowerCase())) {
      console.warn(
        `[Greeting] Banned opener detected: "${text.slice(0, 30)}…"`,
      );
    }
  }
  for (const phrase of BANNED_GREETING_PHRASES) {
    if (lower.includes(phrase)) {
      console.warn(
        `[Greeting] Banned phrase detected: "${phrase}" in "${text.slice(0, 50)}…"`,
      );
    }
  }
}

// ---------- Deterministic daily index ----------

function dailyIndex(count: number): number {
  const today = new Date().toISOString().split("T")[0];
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % count;
}

// ---------- Lapse detection ----------

export function detectLapseTier(
  daysSinceLastCheckIn: number | null,
): 0 | 1 | 2 | 3 | 4 {
  if (daysSinceLastCheckIn === null) return 0;
  if (daysSinceLastCheckIn <= 1) return 0;
  if (daysSinceLastCheckIn <= 3) return 1;
  if (daysSinceLastCheckIn <= 7) return 2;
  if (daysSinceLastCheckIn <= 14) return 3;
  return 4;
}

export function computeDaysSinceLastCheckIn(
  checkInHistory: { date: string }[],
): number | null {
  if (checkInHistory.length === 0) return null;
  const latest = new Date(checkInHistory[0].date);
  const now = new Date();
  const diffMs = now.getTime() - latest.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ---------- Confidence tier language ----------

const TIER_LANGUAGE: Record<string, { prefix: string; verb: string }> = {
  "Pattern Acknowledgment": {
    prefix: "It looks like",
    verb: "I notice",
  },
  Observation: {
    prefix: "Your",
    verb: "I see that",
  },
  Interpretation: {
    prefix: "Your",
    verb: "Because of",
  },
  Prediction: {
    prefix: "If this holds,",
    verb: "Based on your pattern,",
  },
};

// ---------- Scan metric helpers ----------

function scanVal(scan: Record<string, any> | null, key: string): string | null {
  if (!scan) return null;
  const val = scan[key];
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return String(Math.round(val));
  return String(val);
}

// ---------- Lapse greetings ----------

function getLapseGreeting(ctx: GreetingContext): GreetingResult {
  const type = TYPE_CONFIGS[ctx.metabolicType];

  const messages: Record<1 | 2 | 3 | 4, string[]> = {
    1: [
      `Missed a couple days. Your ${type.name.toLowerCase()} pattern doesn't reset that fast — picking up where we left off.`,
      `Two days off. Your rhythm is still there. Let's keep going.`,
    ],
    2: [
      `It's been about a week. Your pattern shifted a bit — one check-in brings me back up to speed.`,
      `A week away. Your body kept its rhythm — I just need to catch up.`,
    ],
    3: [
      `Two weeks since I last heard from you. I'm working from older data now — a check-in would sharpen things.`,
      `It's been a stretch. I still know your type, but your current state is fuzzy.`,
    ],
    4: [
      `It's been a while. I won't pretend to know your pattern. One check-in and I'll recalibrate.`,
      `Long time. Your data is stale — but one check-in is all I need to start fresh.`,
    ],
  };

  const tier = ctx.lapseTier as 1 | 2 | 3 | 4;
  const lines = messages[tier];
  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message: lines[dailyIndex(lines.length)],
  };
}

// ---------- Glance-only greeting ----------

function getGlanceOnlyGreeting(ctx: GreetingContext): GreetingResult {
  const lines = [
    "Your lunches this week were built for your afternoon pattern. Did they help?",
    "I've been tuning your meals based on your type. A quick check-in tells me if it's working.",
    "Five days of meals, zero signals from you. One tap tells me a lot.",
  ];
  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message: lines[dailyIndex(lines.length)],
    embedAction: "energy_checkin",
  };
}

// ---------- Scan day greetings ----------

function getScanDay1Greeting(ctx: GreetingContext): GreetingResult {
  const type = TYPE_CONFIGS[ctx.metabolicType];
  const stressIndex = scanVal(ctx.latestScan, "stressIndex");
  const heartRate = scanVal(ctx.latestScan, "heartRate");
  const wellness = scanVal(ctx.latestScan, "wellnessIndex");

  let message: string;
  if (stressIndex) {
    message = `Your stress index is ${stressIndex}. That confirms what your quiz suggested — your body runs ${type.signals.stress === "high" ? "hot" : "steady"}.`;
  } else if (heartRate) {
    message = `Resting at ${heartRate} bpm. Combined with your quiz answers, I can see how your body manages fuel.`;
  } else if (wellness) {
    message = `Wellness score of ${wellness}. ${type.whyLineSeed}`;
  } else {
    message = `I've seen your scan. ${type.whyLineSeed} Let's start here.`;
  }

  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message,
  };
}

function getScanDay2Greeting(ctx: GreetingContext): GreetingResult {
  const parasympathetic = scanVal(ctx.latestScan, "parasympatheticActivity");
  const recoveryScore = scanVal(ctx.latestScan, "recoveryScore");

  let message: string;
  if (parasympathetic) {
    message = `Your recovery score was ${parasympathetic}. That's your body's bounce-back signal between meals.`;
  } else if (recoveryScore) {
    message = `Recovery at ${recoveryScore}. That tells me how fast your body resets after stress — and what to feed it next.`;
  } else {
    message = "Day 2. I'm watching how your body responds to yesterday's meals.";
  }

  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message,
  };
}

function getScanDay3Greeting(ctx: GreetingContext): GreetingResult {
  const heartRate = scanVal(ctx.latestScan, "heartRate");
  const bmr = scanVal(ctx.latestScan, "bmr");

  let message: string;
  if (heartRate) {
    message = `Resting at ${heartRate} bpm — that tells me how much fuel your body burns just existing.`;
  } else if (bmr) {
    message = `Your baseline burn is around ${bmr} cal. Three days in and I'm calibrating your meals to match.`;
  } else {
    message = "Three days of scan data. Your metabolic rhythm is getting clearer.";
  }

  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message,
  };
}

function getScanDay4to5Greeting(ctx: GreetingContext): GreetingResult {
  if (ctx.checkInCount > 0) {
    const cardiacWorkload = scanVal(ctx.latestScan, "cardiacWorkload");
    const energyRef = ctx.latestEnergy ? `${ctx.latestEnergy} energy` : "your feedback";

    let message: string;
    if (cardiacWorkload) {
      message = `Your cardiac load is ${cardiacWorkload}. Paired with yesterday's ${energyRef}, I'm seeing a pattern.`;
    } else {
      message = `Your scan data plus ${energyRef} from check-in — the picture is getting specific.`;
    }

    return {
      nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
      message,
    };
  }

  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message:
      "I haven't heard how you're feeling yet. That signal matters — tap the check-in below.",
    embedAction: "energy_checkin",
  };
}

function getScanDay6to7Greeting(ctx: GreetingContext): GreetingResult {
  const lines = [
    "There are deeper patterns in your scan I want to unpack for you. I need a bit more time.",
    "Almost a week of biometric data. The patterns are there — I'm building toward something specific.",
  ];
  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message: lines[dailyIndex(lines.length)],
  };
}

function getScanDay8to14Greeting(ctx: GreetingContext): GreetingResult {
  const lines = [
    "A full week of data in. I'm building a bigger picture — your weekly review will pull it together.",
    "Your scan data is stacking up. There are patterns I want to walk you through soon.",
    "I've got enough signal now to go deeper. Stay tuned for your weekly review.",
  ];
  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message: lines[dailyIndex(lines.length)],
  };
}

function getScanDay15PlusGreeting(ctx: GreetingContext): GreetingResult {
  const type = TYPE_CONFIGS[ctx.metabolicType];
  const lines = [
    `There are deeper markers in your scan I haven't unpacked yet. Your ${type.name.toLowerCase()} pattern has layers — Pro will open them up.`,
    "Two weeks of biometric data. The surface-level patterns are clear. The deeper ones are waiting.",
    `Your body's telling a more detailed story now. I've shared the headlines — the full read goes deeper.`,
  ];
  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message: lines[dailyIndex(lines.length)],
  };
}

// ---------- Skip (no scan) greetings ----------

function getSkipDay1Greeting(ctx: GreetingContext): GreetingResult {
  const type = TYPE_CONFIGS[ctx.metabolicType];
  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message: `Based on what you told me, I think I know what's happening. ${type.whyLineSeed}`,
  };
}

function getSkipDay2to4Greeting(ctx: GreetingContext): GreetingResult {
  const lines: Record<number, string[]> = {
    2: [
      "Day 2. I'm watching how your body responds to yesterday's meals.",
      "Back again. That's the pattern I need to see.",
    ],
    3: [
      "Three days in. I'm starting to see your rhythm.",
      "Day 3. Your pattern is getting clearer.",
    ],
    4: [
      "Day 4. Your body is settling into a rhythm I can work with.",
      "Four days. Enough to stop guessing, start knowing.",
    ],
  };

  const dayLines = lines[ctx.dayNumber] || lines[4];
  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message: dayLines[dailyIndex(dayLines.length)],
  };
}

function getSkipDay5PlusGreeting(ctx: GreetingContext): GreetingResult {
  const type = TYPE_CONFIGS[ctx.metabolicType];
  const lines = [
    `Your ${type.name.toLowerCase()} pattern is holding. Today's plan is dialed in.`,
    `I'm getting confident in your pattern. Today's meals are tuned for a ${type.name.toLowerCase()}.`,
  ];
  return {
    nameGreeting: ctx.userName ? `${ctx.userName}.` : "Hey.",
    message: lines[dailyIndex(lines.length)],
  };
}

// ---------- Recency helpers ----------

function isWithin24Hours(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return now - then < 24 * 60 * 60 * 1000;
}

/** True when the latest check-in contains something worth calling out. */
function hasNotableSignal(ctx: GreetingContext): boolean {
  if (ctx.latestSleepHours !== null && ctx.latestSleepHours < 6) return true;
  if (ctx.latestSleepQuality === "poor" || ctx.latestSleepQuality === "bad") return true;
  if (ctx.latestStressTags.length > 0) return true;
  if (ctx.latestEnergy === "low" || ctx.latestEnergy === "very_low") return true;
  if (ctx.latestEnergy === "high" || ctx.latestEnergy === "very_high") return true;
  return false;
}

// ---------- Recent-signal greetings (< 24 h) ----------

function getRecentCheckInGreeting(ctx: GreetingContext): GreetingResult {
  const type = TYPE_CONFIGS[ctx.metabolicType];
  const nameGreeting = ctx.userName ? `${ctx.userName}.` : "Hey.";

  // Sleep-based greetings
  if (ctx.latestSleepHours !== null && ctx.latestSleepHours < 6) {
    return {
      nameGreeting,
      message: `${ctx.latestSleepHours} hours of sleep. Today's meals lean heavier on protein to keep your energy steady.`,
    };
  }
  if (ctx.latestSleepQuality === "poor" || ctx.latestSleepQuality === "bad") {
    return {
      nameGreeting,
      message: "Rough night. I've weighted today's meals toward recovery — more magnesium, less sugar.",
    };
  }

  // Stress-based greetings
  if (ctx.latestStressTags.length > 0) {
    const tag = ctx.latestStressTags[0];
    const stressMessages: Record<string, string> = {
      work: "Work stress showing up. Today's meals are anti-cortisol — protein-forward to keep you level.",
      sleep: "Sleep stress flagged. I've adjusted your meals to support recovery today.",
      family: "Family stress is real. Today's meals are comfort-forward without the crash.",
      health: "Health stress noted. I've tuned your meals to support your body, not add to the load.",
    };
    return {
      nameGreeting,
      message: stressMessages[tag] || `Stress from ${tag} — today's meals are adjusted to help your body recover.`,
    };
  }

  // Energy-based greetings
  if (ctx.latestEnergy === "low" || ctx.latestEnergy === "very_low") {
    return {
      nameGreeting,
      message: `Low energy yesterday. I've front-loaded protein at breakfast and added slow carbs at lunch.`,
    };
  }
  if (ctx.latestEnergy === "high" || ctx.latestEnergy === "very_high") {
    return {
      nameGreeting,
      message: `Your energy was solid yesterday. Today's plan keeps that momentum — same balance, slight variety.`,
    };
  }

  // Moderate / generic recent check-in
  return {
    nameGreeting,
    message: `Your check-in is in. ${type.whyLineSeed}`,
  };
}

function getRecentScanGreeting(ctx: GreetingContext): GreetingResult {
  const nameGreeting = ctx.userName ? `${ctx.userName}.` : "Hey.";
  const scan = ctx.latestScan;

  const stressIndex = scanVal(scan, "stressIndex");
  const heartRate = scanVal(scan, "heartRate");
  const recoveryScore = scanVal(scan, "recoveryScore");
  const wellness = scanVal(scan, "wellnessIndex");

  if (stressIndex) {
    const level = Number(stressIndex) > 60 ? "elevated" : Number(stressIndex) > 40 ? "moderate" : "low";
    return {
      nameGreeting,
      message: `Stress index at ${stressIndex} — ${level}. Today's meals are calibrated to match.`,
    };
  }
  if (heartRate) {
    return {
      nameGreeting,
      message: `Resting at ${heartRate} bpm. Your meals today are tuned to that baseline.`,
    };
  }
  if (recoveryScore) {
    return {
      nameGreeting,
      message: `Recovery score: ${recoveryScore}. That shapes how I fuel you today.`,
    };
  }
  if (wellness) {
    return {
      nameGreeting,
      message: `Wellness at ${wellness}. I'm using that to dial in today's plan.`,
    };
  }

  return {
    nameGreeting,
    message: "Fresh scan in. I'm using your latest numbers to shape today's meals.",
  };
}

// ---------- No recent data greeting (> 24 h) ----------

function getStaleDataGreeting(ctx: GreetingContext): GreetingResult {
  const nameGreeting = ctx.userName ? `${ctx.userName}.` : "Hey.";

  if (ctx.hasScan) {
    return {
      nameGreeting,
      message: "I'm working from older data. A quick scan or check-in sharpens your meals today.",
      embedAction: "energy_checkin",
    };
  }

  return {
    nameGreeting,
    message: "I haven't heard from you today. A quick check-in sharpens your meals.",
    embedAction: "energy_checkin",
  };
}

// ---------- Main greeting router ----------

export function generateGreeting(ctx: GreetingContext): GreetingResult {
  let result: GreetingResult;

  const hasRecentCheckIn = isWithin24Hours(ctx.lastCheckInAt);
  const hasRecentScan = isWithin24Hours(ctx.lastScanAt);
  const hasAnyRecentData = hasRecentCheckIn || hasRecentScan;

  // Priority 1: Lapse
  if (ctx.lapseTier > 0) {
    result = getLapseGreeting(ctx);
  }
  // Priority 2: No recent data (> 24 h) — prompt to scan or check in
  else if (!hasAnyRecentData && ctx.dayNumber >= 2 && !ctx.isGlanceOnly) {
    result = getStaleDataGreeting(ctx);
  }
  // Priority 3: Recent check-in with a notable signal — surface it
  else if (hasRecentCheckIn && hasNotableSignal(ctx)) {
    result = getRecentCheckInGreeting(ctx);
  }
  // Priority 4: Recent scan — surface a metric
  else if (hasRecentScan && ctx.latestScan) {
    result = getRecentScanGreeting(ctx);
  }
  // Priority 5: Has scan — day-progression revelations
  else if (ctx.hasScan) {
    if (ctx.dayNumber <= 1) {
      result = getScanDay1Greeting(ctx);
    } else if (ctx.dayNumber === 2) {
      result = getScanDay2Greeting(ctx);
    } else if (ctx.dayNumber === 3) {
      result = getScanDay3Greeting(ctx);
    } else if (ctx.dayNumber <= 5) {
      result = getScanDay4to5Greeting(ctx);
    } else if (ctx.dayNumber <= 7) {
      result = getScanDay6to7Greeting(ctx);
    } else if (ctx.dayNumber <= 14) {
      result = getScanDay8to14Greeting(ctx);
    } else {
      result = getScanDay15PlusGreeting(ctx);
    }
  }
  // Priority 6: Glance-only (non-scan users with no engagement)
  else if (ctx.isGlanceOnly) {
    result = getGlanceOnlyGreeting(ctx);
  }
  // Priority 7: No scan (skip) — day-progression
  else {
    if (ctx.dayNumber <= 1) {
      result = getSkipDay1Greeting(ctx);
    } else if (ctx.dayNumber <= 4) {
      result = getSkipDay2to4Greeting(ctx);
    } else {
      result = getSkipDay5PlusGreeting(ctx);
    }
  }

  validateNoBannedOpener(result.nameGreeting);
  validateNoBannedOpener(result.message);

  return result;
}

// ---------- Fallback for pre-profile loading ----------

export function generateSimpleGreeting(ctx: {
  metabolicType: MetabolicType;
  hasScan: boolean;
  dayNumber: number;
  userName?: string;
}): GreetingResult {
  return generateGreeting({
    ...ctx,
    checkInCount: 0,
    latestEnergy: null,
    latestStressTags: [],
    latestSleepQuality: null,
    latestSleepHours: null,
    scanCount: 0,
    latestScan: null,
    esterTier: "Pattern Acknowledgment",
    compositeConfidence: 35,
    lastCheckInAt: null,
    lastScanAt: null,
    daysSinceLastCheckIn: null,
    isGlanceOnly: false,
    lapseTier: 0,
    mealFeedbackCount: 0,
  });
}

// Calculate day number from account creation date
export function getDayNumber(createdAt?: string): number {
  if (!createdAt) return 1;
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}
