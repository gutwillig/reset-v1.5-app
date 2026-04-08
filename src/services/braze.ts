let Braze: any;
try {
  Braze = require("@braze/react-native-sdk").default;
} catch {
  // Native module not available (e.g. Expo Go / simulator dev build)
  Braze = null;
}

const noop = () => {};

/**
 * BrazeService — wrapper for all Braze SDK interactions.
 * Never call Braze SDK directly from screens/components — go through this service.
 * Gracefully no-ops when native module is unavailable.
 */

/**
 * Identify a known user. Call after login/register.
 * Merges anonymous braze_id to this external_id.
 */
export function changeUser(userId: string): void {
  if (!Braze) return;
  Braze.changeUser(userId);
  Braze.requestImmediateDataFlush();
}

/**
 * Log a custom event with optional properties.
 */
export function logEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!Braze) return;
  Braze.logCustomEvent(eventName, properties);
}

/**
 * Set standard user attributes.
 */
export function setUserAttributes(attrs: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: { year: number; month: number; day: number };
}): void {
  if (!Braze) return;
  if (attrs.firstName) Braze.setFirstName(attrs.firstName);
  if (attrs.lastName) Braze.setLastName(attrs.lastName);
  if (attrs.email) Braze.setEmail(attrs.email);
  if (attrs.phone) Braze.setPhoneNumber(attrs.phone);
  if (attrs.dateOfBirth) {
    Braze.setDateOfBirth(
      attrs.dateOfBirth.year,
      attrs.dateOfBirth.month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
      attrs.dateOfBirth.day,
    );
  }
}

/**
 * Set a custom string attribute.
 */
export function setCustomAttribute(
  key: string,
  value: string | number | boolean,
): void {
  if (!Braze) return;
  Braze.setCustomUserAttribute(key, value);
}

/**
 * Clear all Braze data on this device. Call on logout.
 */
export function wipeData(): void {
  if (!Braze) return;
  Braze.wipeData();
}
