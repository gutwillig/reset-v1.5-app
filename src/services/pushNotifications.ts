import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Braze from "@braze/react-native-sdk";
import * as BrazeService from "./braze";

/**
 * Configure how notifications appear when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permission and register token with Braze.
 * Returns true if permission was granted.
 */
export async function requestPushPermission(): Promise<boolean> {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") {
    // Token registration handled natively by @braze/expo-plugin (enableBrazeIosPush)
    BrazeService.logEvent("push_permission_granted");
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  const granted = status === "granted";

  if (granted) {
    // Token registration handled natively by @braze/expo-plugin (enableBrazeIosPush)
    BrazeService.logEvent("push_permission_granted");
  } else {
    BrazeService.logEvent("push_permission_denied");
  }

  BrazeService.setCustomAttribute("push_permission_status", granted ? "granted" : "denied");

  return granted;
}

/**
 * Register the device push token with Braze.
 */
async function registerPushToken(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      // Android needs a notification channel
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    // For Braze, we need the device push token, not the Expo token
    const deviceToken = await Notifications.getDevicePushTokenAsync();

    if (Platform.OS === "ios") {
      Braze.registerPushToken(deviceToken.data as string);
    } else {
      Braze.registerPushToken(deviceToken.data as string);
    }
  } catch (error) {
    console.warn("Failed to register push token:", error);
  }
}

/**
 * Check current push permission status without prompting.
 */
export async function getPushPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Set up listeners for notification interactions (taps).
 * Returns a cleanup function.
 */
export function setupNotificationListeners(
  onNotificationTap?: (data: Record<string, any>) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      onNotificationTap?.(data as Record<string, any>);
    },
  );

  return () => subscription.remove();
}
