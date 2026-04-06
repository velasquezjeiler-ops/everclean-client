const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

async function request(path: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) };
  const res = await fetch(API_URL + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, undefined),
    register: (email: string, password: string) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role: 'CLIENT' }) }, undefined),
    me: (token: string) => request('/auth/me', {}, token),
  },
  professionals: { list: (token: string) => request('/professionals', {}, token) },
  bookings: {
    list: (token: string) => request('/bookings', {}, token),
    create: (token: string, data: any) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }, token),
  },
};