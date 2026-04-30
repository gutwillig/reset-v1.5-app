import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { K } from "../constants/colors";

export interface AppPalette {
  evening: boolean;
  outerBg: string;
  innerBg: string;
  nestedBg: string;
  textColor: string;
  subtleText: string;
  borderColor: string;
  statusBarStyle: "light-content" | "dark-content";
}

const EVENING_START_HOUR = 16; // 4pm
const DAY_START_HOUR = 6; // 6am

function isEveningNow(): boolean {
  const hour = new Date().getHours();
  return hour >= EVENING_START_HOUR || hour < DAY_START_HOUR;
}

function buildPalette(evening: boolean): AppPalette {
  return {
    evening,
    outerBg: evening ? K.brown : K.bone,
    innerBg: evening ? "#513436" : K.white,
    nestedBg: evening ? "#2A0E10" : K.bone,
    textColor: evening ? K.bone : K.brown,
    subtleText: evening ? K.border : K.sub,
    borderColor: evening ? K.brown : K.border,
    statusBarStyle: evening ? "light-content" : "dark-content",
  };
}

// Milliseconds from `now` to the next 4pm or 6am boundary. Floor at 1s so we
// can never schedule a zero-delay timer that would tight-loop.
function msUntilNextBoundary(now: Date = new Date()): number {
  const next = new Date(now);
  const hour = now.getHours();
  if (hour >= EVENING_START_HOUR) {
    next.setDate(next.getDate() + 1);
    next.setHours(DAY_START_HOUR, 0, 0, 0);
  } else if (hour < DAY_START_HOUR) {
    next.setHours(DAY_START_HOUR, 0, 0, 0);
  } else {
    next.setHours(EVENING_START_HOUR, 0, 0, 0);
  }
  return Math.max(1000, next.getTime() - now.getTime());
}

const PaletteContext = createContext<AppPalette | null>(null);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [evening, setEvening] = useState<boolean>(() => isEveningNow());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const reschedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(tick, msUntilNextBoundary());
    };

    const reevaluate = () => {
      const current = isEveningNow();
      setEvening((prev) => (prev === current ? prev : current));
    };

    const tick = () => {
      if (cancelled) return;
      reevaluate();
      reschedule();
    };

    reschedule();

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      reevaluate();
      reschedule();
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      sub.remove();
    };
  }, []);

  const palette = useMemo(() => buildPalette(evening), [evening]);
  return (
    <PaletteContext.Provider value={palette}>
      {children}
    </PaletteContext.Provider>
  );
}

export function useAppPalette(): AppPalette {
  const ctx = useContext(PaletteContext);
  if (ctx) return ctx;
  // Fallback for components rendered outside PaletteProvider (tests, isolated
  // previews). Non-reactive but correct at mount time.
  return buildPalette(isEveningNow());
}
