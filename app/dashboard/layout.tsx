'use client';
import { useEffect, useState, useCallback } from 'react';
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
  const [bookings, setBookings] = useState<any[]>([]);
  const [rightOpen, setRightOpen] = useState(false);

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
    fetch(API+'/bookings', { headers: { Authorization: 'Bearer '+token } })
      .then(r => r.json()).then(d => setBookings(d.data || [])).catch(() => {});
  }, [router]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function logout() { localStorage.clear(); router.push('/'); }

  const active = bookings.filter(b => !['COMPLETED','CANCELLED'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const totalSpent = completed.reduce((s, b) => s + Number(b.client_price || b.total_amount || 0), 0);

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

  const RightPanel = () => (
    <div className="flex flex-col gap-4 h-full">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
          <p className="text-lg font-bold text-emerald-600">{active.length}</p>
          <p className="text-[10px] text-gray-400">Activos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-800">{completed.length}</p>
          <p className="text-[10px] text-gray-400">Completados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
          <p className="text-lg font-bold text-blue-600">${totalSpent.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400">Total</p>
        </div>
      </div>

      {/* Quick book */}
      <Link href="/dashboard/new-booking"
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
        style={{background:'linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%)'}}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        + Book Now
      </Link>

      {/* Active bookings */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Servicios activos</p>
        {active.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-2xl mb-1">🧹</p>
            <p className="text-xs text-gray-400">No hay servicios activos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {active.slice(0, 5).map(b => {
              const pro = b.professionals?.[0]?.professional;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <p className="text-xs font-semibold text-gray-800 truncate">{b.service_type?.replace(/_/g,' ')}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                      b.status==='CONFIRMED' ? 'bg-blue-50 text-blue-700' :
                      b.status==='IN_PROGRESS' ? 'bg-purple-50 text-purple-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{b.status?.replace(/_/g,' ')}</span>
                  </div>
                  {b.scheduled_at && (
                    <p className="text-[10px] text-gray-400">📅 {new Date(b.scheduled_at).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                  )}
                  {b.address && <p className="text-[10px] text-gray-400 truncate">📍 {b.address}</p>}
                  {(b.client_price || b.total_amount) && (
                    <p className="text-[10px] font-semibold text-emerald-600 mt-1">${b.client_price || b.total_amount}</p>
                  )}
                  {pro && (
                    <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-emerald-50 rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-700">{(pro.fullName||'C')[0]}</div>
                      <p className="text-[10px] text-emerald-700 font-medium truncate">{pro.fullName}</p>
                      {pro.phone && <a href={`tel:${pro.phone}`} className="ml-auto text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md">Call</a>}
                    </div>
                  )}
                  {!pro && b.status === 'PENDING_ASSIGNMENT' && (
                    <p className="text-[10px] text-amber-500 mt-1">⏳ Finding cleaner...</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40" style={{background:'linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%)'}}>
        <div className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="EC" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white text-sm">EverClean</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Right panel toggle mobile */}
          <button onClick={() => setRightOpen(!rightOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/80 hover:bg-white/10 relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            {active.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full text-[9px] text-white flex items-center justify-center">{active.length}</span>}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/80 hover:bg-white/10">
            {menuOpen
              ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
          </button>
        </div>
      </header>

      {/* Mobile left menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-30">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 h-full ec-sidebar flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}><SidebarContent mobile /></div>
        </div>
      )}

      {/* Mobile right panel */}
      {rightOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-30">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRightOpen(false)} />
          <div className="absolute right-0 w-72 h-full bg-slate-50 flex flex-col overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <RightPanel />
          </div>
        </div>
      )}

      {/* Desktop left sidebar */}
      <aside className="hidden md:flex w-56 ec-sidebar flex-col min-h-screen flex-shrink-0"><SidebarContent /></aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 min-w-0 overflow-auto">{children}</main>

      {/* Desktop right panel */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 p-4 border-l border-gray-200 bg-slate-50 min-h-screen overflow-y-auto">
        <RightPanel />
      </aside>
    </div>
  );
}
