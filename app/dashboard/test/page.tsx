'use client';

import { useMemo, useState } from 'react';

const API = 'https://commercial-clean-setup.replit.app/api';

const C = {
  navy: '#0D3781',
  green: '#4CAF50',
  red: '#DC2626',
  yellow: '#F59E0B',
  bg: '#F5F7FA',
  text: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
};

const TEST_ACCOUNTS = {
  client: { email: 'test@evercleanapp.com', password: 'password', role: 'CLIENT' },
  pro: { email: 'evercleanpro@evercleanapp.com', password: 'password', role: 'PROFESSIONAL' },
  admin: { email: 'notifications@evercleanapp.com', password: 'password', role: 'ADMIN' },
};

type TestResult = {
  status: 'idle' | 'loading' | 'ok' | 'error';
  title: string;
  data?: any;
  timestamp?: string;
};

type TokenState = {
  token: string;
  role: string;
  email: string;
};

function tomorrowAt10Iso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function pretty(data: any) {
  return JSON.stringify(data ?? {}, null, 2);
}

function tokenLabel(t?: TokenState | null) {
  return t?.token ? 'YES' : 'NO';
}

function ResultBox({ result }: { result?: TestResult }) {
  if (!result) return null;

  const border =
    result.status === 'ok' ? C.green :
    result.status === 'error' ? C.red :
    result.status === 'loading' ? C.yellow :
    C.border;

  const label =
    result.status === 'ok' ? 'OK' :
    result.status === 'error' ? 'Error' :
    result.status === 'loading' ? 'Loading' :
    'Idle';

  return (
    <div style={{
      border: '1px solid ' + border,
      background: '#fff',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      overflow: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <strong style={{ color: border }}>{result.status === 'ok' ? '✅' : result.status === 'error' ? '❌' : '⏳'} {label}</strong>
        <span style={{ color: C.muted, fontSize: 12 }}>{result.timestamp || ''}</span>
      </div>
      <div style={{ fontWeight: 800, color: C.text, marginBottom: 8 }}>{result.title}</div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: C.text, fontSize: 12 }}>{pretty(result.data)}</pre>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
  result,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
  result?: TestResult;
}) {
  return (
    <section style={{
      background: '#fff',
      border: '1px solid ' + C.border,
      borderRadius: 10,
      padding: 18,
      boxShadow: '0 2px 8px rgba(13,55,129,0.06)',
    }}>
      <h2 style={{ margin: 0, color: C.navy, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span>
        {title}
      </h2>
      <p style={{ color: C.muted, margin: '6px 0 16px', fontSize: 13 }}>{description}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{children}</div>
      <ResultBox result={result} />
    </section>
  );
}

function Button({
  children,
  onClick,
  disabled,
  tone = 'navy',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'navy' | 'green' | 'light';
}) {
  const bg = tone === 'green' ? C.green : tone === 'light' ? '#fff' : C.navy;
  const color = tone === 'light' ? C.navy : '#fff';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: tone === 'light' ? '1px solid ' + C.border : 'none',
        background: bg,
        color,
        borderRadius: 8,
        padding: '10px 14px',
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function InternalTestDashboard() {
  const [clientToken, setClientToken] = useState<TokenState | null>(null);
  const [proToken, setProToken] = useState<TokenState | null>(null);
  const [adminToken, setAdminToken] = useState<TokenState | null>(null);
  const [bookingId, setBookingId] = useState('');
  const [autocompleteInput, setAutocompleteInput] = useState('11 College NJ');
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [lastTest, setLastTest] = useState('No tests run yet');

  const scheduledAt = useMemo(() => tomorrowAt10Iso(), []);

  function setLoading(key: string, title: string) {
    setResults((p) => ({ ...p, [key]: { status: 'loading', title, timestamp: new Date().toLocaleString() } }));
    setLastTest(title + ' — loading');
  }

  function setResult(key: string, status: 'ok' | 'error', title: string, data: any) {
    setResults((p) => ({ ...p, [key]: { status, title, data, timestamp: new Date().toLocaleString() } }));
    setLastTest(title + ' — ' + status.toUpperCase());
  }

  async function apiCall(key: string, title: string, path: string, token?: string, options: RequestInit = {}) {
    setLoading(key, title);
    try {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> | undefined),
      };

      if (token) headers.Authorization = 'Bearer ' + token;
      if (options.body) headers['Content-Type'] = headers['Content-Type'] || 'application/json';

      const res = await fetch(API + path, { ...options, headers });
      const data = await readJson(res);
      setResult(key, res.ok ? 'ok' : 'error', title, { httpStatus: res.status, ...data });
      return { ok: res.ok, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setResult(key, 'error', title, { error: message });
      return { ok: false, data: { error: message } };
    }
  }

  async function login(kind: 'client' | 'pro' | 'admin') {
    const account = TEST_ACCOUNTS[kind];
    const res = await apiCall('auth', 'Login as ' + account.role, '/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify({ email: account.email, password: account.password }),
    });

    const token = res.data.token || res.data.accessToken || '';
    const info = { token, role: res.data.role || account.role, email: res.data.email || account.email };

    if (token && kind === 'client') setClientToken(info);
    if (token && kind === 'pro') setProToken(info);
    if (token && kind === 'admin') setAdminToken(info);

    setResult('auth', token ? 'ok' : 'error', 'Login as ' + account.role, {
      tokenReceived: tokenLabel(info),
      role: info.role,
      email: info.email,
      response: res.data,
    });
  }

  async function createBooking() {
    if (!clientToken?.token) {
      setResult('booking', 'error', 'Create Test Booking', { error: 'Login as Client first' });
      return;
    }

    const res = await apiCall('booking', 'Create Test Booking', '/bookings', clientToken.token, {
      method: 'POST',
      body: JSON.stringify({
        service_type: 'HOUSE_CLEANING',
        state: 'NJ',
        city: 'Elizabeth',
        address: '227 Magnolia Avenue',
        zip_code: '07206',
        sqft: 900,
        bedrooms: 2,
        bathrooms: 1,
        kitchens: 1,
        frequency: 'ONE_TIME',
        scheduledAt,
        final_estimated_price: 144,
      }),
    });

    const id = res.data.id || res.data.booking?.id || res.data.data?.id;
    if (id) setBookingId(id);
  }

  async function checkAvailableJobs() {
    if (!proToken?.token) {
      setResult('booking', 'error', 'Check Available Jobs', { error: 'Login as Pro first' });
      return;
    }

    const res = await apiCall('booking', 'Check Available Jobs', '/bookings/available', proToken.token);
    const rows = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    setResult(res.ok ? 'booking' : 'booking', res.ok ? 'ok' : 'error', 'Check Available Jobs', {
      count: rows.length,
      first3: rows.slice(0, 3).map((j: any) => ({
        id: j.id,
        address: [j.address, j.city, j.state].filter(Boolean).join(', '),
        service_type: j.service_type,
      })),
      response: res.data,
    });
  }

  async function claimJob() {
    if (!proToken?.token || !bookingId) {
      setResult('booking', 'error', 'Claim Job', { error: 'Login as Pro and create booking first' });
      return;
    }

    await apiCall('booking', 'Claim Job', '/bookings/' + bookingId + '/claim', proToken.token, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt, hourlyRate: 18 }),
    });
  }

  async function sendMessage(sender: 'pro' | 'client') {
    const token = sender === 'pro' ? proToken?.token : clientToken?.token;
    if (!token || !bookingId) {
      setResult('messages', 'error', 'Send Message', { error: 'Need token and bookingId first' });
      return;
    }

    const content = sender === 'pro'
      ? 'Hola! Soy tu profesional de EverClean. Confirmo tu servicio para manana. Estoy listo!'
      : 'Perfecto! Te espero a las 10am. El codigo de acceso es el 1234.';

    await apiCall('messages', 'Send Message (' + sender + ')', '/bookings/' + bookingId + '/messages', token, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async function unreadMessages() {
    if (!proToken?.token) {
      setResult('messages', 'error', 'Check Unread Messages (Pro)', { error: 'Login as Pro first' });
      return;
    }
    await apiCall('messages', 'Check Unread Messages (Pro)', '/messages/unread', proToken.token);
  }

  async function allMessages() {
    if (!proToken?.token || !bookingId) {
      setResult('messages', 'error', 'Get All Messages', { error: 'Need proToken and bookingId first' });
      return;
    }
    await apiCall('messages', 'Get All Messages', '/bookings/' + bookingId + '/messages', proToken.token);
  }

  async function sendEta() {
    if (!proToken?.token || !bookingId) {
      setResult('eta', 'error', 'Send ETA', { error: 'Need proToken and bookingId first' });
      return;
    }

    await apiCall('eta', 'Send ETA', '/bookings/' + bookingId + '/eta', proToken.token, {
      method: 'POST',
      body: JSON.stringify({
        eta_minutes: 15,
        eta_message: 'En camino! Llego en 15 minutos.',
        pro_lat: 40.6636,
        pro_lng: -74.2107,
      }),
    });
  }

  async function getEta() {
    if (!clientToken?.token || !bookingId) {
      setResult('eta', 'error', 'Get ETA (Client view)', { error: 'Need clientToken and bookingId first' });
      return;
    }
    await apiCall('eta', 'Get ETA (Client view)', '/bookings/' + bookingId + '/eta', clientToken.token);
  }

  async function checkIn() {
    if (!proToken?.token || !bookingId) {
      setResult('completion', 'error', 'Check In', { error: 'Need proToken and bookingId first' });
      return;
    }
    await apiCall('completion', 'Check In', '/bookings/' + bookingId + '/checkin', proToken.token, { method: 'POST' });
  }

  async function completeService() {
    if (!proToken?.token || !bookingId) {
      setResult('completion', 'error', 'Complete Service', { error: 'Need proToken and bookingId first' });
      return;
    }
    await apiCall('completion', 'Complete Service', '/bookings/' + bookingId + '/checkout', proToken.token, { method: 'POST' });
  }

  async function autocomplete() {
    const q = encodeURIComponent(autocompleteInput);
    await apiCall('autocomplete', 'Address Autocomplete', '/address-suggestions?input=' + q);
  }

  async function testEmail() {
    await apiCall('notifications', 'Test Email', '/webhooks/n8n', undefined, {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'TEST_EMAIL',
        source: 'test_dashboard',
        payload: {
          message: 'Test email from EverClean admin dashboard',
          to: 'notifications@evercleanapp.com',
        },
        severity: 'LOW',
      }),
    });
  }

  async function testSmsHub() {
    if (!adminToken?.token) {
      setResult('notifications', 'error', 'Test SMS Hub', { error: 'Login as Admin first' });
      return;
    }
    if (!bookingId) {
      setResult('notifications', 'error', 'Test SMS Hub', { error: 'Create booking first' });
      return;
    }

    await apiCall('notifications', 'Test SMS Hub', '/bookings/' + bookingId + '/messages', adminToken.token, {
      method: 'POST',
      body: JSON.stringify({ content: 'Test SMS hub message from internal admin dashboard.' }),
    });
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: C.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ background: '#FEF3C7', border: '1px solid ' + C.yellow, borderRadius: 10, padding: 14, color: '#92400E', fontWeight: 900 }}>
          TEST MODE — Internal use only. All actions use test accounts.
        </div>

        <div style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: 10, padding: 18 }}>
          <h1 style={{ margin: 0, color: C.navy, fontSize: 26 }}>EverClean Internal Test Suite</h1>
          <p style={{ color: C.muted, margin: '6px 0 16px' }}>Verify auth, booking, protected communication, ETA, completion, address, and notifications.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div><strong>Client token:</strong> {clientToken?.token ? '✅' : '❌'}</div>
            <div><strong>Pro token:</strong> {proToken?.token ? '✅' : '❌'}</div>
            <div><strong>Admin token:</strong> {adminToken?.token ? '✅' : '❌'}</div>
            <div><strong>Booking ID:</strong> {bookingId || 'not created'}</div>
            <div style={{ gridColumn: '1 / -1' }}><strong>Last test:</strong> {lastTest}</div>
          </div>
        </div>

        <Section icon="🔐" title="Auth Tests" description="Logs in all hardcoded test accounts and stores tokens in component state only." result={results.auth}>
          <Button onClick={() => login('client')}>Login as Client</Button>
          <Button onClick={() => login('pro')}>Login as Pro</Button>
          <Button onClick={() => login('admin')}>Login as Admin</Button>
        </Section>

        <Section icon="🧾" title="Booking Flow Test" description="Creates a test booking, checks marketplace availability, and claims it as the professional." result={results.booking}>
          <Button onClick={createBooking}>Create Test Booking</Button>
          <Button onClick={checkAvailableJobs} tone="light">Check Available Jobs</Button>
          <Button onClick={claimJob} tone="green">Claim Job</Button>
        </Section>

        <Section icon="💬" title="Communication Tests" description="Verifies protected booking messages and unread message count." result={results.messages}>
          <Button onClick={() => sendMessage('pro')}>Send Message (Pro to Client)</Button>
          <Button onClick={() => sendMessage('client')}>Send Message (Client to Pro)</Button>
          <Button onClick={unreadMessages} tone="light">Check Unread Messages (Pro)</Button>
          <Button onClick={allMessages} tone="light">Get All Messages</Button>
        </Section>

        <Section icon="🧭" title="ETA and Navigation Test" description="Sends professional ETA and retrieves it from client view." result={results.eta}>
          <Button onClick={sendEta}>Send ETA</Button>
          <Button onClick={getEta} tone="light">Get ETA (Client view)</Button>
        </Section>

        <Section icon="✅" title="Service Completion Test" description="Checks in and completes the service flow." result={results.completion}>
          <Button onClick={checkIn}>Check In</Button>
          <Button onClick={completeService} tone="green">Complete Service</Button>
        </Section>

        <Section icon="📍" title="Address Autocomplete Test" description="Checks Google-backed address suggestions." result={results.autocomplete}>
          <input
            value={autocompleteInput}
            onChange={(e) => setAutocompleteInput(e.target.value)}
            style={{ border: '1px solid ' + C.border, borderRadius: 8, padding: '10px 12px', minWidth: 260 }}
          />
          <Button onClick={autocomplete}>Test Autocomplete</Button>
        </Section>

        <Section icon="🔔" title="Notification Tests" description="Triggers n8n email webhook and SMS hub message path." result={results.notifications}>
          <Button onClick={testEmail}>Test Email</Button>
          <Button onClick={testSmsHub} tone="light">Test SMS Hub</Button>
        </Section>
      </div>
    </div>
  );
}
