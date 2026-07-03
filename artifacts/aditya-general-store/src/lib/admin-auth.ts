import { setAuthTokenGetter } from "@workspace/api-client-react";

const ADMIN_TOKEN_KEY = "aditya-admin-token";

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function isAdminUnlocked(): boolean {
  return Boolean(getAdminToken());
}

export function initAdminAuth(): void {
  setAuthTokenGetter(() => getAdminToken());
}
