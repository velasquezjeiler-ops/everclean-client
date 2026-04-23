'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../lib/i18n/useTranslation';
import LanguageSelector from '../lib/i18n/LanguageSelector';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function LoginPage() {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<'email'|'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(''); setLoading(true);
    try {
      const body = mode === 'email' ? { email, password } : { phone };
      const res = await fetch(API+'/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.invalidCredentials'));
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role', data.role);
      if (data.role === 'ADMIN') window.location.href = 'https://everclean-admin.vercel.app';
      else if (data.role === 'PROFESSIONAL') router.push('/pro/dashboard');
      else router.push('/dashboard');
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">EC</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">EverClean</h1>
          <p className="text-sm text-gray-500 mt-1">{t('auth.signIn')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={()=>setMode('email')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${mode==='email'?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>{t('common.email')}</button>
            <button onClick={()=>setMode('phone')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${mode==='phone'?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>{t('common.phone')}</button>
          </div>

          {mode === 'email' ? (
            <>
              <div><label className="text-xs text-gray-600 block mb-1">{t('auth.emailLabel')}</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs text-gray-600 block mb-1">{t('auth.passwordLabel')}</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </>
          ) : (
            <div><label className="text-xs text-gray-600 block mb-1">{t('auth.phoneLabel')}</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+12015550001" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

          <button onClick={handleLogin} disabled={loading} className="w-full bg-emerald-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
            {loading ? t('common.loading') : t('auth.loginButton')}
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="w-48">
            <LanguageSelector lang={lang} setLang={setLang} />
          </div>
        </div>
      </div>
    </div>
  );
}

