'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const C = {
  navy: '#0D3781', navyDark: '#081f4a', blue: '#1565C0',
  green: '#4CAF50', greenDk: '#388E3C', bg: '#F5F7FA',
  surface: '#FFFFFF', text: '#0D1B2A', muted: '#64748B',
  border: '#E2E8F0', warning: '#F59E0B', danger: '#DC2626',
};

// Custom SVG Icons
const Icon = {
  Home: ({ color = '#fff', size = 20 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Plus: ({ color = '#fff', size = 20 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  History: ({ color = '#fff', size = 20 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 8v4l2.5 2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M3.05 11a9 9 0 1 0 .5-3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M3 5v3h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Profile: ({ color = '#fff', size = 20 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Logout: ({ color = '#fff', size = 18 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Dollar: ({ color = C.green, size = 16 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Broom: ({ color = '#fff', size = 20 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 3l3 3-7 7-3-3 7-7z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 6l6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12.5 13.5l7 1-5 7-3-4.5" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  Sparkle: ({ color = C.warning, size = 16 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z"/>
    </svg>
  ),
  Phone: ({ color = '#fff', size = 14 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  MapPin: ({ color = C.blue, size = 12 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8"/>
    </svg>
  ),
  Menu: ({ color = '#fff', size = 22 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  X: ({ color = '#fff', size = 22 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  ClipBoard: ({ color = '#fff', size = 18 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="1.8"/>
      <path d="M8 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2" stroke={color} strokeWidth="1.8"/>
      <path d="M8 12h8M8 16h5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  PENDING_ASSIGNMENT: { label: 'Finding Cleaner', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  CONFIRMED:          { label: 'Confirmed', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  IN_PROGRESS:        { label: 'In Progress', bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6' },
  COMPLETED:          { label: 'Completed', bg: '#D1FAE5', color: '#065F46', dot: C.green },
  CANCELLED:          { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', dot: C.danger },
};

const SERVICE_ICONS: Record<string, string> = {
  HOUSE_CLEANING: '🏠', DEEP_CLEANING: '✨', MOVE_IN_OUT: '📦',
  SAME_DAY_CLEANING: '⚡', OFFICE_CLEANING: '🏢', POST_CONSTRUCTION: '🔨',
  MEDICAL_CLEANING: '🏥', CARPET_CLEANING: '🛋', WINDOW_CLEANING: '🪟',
  ORGANIZING: '📋', CAR_WASH: '🚗', LAUNDRY_PICKUP: '👕', DRY_CLEANING: '👔',
};

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'My Services', IconC: Icon.Home },
  { href: '/dashboard/new-booking', label: 'Book Now', IconC: Icon.Plus },
  { href: '/dashboard/history', label: 'History', IconC: Icon.History },
  { href: '/dashboard/profile', label: 'Profile', IconC: Icon.Profile },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientInitial, setClientInitial] = useState('C');
  const [menuOpen, setMenuOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) { router.push('/'); return; }
    if (role === 'PROFESSIONAL') { router.push('/pro/dashboard'); return; }
    if (role === 'ADMIN') { window.location.href = 'https://everclean-admin.vercel.app'; return; }
    setReady(true);
    fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => {
        const name = d.name || d.email?.split('@')[0] || '';
        setClientName(name);
        setClientInitial((name[0] || 'C').toUpperCase());
      }).catch(() => {});
    fetch(API + '/bookings', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => setBookings(d.data || [])).catch(() => {});
  }, [router]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function logout() { localStorage.clear(); router.push('/'); }

  const active = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const totalSpent = completed.reduce((s, b) => s + Number(b.client_price || b.total_amount || 0), 0);

  if (!ready) return null;

  const SidebarContent = () => (
    <>
      {/* Glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: 'radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #4CAF50, #1565C0)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(76,175,80,0.4)', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="11" height="18" rx="1.5" fill="rgba(255,255,255,0.7)"/>
              <rect x="14" y="8" width="7" height="13" rx="1.5" fill="rgba(255,255,255,0.5)"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
              <span>Ever</span><span style={{ color: C.green }}>Clean</span>
            </div>
            <div style={{ fontSize: 9, color: `${C.green}cc`, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Client Portal</div>
          </div>
        </div>
        {/* User card */}
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #1565C0, #0D3781)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0 }}>
            {clientInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName || 'Client'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>EverClean Member</div>
          </div>
          {active.length > 0 && (
            <div style={{ background: C.green, color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '2px 7px', flexShrink: 0 }}>
              {active.length}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '6px 8px', marginBottom: 4 }}>Menu</div>
        {NAV_ITEMS.map(({ href, label, IconC }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 10, marginBottom: 2, cursor: 'pointer', transition: 'all 0.2s',
                background: isActive ? 'rgba(21,101,192,0.25)' : 'transparent',
                border: isActive ? '1px solid rgba(21,101,192,0.3)' : '1px solid transparent',
                position: 'relative',
              }}>
                {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: C.blue, borderRadius: '0 3px 3px 0' }}/>}
                <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(21,101,192,0.25)' : 'rgba(255,255,255,0.06)' }}>
                  <IconC color={isActive ? '#60A5FA' : 'rgba(255,255,255,0.5)'} size={16}/>
                </div>
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <Icon.Logout color="rgba(255,255,255,0.3)" size={16}/>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Sign Out</span>
        </button>
      </div>
    </>
  );

  const RightPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Active', value: active.length, color: C.blue, bg: '#DBEAFE' },
          { label: 'Done', value: completed.length, color: C.greenDk, bg: '#D1FAE5' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Poppins, sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, opacity: 0.7, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: `linear-gradient(135deg, ${C.navy}15, ${C.blue}15)`, border: `1px solid ${C.blue}20`, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: 'Poppins, sans-serif' }}>${totalSpent.toFixed(0)}</div>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>Total Spent</div>
      </div>

      {/* Book Now CTA */}
      <Link href="/dashboard/new-booking" style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 0', borderRadius: 12, cursor: 'pointer',
          background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
          color: '#fff', fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 14px rgba(13,55,129,0.3)',
        }}>
          <Icon.Plus color="#fff" size={16}/>
          Book a Service
        </div>
      </Link>

      {/* Active Bookings */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Active Services</div>
        {active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', background: C.bg, borderRadius: 12, border: `1px dashed ${C.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🧹</div>
            <div style={{ fontSize: 11, color: C.muted }}>No active services</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 340 }}>
            {active.slice(0, 5).map(b => {
              const pro = b.professionals?.[0]?.professional;
              const s = STATUS[b.status] || STATUS.PENDING_ASSIGNMENT;
              return (
                <div key={b.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: '10px 12px', boxShadow: '0 1px 6px rgba(13,55,129,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16 }}>{SERVICE_ICONS[b.service_type] || '🧹'}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{(b.service_type || '').replace(/_/g, ' ')}</div>
                        {b.scheduled_at && <div style={{ fontSize: 10, color: C.muted }}>{new Date(b.scheduled_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>}
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }}/>
                      {s.label}
                    </span>
                  </div>
                  {b.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.muted, fontSize: 10 }}>
                      <Icon.MapPin color={C.muted} size={10}/>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address}</span>
                    </div>
                  )}
                  {(b.client_price || b.total_amount) && (
                    <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: C.greenDk }}>
                      ${b.client_price || b.total_amount}
                    </div>
                  )}
                  {pro && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, padding: '6px 8px', background: '#D1FAE5', borderRadius: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{(pro.fullName || 'C')[0]}</div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.greenDk, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pro.fullName}</span>
                      {pro.phone && (
                        <a href={`tel:${pro.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.green, color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                          <Icon.Phone color="#fff" size={10}/> Call
                        </a>
                      )}
                    </div>
                  )}
                  {!pro && b.status === 'PENDING_ASSIGNMENT' && (
                    <div style={{ marginTop: 6, fontSize: 10, color: C.warning, fontWeight: 600 }}>⏳ Finding your cleaner...</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const sidebarStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 45%, #0d4a2e 100%)`,
    display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'Poppins, DM Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .client-sidebar { display: none !important; }
          .client-right { display: none !important; }
          .client-main { margin-left: 0 !important; padding-bottom: 80px !important; }
        }
        @media (min-width: 769px) {
          .mobile-client-header { display: none !important; }
          .mobile-client-nav { display: none !important; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="client-sidebar" style={{ width: 240, minHeight: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, ...sidebarStyle }}>
        <SidebarContent/>
      </aside>

      {/* Mobile Header */}
      <header className="mobile-client-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`,
        padding: '11px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 16px rgba(13,55,129,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #4CAF50, #1565C0)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="11" height="18" rx="1.5" fill="rgba(255,255,255,0.7)"/></svg>
          </div>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff' }}>
            Ever<span style={{ color: C.green }}>Clean</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setRightOpen(!rightOpen)} style={{ position: 'relative', width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.ClipBoard color="#fff" size={16}/>
            {active.length > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, background: C.green, borderRadius: '50%', fontSize: 9, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{active.length}</span>}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {menuOpen ? <Icon.X size={18}/> : <Icon.Menu size={18}/>}
          </button>
        </div>
      </header>

      {/* Mobile Left Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, top: 57, zIndex: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMenuOpen(false)}/>
          <div style={{ position: 'relative', width: 260, height: '100%', ...sidebarStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <SidebarContent/>
          </div>
        </div>
      )}

      {/* Mobile Right Panel */}
      {rightOpen && (
        <div style={{ position: 'fixed', inset: 0, top: 57, zIndex: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setRightOpen(false)}/>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 300, background: C.bg, padding: 14, overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <RightPanel/>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="client-main" style={{ marginLeft: 240, flex: 1, padding: '20px', minWidth: 0 }}>
        {children}
      </main>

      {/* Desktop Right Panel */}
      <aside className="client-right" style={{ width: 272, flexShrink: 0, padding: '20px 14px 20px 0', borderLeft: `1px solid ${C.border}`, background: C.bg, overflow: 'auto' }}>
        <RightPanel/>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-client-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff', borderTop: `1px solid ${C.border}`,
        display: 'flex', boxShadow: '0 -4px 20px rgba(13,55,129,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(({ href, label, IconC }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 6px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3,
                  background: isActive ? `linear-gradient(135deg, ${C.navy}, ${C.blue})` : 'transparent',
                  boxShadow: isActive ? '0 3px 10px rgba(13,55,129,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  <IconC color={isActive ? '#fff' : C.muted} size={17}/>
                </div>
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? C.navy : C.muted }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

