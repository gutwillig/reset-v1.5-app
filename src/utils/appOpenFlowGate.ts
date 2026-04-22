import AsyncStorage from "@react-native-async-storage/async-storage";

const keyFor = (userId: string, date: string) =>
  `@reset_app_open_shown_${userId}_${date}`;

const todayISO = () => new Date().toISOString().split("T")[0];

export async function shouldShowAppOpenFlow(userId: string): Promise<boolean> {
  try {
    const shown = await AsyncStorage.getItem(keyFor(userId, todayISO()));
    return !shown;
  } catch {
    return false;
  }
}

export async function markAppOpenFlowShown(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId, todayISO()), "1");
  } catch {
    // noop — next open will just show again
  }
}

export async function resetAppOpenFlowGate(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(userId, todayISO()));
  } catch {
    // noop
  }
}
