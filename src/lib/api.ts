import { getToken, removeToken } from "./auth-cookie";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleUnauthorized(status: number): void {
  if (status === 401 && typeof window !== "undefined") {
    removeToken();
    window.location.href = "/login";
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  const body = await parseJson(response);
  if (!response.ok) {
    handleUnauthorized(response.status);
    const msg =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : response.statusText;
    throw new ApiError(msg, response.status, body);
  }
  return body as T;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  json?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { ...authHeaders() };
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  if (response.status === 204) return undefined as T;
  const body = await parseJson(response);
  if (!response.ok) {
    handleUnauthorized(response.status);
    const msg =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : response.statusText;
    throw new ApiError(msg, response.status, body);
  }
  return body as T;
}

export function getApiBase() {
  return BASE;
}

export function authFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers }).then((res) => {
    handleUnauthorized(res.status);
    return res;
  });
}
