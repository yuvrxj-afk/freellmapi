const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const STORAGE_KEY = 'freellmapi_dashboard_secret';

/** Read the stored dashboard password (set by LoginGate). */
export function getStoredSecret(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

/** Persist the dashboard password after a successful login. */
export function setStoredSecret(secret: string): void {
  if (secret) localStorage.setItem(STORAGE_KEY, secret);
  else localStorage.removeItem(STORAGE_KEY);
}

/** Clear the stored password (logout). */
export function clearStoredSecret(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const secret = getStoredSecret();
  const authHeader: Record<string, string> = secret
    ? { Authorization: `Bearer ${secret}` }
    : {};

  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader, ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}
