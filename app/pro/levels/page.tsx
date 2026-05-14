'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://everclean-platform.replit.app/api';
const C = {
  navy: '#0D3781',
  green: '#4CAF50',
  greenDk: '#388E3C',
  ink: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#F6F9FC',
  gold: '#D97706',
  platinum: '#6D28D9',
  shadow: '0 2px 8px rgba(13,55,129,0.06)',
};

const LEVELS = [
  {
    id: 'PLATA',
    label: 'PLATA',
    short: 'PL',
    min: 0,
    max: 10,
    bonus: 10,
    color: '#64748B',
    bg: '#F8FAFC',
    benefits: [
      '+10% income bonus',
      'Standard payouts (3-5 days)',
      'Base hourly rate',
      'Standard job visibility',
    ],
  },
  {
    id: 'GOLD',
    label: 'GOLD',
    short: 'GO',
    min: 11,
    max: 25,
    bonus: 15,
    color: C.gold,
    bg: '#FFFBEB',
    benefits: [
      '+15% income bonus',
      'Instant payouts (same day)',
      'Priority job visibility',
      'Silver badge on profile',
    ],
  },
  {
    id: 'PLATINUM',
    label: 'PLATINUM',
    short: 'PT',
    min: 26,
    max: 999,
    bonus: 20,
    color: C.platinum,
    bg: '#F5F3FF',
    benefits: [
      '+20% income bonus',
      'Instant payouts (same day)',
      'Subsidized health micro-insurance',
      'Gold badge - top search results',
      'Dedicated support line',
    ],
  },
];

const COPY: Record<string, Record<string, string>> = {
  en: {
    kicker: 'CAREER PATH',
    title: 'My Level and Benefits',
    sub: 'More services means higher level, more income, and better benefits.',
    services: 'services this month',
    rate: 'YOUR EFFECTIVE RATE',
    benefits: 'Benefits',
    points: 'Points System',
    activity: 'Recent Activity',
    current: 'CURRENT',
    incomeBonus: 'Income bonus',
    next: 'more to reach',
    max: 'Maximum level achieved',
    noActivity: 'No activity yet - complete your first service to earn points',
  },
  es: {
    kicker: 'CARRERA PRO',
    title: 'Mi nivel y beneficios',
    sub: 'Mas servicios significa mayor nivel, mas ingresos y mejores beneficios.',
    services: 'servicios este mes',
    rate: 'TU TARIFA EFECTIVA',
    benefits: 'Beneficios',
    points: 'Sistema de puntos',
    activity: 'Actividad reciente',
    current: 'ACTUAL',
    incomeBonus: 'Bono de ingresos',
    next: 'mas para llegar a',
    max: 'Nivel maximo alcanzado',
    noActivity: 'Sin actividad todavia - completa tu primer servicio para ganar puntos',
  },
};

function normalizeLevel(level?: string) {
  const raw = String(level || '').toUpperCase();
  const map: Record<string, string> = {
    BRONZE: 'PLATA',
    SILVER: 'PLATA',
    ROOKIE: 'PLATA',
    ORO: 'GOLD',
    PLATINO: 'PLATINUM',
    ELITE: 'PLATINUM',
  };
  return ['PLATA', 'GOLD', 'PLATINUM'].includes(raw) ? raw : map[raw] || '';
}

function levelFromServices(count: number, storedLevel?: string) {
  const normalized = normalizeLevel(storedLevel);
  if (normalized) return LEVELS.find((level) => level.id === normalized) || LEVELS[0];
  if (count >= 26) return LEVELS[2];
  if (count >= 11) return LEVELS[1];
  return LEVELS[0];
}

