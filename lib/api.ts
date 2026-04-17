const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  let res = await fetch(url, { ...options, headers });

  // If 401, try refreshing the token
  if (res.status === 401 && !path.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await refreshAccessToken();
      isRefreshing = false;

      if (refreshed) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${getToken()}`;
        res = await fetch(url, { ...options, headers });

        // Process queued requests
        refreshQueue.forEach(cb => cb());
        refreshQueue = [];
      } else {
        // Refresh failed — redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    } else {
      // Wait for the current refresh to complete
      await new Promise<void>(resolve => {
        refreshQueue.push(resolve);
      });
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
}

// Convenience methods
export const api = {
  get: (path: string) => apiFetch(path).then(r => r.json()),
  post: (path: string, body: any) => apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.json()),
  patch: (path: string, body: any) => apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.json()),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }).then(r => r.json()),

  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    loginPhone: async (phone: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      return res.json();
    },
    register: async (email: string, password: string, role = 'CLIENT') => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      return res.json();
    },
  },

  bookings: {
    list: () => api.get('/bookings'),
    available: () => api.get('/bookings/available'),
    create: (data: any) => api.post('/bookings', data),
    claim: (id: string, scheduledAt?: string) => api.post(`/bookings/${id}/claim`, { scheduledAt }),
    checkin: (id: string, lat: number, lng: number) => api.post(`/bookings/${id}/checkin`, { lat, lng }),
    checkout: (id: string, photos?: string[]) => api.post(`/bookings/${id}/checkout-complete`, { photos }),
    eta: (id: string) => api.get(`/bookings/${id}/eta`),
    invoice: (id: string) => api.get(`/bookings/${id}/invoice`),
  },

  professionals: {
    me: () => api.get('/professionals/me'),
    update: (data: any) => api.patch('/professionals/me', data),
    list: () => api.get('/professionals'),
    myBookings: () => api.get('/professionals/me/bookings'),
    updateLocation: (lat: number, lng: number) => api.post('/professionals/me/location', { lat, lng }),
    toggleAvailability: () => api.patch('/professionals/me/availability', {}),
  },

  admin: {
    stats: () => api.get('/bookings/admin/stats'),
  },
};
