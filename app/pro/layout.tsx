// v2.3 - Pro layout with compact right panel and map
'use client';

import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const C = {
  navy: '#0D3781',
  navyDark: '#081f4a',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  bg: '#F5F7FA',
  text: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
  danger: '#DC2626',
};

const SVC_ICONS: Record<string, string> = {
  HOUSE_CLEANING: '🏠',
  DEEP_CLEANING: '✨',
  MOVE_IN_OUT: '📦',
  SAME_DAY_CLEANING: '⚡',
  OFFICE_CLEANING: '🏢',
  POST_CONSTRUCTION: '🔨',
  MEDICAL_CLEANING: '🏥',
  CARPET_CLEANING: '🛋',
  WINDOW_CLEANING: '🪟',
  ORGANIZING: '📋',
  CAR_WASH: '🚗',
  LAUNDRY_PICKUP: '👕',
  DRY_CLEANING: '👔',
};

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  PENDING_ASSIGNMENT: { label: 'Pending', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  CONFIRMED: { label: 'Confirmed', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  IN_PROGRESS: { label: 'In Progress', bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', color: '#065F46', dot: C.green },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', dot: C.danger },
};

const IC = {
  Jobs: ({ c = '#fff', s = 20 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke={c} strokeWidth="1.7" />
      <path d="M8 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 11h3M8 15h6" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16" cy="11" r="1.5" fill={c} />
    </svg>
  ),
  Market: ({ c = '#fff', s = 20 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.7" />
      <path d="M20 20l-3-3M11 8v3h3" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  History: ({ c = '#fff', s = 20 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 8v4l2.5 2.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3.1 11A9 9 0 1 0 4 8" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3 5v3h3" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Profile: ({ c = '#fff', s = 20 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.7" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Logout: ({ c = '#fff', s = 18 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5M21 12H9" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Menu: ({ c = '#fff', s = 22 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Camera: ({ c = '#fff', s = 18 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke={c} strokeWidth="1.7" />
    </svg>
  ),
  Map: ({ c = C.blue, s = 16 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={c} strokeWidth="1.7" />
      <circle cx="12" cy="9" r="2.5" stroke={c} strokeWidth="1.7" />
    </svg>
  ),
  Dollar: ({ c = C.green, s = 16 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Shield: ({ c = C.green, s = 16 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" fill={c} opacity="0.15" stroke={c} strokeWidth="1.7" />
      <path d="M9 12l2 2 4-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Star: ({ s = 14 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={C.warning}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Check: ({ c = '#fff', s = 16 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.7" />
      <path d="M9 12l2 2 4-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Card: ({ c = C.blue, s = 16 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" stroke={c} strokeWidth="1.7" />
      <path d="M2 10h20M6 15h4" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Arrow: ({ c = C.muted, s = 14 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function PhotoUpload({ initials }: { initials: string }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pro_photo');
    if (saved) setPhoto(saved);
  }, []);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Max 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      localStorage.setItem('pro_photo', result);
      setPhoto(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      {photo ? (
        <img src={photo} alt="Pro" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.green}` }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.green}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff', border: '2px solid rgba(255,255,255,0.2)' }}>
          {initials}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, background: C.blue, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
        <IC.Camera c="#fff" s={9} />
      </div>
    </div>
  );
}

function bookingAddress(booking: any) {
  return [booking.address, booking.city, booking.state].filter(Boolean).join(', ');
}

function mapsUrl(booking: any) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bookingAddress(booking))}`;
}

function RightPanel({ bookings }: { bookings: any[] }) {
  const active = bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const pending = bookings.filter((b) => b.status === 'PENDING_ASSIGNMENT');
  const earnings = completed.reduce((s, b) => s + Number(b.payout_amount || b.total_amount || 0), 0);
  const mapBooking = active.find((b) => b.address) || bookings.find((b) => b.address);

  return (
    <div className="pro-right-stack">
      <div className="pro-earnings-card">
        <div className="pro-panel-kicker light">Earnings Summary</div>
        <div className="pro-earnings-total">${earnings.toFixed(2)}</div>

        <div className="pro-earnings-grid">
          {[
            { label: 'Active', value: active.length, icon: '⚡' },
            { label: 'Done', value: completed.length, icon: '✅' },
            { label: 'Rating', value: '5.0★', icon: '⭐' },
            { label: 'Pending', value: pending.length, icon: '⏳' },
          ].map((item) => (
            <div key={item.label} className="pro-earnings-tile">
              <div>{item.icon} {item.label}</div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <section className="pro-side-card">
        <div className="pro-panel-kicker">Status</div>
        {[
          { label: 'Background Verified', bg: '#D1FAE5', color: C.greenDk, icon: <IC.Shield c={C.greenDk} s={14} />, href: '/pro/profile' },
          { label: 'ID Confirmed', bg: '#D1FAE5', color: C.greenDk, icon: <IC.Check c={C.greenDk} s={14} />, href: '/pro/profile' },
          { label: 'Payout Active', bg: '#DBEAFE', color: C.blue, icon: <IC.Card c={C.blue} s={14} />, href: '/pro/earnings' },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="pro-status-row" style={{ background: item.bg, color: item.color }}>
            {item.icon}
            <span>{item.label}</span>
            <IC.Arrow c={item.color} s={12} />
          </Link>
        ))}
      </section>

      <section className="pro-side-card">
        <div className="pro-panel-kicker">Active Jobs</div>
        {active.length === 0 ? (
          <div className="pro-empty-side">No active jobs</div>
        ) : (
          <div className="pro-side-list">
            {active.slice(0, 5).map((b) => {
              const s = STATUS[b.status] || STATUS.PENDING_ASSIGNMENT;
              const date = b.scheduled_at ? new Date(b.scheduled_at) : null;

              return (
                <a key={b.id} href={b.address ? mapsUrl(b) : '#'} target={b.address ? '_blank' : undefined} rel="noopener noreferrer" className="pro-job-mini">
                  <div className="pro-job-mini-top">
                    <div className="pro-job-mini-title">
                      <span>{SVC_ICONS[b.service_type] || '🧹'}</span>
                      <strong>{(b.service_type || '').replace(/_/g, ' ')}</strong>
                    </div>
                    <span className="pro-mini-badge" style={{ background: s.bg, color: s.color }}>
                      <span style={{ background: s.dot }} />
                      {s.label}
                    </span>
                  </div>
                  {date && <div className="pro-job-mini-date">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                  {b.address && (
                    <div className="pro-job-mini-address">
                      <IC.Map c={C.blue} s={11} />
                      {bookingAddress(b)}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </section>

      <section className="pro-side-card">
        <div className="pro-panel-kicker">Quick Access</div>
        {[
          { label: 'Find Jobs', href: '/pro/marketplace', icon: <IC.Market c={C.blue} s={16} />, bg: '#DBEAFE' },
          { label: 'My Earnings', href: '/pro/earnings', icon: <IC.Dollar c={C.greenDk} s={16} />, bg: '#D1FAE5' },
          { label: 'Edit Profile', href: '/pro/profile', icon: <IC.Profile c={C.navy} s={16} />, bg: `${C.navy}15` },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="pro-quick-row">
            <span style={{ background: item.bg }}>{item.icon}</span>
            <strong>{item.label}</strong>
            <IC.Arrow c={C.muted} s={13} />
          </Link>
        ))}
      </section>

      {mapBooking && (
        <section className="pro-side-card">
          <div className="pro-panel-kicker">Location</div>
          <div className="pro-map-box">
            <iframe title="job location" width="100%" height="100%" loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(bookingAddress(mapBooking))}&output=embed&z=15`} />
          </div>
          <a href={mapsUrl(mapBooking)} target="_blank" rel="noopener noreferrer" className="pro-map-button">
            <IC.Map c="#fff" s={14} />
            Open in Google Maps
          </a>
        </section>
      )}
    </div>
  );
}

export default function ProLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [proName, setProName] = useState('');
  const [proInitials, setProInitials] = useState('P');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/');
      return;
    }

    if (role === 'CLIENT') {
      router.push('/dashboard');
      return;
    }

    if (role === 'ADMIN') {
      window.location.href = 'https://everclean-admin.vercel.app';
      return;
    }

    setReady(true);

    fetch(API + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } })
      .then((r) => r.json())
      .then((d) => {
        const name = d.full_name || d.fullName || '';
        setProName(name);
        setProInitials(name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'P');
        setIsAvailable(d.is_available ?? false);
        setRating(d.avg_rating ? Number(d.avg_rating) : null);
      })
      .catch(() => {});

    fetch(API + '/professionals/me/bookings', { headers: { Authorization: 'Bearer ' + token } })
      .then((r) => r.json())
      .then((d) => setBookings(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function logout() {
    localStorage.clear();
    router.push('/');
  }

  const NAV = [
    { href: '/pro/dashboard', label: 'My Jobs', Icon: IC.Jobs },
    { href: '/pro/marketplace', label: 'Available', Icon: IC.Market },
    { href: '/pro/history', label: 'History', Icon: IC.History },
    { href: '/pro/profile', label: 'Profile', Icon: IC.Profile },
  ];

  if (!ready) return null;

  const sidebarBg = `linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 50%, #0d4a2e 100%)`;

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <Image src="/logo.jpg" alt="EverClean" width={40} height={40} style={{ borderRadius: 11, boxShadow: '0 3px 10px rgba(0,0,0,0.3)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>
              Ever<span style={{ color: C.green }}>Clean</span>
            </div>
            <div style={{ fontSize: 9, color: `${C.green}bb`, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Pro Portal
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <PhotoUpload initials={proInitials} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {proName || 'Professional'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {rating && (
                <>
                  <IC.Star s={10} />
                  <span style={{ fontSize: 10, color: '#fff', opacity: 0.7 }}>{rating.toFixed(1)}</span>
                </>
              )}
              <IC.Shield c={C.green} s={10} />
              <span style={{ fontSize: 9, color: `${C.green}cc`, fontWeight: 700 }}>VERIFIED</span>
            </div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isAvailable ? C.green : C.muted, boxShadow: isAvailable ? `0 0 6px ${C.green}` : 'none', flexShrink: 0 }} />
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 12, background: active ? 'rgba(255,255,255,0.16)' : 'transparent', border: active ? '1px solid rgba(255,255,255,0.16)' : '1px solid transparent', color: '#fff' }}>
                  <Icon c={active ? '#fff' : 'rgba(255,255,255,0.72)'} s={19} />
                  <span style={{ fontSize: 13, fontWeight: active ? 800 : 600, color: active ? '#fff' : 'rgba(255,255,255,0.72)' }}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={logout} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 12, padding: '11px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 800 }}>
          <IC.Logout s={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="pro-layout-root">
      <style>{`
        .pro-layout-root {
          min-height: 100vh;
          background: ${C.bg};
          color: ${C.text};
          font-family: Poppins, DM Sans, system-ui, sans-serif;
        }

        .pro-sidebar-desktop {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 244px;
          z-index: 40;
          background: ${sidebarBg};
          box-shadow: 8px 0 28px rgba(13, 55, 129, 0.16);
        }

        .pro-mobile-header,
        .pro-mobile-drawer-backdrop {
          display: none;
        }

        .pro-page-frame {
          min-height: 100vh;
          margin-left: 244px;
        }

        .pro-content-shell {
          width: 100%;
          max-width: 1460px;
          margin: 0 auto;
          padding: 24px 20px 40px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 20px;
          align-items: start;
        }

        .pro-main {
          min-width: 0;
          width: 100%;
        }

        .pro-right-desktop {
          width: 300px;
          position: sticky;
          top: 20px;
        }

        .pro-right-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pro-earnings-card {
          background: linear-gradient(135deg, ${C.navy}, ${C.blue});
          border-radius: 18px;
          padding: 18px;
          color: #fff;
          box-shadow: 0 8px 26px rgba(13, 55, 129, 0.26);
        }

        .pro-panel-kicker {
          font-size: 11px;
          font-weight: 900;
          color: ${C.muted};
          text-transform: uppercase;
          letter-spacing: 1.6px;
          margin-bottom: 10px;
        }

        .pro-panel-kicker.light {
          color: rgba(255,255,255,0.55);
        }

        .pro-earnings-total {
          font-size: 32px;
          font-weight: 900;
          margin-bottom: 14px;
          line-height: 1;
        }

        .pro-earnings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .pro-earnings-tile {
          background: rgba(255,255,255,0.12);
          border-radius: 11px;
          padding: 8px 10px;
        }

        .pro-earnings-tile div {
          font-size: 10px;
          opacity: 0.72;
          margin-bottom: 4px;
        }

        .pro-earnings-tile strong {
          font-size: 17px;
          font-weight: 900;
        }

        .pro-side-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid ${C.border};
          padding: 14px;
          box-shadow: 0 2px 12px rgba(13, 55, 129, 0.05);
        }

        .pro-status-row,
        .pro-quick-row {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 40px;
          border-radius: 11px;
          margin-bottom: 7px;
          padding: 8px 10px;
        }

        .pro-status-row span,
        .pro-quick-row strong {
          flex: 1;
          font-size: 12px;
          font-weight: 800;
        }

        .pro-quick-row {
          border: 1px solid ${C.border};
          color: ${C.text};
          background: #fff;
        }

        .pro-quick-row > span:first-child {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pro-empty-side {
          text-align: center;
          padding: 18px 0;
          border-radius: 12px;
          border: 1px dashed ${C.border};
          background: ${C.bg};
          color: ${C.muted};
          font-size: 12px;
          font-weight: 700;
        }

        .pro-side-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 390px;
          overflow-y: auto;
          padding-right: 3px;
        }

        .pro-job-mini {
          text-decoration: none;
          color: ${C.text};
          background: ${C.bg};
          border: 1px solid ${C.border};
          border-radius: 13px;
          padding: 10px 11px;
          display: block;
        }

        .pro-job-mini-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 5px;
        }

        .pro-job-mini-title {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .pro-job-mini-title strong {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.15;
        }

        .pro-mini-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .pro-mini-badge span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          display: inline-block;
        }

        .pro-job-mini-date {
          font-size: 10px;
          color: ${C.muted};
          margin-left: 22px;
          margin-bottom: 5px;
        }

        .pro-job-mini-address {
          display: flex;
          align-items: center;
          gap: 5px;
          color: ${C.blue};
          font-size: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pro-map-box {
          height: 150px;
          border-radius: 14px;
          border: 1px solid ${C.border};
          overflow: hidden;
          background: ${C.bg};
          margin-bottom: 10px;
        }

        .pro-map-box iframe {
          border: 0;
        }

        .pro-map-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, ${C.navy}, ${C.blue});
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
        }

        @media (max-width: 1180px) {
          .pro-content-shell {
            grid-template-columns: minmax(0, 1fr);
            max-width: 980px;
          }

          .pro-right-desktop {
            width: 100%;
            position: static;
          }

          .pro-right-stack {
            margin-bottom: 18px;
          }
        }

        @media (max-width: 760px) {
          .pro-sidebar-desktop {
            display: none;
          }

          .pro-mobile-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 56px;
            z-index: 60;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 14px;
            background: ${sidebarBg};
            box-shadow: 0 6px 18px rgba(13, 55, 129, 0.18);
          }

          .pro-page-frame {
            margin-left: 0;
          }

          .pro-content-shell {
            margin-left: 0;
            padding: 72px 14px 80px;
            display: block;
            max-width: none;
          }

          .pro-earnings-card,
          .pro-side-card {
            border-radius: 16px;
          }

          .pro-mobile-drawer-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 80;
            background: rgba(8, 31, 74, 0.42);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.18s ease;
          }

          .pro-mobile-drawer-backdrop.open {
            opacity: 1;
            pointer-events: auto;
          }

          .pro-mobile-drawer {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: min(86vw, 300px);
            background: ${sidebarBg};
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: 12px 0 32px rgba(0, 0, 0, 0.24);
          }

          .pro-mobile-drawer.open {
            transform: translateX(0);
          }
        }
      `}</style>

      <aside className="pro-sidebar-desktop">
        <SidebarContent />
      </aside>

      <header className="pro-mobile-header">
        <button onClick={() => setMenuOpen(true)} style={{ width: 38, height: 38, borderRadius: 11, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label="Open menu">
          <IC.Menu />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Image src="/logo.jpg" alt="EverClean" width={32} height={32} style={{ borderRadius: 9 }} />
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>
            Ever<span style={{ color: C.green }}>Clean</span>
          </div>
        </div>

        <PhotoUpload initials={proInitials} />
      </header>

      <div className={`pro-mobile-drawer-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className={`pro-mobile-drawer ${menuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <SidebarContent />
        </div>
      </div>

      <div className="pro-page-frame">
        <div className="pro-content-shell">
          <main className="pro-main">{children}</main>
          <aside className="pro-right-desktop">
            <RightPanel bookings={bookings} />
          </aside>
        </div>
      </div>
    </div>
  );
}
