'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import BookingChat from '../../components/BookingChat';
import { useTranslation } from '../../../lib/i18n/useTranslation';
import { notifyBookingEvent } from '../../../lib/notifications';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';

const C = {
  navy: '#0D3781',
  navyDark: '#081f4a',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  canvas: '#FFFFFF',
  soft: '#F5F7FA',
  ink: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  shadow: '0 2px 8px rgba(13,55,129,0.06)',
  bg: '#F5F7FA',
  text: '#0D1B2A',
  warning: '#F59E0B',
  danger: '#DC2626',
};
const R = { sm: '8px', md: '14px', lg: '20px', full: '9999px' };
const font = "'Inter', system-ui, sans-serif";

const IC = {
  ETA: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><path d="M3 12h18M15 6l6 6-6 6" stroke={p.c||'#fff'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||'#fff'} strokeWidth="1.8"/><path d="M9 12l2 2 4-4" stroke={p.c||'#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Clock: (p: any) => <svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||C.muted} strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke={p.c||C.muted} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Dollar: (p: any) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={p.c||C.green} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Sqft: (p: any) => <svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke={p.c||C.muted} strokeWidth="1.8"/><path d="M3 9h18M9 3v18" stroke={p.c||C.muted} strokeWidth="1.2"/></svg>,
};

const STATUS: Record<string, { fallback: string; bg: string; color: string; dot: string }> = {
  PENDING_ASSIGNMENT: { fallback: 'Pending', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  CONFIRMED: { fallback: 'Confirmed', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  IN_PROGRESS: { fallback: 'In Progress', bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6' },
  COMPLETED: { fallback: 'Completed', bg: '#D1FAE5', color: '#065F46', dot: C.green },
  CANCELLED: { fallback: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', dot: C.danger },
};

const SVC: Record<string, string> = {
  HOUSE_CLEANING: 'HC', DEEP_CLEANING: 'DC', MOVE_IN_OUT: 'MV',
  SAME_DAY_CLEANING: 'SD', OFFICE_CLEANING: 'OF', POST_CONSTRUCTION: 'PC',
  MEDICAL_CLEANING: 'MC', CARPET_CLEANING: 'CP', WINDOW_CLEANING: 'WN',
  ORGANIZING: 'OR', CAR_WASH: 'CW', LAUNDRY_PICKUP: 'LD', DRY_CLEANING: 'DR',
};

const TXT: Record<string, Record<string, string>> = {
  en: {
    overview: "Here's your schedule overview",
    goAvailable: 'Go Available',
    schedule: 'Schedule',
    noJobsOnDate: 'No jobs on this date',
    job: 'job',
    jobs: 'jobs',
    noActiveJobs: 'No active jobs',
    findNearby: 'Check Available Jobs to find work nearby',
    findAvailable: 'Find Available Jobs',
    totalEarnings: 'Total earnings',
    activeJobs: 'Active jobs',
    completed: 'Completed',
    myJobs: 'My Jobs',
    noJobsCode: 'NO JOBS',
    estimated: 'estimated',
    sqft: 'sqft',
    yourPay: 'Your pay',
    openNavigation: 'Open Navigation',
    sendEta: 'Send ETA to client',
    etaSent: 'ETA sent to client',
    messageClient: 'Message client',
    callClient: 'Platform call',
    protectedComms: 'Contact stays protected inside EverClean',
    completeJob: 'Complete Job',
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
  },
  es: {
    overview: 'Este es el resumen de tu agenda',
    goAvailable: 'Activar disponibilidad',
    schedule: 'Agenda',
    noJobsOnDate: 'No hay trabajos en esta fecha',
    job: 'trabajo',
    jobs: 'trabajos',
    noActiveJobs: 'Sin trabajos activos',
    findNearby: 'Revisa Disponibles para encontrar trabajos cercanos',
    findAvailable: 'Buscar trabajos disponibles',
    totalEarnings: 'Ganancias totales',
    activeJobs: 'Trabajos activos',
    completed: 'Completados',
    myJobs: 'Mis trabajos',
    noJobsCode: 'SIN TRABAJOS',
    estimated: 'estimadas',
    sqft: 'pies2',
    yourPay: 'Tu pago',
    openNavigation: 'Abrir navegación',
    sendEta: 'Enviar ETA al cliente',
    etaSent: 'ETA enviada al cliente',
    messageClient: 'Mensaje al cliente',
    callClient: 'Llamada plataforma',
    protectedComms: 'El contacto se mantiene protegido dentro de EverClean',
    completeJob: 'Completar trabajo',
    morning: 'Buenos días',
    afternoon: 'Buenas tardes',
    evening: 'Buenas noches',
  },
};

function copy(lang: string, key: string) {
  return TXT[lang]?.[key] || TXT.en[key] || key;
}

function localeForLang(lang: string) {
  const locales: Record<string, string> = { en: 'en-US', es: 'es-US', fr: 'fr-FR', pt: 'pt-BR', zh: 'zh-CN', ko: 'ko-KR', ru: 'ru-RU', ar: 'ar', vi: 'vi-VN', tl: 'fil-PH' };
  return locales[lang] || 'en-US';
}

function serviceLabel(type: string, t: (key: string) => string) {
  const key = String(type || 'HOUSE_CLEANING');
  const translated = t('services.' + key);
  return translated === 'services.' + key ? key.replace(/_/g, ' ') : translated;
}

function greetingForNow(lang: string) {
  const hour = new Date().getHours();
  if (hour < 12) return copy(lang, 'morning');
  if (hour < 18) return copy(lang, 'afternoon');
  return copy(lang, 'evening');
}

function jobAddress(job: any) {
  return [job.address, job.city, job.state].filter(Boolean).join(', ');
}

function jobMapsUrl(job: any) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobAddress(job))}`;
}

function calculatedSqft(job: any) {
  return Number(job.sqft || job.square_feet || job.squareFeet || job.calculated_sqft || job.calculatedSqft || 0);
}

function approvedHours(job: any) {
  const explicit = Number(job.hours || job.estimated_hours || job.estimatedHours || job.approved_hours || job.approvedHours || 0);
  if (explicit > 0) return explicit;
  const sqft = calculatedSqft(job);
  if (sqft > 0) return Math.max(2, Math.ceil(sqft / 500));
  return 2;
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const s = STATUS[status] || STATUS.PENDING_ASSIGNMENT;
  const translated = t('statuses.' + status);
  const label = translated === 'statuses.' + status ? s.fallback : translated;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }}/>
      {label}
    </span>
  );
}

function CalendarStrip({ jobs, t, lang }: { jobs: any[]; t: (key: string) => string; lang: string }) {
  const [selected, setSelected] = useState(new Date().toISOString().split('T')[0]);
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i - 2); return d; });
  const hasJob = (d: Date) => jobs.some(j => j.scheduled_at && new Date(j.scheduled_at).toDateString() === d.toDateString());
  const dayJobs = jobs.filter(j => j.scheduled_at && new Date(j.scheduled_at).toISOString().split('T')[0] === selected);
  const locale = localeForLang(lang);

  return (
    <div>
      <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
        <div style={{ display: 'flex', gap: 5, minWidth: 'max-content' }}>
          {days.map((d, i) => {
            const key = d.toISOString().split('T')[0];
            const isToday = d.toDateString() === today.toDateString();
            const isSel = key === selected;
            const busy = hasJob(d);
            return (
              <button key={i} onClick={() => setSelected(key)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', minWidth: 50,
                background: isSel ? `linear-gradient(135deg, ${C.navy}, ${C.blue})` : isToday ? `${C.blue}15` : C.bg,
                boxShadow: isSel ? '0 4px 12px rgba(13,55,129,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: isSel ? 'rgba(255,255,255,0.7)' : C.muted }}>{d.toLocaleDateString(locale, { weekday: 'short' })}</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: isSel ? '#fff' : isToday ? C.blue : C.text, marginTop: 2 }}>{d.getDate()}</span>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: busy ? (isSel ? '#fff' : C.green) : 'transparent', marginTop: 3 }}/>
              </button>
            );
          })}
        </div>
      </div>
      {dayJobs.length > 0 ? (
        <div style={{ marginTop: 10, padding: '10px 12px', background: `${C.green}10`, border: `1px solid ${C.green}25`, borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.greenDk, marginBottom: 6 }}>
            {dayJobs.length} {dayJobs.length > 1 ? copy(lang, 'jobs') : copy(lang, 'job')} - {new Date(selected + 'T12:00:00').toLocaleDateString(locale, { month: 'long', day: 'numeric' })}
          </div>
          {dayJobs.map(j => (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: `1px solid ${C.green}20` }}>
              <span style={{ fontSize: 14 }}>{SVC[j.service_type] || 'CL'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{serviceLabel(j.service_type, t)}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{j.address}</div>
              </div>
              <StatusBadge status={j.status} t={t}/>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '10px 0', color: C.muted, fontSize: 12 }}>{copy(lang, 'noJobsOnDate')}</div>
      )}
    </div>
  );
}

export default function ProDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [messaging, setMessaging] = useState<string|null>(null);
  const [msgSent, setMsgSent] = useState<string[]>([]);
  const [showMsgPanel, setShowMsgPanel] = useState<string|null>(null);
  const [showChat, setShowChat] = useState<string|null>(null);
  const [etaData, setEtaData] = useState<Record<string, any>>({});
  const [isAvailable, setIsAvailable] = useState(false);
  const { t, lang } = useTranslation();
  const locale = localeForLang(lang);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [jR, pR] = await Promise.all([
        fetch(API + '/professionals/me/bookings', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } }),
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

  async function sendETA(job: any) {
    const token = localStorage.getItem('token') || '';
    let res = await fetch(API + '/bookings/' + job.id + '/eta', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyClient: true }),
    });
    if (!res.ok) {
      res = await fetch(API + '/bookings/' + job.id + '/eta', { headers: { Authorization: 'Bearer ' + token } });
    }
    if (res.ok) {
      const d = await res.json();
      setEtaData(p => ({ ...p, [job.id]: d }));
      notifyBookingEvent({ event: 'ETA_SENT', booking: job, professional: profile, eta: d });
    }
  }

  async function sendPlatformMessage(job: any, type: 'message' | 'call') {
    setMessaging(job.id);
    const token = localStorage.getItem('token') || '';
    const greetingMsg = lang === 'es'
      ? 'Hola! Soy tu profesional de EverClean. Estoy confirmado para tu servicio. Cualquier consulta, estoy aquí en la plataforma. ¡Hasta pronto!'
      : 'Hi! I am your EverClean professional. I am confirmed for your service. For any questions, I am here on the platform. See you soon!';
    try {
      await fetch(API + '/bookings/' + job.id + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          type,
          message: greetingMsg,
          from: 'PROFESSIONAL',
        }),
      });
      setMsgSent(prev => [...prev, job.id + '_' + type]);
      if (type === 'message') setShowMsgPanel(null);
    } catch(e) { console.error('Message error:', e); }
    setMessaging(null);
  }

  async function doAction(job: any, action: string) {
    setActing(job.id);
    const token = localStorage.getItem('token') || '';
    try {
      const r = await fetch(API + '/bookings/' + job.id + '/' + action, { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { console.error('Action error:', action, d.error); }
      else {
        notifyBookingEvent({
          event: action === 'checkin' ? 'CHECKIN_DONE' : 'BOOKING_COMPLETED',
          booking: job,
          professional: profile,
        });
      }
    } catch(e) { console.error('doAction error:', e); }
    await load();
    setActing(null);
  }

  async function toggleAvail() {
    const token = localStorage.getItem('token') || '';
    await fetch(API + '/professionals/me/availability', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    setIsAvailable(!isAvailable);
  }

  const hourlyRate = Number(profile?.hourly_rate || profile?.hourlyRate || 18);
  const calcPayout = (job: any) => {
    const hours = approvedHours(job);
    const byRate = hourlyRate * hours;
    const cap = Number(job.client_price || 0) * 0.55;
    return cap > 0 ? Math.min(byRate, cap) : byRate;
  };
  const myJobs = jobs.filter(j => ['CONFIRMED', 'IN_PROGRESS'].includes(j.status));
  const hasPhone = !!(profile?.phone);
  const active = myJobs;
  const completed = jobs.filter(j => j.status === 'COMPLETED');
  const earnings = completed.reduce((s, j) => s + calcPayout(j), 0);
  const proName = profile?.full_name || profile?.fullName || 'Professional';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ width: '100%', fontFamily: font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {!hasPhone && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📞</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>Add your phone to enable platform calls</div>
            <div style={{ fontSize: 12, color: '#B45309' }}>Clients can connect with you via EverClean — no number exposed.</div>
          </div>
          <a href="/pro/profile" style={{ padding: '6px 14px', borderRadius: 9999, background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Add Phone</a>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: font, fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>
            {greetingForNow(lang)}, {proName.split(' ')[0]}
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '3px 0 0' }}>{copy(lang, 'overview')}</p>
        </div>
        <button onClick={toggleAvail} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 9999,
          border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          background: isAvailable ? `linear-gradient(135deg, ${C.green}, ${C.greenDk})` : 'rgba(100,116,139,0.15)',
          color: isAvailable ? '#fff' : C.muted,
          boxShadow: isAvailable ? '0 4px 12px rgba(76,175,80,0.35)' : 'none',
          transition: 'all 0.2s',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isAvailable ? '#fff' : C.muted, display: 'inline-block' }}/>
          {isAvailable ? t('pro.dashboard.available') : copy(lang, 'goAvailable')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: copy(lang, 'totalEarnings'), val: '$' + earnings.toFixed(0), icon: '$' },
          { label: copy(lang, 'activeJobs'), val: active.length, icon: 'A' },
          { label: copy(lang, 'completed'), val: completed.length, icon: 'C' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '24px', color: C.text, border: `1px solid ${C.border}`, boxShadow: C.shadow, position: 'relative', overflow: 'hidden', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 16, marginBottom: 10, color: C.green }}>{s.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 600, fontFamily: font, lineHeight: 1, color: C.navy }}>{s.val}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: 18, marginBottom: 16, boxShadow: C.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <IC.Clock c={C.navy} s={16}/>
          <span style={{ fontFamily: font, fontWeight: 600, fontSize: 14, color: C.text }}>{copy(lang, 'schedule')}</span>
        </div>
        <CalendarStrip jobs={myJobs} t={t} lang={lang}/>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: 18, boxShadow: C.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: font, fontWeight: 600, fontSize: 14, color: C.text }}>{copy(lang, 'myJobs')}</span>
          {myJobs.length > 0 && <span style={{ background: `${C.navy}15`, color: C.navy, padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>{myJobs.length}</span>}
        </div>

        {myJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10 }}>{copy(lang, 'noJobsCode')}</div>
            <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>{copy(lang, 'noActiveJobs')}</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{copy(lang, 'findNearby')}</div>
            <Link href="/pro/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: C.navy, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              {copy(lang, 'findAvailable')}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myJobs.map(job => {
              const payout = calcPayout(job);
              const hours = approvedHours(job);
              const sqft = calculatedSqft(job);
              const date = job.scheduled_at ? new Date(job.scheduled_at) : null;
              const eta = etaData[job.id];
              return (
                <div key={job.id} style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, background: `${C.navy}12`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                        {SVC[job.service_type] || 'CL'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 3 }}>{serviceLabel(job.service_type, t)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.blue, fontSize: 11, fontWeight: 500 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={C.blue} strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke={C.blue} strokeWidth="1.8"/></svg>
                          <a href={jobMapsUrl(job)} target="_blank" rel="noopener noreferrer" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260, color: C.blue, textDecoration: 'none' }}>
                            {job.address}{job.city ? `, ${job.city}` : ''}
                          </a>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={job.status} t={t}/>
                  </div>

                  <div style={{ padding: '0 14px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {date && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', color: C.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11, border: `1px solid ${C.border}` }}>
                        <IC.Clock s={11} c={C.muted}/>
                        {date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - {date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {sqft > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', color: C.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11, border: `1px solid ${C.border}` }}>
                        <IC.Sqft s={11} c={C.muted}/>{sqft.toFixed(0)} {copy(lang, 'sqft')}
                      </span>
                    )}
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:C.bg, color:C.muted, padding:'4px 10px', borderRadius:8, fontSize:11, border:`1px solid ${C.border}` }}>
                      {hours}h {copy(lang, 'estimated')}
                    </span>
                    {payout > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#D1FAE5', color: C.greenDk, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                        <IC.Dollar s={11} c={C.greenDk}/> {copy(lang, 'yourPay')}: ${payout.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {(job.status === 'CONFIRMED' || job.status === 'IN_PROGRESS') && (
                    <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {eta ? (
                        <div style={{ background: '#EFF6FF', border: `1px solid ${C.blue}25`, borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.blue, marginBottom: 8 }}>{eta.distanceMiles} mi - ETA {eta.etaText}</div>
                          <a href={eta.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 0', borderRadius: 8, background: C.navy, color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            {copy(lang, 'openNavigation')}
                          </a>
                          <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: C.green, fontWeight: 600 }}>{copy(lang, 'etaSent')}</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <a href={jobMapsUrl(job)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 0', borderRadius: 8, background: C.navy, color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', width: '100%' }}>
                            🗺️ {copy(lang, 'openNavigation')}
                          </a>
                          <button onClick={() => sendETA(job)} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <IC.ETA c="#fff" s={14}/> {copy(lang, 'sendEta')}
                          </button>
                        </div>
                      )}

                      {/* Chat Panel */}
                      {showChat === job.id && (
                        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                          <BookingChat bookingId={job.id} myRole="PROFESSIONAL" onClose={() => setShowChat(null)} />
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShowChat(showChat === job.id ? null : job.id)}
                          style={{ padding: '9px 0', borderRadius: 8, border: `1px solid ${showChat === job.id ? C.green : C.border}`, background: showChat === job.id ? '#F0FDF4' : '#fff', color: showChat === job.id ? C.green : C.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          💬 {showChat === job.id ? 'Close Chat' : 'Message Client'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setMessaging(job.id);
                            const token = localStorage.getItem('token') || '';
                            try {
                              await fetch(API + '/bookings/' + job.id + '/call', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                              setMsgSent(prev => [...prev, job.id + '_call']);
                            } catch(e) { console.error(e); }
                            setMessaging(null);
                          }}
                          disabled={messaging === job.id || msgSent.includes(job.id + '_call')}
                          style={{ padding: '9px 0', borderRadius: 8, border: `1px solid ${msgSent.includes(job.id + '_call') ? C.green : C.border}`, background: msgSent.includes(job.id + '_call') ? '#F0FDF4' : '#fff', color: msgSent.includes(job.id + '_call') ? C.green : C.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: messaging === job.id ? 0.6 : 1 }}>
                          {msgSent.includes(job.id + '_call') ? '✓ Calling...' : '📞 Platform Call'}
                        </button>
                      </div>
                      <div style={{ textAlign: 'center', color: C.muted, fontSize: 10 }}>Contact stays protected inside EverClean</div>

                      {job.status === 'CONFIRMED' && (
                        <button onClick={() => doAction(job, 'checkin')} disabled={acting === job.id} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, opacity: acting === job.id ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <IC.Check c="#fff" s={14}/> {t('pro.dashboard.checkIn')}
                        </button>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <button onClick={() => doAction(job, 'checkout')} disabled={acting === job.id} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.green, color: '#fff', fontSize: 12, fontWeight: 600, opacity: acting === job.id ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <IC.Check c="#fff" s={14}/> {copy(lang, 'completeJob')}
                        </button>
                      )}
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
