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

// Evening palette runs from 4p through 6a so post-midnight launches still
// render the night styling instead of flipping back to day.
function isEvening(): boolean {
  const hour = new Date().getHours();
  return hour >= 16 || hour < 6;
}

export function useAppPalette(): AppPalette {
  const evening = isEvening();
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
