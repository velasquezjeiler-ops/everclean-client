'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// ─── BRAND COLORS ───────────────────────────────────────────
const C = {
  navy:    '#0D3781',
  navyDark:'#081f4a',
  blue:    '#1565C0',
  green:   '#4CAF50',
  greenDk: '#388E3C',
  bg:      '#F5F7FA',
  surface: '#FFFFFF',
  text:    '#0D1B2A',
  muted:   '#64748B',
  border:  '#E2E8F0',
  warning: '#F59E0B',
  danger:  '#DC2626',
};

// ─── CUSTOM SVG ICON SYSTEM ──────────────────────────────────
const Icon = {
  MyJobs: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="1.8"/>
      <path d="M8 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 11h4M8 15h6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="16" cy="11" r="1.5" fill={color}/>
    </svg>
  ),
  Available: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18.5" cy="5.5" r="3.5" fill={C.green}/>
      <path d="M17 5.5l1 1 2-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  History: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 8v4l2.5 2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M3.05 11a9 9 0 1 0 .5-3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M3 5v3h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Earnings: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="3" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="13" r="3" stroke={color} strokeWidth="1.8"/>
      <path d="M6 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke={color} strokeWidth="1.8"/>
      <path d="M12 11v4M10.5 13h3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Profile: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Verified: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.4 4.8L20 8l-4 4.4.9 6.1L12 16l-4.9 2.5.9-6.1L4 8l5.6-1.2L12 2z" fill={C.green} stroke={C.greenDk} strokeWidth="0.5"/>
      <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Checkin: ({ color = '#fff', size = 18 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
    </svg>
  ),
  Checkout: ({ color = '#fff', size = 18 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  MapPin: ({ color = '#fff', size = 18 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8"/>
    </svg>
  ),
  Clock: ({ color = C.muted, size = 14 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Dollar: ({ color = C.green, size = 16 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Sparkle: ({ color = C.warning, size = 16 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z" fill={color} opacity="0.9"/>
    </svg>
  ),
  ETA: ({ color = '#fff', size = 18 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" stroke={color} strokeWidth="1.8"/>
      <path d="M12 10l1.5 3H15" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="10" r="1" fill={color}/>
    </svg>
  ),
  Leaf: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 21c0 0 4-2 8-8 2-3 3-7 3-7s3 0 5 2c2.5 2.5 2 7 0 9-2.5 2.5-7 2-9 0" fill={C.green} opacity="0.9"/>
      <path d="M2 21c0 0 4-2 8-8 2-3 3-7 3-7s3 0 5 2c2.5 2.5 2 7 0 9-2.5 2.5-7 2-9 0" stroke={C.greenDk} strokeWidth="1.5"/>
      <path d="M2 21l9-9" stroke={C.greenDk} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Building: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="11" height="18" rx="1.5" fill={C.navy} opacity="0.8"/>
      <rect x="14" y="8" width="7" height="13" rx="1.5" fill={C.blue} opacity="0.8"/>
      <rect x="5" y="6" width="2.5" height="2.5" rx="0.5" fill="#fff" opacity="0.6"/>
      <rect x="9" y="6" width="2.5" height="2.5" rx="0.5" fill="#fff" opacity="0.6"/>
      <rect x="5" y="11" width="2.5" height="2.5" rx="0.5" fill="#fff" opacity="0.6"/>
      <rect x="9" y="11" width="2.5" height="2.5" rx="0.5" fill="#fff" opacity="0.6"/>
      <rect x="16" y="11" width="2" height="2" rx="0.5" fill="#fff" opacity="0.6"/>
      <rect x="16" y="15" width="2" height="2" rx="0.5" fill="#fff" opacity="0.6"/>
    </svg>
  ),
  Star: ({ filled = false, size = 14 }: { filled?: boolean; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? C.warning : 'none'}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={C.warning} strokeWidth="1.8"/>
    </svg>
  ),
  Broom: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 3l3 3-7 7-3-3 7-7z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 6l6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 14l-4 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M18 14l-3.5 6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12.5 13.5l7 1-5 7-3-4.5" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  Shield: ({ color = C.green, size = 16 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.8"/>
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Logout: ({ color = '#fff', size = 18 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ─── STATUS CONFIG ───────────────────────────────────────────
const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  PENDING_ASSIGNMENT: { label: 'Pending', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
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

// ─── STAT CARD ───────────────────────────────────────────────
function StatCard({ label, value, icon, gradient }: any) {
  return (
    <div style={{
      background: gradient,
      borderRadius: 16,
      padding: '18px 16px',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(13,55,129,0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -10, right: -10,
        width: 70, height: 70,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
      }}/>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 500, letterSpacing: '0.3px' }}>{label}</div>
    </div>
  );
}

// ─── STATUS BADGE ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.PENDING_ASSIGNMENT;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }}/>
      {s.label}
    </span>
  );
}

// ─── JOB CARD ────────────────────────────────────────────────
function JobCard({ job, onAction, acting, etaData, onETA }: any) {
  const statusKey = job.status || 'PENDING_ASSIGNMENT';
  const svcIcon = SERVICE_ICONS[job.service_type] || '🧹';
  const price = job.payout_amount || job.client_price || job.total_amount || 0;
  const date = job.scheduled_at ? new Date(job.scheduled_at) : null;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(13,55,129,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Card Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42,
            background: `linear-gradient(135deg, ${C.navy}15, ${C.blue}20)`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {svcIcon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 2 }}>
              {(job.service_type || '').replace(/_/g, ' ')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.blue, fontSize: 11 }}>
              <Icon.MapPin color={C.blue} size={12}/>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                {job.address}{job.city ? `, ${job.city}` : ''}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={statusKey}/>
      </div>

      {/* Card Body */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.bg, color: C.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11 }}>
              <Icon.Clock size={12} color={C.muted}/>
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {job.sqft && (
            <span style={{ background: C.bg, color: C.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11 }}>
              📐 {job.sqft} sqft
            </span>
          )}
          {Number(price) > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#D1FAE5', color: C.greenDk, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
              <Icon.Dollar color={C.greenDk} size={12}/>
              +${Number(price).toFixed(2)}
            </span>
          )}
        </div>

        {/* ETA Section */}
        {(statusKey === 'CONFIRMED' || statusKey === 'IN_PROGRESS') && (
          <div style={{ marginBottom: 10 }}>
            {etaData[job.id] ? (
              <div style={{ background: '#EFF6FF', border: `1px solid ${C.blue}30`, borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: C.blue, fontSize: 12, fontWeight: 600 }}>
                  <Icon.ETA color={C.blue} size={14}/>
                  {etaData[job.id].distanceMiles} mi · ETA {etaData[job.id].etaText}
                </div>
                <a href={etaData[job.id].mapsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 0', borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  🗺️ Open Navigation
                </a>
                <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: C.green, fontWeight: 600 }}>
                  ✅ ETA sent to client
                </div>
              </div>
            ) : (
              <button onClick={() => onETA(job.id)} style={{
                width: '100%', padding: '9px 0', borderRadius: 10,
                background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
                color: '#fff', fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icon.ETA color="#fff" size={14}/> Send ETA to Client
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {statusKey === 'CONFIRMED' && (
            <button onClick={() => onAction(job.id, 'checkin')} disabled={acting === job.id}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.blue}, ${C.navy})`,
                color: '#fff', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: acting === job.id ? 0.6 : 1,
              }}>
              <Icon.Checkin color="#fff" size={14}/> Check In
            </button>
          )}
          {statusKey === 'IN_PROGRESS' && (
            <button onClick={() => onAction(job.id, 'checkout')} disabled={acting === job.id}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.green}, ${C.greenDk})`,
                color: '#fff', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: acting === job.id ? 0.6 : 1,
              }}>
              <Icon.Checkout color="#fff" size={14}/> Complete Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR STRIP ──────────────────────────────────────────
function CalendarStrip({ jobs }: { jobs: any[] }) {
  const [selected, setSelected] = useState(new Date().toISOString().split('T')[0]);
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 2);
    return d;
  });

  const hasJob = (d: Date) => jobs.some(j => {
    if (!j.scheduled_at) return false;
    return new Date(j.scheduled_at).toDateString() === d.toDateString();
  });

  const dayJobs = jobs.filter(j => {
    if (!j.scheduled_at) return false;
    return new Date(j.scheduled_at).toISOString().split('T')[0] === selected;
  });

  return (
    <div>
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
          {days.map((d, i) => {
            const key = d.toISOString().split('T')[0];
            const isToday = d.toDateString() === today.toDateString();
            const isSelected = key === selected;
            const busy = hasJob(d);

            return (
              <button key={i} onClick={() => setSelected(key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  minWidth: 52, transition: 'all 0.2s',
                  background: isSelected
                    ? `linear-gradient(135deg, ${C.navy}, ${C.blue})`
                    : isToday ? `${C.blue}15` : C.bg,
                  boxShadow: isSelected ? '0 4px 12px rgba(13,55,129,0.3)' : 'none',
                }}>
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: isSelected ? 'rgba(255,255,255,0.7)' : C.muted }}>
                  {d.toLocaleDateString('en', { weekday: 'short' })}
                </span>
                <span style={{ fontSize: 17, fontWeight: 800, color: isSelected ? '#fff' : isToday ? C.blue : C.text, marginTop: 2 }}>
                  {d.getDate()}
                </span>
                {busy && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : C.green, marginTop: 4 }}/>
                )}
                {!busy && <div style={{ width: 5, height: 5, marginTop: 4 }}/>}
              </button>
            );
          })}
        </div>
      </div>

      {dayJobs.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.greenDk, marginBottom: 6 }}>
            {dayJobs.length} job{dayJobs.length > 1 ? 's' : ''} on {new Date(selected).toLocaleDateString('en', { month: 'long', day: 'numeric' })}
          </div>
          {dayJobs.map(j => (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: `1px solid ${C.green}20` }}>
              <span style={{ fontSize: 14 }}>{SERVICE_ICONS[j.service_type] || '🧹'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{(j.service_type || '').replace(/_/g, ' ')}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{j.address}</div>
              </div>
              <StatusBadge status={j.status}/>
            </div>
          ))}
        </div>
      )}

      {dayJobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: C.muted, fontSize: 12 }}>
          No jobs on this date
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR CONTENT ─────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/pro/dashboard', label: 'My Jobs', IconC: Icon.MyJobs },
  { href: '/pro/available', label: 'Available Jobs', IconC: Icon.Available },
  { href: '/pro/history', label: 'Job History', IconC: Icon.History },
  { href: '/pro/earnings', label: 'Earnings', IconC: Icon.Earnings },
  { href: '/pro/profile', label: 'My Profile', IconC: Icon.Profile },
];

