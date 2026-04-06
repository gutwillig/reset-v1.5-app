import * as Notifications from "expo-notifications";
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
 * Request push notification permission via Braze SDK.
 * This ensures Braze handles both the iOS permission prompt and token registration.
 */
export function requestPushPermission(): void {
  Braze.requestPushPermission({
    alert: true,
    badge: true,
    sound: true,
  });
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
