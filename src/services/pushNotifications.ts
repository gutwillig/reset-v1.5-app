let Braze: any;
try {
  Braze = require("@braze/react-native-sdk").default;
} catch {
  Braze = null;
}

/**
 * Request push notification permission via Braze SDK.
 * Braze handles the iOS permission prompt, token registration,
 * and foreground display natively via enableBrazeIosPush.
 * Do NOT use expo-notifications for push — it conflicts with Braze's native handling.
 * Gracefully no-ops when native module is unavailable.
 */
export function requestPushPermission(): void {
  if (!Braze) return;
  Braze.requestPushPermission({
    alert: true,
    badge: true,
    sound: true,
  });
}
