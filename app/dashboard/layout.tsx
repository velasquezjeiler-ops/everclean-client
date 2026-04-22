'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n/useTranslation';
import LanguageSelector from '../../lib/i18n/LanguageSelector';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const [ready, setReady] = useState(false);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) { router.push('/'); return; }
    if (role === 'PROFESSIONAL') { router.push('/pro/dashboard'); return; }
    if (role === 'ADMIN') { window.location.href = 'https://everclean-admin.vercel.app'; return; }
    setReady(true);
    fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => setClientName(d.name || d.email?.split('@')[0] || '')).catch(() => {});
  }, [router]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/');
  }

  const navItems = [
    { href: '/dashboard', label: t('sidebar.myServices'), icon: '🧹' },
    { href: '/dashboard/new-booking', label: t('sidebar.request'), icon: '➕' },
    { href: '/dashboard/history', label: t('sidebar.history'), icon: '📋' },
    { href: '/dashboard/profile', label: t('sidebar.myProfile'), icon: '👤' },
  ];

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-44 bg-white border-r border-gray-200 flex flex-col min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">EC</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">EverClean</p>
              <p className="text-xs text-blue-600 font-medium">{t('sidebar.client')}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <LanguageSelector lang={lang} setLang={setLang} />
          {clientName && <p className="text-xs text-gray-500 px-3 truncate">{clientName}</p>}
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <span className="text-base">🚪</span>
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
