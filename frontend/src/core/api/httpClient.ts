const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://businessos-fzmp.onrender.com/api/v1';
const TOKEN_STORAGE_KEY = 'bos_access_token';
let inMemoryAccessToken: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (typeof localStorage === 'undefined') return;

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getDeviceId(): string {
  let id = localStorage.getItem('bos_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('bos_device_id', id);
  }
  return id;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-ID': getDeviceId(),
          },
        });
        if (!res.ok) {
          setAccessToken(null);
          return null;
        }
        const json = await res.json();
        const nextToken = json?.data?.access_token ?? null;
        setAccessToken(nextToken);
        return nextToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  code?: string;
  message?: string;
  data?: T;
  details?: Record<string, unknown>;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}, retryOn401 = true): Promise<{ ok: boolean; status: number; body: ApiResponse<T> }> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('X-Device-ID', getDeviceId());
  headers.set('X-Device-Name', navigator.platform || 'Web PWA');

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers.set('X-Request-Nonce', crypto.randomUUID());
    headers.set('X-Timestamp', String(Math.floor(Date.now() / 1000)));
  }

  if (inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
    });
  } catch {
    return {
      ok: false,
      status: 0,
      body: { status: 'error', code: 'NETWORK_ERROR', message: 'Cannot reach server. Check your connection or API server.' },
    };
  }


  if (res.status === 401 && retryOn401 && !path.startsWith('/auth/')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    window.dispatchEvent(new CustomEvent('bos:session-expired'));
  }

  if (res.status === 402) {
    window.dispatchEvent(new CustomEvent('bos:subscription-required'));
  }

  const body = (await res.json().catch(() => ({
    status: 'error',
    message: 'Unexpected server response.',
  }))) as ApiResponse<T>;

  return { ok: res.ok, status: res.status, body };
}
