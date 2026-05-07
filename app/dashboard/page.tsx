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
            <button key={key} type="button" onClick={() => setSelected(key)} className={active ? 'active' : ''}>
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

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [bookingsRes, meRes] = await Promise.all([
        fetch(API + '/bookings', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } }).catch(() => null),
      ]);

      const bookingsData = await bookingsRes.json();
      const meData = meRes ? await meRes.json().catch(() => null) : null;
      setBookings(Array.isArray(bookingsData.data) ? bookingsData.data : []);
      setProfile(meData);
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
              return (
                <article className="client-service-card" key={booking.id}>
                  <div>
                    <h3>{serviceName(booking.service_type, t)}</h3>
                    <p>{bookingAddress(booking) || cdt(lang, 'addressPending')}</p>
                    <div className="client-service-meta">
                      <span>{bookingDate(booking, lang)}</span>
                      <span>{statusNote(booking.status, lang) || status.note}</span>
                      {pro?.fullName || pro?.full_name ? <span>{pro.fullName || pro.full_name}</span> : null}
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={booking.status} t={t} />
                    {amount > 0 && <div className="client-service-price">${amount.toFixed(2)}</div>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
