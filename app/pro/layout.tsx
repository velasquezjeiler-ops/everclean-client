// v2.2 - Rebuilt Pro Layout
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
  X: ({ c = '#fff', s = 22 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth="2" strokeLinecap="round" />
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
  Clock: ({ c = C.muted, s = 13 }: any) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.7" />
      <path d="M12 7v5l3 3" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
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

function AddressMapCard({ booking, onClose }: { booking: any; onClose: () => void }) {
  const addr = encodeURIComponent(`${booking.address || ''} ${booking.city || ''} ${booking.state || ''}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${addr}`;
  const s = STATUS[booking.status] || STATUS.PENDING_ASSIGNMENT;
  const date = booking.scheduled_at ? new Date(booking.scheduled_at) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', pointerEvents: 'none' }}>
      <div style={{ width: 320, margin: '0 16px 16px 0', background: '#fff', borderRadius: 18, boxShadow: '0 12px 48px rgba(13,55,129,0.22)', overflow: 'hidden', pointerEvents: 'all', border: `1px solid ${C.border}` }}>
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <iframe title="map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" src={`https://maps.google.com/maps?q=${addr}&output=embed&z=15`} />
          <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IC.X c="#fff" s={14} />
          </button>
        </div>

        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{SVC_ICONS[booking.service_type] || '🧹'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                {(booking.service_type || '').replace(/_/g, ' ')}
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                {s.label}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
            <IC.Map c={C.blue} s={13} />
            <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>
              {booking.address}
              {booking.city ? `, ${booking.city}` : ''}
              {booking.state ? `, ${booking.state}` : ''}
            </span>
          </div>

          {date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <IC.Clock c={C.muted} s={13} />
              <span style={{ fontSize: 12, color: C.muted }}>
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 12, textDecoration: 'none', background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, color: '#fff', fontSize: 12, fontWeight: 700 }}>
            <IC.Map c="#fff" s={14} />
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

function RightPanel({ bookings, selectedBooking, onSelectBooking }: { bookings: any[]; selectedBooking: any; onSelectBooking: (b: any) => void }) {
  const active = bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const earnings = completed.reduce((s, b) => s + Number(b.payout_amount || b.total_amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, borderRadius: 16, padding: '16px 18px', color: '#fff', boxShadow: '0 6px 24px rgba(13,55,129,0.25)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>
          Earnings Summary
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>${earnings.toFixed(2)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Active', val: active.length, icon: '⚡' },
            { label: 'Done', val: completed.length, icon: '✅' },
            { label: 'Rating', val: '5.0★', icon: '⭐' },
            { label: 'Pending', val: 0, icon: '⏳' },
          ].map((item) => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 10px' }}>
              <div style={{ fontSize: 10, opacity: 0.6 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Status
        </div>
        {[
          { label: 'Background Verified', bg: '#D1FAE5', color: C.greenDk, icon: <IC.Shield c={C.greenDk} s={14} />, href: '/pro/profile' },
          { label: 'ID Confirmed', bg: '#D1FAE5', color: C.greenDk, icon: <IC.Check c={C.greenDk} s={14} />, href: '/pro/profile' },
          { label: 'Payout Active', bg: '#DBEAFE', color: C.blue, icon: <IC.Card c={C.blue} s={14} />, href: '/pro/earnings' },
        ].map((item) => (
          <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, marginBottom: 5, background: item.bg }}>
              {item.icon}
              <span style={{ fontSize: 11, fontWeight: 600, color: item.color, flex: 1 }}>{item.label}</span>
              <IC.Arrow c={item.color} s={12} />
            </div>
          </Link>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Active Jobs
        </div>

        {active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', background: C.bg, borderRadius: 12, border: `1px dashed ${C.border}` }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🧹</div>
            <div style={{ fontSize: 11, color: C.muted }}>No active jobs</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {active.slice(0, 5).map((b) => {
              const s = STATUS[b.status] || STATUS.PENDING_ASSIGNMENT;
              const date = b.scheduled_at ? new Date(b.scheduled_at) : null;
              const isSel = selectedBooking?.id === b.id;

              return (
                <div key={b.id} onClick={() => onSelectBooking(isSel ? null : b)} style={{ background: isSel ? `${C.blue}08` : C.bg, borderRadius: 11, border: `1px solid ${isSel ? C.blue : C.border}`, padding: '9px 11px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 14 }}>{SVC_ICONS[b.service_type] || '🧹'}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{(b.service_type || '').replace(/_/g, ' ')}</div>
                        {date && <div style={{ fontSize: 10, color: C.muted }}>{date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>}
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: s.bg, color: s.color, padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                      {s.label}
                    </span>
                  </div>

                  {b.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.blue, fontSize: 10 }}>
                      <IC.Map c={C.blue} s={11} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.address}
                        {b.city ? `, ${b.city}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Quick Access
        </div>
        {[
          { label: 'Find Jobs', href: '/pro/marketplace', icon: <IC.Market c={C.blue} s={16} />, bg: '#DBEAFE' },
          { label: 'My Earnings', href: '/pro/earnings', icon: <IC.Dollar c={C.greenDk} s={16} />, bg: '#D1FAE5' },
          { label: 'Edit Profile', href: '/pro/profile', icon: <IC.Profile c={C.navy} s={16} />, bg: `${C.navy}15` },
        ].map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, marginBottom: 5, border: `1px solid ${C.border}` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: C.text, flex: 1 }}>{item.label}</span>
              <IC.Arrow c={C.muted} s={13} />
            </div>
          </Link>
        ))}
      </div>
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
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
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
    setSelectedBooking(null);
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
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              <span style={{ fontSize: 9, color: `${C.green}cc`, fontWeight: 600 }}>VERIFIED</span>
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
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.72)' }}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={logout} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 12, padding: '11px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
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

        @media (max-width: 1180px) {
          .pro-content-shell {
            grid-template-columns: minmax(0, 1fr);
            max-width: 980px;
          }

          .pro-right-desktop {
            display: none;
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
            <RightPanel bookings={bookings} selectedBooking={selectedBooking} onSelectBooking={setSelectedBooking} />
          </aside>
        </div>
      </div>

      {selectedBooking && <AddressMapCard booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </div>
  );
}
