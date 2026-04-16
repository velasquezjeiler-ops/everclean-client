'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

type Mode = 'choose' | 'email' | 'phone_enter' | 'phone_otp';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  function startResendTimer() {
    setResendTimer(60);
    const iv = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  }

  function redirectByRole(role: string) {
    if (role === 'PROFESSIONAL') router.push('/pro/dashboard');
    else if (role === 'ADMIN') window.location.href = 'https://everclean-admin.vercel.app';
    else router.push('/dashboard');
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', data.role);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      redirectByRole(data.role);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(API + '/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setMode('phone_otp');
      startResendTimer();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(API + '/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', data.role);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      redirectByRole(data.role);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">EC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">EverClean</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {mode === 'choose' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <button onClick={() => setMode('phone_enter')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-all text-left">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">📱</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Sign in with phone</p>
                <p className="text-xs text-gray-500">Receive a 6-digit code by SMS</p>
              </div>
              <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Recommended</span>
            </button>
            <button onClick={() => setMode('email')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">✉️</div>
              <div>
                <p className="font-semibold text-gray-900">Sign in with email</p>
                <p className="text-xs text-gray-500">Use your email and password</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'email' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <button onClick={() => { setMode('choose'); setError(''); }} className="text-sm text-gray-500 mb-4 flex items-center gap-1 hover:text-gray-700">← Back</button>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sign in with email</h2>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800 disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        )}

        {mode === 'phone_enter' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <button onClick={() => { setMode('choose'); setError(''); }} className="text-sm text-gray-500 mb-4 flex items-center gap-1 hover:text-gray-700">← Back</button>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter your phone</h2>
            <p className="text-sm text-gray-500 mb-5">We'll send a 6-digit verification code</p>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Phone number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-600 font-medium">🇺🇸 +1</div>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(201) 555-0001" required
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send verification code'}
              </button>
            </form>
          </div>
        )}

        {mode === 'phone_otp' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <button onClick={() => { setMode('phone_enter'); setError(''); setOtp(''); }} className="text-sm text-gray-500 mb-4 flex items-center gap-1 hover:text-gray-700">← Back</button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">📱</div>
              <h2 className="text-lg font-semibold text-gray-900">Check your phone</h2>
              <p className="text-sm text-gray-500 mt-1">Code sent to <span className="font-medium text-gray-700">{phone}</span></p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input type="text" inputMode="numeric" pattern="[0-9]{6}" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" required maxLength={6}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-2xl font-bold text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800 disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & sign in'}
              </button>
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-xs text-gray-400">Resend in {resendTimer}s</p>
                ) : (
                  <button type="button" onClick={async () => {
                    setLoading(true);
                    await fetch(API+'/auth/send-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone }) });
                    startResendTimer(); setLoading(false);
                  }} className="text-xs text-emerald-700 font-medium hover:underline">
                    Didn't receive it? Resend code
                  </button>
                )}
              </div>
            </form>
            <div className="mt-4 p-3 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-700 text-center">Code expires in 5 minutes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
