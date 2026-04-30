'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(''); setLoading(true);
    try {
      const res = await fetch(API+'/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role', data.role);
      if (data.role === 'ADMIN') window.location.href = 'https://everclean-admin.vercel.app';
      else if (data.role === 'PROFESSIONAL') router.push('/pro/dashboard');
      else router.push('/dashboard');
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center px-16 text-white"
        style={{background:'linear-gradient(135deg, #0f2942 0%, #1a3a5c 50%, #0d4a2e 100%)'}}>
        <div className="flex items-center gap-3 mb-8">
          <Image src="/logo.jpg" alt="EverClean" width={52} height={52} className="rounded-xl shadow-lg" />
          <div>
            <p className="text-2xl font-black">EverClean</p>
            <p className="text-emerald-400 text-sm font-semibold tracking-wider">PROFESSIONAL CLEANING</p>
          </div>
        </div>
        <h1 className="text-4xl font-black leading-tight mb-4">
          The smarter way<br/>to manage clean.
        </h1>
        <p className="text-white/60 text-lg leading-relaxed mb-8">
          Book services, track your cleaner in real-time, and manage everything from one dashboard.
        </p>
        <div className="flex flex-col gap-3">
          {['Instant pricing by sqft & state','Real-time cleaner tracking','Automated scheduling & billing'].map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-white/80 text-sm">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-8 justify-center">
            <Image src="/logo.jpg" alt="EverClean" width={44} height={44} className="rounded-xl" />
            <p className="text-xl font-black text-gray-900">EverClean</p>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{background:'linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%)'}}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            © 2026 EverClean · Professional Cleaning Platform
          </p>
        </div>
      </div>
    </div>
  );
}
