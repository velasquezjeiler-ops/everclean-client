'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
    <div className="min-h-screen flex">
      {/* Left: Hero panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{background:'linear-gradient(135deg, #0f2942 0%, #1a3a5c 50%, #1e4d2b 100%)'}}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="mb-8">
            <Image src="/logo.jpg" alt="EverClean" width={80} height={80} className="rounded-2xl shadow-2xl" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Professional<br />Cleaning<br /><span className="text-green-400">Made Simple</span>
          </h1>
          <p className="text-lg text-blue-200/80 max-w-md mb-8">
            The #1 platform connecting cleaning professionals with clients across New Jersey.
          </p>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-xs text-blue-300">Professionals</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-xs text-blue-300">Services Done</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">4.9★</p>
              <p className="text-xs text-blue-300">Avg Rating</p>
            </div>
          </div>
          <div className="flex gap-3 mt-10">
            {['🏠 Residential','🏢 Commercial','👔 Laundry','🚗 Car Wash'].map(s => (
              <span key={s} className="text-xs bg-white/10 text-white/80 px-3 py-1.5 rounded-full border border-white/10">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.jpg" alt="EverClean" width={64} height={64} className="rounded-xl shadow-lg mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">EverClean</h1>
            <p className="text-sm text-gray-500">Professional Cleaning Services</p>
          </div>

          <div className="lg:mb-8">
            <h2 className="text-2xl font-bold text-gray-900 hidden lg:block">{t('auth.welcomeBack')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('auth.signIn')}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={()=>setMode('email')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode==='email'?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>
                <span className="mr-1.5">📧</span>{t('common.email')}
              </button>
              <button onClick={()=>setMode('phone')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode==='phone'?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>
                <span className="mr-1.5">📱</span>{t('common.phone')}
              </button>
            </div>

            {mode === 'email' ? (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">{t('auth.emailLabel')}</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">{t('auth.passwordLabel')}</label>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">{t('auth.phoneLabel')}</label>
                <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
                  placeholder="+1 (201) 555-0001"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
            )}

            {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3"><span>⚠️</span>{error}</div>}

            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{background:'linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%)'}}>
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('common.loading')}</span> : t('auth.loginButton')}
            </button>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="w-52"><LanguageSelector lang={lang} setLang={setLang} /></div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            © 2026 EverClean App. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
