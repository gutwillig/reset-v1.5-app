import { apiClient, storeTokens, clearTokens } from "./apiClient";
import * as BrazeService from "./braze";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
  createdAt?: string;
}

export async function registerWithEmail(
  email: string,
  password: string,
  timezone?: string,
  firstName?: string,
  lastName?: string,
): Promise<AuthUser> {
  const data = await apiClient("/api/auth/register/email", {
    method: "POST",
    body: JSON.stringify({ email, password, firstName, lastName, timezone }),
  });

  // Register endpoint returns {id, email, firstName, lastName, token, deviceId}
  await storeTokens(data.token, undefined, data.deviceId);

  BrazeService.changeUser(data.id);
  if (data.email) BrazeService.setUserAttributes({ email: data.email, firstName: data.firstName, lastName: data.lastName });

  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
  };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const data = await apiClient("/api/auth/login/email/password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  await storeTokens(data.token, undefined, data.deviceId);

  // Fetch full user data (including createdAt) from /me endpoint
  const user = await fetchMe();
  BrazeService.changeUser(user.id);
  return user;
}

export async function loginWithApple(idToken: string): Promise<AuthUser> {
  const data = await apiClient("/api/auth/apple", {
    method: "POST",
    body: JSON.stringify({ idToken, platform: "react-native" }),
  });

  // Apple endpoint returns {user, accessToken, refreshToken, platform}
  await storeTokens(data.accessToken, data.refreshToken);

  BrazeService.changeUser(data.user.id);
  if (data.user.email) BrazeService.setUserAttributes({ email: data.user.email, firstName: data.user.name });

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    firstName: data.user.name ?? null,
    lastName: null,
    avatarUrl: data.user.avatarUrl ?? null,
  };
}

export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
  const data = await apiClient("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken, platform: "react-native" }),
  });

  // Google endpoint returns {user, accessToken, refreshToken, platform}
  await storeTokens(data.accessToken, data.refreshToken);

  BrazeService.changeUser(data.user.id);
  if (data.user.email) BrazeService.setUserAttributes({ email: data.user.email, firstName: data.user.name });

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    firstName: data.user.name ?? null,
    lastName: null,
    avatarUrl: data.user.avatarUrl ?? null,
  };
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await apiClient("/api/auth/me");

  return {
    id: data.user.id,
    email: data.user.email,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    phoneNumber: data.user.phoneNumber,
    avatarUrl: data.user.avatarUrl,
    timezone: data.user.timezone,
    createdAt: data.user.createdAt,
  };
}

export async function logout(): Promise<void> {
  try {
    await apiClient("/api/auth/logout", { method: "POST" });
  } catch {
    // Best effort — clear tokens regardless
  }
  BrazeService.wipeData();
  await clearTokens();
}
