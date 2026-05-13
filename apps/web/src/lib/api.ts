const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("accessToken");
  }
  return accessToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

export async function fetcher<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  // Token refresh on 401
  if (res.status === 401 && !skipAuth && refreshToken) {
    const refreshRes = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data.success) {
        setTokens(data.data.accessToken, data.data.refreshToken);
        headers["Authorization"] = `Bearer ${data.data.accessToken}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
        return retryRes.json() as T;
      }
    }
    clearTokens();
  }

  return res.json() as T;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
