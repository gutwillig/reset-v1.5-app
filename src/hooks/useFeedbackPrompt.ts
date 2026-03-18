import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyPlan, DailyPlanMeal } from '../services/meals';

const SLOT_TIMES = {
  breakfast: 8,  // 8:00 AM
  lunch: 12,     // 12:00 PM
  dinner: 19,    // 7:00 PM
} as const;

const PROMPT_DELAY_MINUTES = 30;
const DAY1_TAP_DELAY_MS = 30 * 60 * 1000; // 30 minutes

type Slot = 'breakfast' | 'lunch' | 'dinner';

function getPromptKey(date: string, slot: string): string {
  return `@feedback_prompt_${date}_${slot}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getCurrentPromptSlot(): Slot | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check slots in reverse (dinner, lunch, breakfast)
  // The active slot is the one whose prompt time has passed but whose next slot hasn't
  const slots: Slot[] = ['dinner', 'lunch', 'breakfast'];
  for (const slot of slots) {
    const promptMinutes = SLOT_TIMES[slot] * 60 + PROMPT_DELAY_MINUTES;
    if (currentMinutes >= promptMinutes) {
      return slot;
    }
  }
  return null;
}

function getNextPromptMs(): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: Slot[] = ['breakfast', 'lunch', 'dinner'];
  for (const slot of slots) {
    const promptMinutes = SLOT_TIMES[slot] * 60 + PROMPT_DELAY_MINUTES;
    if (currentMinutes < promptMinutes) {
      return (promptMinutes - currentMinutes) * 60 * 1000;
    }
  }
  // All prompts passed for today
  return -1;
}

export function useFeedbackPrompt(
  dailyPlan: DailyPlan | null,
  dayNumber: number,
) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptSlot, setPromptSlot] = useState<Slot | null>(null);
  const [promptMeal, setPromptMeal] = useState<DailyPlanMeal | null>(null);
  const firstTapTime = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getMealsForSlot = useCallback((slot: Slot): DailyPlanMeal[] => {
    if (!dailyPlan) return [];
    return dailyPlan[slot] || [];
  }, [dailyPlan]);

  const checkAndShowPrompt = useCallback(async () => {
    if (!dailyPlan) return;

    const today = getTodayStr();

    // Day 1 special: only fire 30min after first meal card tap
    if (dayNumber <= 1) {
      if (!firstTapTime.current) return;
      const elapsed = Date.now() - firstTapTime.current;
      if (elapsed < DAY1_TAP_DELAY_MS) return;

      // On day 1, show for the most recent slot that has meals
      const slots: Slot[] = ['dinner', 'lunch', 'breakfast'];
      for (const slot of slots) {
        const meals = getMealsForSlot(slot);
        if (meals.length > 0) {
          const dismissed = await AsyncStorage.getItem(getPromptKey(today, slot));
          if (!dismissed) {
            setPromptSlot(slot);
            setPromptMeal(meals[0]);
            setShowPrompt(true);
            return;
          }
        }
      }
      return;
    }

    // Normal flow: check which slot's prompt window is active
    const slot = getCurrentPromptSlot();
    if (!slot) {
      setShowPrompt(false);
      return;
    }

    const dismissed = await AsyncStorage.getItem(getPromptKey(today, slot));
    if (dismissed) {
      setShowPrompt(false);
      return;
    }

    const meals = getMealsForSlot(slot);
    if (meals.length > 0) {
      setPromptSlot(slot);
      setPromptMeal(meals[0]);
      setShowPrompt(true);
    }
  }, [dailyPlan, dayNumber, getMealsForSlot]);

  // Schedule next prompt check
  const scheduleNextCheck = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (dayNumber <= 1 && firstTapTime.current) {
      // On day 1, check 30min after tap
      const elapsed = Date.now() - firstTapTime.current;
      const remaining = DAY1_TAP_DELAY_MS - elapsed;
      if (remaining > 0) {
        timerRef.current = setTimeout(() => checkAndShowPrompt(), remaining);
      }
      return;
    }

    const nextMs = getNextPromptMs();
    if (nextMs > 0) {
      timerRef.current = setTimeout(() => {
        checkAndShowPrompt();
      }, nextMs);
    }
  }, [dayNumber, checkAndShowPrompt]);

  // Initial check and schedule
  useEffect(() => {
    checkAndShowPrompt();
    scheduleNextCheck();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [checkAndShowPrompt, scheduleNextCheck]);

  // Re-check on foreground resume
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        checkAndShowPrompt();
        scheduleNextCheck();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [checkAndShowPrompt, scheduleNextCheck]);

  const dismissPrompt = useCallback(async () => {
    if (promptSlot) {
      const today = getTodayStr();
      await AsyncStorage.setItem(getPromptKey(today, promptSlot), 'dismissed');
    }
    setShowPrompt(false);
    setPromptMeal(null);
    setPromptSlot(null);
    scheduleNextCheck();
  }, [promptSlot, scheduleNextCheck]);

  const recordMealTap = useCallback(() => {
    if (dayNumber <= 1 && !firstTapTime.current) {
      firstTapTime.current = Date.now();
      // Schedule check for 30min later
      timerRef.current = setTimeout(() => {
        checkAndShowPrompt();
      }, DAY1_TAP_DELAY_MS);
    }
  }, [dayNumber, checkAndShowPrompt]);

  return {
    showPrompt,
    promptMeal,
    promptSlot,
    dismissPrompt,
    recordMealTap,
  };
}