function Badge({ label, color = C.navy }: { label: string; color?: string }) {
  return (
    <span style={{ width: 38, height: 38, borderRadius: 12, background: color + '14', border: '1px solid ' + color + '30', color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
      {label}
    </span>
  );
}

function Check({ color }: { color: string }) {
  return <span aria-hidden="true" style={{ color, fontWeight: 900, width: 16, display: 'inline-flex', justifyContent: 'center' }}>✓</span>;
}

export default function LevelsPage() {
  const { lang } = useTranslation();
  const tx = COPY[lang] || COPY.en;
  const [pro, setPro] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('everclean_pro_token') || localStorage.getItem('token') || '';
    fetch(API + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } }).then((r) => r.json()).then(setPro).catch(() => {});
    fetch(API + '/professionals/me/bookings', { headers: { Authorization: 'Bearer ' + token } }).then((r) => r.json()).then((d) => setBookings(d.data || [])).catch(() => {});
    fetch(API + '/professionals/me/level-events', { headers: { Authorization: 'Bearer ' + token } }).then((r) => r.json()).then((d) => setEvents(d.data || [])).catch(() => {});
  }, []);

  const now = new Date();
  const completedThisMonth = bookings.filter((booking: any) => {
    const date = new Date(booking.created_at || booking.scheduled_at || '');
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && booking.status === 'COMPLETED';
  });
  const servicesThisMonth = Number(pro?.services_this_month || completedThisMonth.length || 0);
  const currentLevel = levelFromServices(servicesThisMonth, pro?.level || pro?.level_id);
  const currentIndex = LEVELS.findIndex((level) => level.id === currentLevel.id);
  const nextLevel = LEVELS[currentIndex + 1];
  const progress = nextLevel ? ((servicesThisMonth - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;
  const baseRate = Number(pro?.hourly_rate || pro?.rate || 22);
  const bonusRate = baseRate * (currentLevel.bonus / 100);
  const effectiveRate = baseRate + bonusRate;
  const card = (extra?: any) => ({ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, ...extra });

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        .levels-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:16px}
        .summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        @media(max-width:900px){.levels-grid,.summary-grid{grid-template-columns:1fr}.level-banner{align-items:flex-start!important}.rate-panel{text-align:left!important}}
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: '0 0 4px', color: C.greenDk, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{tx.kicker}</p>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, color: C.ink }}>{tx.title}</h1>
        <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>{tx.sub}</p>
      </div>

      <div style={{ ...card({ padding: 28, marginBottom: 16 }), background: `linear-gradient(135deg, ${currentLevel.color}1f, ${currentLevel.bg})` }}>
        <div className="level-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            <Badge label={currentLevel.short} color={currentLevel.color} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{currentLevel.label}</div>
              <div style={{ fontSize: 'clamp(22px,5vw,28px)', fontWeight: 800, color: C.ink }}>{servicesThisMonth} {tx.services}</div>
              {nextLevel ? <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{nextLevel.min - servicesThisMonth} {tx.next} {nextLevel.label}</div> : <div style={{ fontSize: 13, color: currentLevel.color, fontWeight: 700, marginTop: 4 }}>{tx.max}</div>}
            </div>
          </div>
          <div className="rate-panel" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{tx.rate}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>${effectiveRate.toFixed(0)}/hr</div>
            <div style={{ fontSize: 12, color: C.green }}>Base ${baseRate.toFixed(0)} + {currentLevel.bonus}% {tx.incomeBonus.toLowerCase()}</div>
          </div>
        </div>

        {nextLevel && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: C.muted, marginBottom: 6 }}>
              <span>{currentLevel.label}: {servicesThisMonth} services</span>
              <span>{nextLevel.label}: {nextLevel.min} services needed</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 9999, height: 10, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(0, progress))}%`, height: '100%', background: currentLevel.color, borderRadius: 9999, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4, textAlign: 'right' }}>{Math.round(Math.min(100, Math.max(0, progress)))}% to {nextLevel.label}</div>
          </div>
        )}
      </div>

      <div className="levels-grid">
        {LEVELS.map((level) => {
          const isCurrent = level.id === currentLevel.id;
          const range = level.id === 'PLATINUM' ? '26+ services/month' : `${level.min}-${level.max} services/month`;
          return (
            <div key={level.id} style={card({ padding: 20, border: isCurrent ? `2px solid ${level.color}` : `1px solid ${C.border}`, position: 'relative' })}>
              {isCurrent && <div style={{ position: 'absolute', top: 12, right: 12, borderRadius: 9999, padding: '3px 10px', fontSize: 10, fontWeight: 800, background: level.color, color: '#fff' }}>{tx.current}</div>}
              <div style={{ marginBottom: 8 }}><Badge label={level.short} color={level.color} /></div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 4 }}>{level.label}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{range}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{tx.benefits}</div>
              {level.benefits.map((benefit: string) => (
                <div key={benefit} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 12, color: C.ink, lineHeight: 1.35 }}>
                  <Check color={level.color} />
                  <span>{benefit}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: level.bg }}>
                <div style={{ fontSize: 11, color: C.muted }}>{tx.incomeBonus}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: level.color }}>+{level.bonus}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="summary-grid">
        <div style={card({ padding: 24 })}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.ink }}>{tx.points}</h3>
          {[
            { label: 'Service completed', pts: '+10 pts', color: C.green },
            { label: 'Perfect Week (no cancellations)', pts: '+50 pts', color: C.gold },
            { label: '5-star rating received', pts: '+5 pts', color: C.navy },
            { label: 'Last-minute cancellation', pts: '-25 pts', color: '#EF4444' },
            { label: 'No-show', pts: '-50 pts', color: '#EF4444' },
            { label: '10 services in a week', pts: '+30 pts', color: C.green },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge label={item.label.slice(0, 2).toUpperCase()} color={item.color} />
                <span style={{ fontSize: 13, color: C.ink }}>{item.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.pts}</span>
            </div>
          ))}
        </div>
        <div style={card({ padding: 24 })}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.ink }}>{tx.activity}</h3>
          {events.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontSize: 14 }}>{tx.noActivity}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.slice(0, 8).map((event: any) => (
                <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{event.description || event.event_type}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{new Date(event.created_at).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: Number(event.points_delta) > 0 ? C.green : '#EF4444' }}>{Number(event.points_delta) > 0 ? '+' : ''}{event.points_delta} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
