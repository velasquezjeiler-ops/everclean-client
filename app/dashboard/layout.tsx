'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '../../lib/i18n/useTranslation';
import LanguageSelector from '../../lib/i18n/LanguageSelector';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const [ready, setReady] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientInitial, setClientInitial] = useState('C');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) { router.push('/'); return; }
    if (role === 'PROFESSIONAL') { router.push('/pro/dashboard'); return; }
    if (role === 'ADMIN') { window.location.href = 'https://everclean-admin.vercel.app'; return; }
    setReady(true);
    fetch(API+'/auth/me', { headers: { Authorization: 'Bearer '+token } })
      .then(r => r.json()).then(d => {
        const name = d.name || d.email?.split('@')[0] || '';
        setClientName(name);
        setClientInitial((name[0] || 'C').toUpperCase());
      }).catch(() => {});
  }, [router]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function logout() { localStorage.clear(); router.push('/'); }

  const navItems = [
    { href: '/dashboard', label: t('sidebar.myServices'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { href: '/dashboard/new-booking', label: t('sidebar.request'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg> },
    { href: '/dashboard/history', label: t('sidebar.history'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { href: '/dashboard/profile', label: t('sidebar.myProfile'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  ];

  if (!ready) return null;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className={`${mobile ? 'p-5' : 'p-4'} border-b border-white/10`}>
        <div className="flex items-center gap-3 mb-4">
          <Image src="/logo.jpg" alt="EverClean" width={36} height={36} className="rounded-lg shadow-md" />
          <div><p className="font-bold text-white text-sm">EverClean</p><p className="text-[10px] text-blue-300 font-semibold tracking-wider uppercase">{t('sidebar.client')}</p></div>
        </div>
        {clientName && (
          <div className="flex items-center gap-2.5 bg-white/10 rounded-xl p-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{clientInitial}</div>
            <div className="min-w-0"><p className="text-white text-xs font-medium truncate">{clientName}</p><p className="text-blue-300/70 text-[10px]">{t('sidebar.client')}</p></div>
          </div>
        )}
      </div>
      <nav className={`flex-1 ${mobile ? 'p-4' : 'p-3'} space-y-1`}>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-white/15 text-white font-medium border-l-2 border-blue-400' : 'text-white/60 hover:bg-white/8 hover:text-white/90'}`}>
              <span className={isActive ? 'text-blue-400' : ''}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={`${mobile ? 'p-4' : 'p-3'} border-t border-white/10 space-y-2`}>
        <LanguageSelector lang={lang} setLang={setLang} />
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40" style={{background:'linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%)'}}>
        <div className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="EC" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white text-sm">EverClean</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:bg-white/10">
          {menuOpen ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
        </button>
      </header>
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-30">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 h-full ec-sidebar flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}><SidebarContent mobile /></div>
        </div>
      )}
      <aside className="hidden md:flex w-56 ec-sidebar flex-col min-h-screen flex-shrink-0"><SidebarContent /></aside>
      <main className="flex-1 p-4 md:p-6 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
