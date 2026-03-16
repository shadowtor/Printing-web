const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api/v1";
const TOKEN_KEY = "printing-web-auth-token";

export interface AuthResult {
  customerId: string;
  email: string;
  name: string;
  token: string;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export async function register(params: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const data = (await res.json()) as { message?: string; code?: string };
    throw new Error(data.message ?? "Registration failed");
  }
  return (await res.json()) as AuthResult;
}

export async function login(params: { email: string; password: string }): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const data = (await res.json()) as { message?: string; code?: string };
    throw new Error(data.message ?? "Login failed");
  }
  return (await res.json()) as AuthResult;
}

export function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
