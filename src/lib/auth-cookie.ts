const COOKIE_NAME = "financasai-token";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function removeToken(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
