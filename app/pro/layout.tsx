'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const C = {
  navy: '#0D3781', navyDark: '#081f4a', blue: '#1565C0',
  green: '#4CAF50', greenDk: '#388E3C', bg: '#F5F7FA',
  text: '#0D1B2A', muted: '#64748B', border: '#E2E8F0',
  warning: '#F59E0B', danger: '#DC2626',
};

// ─── ICON SYSTEM ─────────────────────────────────────────────
const IC = {
  Jobs: (p: any) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke={p.c||'#fff'} strokeWidth="1.7"/><path d="M8 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round"/><path d="M8 11h3M8 15h6" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round"/><circle cx="16" cy="11" r="1.5" fill={p.c||'#fff'}/></svg>,
  Market: (p: any) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={p.c||'#fff'} strokeWidth="1.7"/><path d="M20 20l-3-3" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round"/><path d="M11 8v3h3" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round"/></svg>,
  History: (p: any) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><path d="M12 8v4l2.5 2.5" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round"/><path d="M3.1 11A9 9 0 1 0 4 8" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round"/><path d="M3 5v3h3" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Profile: (p: any) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={p.c||'#fff'} strokeWidth="1.7"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Logout: (p: any) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round"/><path d="M16 17l5-5-5-5M21 12H9" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Menu: (p: any) => <svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke={p.c||'#fff'} strokeWidth="2" strokeLinecap="round"/></svg>,
  X: (p: any) => <svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={p.c||'#fff'} strokeWidth="2" strokeLinecap="round"/></svg>,
  Camera: (p: any) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke={p.c||'#fff'} strokeWidth="1.7"/></svg>,
  Map: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={p.c||C.blue} strokeWidth="1.7"/><circle cx="12" cy="9" r="2.5" stroke={p.c||C.blue} strokeWidth="1.7"/></svg>,
  Dollar: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={p.c||C.green} strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Shield: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" fill={p.c||C.green} opacity="0.15" stroke={p.c||C.green} strokeWidth="1.7"/><path d="M9 12l2 2 4-4" stroke={p.c||C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Star: (p: any) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill={C.warning}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Phone: (p: any) => <svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Clock: (p: any) => <svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||C.muted} strokeWidth="1.7"/><path d="M12 7v5l3 3" stroke={p.c||C.muted} strokeWidth="1.7" strokeLinecap="round"/></svg>,
  ETA: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><path d="M3 12h18M15 6l6 6-6 6" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||'#fff'} strokeWidth="1.7"/><path d="M9 12l2 2 4-4" stroke={p.c||'#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Upload: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={p.c||'#fff'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  PENDING_ASSIGNMENT: { label: 'Pending', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  CONFIRMED:          { label: 'Confirmed', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  IN_PROGRESS:        { label: 'In Progress', bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6' },
  COMPLETED:          { label: 'Completed', bg: '#D1FAE5', color: '#065F46', dot: C.green },
  CANCELLED:          { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', dot: C.danger },
};

const SVC_ICONS: Record<string, string> = {
  HOUSE_CLEANING: '🏠', DEEP_CLEANING: '✨', MOVE_IN_OUT: '📦',
  SAME_DAY_CLEANING: '⚡', OFFICE_CLEANING: '🏢', POST_CONSTRUCTION: '🔨',
  MEDICAL_CLEANING: '🏥', CARPET_CLEANING: '🛋', WINDOW_CLEANING: '🪟',
  ORGANIZING: '📋', CAR_WASH: '🚗', LAUNDRY_PICKUP: '👕', DRY_CLEANING: '👔',
};

// ─── ADDRESS MAP PREVIEW ──────────────────────────────────────
function AddressMapCard({ booking, onClose }: { booking: any; onClose: () => void }) {
  const addr = encodeURIComponent(`${booking.address || ''} ${booking.city || ''} ${booking.state || ''}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${addr}`;
  const embedUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${addr}&zoom=15&size=400x200&markers=color:0x0D3781|${addr}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}`;
  const s = STATUS[booking.status] || STATUS.PENDING_ASSIGNMENT;
  const date = booking.scheduled_at ? new Date(booking.scheduled_at) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', pointerEvents: 'none' }}>
      <div style={{
        width: 320, margin: '0 16px 16px 0',
        background: '#fff', borderRadius: 18,
        boxShadow: '0 12px 48px rgba(13,55,129,0.22)',
        overflow: 'hidden', pointerEvents: 'all',
        border: `1px solid ${C.border}`,
        animation: 'slideUp 0.25s ease',
      }}>
        {/* Map Preview */}
        <div style={{ position: 'relative', height: 160, background: `linear-gradient(135deg, ${C.navy}20, ${C.blue}20)`, overflow: 'hidden' }}>
          <iframe
            title="map"
            width="100%" height="100%"
            style={{ border: 0, opacity: 0.92 }}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${addr}&output=embed&z=15`}
          />
          <button onClick={onClose} style={{
            position: 'absolute', top: 8, right: 8,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IC.X c="#fff" s={14}/>
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{SVC_ICONS[booking.service_type] || '🧹'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{(booking.service_type || '').replace(/_/g, ' ')}</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }}/>
                {s.label}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
            <IC.Map c={C.blue} s={13}/>
            <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{booking.address}{booking.city ? `, ${booking.city}` : ''}{booking.state ? `, ${booking.state}` : ''}</span>
          </div>

          {date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <IC.Clock c={C.muted} s={13}/>
              <span style={{ fontSize: 12, color: C.muted }}>
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {booking.payout_amount && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <IC.Dollar c={C.green} s={13}/>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.greenDk }}>+${Number(booking.payout_amount).toFixed(2)}</span>
            </div>
          )}

          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 0', borderRadius: 12, textDecoration: 'none',
            background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
            color: '#fff', fontSize: 12, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(13,55,129,0.3)',
          }}>
            <IC.Map c="#fff" s={14}/>
            Open in Google Maps
          </a>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ─── PHOTO UPLOAD ─────────────────────────────────────────────
