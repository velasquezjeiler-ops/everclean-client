'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n/useTranslation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup.replit.app/api';

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

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string; note: string }> = {
  PENDING_ASSIGNMENT: { label: 'Finding Cleaner', bg: '#FEF3C7', color: '#92400E', dot: C.warning, note: 'Matching professional' },
  CONFIRMED: { label: 'Confirmed', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', note: 'Professional assigned' },
  IN_PROGRESS: { label: 'In Progress', bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6', note: 'Service in progress' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', color: '#065F46', dot: C.green, note: 'Service completed' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', dot: C.danger, note: 'Cancelled' },
};

const SERVICE_LABELS: Record<string, string> = {
  HOUSE_CLEANING: 'House Cleaning',
  DEEP_CLEANING: 'Deep Cleaning',
  MOVE_IN_OUT: 'Move In / Out',
  SAME_DAY_CLEANING: 'Same Day Cleaning',
  OFFICE_CLEANING: 'Office Cleaning',
  POST_CONSTRUCTION: 'Post Construction',
  MEDICAL_CLEANING: 'Medical / Clinical',
  CARPET_CLEANING: 'Carpet Cleaning',
  WINDOW_CLEANING: 'Window Cleaning',
  ORGANIZING: 'Organizing',
  CAR_WASH: 'Car Wash',
  LAUNDRY_PICKUP: 'Laundry',
};

const CLIENT_DASH_TEXT: Record<string, Record<string, string>> = {
  en: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    subtitle: 'Track your active services, assigned professionals and booking history.',
    bookService: 'Book a Service',
    activeServices: 'Active services',
    completedServices: 'Completed services',
    totalSpent: 'Total spent',
    schedule: 'Schedule',
    noServicesDate: 'No services on this date',
    serviceScheduled: 'Service scheduled',
    schedulePending: 'Schedule pending',
    myServices: 'My Services',
    noActiveServices: 'No active services',
    emptyCopy: 'Book your next cleaning and it will appear here as soon as it is created.',
    addressPending: 'Address pending',
    bookingConfirmed: 'Booking confirmed! A professional will be assigned soon.',
    matchingProfessional: 'Matching professional',
    professionalAssigned: 'Professional assigned',
    serviceInProgress: 'Service in progress',
    serviceCompleted: 'Service completed',
    cancelled: 'Cancelled',
    etaTitle: 'Professional ETA',
    etaPending: 'ETA will appear when your professional sends it.',
    messagePro: 'Message professional',
    callPro: 'Platform call',
    protectedComms: 'Your contact details stay protected inside EverClean.',
  },
  es: {
    morning: 'Buenos dias',
    afternoon: 'Buenas tardes',
    evening: 'Buenas noches',
    subtitle: 'Consulta tus servicios activos, profesionales asignados e historial de reservas.',
    bookService: 'Reservar servicio',
    activeServices: 'Servicios activos',
    completedServices: 'Servicios completados',
    totalSpent: 'Total gastado',
    schedule: 'Calendario',
    noServicesDate: 'No hay servicios en esta fecha',
    serviceScheduled: 'Servicio programado',
    schedulePending: 'Horario pendiente',
    myServices: 'Mis servicios',
    noActiveServices: 'No hay servicios activos',
    emptyCopy: 'Reserva tu proxima limpieza y aparecera aqui cuando sea creada.',
    addressPending: 'Direccion pendiente',
    bookingConfirmed: 'Reserva confirmada. Un profesional sera asignado pronto.',
    matchingProfessional: 'Asignando profesional',
    professionalAssigned: 'Profesional asignado',
    serviceInProgress: 'Servicio en progreso',
    serviceCompleted: 'Servicio completado',
    cancelled: 'Cancelado',
    etaTitle: 'ETA del profesional',
    etaPending: 'El ETA aparecera cuando tu profesional lo envie.',
    messagePro: 'Mensaje al profesional',
    callPro: 'Llamada plataforma',
    protectedComms: 'Tus datos de contacto se mantienen protegidos dentro de EverClean.',
  },
};

function cdt(lang: string, key: string) {
  return CLIENT_DASH_TEXT[lang]?.[key] || CLIENT_DASH_TEXT.en[key] || key;
}

function localeForLang(lang: string) {
  return lang === 'es' ? 'es-US' : 'en-US';
}

function greetingForNow(lang: string) {
  const hour = new Date().getHours();
  if (hour < 12) return cdt(lang, 'morning');
  if (hour < 18) return cdt(lang, 'afternoon');
  return cdt(lang, 'evening');
}

function serviceName(value: string, t: (key: string) => string) {
  const key = String(value || 'HOUSE_CLEANING').toUpperCase();
  return t('services.' + key) || SERVICE_LABELS[value] || String(value || 'Service').replace(/_/g, ' ');
}

function bookingAddress(booking: any) {
  return [booking?.address, booking?.city, booking?.state].filter(Boolean).join(', ');
}

function bookingDate(booking: any, lang: string) {
  if (!booking?.scheduled_at) return cdt(lang, 'schedulePending');
  const d = new Date(booking.scheduled_at);
  const locale = localeForLang(lang);
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' - ' +
    d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function bookingAmount(booking: any) {
  const amount = Number(booking?.client_price || booking?.total_amount || booking?.price || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function statusNote(status: string, lang: string) {
  if (status === 'PENDING_ASSIGNMENT') return cdt(lang, 'matchingProfessional');
  if (status === 'CONFIRMED') return cdt(lang, 'professionalAssigned');
  if (status === 'IN_PROGRESS') return cdt(lang, 'serviceInProgress');
  if (status === 'COMPLETED') return cdt(lang, 'serviceCompleted');
  if (status === 'CANCELLED') return cdt(lang, 'cancelled');
  return '';
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const s = STATUS[status] || STATUS.PENDING_ASSIGNMENT;
  return (
    <span className="client-status-badge" style={{ background: s.bg, color: s.color }}>
      <span style={{ background: s.dot }} />
      {t('statuses.' + status) || s.label}
    </span>
  );
}

function CalendarStrip({ bookings, t, lang }: { bookings: any[]; t: (key: string) => string; lang: string }) {
  const [selected, setSelected] = useState(new Date().toISOString().split('T')[0]);
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 2);
    return d;
  });

  const dayBookings = bookings.filter((booking) => {
    if (!booking.scheduled_at) return false;
    return new Date(booking.scheduled_at).toISOString().split('T')[0] === selected;
  });

  return (
    <div className="client-schedule-card">
      <div className="client-section-title">{cdt(lang, 'schedule')}</div>
      <div className="client-calendar-strip">
        {days.map((d) => {
          const key = d.toISOString().split('T')[0];
          const active = key === selected;
          const hasBooking = bookings.some((b) => b.scheduled_at && new Date(b.scheduled_at).toDateString() === d.toDateString());
          return (
            <button key={key} type="button" onClick={() => setSelected(key)} className={"client-day-btn" + (active ? ' active' : '')}>
              <span>{d.toLocaleDateString(localeForLang(lang), { weekday: 'short' })}</span>
              <strong>{d.getDate()}</strong>
              <i style={{ opacity: hasBooking ? 1 : 0 }} />
            </button>
          );
        })}
      </div>

      {dayBookings.length > 0 ? (
        <div className="client-day-list">
          {dayBookings.map((booking) => (
            <div key={booking.id}>
              <strong>{serviceName(booking.service_type, t)}</strong>
              <span>{bookingAddress(booking) || statusNote(booking.status, lang) || cdt(lang, 'serviceScheduled')}</span>
              <StatusBadge status={booking.status} t={t} />
            </div>
          ))}
        </div>
      ) : (
        <p className="client-empty-line">{cdt(lang, 'noServicesDate')}</p>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const { t, lang } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [lastBookingId, setLastBookingId] = useState('');
  const [etaData, setEtaData] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [bookingsRes, meRes] = await Promise.all([
        fetch(API + '/bookings', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } }).catch(() => null),
      ]);

      const bookingsData = await bookingsRes.json();
      const meData = meRes ? await meRes.json().catch(() => null) : null;
      const nextBookings = Array.isArray(bookingsData.data) ? bookingsData.data : [];
      setBookings(nextBookings);
      setProfile(meData);

      const etaEntries = await Promise.all(
        nextBookings
          .filter((booking: any) => ['CONFIRMED', 'IN_PROGRESS'].includes(booking.status))
          .map(async (booking: any) => {
            const etaRes = await fetch(API + '/bookings/' + booking.id + '/eta', { headers: { Authorization: 'Bearer ' + token } }).catch(() => null);
            if (!etaRes?.ok) return [booking.id, null];
            return [booking.id, await etaRes.json().catch(() => null)];
          })
      );
      setEtaData(Object.fromEntries(etaEntries.filter(([, eta]) => eta)));
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('booked') === '1') {
      setBookingConfirmed(true);
      setLastBookingId(localStorage.getItem('last_booking_id') || '');
    }
  }, []);

  const activeBookings = useMemo(
    () => bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status)),
    [bookings]
  );
  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'COMPLETED'),
    [bookings]
  );
  const totalSpent = completedBookings.reduce((sum, booking) => sum + bookingAmount(booking), 0);
  const nextServices = [...activeBookings].sort((a, b) => {
    const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
  const clientName = profile?.name || profile?.fullName || profile?.full_name || profile?.email?.split('@')[0] || 'Client';

  if (loading) {
    return (
      <div className="client-loading">
        <div />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="client-dashboard-page">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .client-dashboard-page { width: 100%; font-family: Poppins, DM Sans, system-ui, sans-serif; }
        .client-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
        .client-loading div { width: 40px; height: 40px; border: 3px solid ${C.border}; border-top-color: ${C.blue}; border-radius: 50%; animation: spin .8s linear infinite; }
        .client-dashboard-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
        .client-dashboard-header h1 {
          margin: 0;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 600;
          color: ${C.text};
          letter-spacing: 0;
        }
        .client-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .client-stat-card { border-radius: 14px; padding: 18px 20px; color: #fff; box-shadow: 0 2px 8px rgba(13,55,129,0.10); }
        .client-stat-card strong { display: block; font-size: 26px; font-weight: 700; line-height: 1; }
        .client-stat-card span { font-size: 12px; opacity: 0.8; margin-top: 4px; display: block; }
        .client-card { background: #fff; border-radius: 14px; border: 1px solid #E2E8F0; padding: 20px 22px; margin-bottom: 16px; }
        .client-section-title { font-size: 15px; font-weight: 600; color: #0D1B2A; margin-bottom: 14px; }
        .client-empty-state { text-align: center; padding: 32px 16px; }
        .client-primary-action { display: inline-block; padding: 12px 24px; background: #4CAF50; color: #fff; border-radius: 9999px; font-size: 14px; font-weight: 600; text-decoration: none; }
        .client-services-list { display: flex; flex-direction: column; gap: 10px; }
        .client-service-card { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; padding: 14px 16px; }
        .client-service-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .client-service-name { font-size: 14px; font-weight: 600; color: #0D1B2A; }
        .client-service-address { font-size: 12px; color: #64748B; margin-top: 2px; }
        .client-service-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .client-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
        .client-meta-chip { background: #F5F7FA; color: #64748B; padding: 3px 9px; border-radius: 8px; font-size: 11px; }
        .client-confirm-banner { background: #D1FAE5; color: #065F46; padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; }
        .client-schedule-card { background: #fff; border-radius: 14px; border: 1px solid #E2E8F0; padding: 16px 20px; margin-bottom: 16px; }
        .client-calendar-strip { display: flex; gap: 6px; overflow-x: auto; }
        .client-day-btn { min-width: 44px; padding: 8px 4px; border-radius: 10px; border: none; background: transparent; cursor: pointer; text-align: center; font-size: 12px; color: #64748B; }
        .client-day-btn.active { background: #0D3781; color: #fff; }
        .client-day-btn strong { display: block; font-size: 16px; font-weight: 700; }
        .client-empty-line { font-size: 13px; color: #64748B; text-align: center; padding: 16px 0; }
        @media (max-width: 640px) { .client-stats-row { grid-template-columns: 1fr; } }
      `}</style>

      {bookingConfirmed && (
        <div className="client-confirm-banner">
          {cdt(lang, 'bookingConfirmed')}
          {lastBookingId && <span> ID: {lastBookingId}</span>}
        </div>
      )}

      <div className="client-dashboard-header">
        <div>
          <h1>{greetingForNow(lang)}, {clientName.split(' ')[0]}</h1>
          <p>{cdt(lang, 'subtitle')}</p>
        </div>
        <Link href="/dashboard/new-booking" className="client-primary-action">{cdt(lang, 'bookService')}</Link>
      </div>

      <div className="client-stats-row">
        <div className="client-stat-card" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.blue})` }}>
          <strong>{activeBookings.length}</strong>
          <span>{cdt(lang, 'activeServices')}</span>
        </div>
        <div className="client-stat-card" style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDk})` }}>
          <strong>{completedBookings.length}</strong>
          <span>{cdt(lang, 'completedServices')}</span>
        </div>
        <div className="client-stat-card" style={{ background: 'linear-gradient(135deg, #64748B, #334155)' }}>
          <strong>${totalSpent.toFixed(0)}</strong>
          <span>{cdt(lang, 'totalSpent')}</span>
        </div>
      </div>

      <CalendarStrip bookings={activeBookings} t={t} lang={lang} />

      <div className="client-card">
        <div className="client-section-title">{cdt(lang, 'myServices')}</div>
        {nextServices.length === 0 ? (
          <div className="client-empty-state">
            <div>+</div>
            <h3>{cdt(lang, 'noActiveServices')}</h3>
            <p>{cdt(lang, 'emptyCopy')}</p>
            <Link href="/dashboard/new-booking" className="client-primary-action">{cdt(lang, 'bookService')}</Link>
          </div>
        ) : (
          <div className="client-services-list">
            {nextServices.map((booking) => {
              const amount = bookingAmount(booking);
              const status = STATUS[booking.status] || STATUS.PENDING_ASSIGNMENT;
              const pro = booking.professionals?.[0]?.professional || booking.professional;
              const eta = etaData[booking.id];
              return (
                                <article key={booking.id} style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px",boxShadow:"0 2px 8px rgba(13,55,129,0.05)"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                      <div style={{width:40,height:40,borderRadius:11,flexShrink:0,background:"rgba(13,55,129,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#0D3781"}}>{serviceName(booking.service_type, t).split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase()}</div>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#0D1B2A"}}>{serviceName(booking.service_type, t)}</div>
                        {bookingAddress(booking) && <div style={{color:"#1565C0",fontSize:11,marginTop:2}}>{bookingAddress(booking)}</div>}
                      </div>
                    </div>
                    <StatusBadge status={booking.status} t={t} />
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    <span style={{background:"#F5F7FA",color:"#64748B",padding:"4px 10px",borderRadius:8,fontSize:11,border:"1px solid #E2E8F0"}}>{bookingDate(booking, lang)}</span>
                    {amount > 0 && <span style={{background:"#D1FAE5",color:"#388E3C",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700}}>{"$"}{amount.toFixed(2)}</span>}
                    {(pro?.fullName || pro?.full_name) && <span style={{background:"#EFF6FF",color:"#1565C0",padding:"4px 10px",borderRadius:8,fontSize:11}}>{pro.fullName || pro.full_name}</span>}
                  </div>
                  {['CONFIRMED', 'IN_PROGRESS'].includes(booking.status) && (
                    <div style={{marginTop:10,border:"1px solid #E2E8F0",borderRadius:10,background:"#F8FAFC",padding:10}}>
                      <div style={{fontSize:11,fontWeight:800,color:"#0D3781",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{cdt(lang, 'etaTitle')}</div>
                      {eta ? (
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                          <span style={{fontSize:13,fontWeight:700,color:"#0D1B2A"}}>{eta.distanceMiles ? `${eta.distanceMiles} mi - ` : ''}ETA {eta.etaText || eta.eta || eta.duration || ''}</span>
                          {eta.mapsUrl && <a href={eta.mapsUrl} target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:700,color:"#1565C0",textDecoration:"none"}}>{t('map.openGoogleMaps')}</a>}
                        </div>
                      ) : (
                        <div style={{fontSize:12,color:"#64748B"}}>{cdt(lang, 'etaPending')}</div>
                      )}
                      {pro && (
                        <>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
                            <button type="button" style={{border:"1px solid #E2E8F0",background:"#fff",borderRadius:8,padding:"8px 10px",fontSize:12,fontWeight:700,color:"#0D3781"}}>{cdt(lang, 'messagePro')}</button>
                            <button type="button" style={{border:"1px solid #E2E8F0",background:"#fff",borderRadius:8,padding:"8px 10px",fontSize:12,fontWeight:700,color:"#0D3781"}}>{cdt(lang, 'callPro')}</button>
                          </div>
                          <div style={{fontSize:10,color:"#64748B",textAlign:"center",marginTop:6}}>{cdt(lang, 'protectedComms')}</div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
