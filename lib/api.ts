// lib/api.ts — API client with automatic token refresh
const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await fetch(API + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      // Refresh failed — logout
      localStorage.clear();
      window.location.href = '/';
      return null;
    }
    const data = await res.json();
    localStorage.setItem('token', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    localStorage.clear();
    window.location.href = '/';
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token') || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(API + path, { ...options, headers });

  // If 401 — token expired, try refresh
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      if (newToken) {
        refreshQueue.forEach(cb => cb(newToken));
        refreshQueue = [];
        // Retry original request with new token
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        res = await fetch(API + path, { ...options, headers: retryHeaders });
      }
    } else {
      // Queue request until refresh completes
      const newToken = await new Promise<string>(resolve => {
        refreshQueue.push(resolve);
      });
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      res = await fetch(API + path, { ...options, headers: retryHeaders });
    }
  }

  return res;
}

// Convenience methods
export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};

export default API;