function PhotoUpload({ initials, name }: { initials: string; name: string }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pro_photo');
    if (saved) setPhoto(saved);
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Max 2MB'); return; }
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
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile}/>
      {photo ? (
        <img src={photo} alt="Pro" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.green}`, flexShrink: 0 }}/>
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.green}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0, border: `2px solid rgba(255,255,255,0.2)` }}>
          {initials}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, background: C.blue, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
        <IC.Camera c="#fff" s={9}/>
      </div>
    </div>
  );
}

// ─── RIGHT PANEL ─────────────────────────────────────────────
function RightPanel({ bookings, selectedBooking, onSelectBooking }: { bookings: any[]; selectedBooking: any; onSelectBooking: (b: any) => void }) {
  const active = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const earnings = completed.reduce((s, b) => s + Number(b.payout_amount || b.total_amount || 0), 0);
  const rating = 5.0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      {/* Earnings Card */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, borderRadius: 16, padding: '16px 18px', color: '#fff', boxShadow: '0 6px 24px rgba(13,55,129,0.25)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>Earnings Summary</div>
        <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'Poppins, sans-serif', marginBottom: 12 }}>${earnings.toFixed(2)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Active', val: active.length, icon: '⚡' },
            { label: 'Done', val: completed.length, icon: '✅' },
            { label: 'Rating', val: `${rating}★`, icon: '⭐' },
            { label: 'Pending', val: 0, icon: '⏳' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 10px' }}>
              <div style={{ fontSize: 10, opacity: 0.6 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Badges */}
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Status</div>
        {[
          { label: 'Background Verified', bg: '#D1FAE5', color: C.greenDk, icon: <IC.Shield c={C.greenDk} s={14}/> },
          { label: 'ID Confirmed', bg: '#D1FAE5', color: C.greenDk, icon: <IC.Check c={C.greenDk} s={14}/> },
          { label: 'Payout Active', bg: '#DBEAFE', color: C.blue, icon: <IC.Dollar c={C.blue} s={14}/> },
        ].map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, marginBottom: 5, background: b.bg }}>
            {b.icon}
            <span style={{ fontSize: 11, fontWeight: 600, color: b.color }}>{b.label}</span>
          </div>
        ))}
      </div>

      {/* Active Jobs with Map trigger */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Active Jobs</div>
        {active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', background: C.bg, borderRadius: 12, border: `1px dashed ${C.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🧹</div>
            <div style={{ fontSize: 11, color: C.muted }}>No active jobs</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {active.slice(0, 5).map(b => {
              const s = STATUS[b.status] || STATUS.PENDING_ASSIGNMENT;
              const date = b.scheduled_at ? new Date(b.scheduled_at) : null;
              const isSelected = selectedBooking?.id === b.id;
              return (
                <div key={b.id}
                  onClick={() => onSelectBooking(isSelected ? null : b)}
                  style={{
                    background: isSelected ? `${C.blue}08` : '#fff',
                    borderRadius: 12,
                    border: `1px solid ${isSelected ? C.blue : C.border}`,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? `0 0 0 2px ${C.blue}30` : '0 1px 4px rgba(13,55,129,0.05)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 15 }}>{SVC_ICONS[b.service_type] || '🧹'}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{(b.service_type || '').replace(/_/g, ' ')}</div>
                        {date && <div style={{ fontSize: 10, color: C.muted }}>{date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>}
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: s.bg, color: s.color, padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.dot, display: 'inline-block' }}/>
                      {s.label}
                    </span>
                  </div>
                  {b.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.blue, fontSize: 10 }}>
                      <IC.Map c={C.blue} s={11}/>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address}{b.city ? `, ${b.city}` : ''}</span>
                    </div>
                  )}
                  {b.payout_amount && (
                    <div style={{ marginTop: 5, fontSize: 12, fontWeight: 800, color: C.greenDk }}>+${Number(b.payout_amount).toFixed(2)}</div>
                  )}
                  {isSelected && (
                    <div style={{ marginTop: 8, fontSize: 10, color: C.blue, fontWeight: 600, textAlign: 'center' }}>
                      📍 Click to view map →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN LAYOUT ─────────────────────────────────────────────
export default function ProLayout({ children }: { children: React.ReactNode }) {
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
    if (!token) { router.push('/'); return; }
    if (role === 'CLIENT') { router.push('/dashboard'); return; }
    if (role === 'ADMIN') { window.location.href = 'https://everclean-admin.vercel.app'; return; }
    setReady(true);

    fetch(API + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => {
        const name = d.full_name || d.fullName || '';
        setProName(name);
        setProInitials(name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'P');
        setIsAvailable(d.is_available ?? false);
        setRating(d.avg_rating ? Number(d.avg_rating) : null);
      }).catch(() => {});

    fetch(API + '/professionals/me/bookings', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => setBookings(d.data || [])).catch(() => {});
  }, [router]);

  useEffect(() => { setMenuOpen(false); setSelectedBooking(null); }, [pathname]);

  function logout() { localStorage.clear(); router.push('/'); }

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
      {/* Glow effects */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, background: 'radial-gradient(circle, rgba(76,175,80,0.13) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: 50, left: -30, width: 130, height: 130, background: 'radial-gradient(circle, rgba(21,101,192,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <Image src="/logo.jpg" alt="EverClean" width={40} height={40} style={{ borderRadius: 11, boxShadow: '0 3px 10px rgba(0,0,0,0.3)', flexShrink: 0 }}/>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
              Ever<span style={{ color: C.green }}>Clean</span>
            </div>
            <div style={{ fontSize: 9, color: `${C.green}bb`, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Pro Portal</div>
          </div>
        </div>

        {/* Pro card with photo upload */}
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <PhotoUpload initials={proInitials} name={proName}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proName || 'Professional'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {rating && <><IC.Star s={10}/><span style={{ fontSize: 10, color: '#fff', opacity: 0.7 }}>{rating.toFixed(1)}</span></>}
              <IC.Shield c={C.green} s={10}/>
              <span style={{ fontSize: 9, color: `${C.green}cc`, fontWeight: 600 }}>VERIFIED</span>
            </div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isAvailable ? C.green : C.muted, boxShadow: isAvailable ? `0 0 6px ${C.green}` : 'none', flexShrink: 0 }}/>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '6px 8px', marginBottom: 4 }}>Navigation</div>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 11, marginBottom: 3, cursor: 'pointer', transition: 'all 0.2s',
                background: active ? 'rgba(76,175,80,0.18)' : 'transparent',
                border: active ? '1px solid rgba(76,175,80,0.25)' : '1px solid transparent',
                position: 'relative',
              }}>
                {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: C.green, borderRadius: '0 3px 3px 0' }}/>}
                <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(76,175,80,0.22)' : 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
                  <Icon c={active ? C.green : 'rgba(255,255,255,0.5)'} s={17}/>
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <button onClick={logout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 11, border: 'none', cursor: 'pointer',
          background: 'transparent', transition: 'all 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <IC.Logout c="rgba(255,255,255,0.3)" s={16}/>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'Poppins, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        @media (max-width: 768px) {
          .pro-sidebar-desktop { display: none !important; }
          .pro-right-desktop { display: none !important; }
          .pro-main { margin-left: 0 !important; padding: 72px 14px 80px !important; }
          .pro-mobile-header { display: flex !important; }
          .pro-mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .pro-mobile-header { display: none !important; }
          .pro-mobile-nav { display: none !important; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="pro-sidebar-desktop" style={{ width: 248, minHeight: '100vh', background: sidebarBg, position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
        <SidebarContent/>
      </aside>

      {/* Mobile Header */}
      <header className="pro-mobile-header" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`,
        padding: '11px 14px', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 16px rgba(13,55,129,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src="/logo.jpg" alt="EverClean" width={30} height={30} style={{ borderRadius: 8 }}/>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff' }}>
            Ever<span style={{ color: C.green }}>Clean</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <PhotoUpload initials={proInitials} name={proName}/>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {menuOpen ? <IC.X c="#fff" s={18}/> : <IC.Menu c="#fff" s={18}/>}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, top: 57, zIndex: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMenuOpen(false)}/>
          <div style={{ position: 'relative', width: 268, height: '100%', background: sidebarBg, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <SidebarContent/>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pro-main" style={{ marginLeft: 248, flex: 1, padding: '24px', minWidth: 0 }}>
        {children}
      </main>

      {/* Desktop Right Panel */}
      <aside className="pro-right-desktop" style={{ width: 276, flexShrink: 0, padding: '20px 14px', borderLeft: `1px solid ${C.border}`, background: C.bg, overflow: 'auto', minHeight: '100vh' }}>
        <RightPanel bookings={bookings} selectedBooking={selectedBooking} onSelectBooking={setSelectedBooking}/>
      </aside>

      {/* Map Card Overlay */}
      {selectedBooking && (
        <AddressMapCard booking={selectedBooking} onClose={() => setSelectedBooking(null)}/>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="pro-mobile-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff', borderTop: `1px solid ${C.border}`,
        boxShadow: '0 -4px 20px rgba(13,55,129,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '9px 0 5px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3,
                  background: active ? `linear-gradient(135deg, ${C.navy}, ${C.blue})` : 'transparent',
                  boxShadow: active ? '0 3px 10px rgba(13,55,129,0.25)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  <Icon c={active ? '#fff' : C.muted} s={18}/>
                </div>
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? C.navy : C.muted }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
