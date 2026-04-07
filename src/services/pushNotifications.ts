import Braze from "@braze/react-native-sdk";

/**
 * Request push notification permission via Braze SDK.
 * Braze handles the iOS permission prompt, token registration,
 * and foreground display natively via enableBrazeIosPush.
 * Do NOT use expo-notifications for push — it conflicts with Braze's native handling.
 */
export function requestPushPermission(): void {
  Braze.requestPushPermission({
    alert: true,
    badge: true,
    sound: true,
  });
}