function ProSidebar({ proName, proInitial, rating, isAvailable, pathname, onLogout, lang, setLang }: any) {
  return (
    <aside style={{
      width: 248,
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 45%, #0d4a2e 100%)`,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Glow effects */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: 'radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: 60, left: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(21,101,192,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #4CAF50, #1565C0)',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(76,175,80,0.4)',
            flexShrink: 0,
          }}>
            <Icon.Building size={22}/>
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' }}>
              <span style={{ color: '#fff' }}>Ever</span><span style={{ color: C.green }}>Clean</span>
            </div>
            <div style={{ fontSize: 9, color: `${C.green}cc`, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Pro Portal
            </div>
          </div>
        </div>

        {/* Pro card */}
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.green}, ${C.blue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0,
          }}>{proInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proName || 'Professional'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Icon.Shield color={C.green} size={10}/>
              <span style={{ fontSize: 9, color: `${C.green}cc`, fontWeight: 600 }}>VERIFIED PRO</span>
            </div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isAvailable ? C.green : C.muted, boxShadow: isAvailable ? `0 0 6px ${C.green}` : 'none', flexShrink: 0 }}/>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '6px 8px', marginBottom: 4 }}>Navigation</div>
        {NAV_ITEMS.map(({ href, label, IconC }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 10, marginBottom: 2, cursor: 'pointer', transition: 'all 0.2s',
                background: active ? 'rgba(76,175,80,0.18)' : 'transparent',
                border: active ? '1px solid rgba(76,175,80,0.25)' : '1px solid transparent',
                position: 'relative',
              }}>
                {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: C.green, borderRadius: '0 3px 3px 0' }}/>}
                <div style={{
                  width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'rgba(76,175,80,0.22)' : 'rgba(255,255,255,0.06)',
                }}>
                  <IconC color={active ? C.green : 'rgba(255,255,255,0.55)'} size={16}/>
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'transparent', transition: 'background 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <Icon.Logout color="rgba(255,255,255,0.35)" size={16}/>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ProDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [etaData, setEtaData] = useState<Record<string, any>>({});
  const [isAvailable, setIsAvailable] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [jR, pR] = await Promise.all([
        fetch(API_URL + '/professionals/me/bookings', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API_URL + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } }),
      ]);
      const jD = await jR.json();
      const pD = await pR.json();
      setJobs(jD.data || []);
      setProfile(pD);
      setIsAvailable(pD.is_available ?? false);
    } catch (e) { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function fetchETA(id: string) {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API_URL + '/bookings/' + id + '/eta', { headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) { const d = await res.json(); setEtaData(p => ({ ...p, [id]: d })); }
  }

  async function doAction(id: string, action: string) {
    setActing(id);
    const token = localStorage.getItem('token') || '';
    await fetch(API_URL + '/bookings/' + id + '/' + action, { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    await load();
    setActing(null);
  }

  async function toggleAvail() {
    const token = localStorage.getItem('token') || '';
    await fetch(API_URL + '/professionals/me/availability', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    setIsAvailable(!isAvailable);
  }

  function logout() { localStorage.clear(); router.push('/'); }

  const active = jobs.filter(j => ['CONFIRMED', 'IN_PROGRESS'].includes(j.status));
  const completed = jobs.filter(j => j.status === 'COMPLETED');
  const pending = jobs.filter(j => j.status === 'PENDING_ASSIGNMENT');
  const earnings = completed.reduce((s, j) => s + Number(j.payout_amount || j.total_amount || 0), 0);
  const proName = profile?.full_name || profile?.fullName || 'Professional';
  const proInitial = (proName[0] || 'P').toUpperCase();
  const rating = profile?.avg_rating || profile?.avgRating;

  const visibleJobs = jobs.filter(j => j.status !== 'CANCELLED');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${C.border}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}/>
        <div style={{ color: C.muted, fontSize: 13 }}>Loading dashboard...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'Poppins, DM Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        .job-card:hover { box-shadow: 0 6px 24px rgba(13,55,129,0.12) !important; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; padding-bottom: 80px !important; }
        }
        @media (min-width: 769px) {
          .mobile-bottom-nav { display: none !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <ProSidebar proName={proName} proInitial={proInitial} rating={rating} isAvailable={isAvailable} pathname={pathname} onLogout={logout} />
      </div>

      {/* Mobile Header */}
      <div className="mobile-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 16px rgba(13,55,129,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #4CAF50, #1565C0)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.Building size={18}/>
          </div>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
            <span>Ever</span><span style={{ color: C.green }}>Clean</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggleAvail} style={{
            padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: isAvailable ? `${C.green}25` : 'rgba(255,255,255,0.1)',
            color: isAvailable ? C.green : 'rgba(255,255,255,0.5)',
          }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: isAvailable ? C.green : 'rgba(255,255,255,0.3)', marginRight: 5, verticalAlign: 'middle' }}/>
            {isAvailable ? 'Available' : 'Offline'}
          </button>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.green}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>
            {proInitial}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content" style={{ marginLeft: 248, flex: 1, padding: '24px', minWidth: 0, animation: 'fadeIn 0.4s ease' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>
              Good morning, {proName.split(' ')[0]} 👋
            </h1>
            <p style={{ color: C.muted, fontSize: 13, margin: '2px 0 0' }}>Here's your schedule overview</p>
          </div>
          <button onClick={toggleAvail} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: isAvailable ? `linear-gradient(135deg, ${C.green}, ${C.greenDk})` : 'rgba(100,116,139,0.15)',
            color: isAvailable ? '#fff' : C.muted,
            fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
            boxShadow: isAvailable ? '0 4px 12px rgba(76,175,80,0.35)' : 'none',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isAvailable ? '#fff' : C.muted, display: 'inline-block' }}/>
            {isAvailable ? 'Available' : 'Go Available'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <StatCard label="Total Earnings" value={`$${earnings.toFixed(0)}`} icon={<Icon.Dollar color="#fff" size={22}/>} gradient={`linear-gradient(135deg, ${C.green}, ${C.greenDk})`}/>
          <StatCard label="Active Jobs" value={active.length} icon={<Icon.MyJobs color="#fff" size={22}/>} gradient={`linear-gradient(135deg, ${C.blue}, ${C.navy})`}/>
          <StatCard label="Completed" value={completed.length} icon={<Icon.Checkin color="#fff" size={22}/>} gradient={`linear-gradient(135deg, #7C3AED, #5B21B6)`}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Calendar */}
            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, boxShadow: '0 2px 12px rgba(13,55,129,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Icon.Clock color={C.navy} size={16}/>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: C.text }}>Schedule</span>
              </div>
              <CalendarStrip jobs={jobs}/>
            </div>

            {/* Jobs List */}
            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, boxShadow: '0 2px 12px rgba(13,55,129,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon.MyJobs color={C.navy} size={16}/>
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: C.text }}>My Jobs</span>
                </div>
                {visibleJobs.length > 0 && (
                  <span style={{ background: `${C.navy}15`, color: C.navy, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                    {visibleJobs.length}
                  </span>
                )}
              </div>

              {visibleJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🧹</div>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, fontSize: 14 }}>No active jobs</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>Check Available Jobs to find work nearby</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visibleJobs.slice(0, 8).map(job => (
                    <JobCard key={job.id} job={job} onAction={doAction} acting={acting} etaData={etaData} onETA={fetchETA}/>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Earnings Card */}
            <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, borderRadius: 16, padding: 18, color: '#fff', boxShadow: '0 6px 24px rgba(13,55,129,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, opacity: 0.7 }}>
                <Icon.Dollar color="#fff" size={14}/>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Earnings Summary</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>
                ${earnings.toFixed(2)}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 16 }}>Total lifetime earnings</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Active', value: active.length, icon: '⚡' },
                  { label: 'Pending', value: pending.length, icon: '⏳' },
                  { label: 'Completed', value: completed.length, icon: '✅' },
                  { label: 'Rating', value: rating ? `${Number(rating).toFixed(1)}★` : 'N/A', icon: '⭐' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>{s.icon} {s.label}</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Badges */}
            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 14, boxShadow: '0 2px 12px rgba(13,55,129,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Status</div>
              {[
                { icon: <Icon.Shield color={C.green} size={16}/>, label: 'Background Verified', color: C.green, bg: '#D1FAE5' },
                { icon: <Icon.Verified size={16}/>, label: 'ID Confirmed', color: C.greenDk, bg: '#D1FAE5' },
                { icon: <Icon.Dollar color={C.blue} size={16}/>, label: 'Payout Active', color: C.blue, bg: '#DBEAFE' },
              ].map(b => (
                <div key={b.label} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 10, marginBottom: 6,
                  background: b.bg,
                }}>
                  {b.icon}
                  <span style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.label}</span>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 14, boxShadow: '0 2px 12px rgba(13,55,129,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Quick Access</div>
              {[
                { href: '/pro/available', label: 'Find Jobs', icon: <Icon.Available color={C.blue} size={16}/>, color: C.blue },
                { href: '/pro/earnings', label: 'My Earnings', icon: <Icon.Earnings color={C.green} size={16}/>, color: C.green },
                { href: '/pro/profile', label: 'Edit Profile', icon: <Icon.Profile color={C.navy} size={16}/>, color: C.navy },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                    borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                    transition: 'background 0.15s',
                    border: `1px solid ${C.border}`,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${l.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {l.icon}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1 }}>{l.label}</span>
                    <span style={{ color: C.muted, fontSize: 16 }}>›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        boxShadow: '0 -4px 20px rgba(13,55,129,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {[
          { tab: 'jobs', label: 'My Jobs', Icon: Icon.MyJobs, href: '/pro/dashboard' },
          { tab: 'available', label: 'Available', Icon: Icon.Available, href: '/pro/available' },
          { tab: 'history', label: 'History', Icon: Icon.History, href: '/pro/history' },
          { tab: 'earnings', label: 'Earnings', Icon: Icon.Earnings, href: '/pro/earnings' },
          { tab: 'profile', label: 'Profile', Icon: Icon.Profile, href: '/pro/profile' },
        ].map(({ tab, label, Icon: IC, href }) => {
          const active2 = pathname === href;
          return (
            <Link key={tab} href={href} style={{ flex: 1, textDecoration: 'none' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '10px 0 6px', cursor: 'pointer',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active2 ? `linear-gradient(135deg, ${C.navy}, ${C.blue})` : 'transparent',
                  marginBottom: 3, transition: 'all 0.2s',
                  boxShadow: active2 ? '0 3px 10px rgba(13,55,129,0.3)' : 'none',
                }}>
                  <IC color={active2 ? '#fff' : C.muted} size={18}/>
                </div>
                <span style={{ fontSize: 9, fontWeight: active2 ? 700 : 500, color: active2 ? C.navy : C.muted, letterSpacing: '0.2px' }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
