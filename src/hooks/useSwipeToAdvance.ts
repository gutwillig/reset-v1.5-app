import { useRef } from "react";
import { PanResponder, PanResponderInstance } from "react-native";

export type SwipeAxis = "horizontal" | "down";

interface UseSwipeToAdvanceOptions {
  axis: SwipeAxis;
  onAdvance: () => void;
  enabled?: boolean;
}

// Threshold to "claim" the gesture from underlying touchables. Taps don't move,
// so this guarantees a real directional drag before we intercept.
const CLAIM_DISTANCE_PX = 12;
// Distance / velocity required on release to fire the advance.
const ADVANCE_DISTANCE_PX = 60;
const ADVANCE_VELOCITY = 0.4;

export function useSwipeToAdvance({
  axis,
  onAdvance,
  enabled = true,
}: UseSwipeToAdvanceOptions): PanResponderInstance["panHandlers"] {
  // Refs so the captured PanResponder always reads the latest values without
  // re-creating the responder on every render.
  const axisRef = useRef(axis);
  const onAdvanceRef = useRef(onAdvance);
  const enabledRef = useRef(enabled);
  axisRef.current = axis;
  onAdvanceRef.current = onAdvance;
  enabledRef.current = enabled;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (!enabledRef.current) return false;
        if (axisRef.current === "horizontal") {
          return (
            Math.abs(g.dx) > CLAIM_DISTANCE_PX &&
            Math.abs(g.dx) > Math.abs(g.dy)
          );
        }
        return g.dy > CLAIM_DISTANCE_PX && g.dy > Math.abs(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (!enabledRef.current) return;
        const passes =
          axisRef.current === "horizontal"
            ? Math.abs(g.dx) > ADVANCE_DISTANCE_PX ||
              Math.abs(g.vx) > ADVANCE_VELOCITY
            : g.dy > ADVANCE_DISTANCE_PX || g.vy > ADVANCE_VELOCITY;
        if (passes) onAdvanceRef.current();
      },
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  return panResponder.panHandlers;
}
