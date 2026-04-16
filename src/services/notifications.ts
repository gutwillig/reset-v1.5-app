import { apiClient } from "./apiClient";

/**
 * Notify the backend that the app has been opened.
 * Cancels any pending re-engagement pushes (PRD §19.2 Action Paths).
 * Fire-and-forget — errors are swallowed.
 */
export async function notifyAppOpened(): Promise<void> {
  try {
    await apiClient("/api/notifications/app-opened", { method: "POST" });
  } catch {
    // Non-blocking. If the user isn't authenticated, the server will 401 and
    // we simply skip — there are no re-engagement pushes scheduled for an
    // anonymous user anyway.
  }
}
