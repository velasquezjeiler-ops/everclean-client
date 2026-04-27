'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n/useTranslation';
import LanguageSelector from '../../lib/i18n/LanguageSelector';

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const [ready, setReady] = useState(false);
  const [proName, setProName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) { router.push('/'); return; }
    if (role === 'CLIENT') { router.push('/dashboard'); return; }
    if (role === 'ADMIN') { window.location.href = 'https://everclean-admin.vercel.app'; return; }
    setReady(true);
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';
    fetch(API+'/professionals/me', { headers: { Authorization: 'Bearer '+token } })
      .then(r => r.json()).then(d => setProName(d.full_name || d.fullName || '')).catch(() => {});
  }, [router]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/');
  }

  const navItems = [
    { href: '/pro/dashboard', label: t('sidebar.myJobs'), icon: '🧹' },
    { href: '/pro/marketplace', label: t('sidebar.available'), icon: '🔍' },
    { href: '/pro/history', label: t('sidebar.history'), icon: '🔥' },
    { href: '/pro/profile', label: t('sidebar.myProfile'), icon: '👤' },
  ];

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">EC</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">EverClean</span>
          <span className="text-xs text-emerald-600 font-medium">{t('sidebar.professional')}</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100">
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-black/50 z-30" onClick={() => setMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-4 space-y-2" onClick={e => e.stopPropagation()}>
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600'}`}>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-gray-100 pt-3 mt-3">
              <LanguageSelector lang={lang} setLang={setLang} />
            </div>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50">
              <span className="text-lg">🚪</span>
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-44 bg-white border-r border-gray-200 flex-col min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">EC</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">EverClean</p>
              <p className="text-xs text-emerald-600 font-medium">{t('sidebar.professional')}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <LanguageSelector lang={lang} setLang={setLang} />
          {proName && <p className="text-xs text-gray-500 px-3 truncate">{proName}</p>}
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600">
            <span className="text-base">🚪</span>
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
