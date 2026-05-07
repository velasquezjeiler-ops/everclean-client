'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LanguageSelector from '../../lib/i18n/LanguageSelector';
import { useTranslation } from '../../lib/i18n/useTranslation';

const IC = {
  Services: (p) => (<svg width={p.s||20} height={p.s||20} viewBox='0 0 24 24' fill='none'><rect x='3' y='4' width='18' height='16' rx='2.5' stroke={p.c||'currentColor'} strokeWidth='1.7'/><path d='M8 11h3M8 15h6' stroke={p.c||'currentColor'} strokeWidth='1.7' strokeLinecap='round'/></svg>),
  Add: (p) => (<svg width={p.s||20} height={p.s||20} viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='9' stroke={p.c||'currentColor'} strokeWidth='1.7'/><path d='M12 8v8M8 12h8' stroke={p.c||'currentColor'} strokeWidth='1.7' strokeLinecap='round'/></svg>),
  History: (p) => (<svg width={p.s||20} height={p.s||20} viewBox='0 0 24 24' fill='none'><path d='M12 8v4l2.5 2.5' stroke={p.c||'currentColor'} strokeWidth='1.7' strokeLinecap='round'/><path d='M3.1 11A9 9 0 1 0 4 8' stroke={p.c||'currentColor'} strokeWidth='1.7' strokeLinecap='round'/></svg>),
  Profile: (p) => (<svg width={p.s||20} height={p.s||20} viewBox='0 0 24 24' fill='none'><circle cx='12' cy='8' r='4' stroke={p.c||'currentColor'} strokeWidth='1.7'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7' stroke={p.c||'currentColor'} strokeWidth='1.7' strokeLinecap='round'/></svg>),
};

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup.replit.app/api';

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

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string; eta: string }> = {
  PENDING_ASSIGNMENT: {
    label: 'Finding Cleaner',
    bg: '#FEF3C7',
    color: '#92400E',
    dot: '#F59E0B',
    eta: 'Matching professional',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: '#DBEAFE',
    color: '#1E40AF',
    dot: '#3B82F6',
    eta: 'Professional assigned',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: '#EDE9FE',
    color: '#5B21B6',
    dot: '#8B5CF6',
    eta: 'Service in progress',
  },
  COMPLETED: {
    label: 'Completed',
    bg: '#D1FAE5',
    color: '#065F46',
    dot: C.green,
    eta: 'Service completed',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: '#FEE2E2',
    color: '#991B1B',
    dot: C.danger,
    eta: 'Cancelled',
  },
};

const SERVICE_ICONS: Record<string, string> = {
  HOUSE_CLEANING: 'HC', DEEP_CLEANING: 'DC', MOVE_IN_OUT: 'MV', SAME_DAY_CLEANING: 'SD',
  OFFICE_CLEANING: 'OF', POST_CONSTRUCTION: 'PC', MEDICAL_CLEANING: 'MC', CARPET_CLEANING: 'CP',
  WINDOW_CLEANING: 'WN', ORGANIZING: 'OR', CAR_WASH: 'CW', LAUNDRY_PICKUP: 'LD', DRY_CLEANING: 'DR',
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'My Services', icon: '🧹' },
  { href: '/dashboard/new-booking', label: 'Book Now', icon: '➕' },
  { href: '/dashboard/history', label: 'History', icon: '📋' },
  { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

const CLIENT_LAYOUT_TEXT: Record<string, Record<string, string>> = {
  en: {
    active: 'Active',
    done: 'Done',
    totalSpent: 'Total Spent',
    status: 'Status',
    accountActive: 'Client account active',
    liveMonitoring: 'Live service monitoring',
    readyToBook: 'Ready to book',
    mapsReady: 'Google Maps directions ready',
    quickAccess: 'Quick Access',
    bookService: 'Book a Service',
    myServices: 'My Services',
    viewHistory: 'View History',
    billingProfile: 'Billing Profile',
    activeServices: 'Active Services',
    noActiveServices: 'No active services',
    assignedProfessional: 'Assigned Professional',
    findingCleaner: 'Finding your cleaner...',
    location: 'Location',
    openGoogleMaps: 'Open in Google Maps',
    clientPortal: 'Client Portal',
    member: 'EverClean Member',
    menu: 'Menu',
    signOut: 'Sign Out',
    call: 'Call',
    matchingProfessional: 'Matching professional',
    professionalAssigned: 'Professional assigned',
    serviceInProgress: 'Service in progress',
    serviceCompleted: 'Service completed',
    cancelled: 'Cancelled',
  },
  es: {
    active: 'Activos',
    done: 'Completados',
    totalSpent: 'Total gastado',
    status: 'Estado',
    accountActive: 'Cuenta del cliente activa',
    liveMonitoring: 'Monitoreo de servicios activo',
    readyToBook: 'Listo para reservar',
    mapsReady: 'Direcciones de Google Maps listas',
    quickAccess: 'Acceso rapido',
    bookService: 'Reservar servicio',
    myServices: 'Mis servicios',
    viewHistory: 'Ver historial',
    billingProfile: 'Perfil de facturacion',
    activeServices: 'Servicios activos',
    noActiveServices: 'No hay servicios activos',
    assignedProfessional: 'Profesional asignado',
    findingCleaner: 'Buscando tu profesional...',
    location: 'Ubicacion',
    openGoogleMaps: 'Abrir en Google Maps',
    clientPortal: 'Portal del cliente',
    member: 'Miembro de EverClean',
    menu: 'Menu',
    signOut: 'Cerrar sesion',
    call: 'Llamar',
    matchingProfessional: 'Asignando profesional',
    professionalAssigned: 'Profesional asignado',
    serviceInProgress: 'Servicio en progreso',
    serviceCompleted: 'Servicio completado',
    cancelled: 'Cancelado',
  },
};

function clt(lang: string, key: string) {
  return CLIENT_LAYOUT_TEXT[lang]?.[key] || CLIENT_LAYOUT_TEXT.en[key] || key;
}

function clientNavLabel(href: string, t: (key: string) => string, lang: string) {
  if (href === '/dashboard') return t('sidebar.myServices') || clt(lang, 'myServices');
  if (href === '/dashboard/new-booking') return t('sidebar.bookNow') || clt(lang, 'bookService');
  if (href === '/dashboard/history') return t('sidebar.history') || clt(lang, 'viewHistory');
  if (href === '/dashboard/profile') return t('sidebar.profile') || 'Profile';
  return href;
}

function serviceLabel(value: string, t: (key: string) => string) {
  const key = String(value || 'HOUSE_CLEANING').toUpperCase();
  return t('services.' + key) || serviceName(value);
}

function statusLabel(value: string, fallback: string, t: (key: string) => string) {
  return t('statuses.' + value) || fallback;
}

function etaLabel(value: string, fallback: string, lang: string) {
  if (value === 'PENDING_ASSIGNMENT') return clt(lang, 'matchingProfessional');
  if (value === 'CONFIRMED') return clt(lang, 'professionalAssigned');
  if (value === 'IN_PROGRESS') return clt(lang, 'serviceInProgress');
  if (value === 'COMPLETED') return clt(lang, 'serviceCompleted');
  if (value === 'CANCELLED') return clt(lang, 'cancelled');
  return fallback;
}

function serviceName(value: string) {
  return String(value || 'HOUSE_CLEANING').replace(/_/g, ' ');
}

function bookingAddress(booking: any) {
  return [booking?.address, booking?.city, booking?.state].filter(Boolean).join(', ');
}

function mapsUrl(booking: any) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bookingAddress(booking))}`;
}

function RightPanel({
  bookings,
  selectedBooking,
  onSelectBooking,
  t,
  lang,
}: {
  bookings: any[];
  selectedBooking: any;
  onSelectBooking: (booking: any) => void;
  t: (key: string) => string;
  lang: string;
}) {
  const active = bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const totalSpent = completed.reduce(
    (sum, b) => sum + Number(b.client_price || b.total_amount || 0),
    0
  );
  const featured = selectedBooking || active[0];

  return (
    <aside className="client-right-panel">
      <div className="client-stats-grid">
        <div className="client-stat blue">
          <strong>{active.length}</strong>
          <span>{clt(lang, 'active')}</span>
        </div>
        <div className="client-stat green">
          <strong>{completed.length}</strong>
          <span>{clt(lang, 'done')}</span>
        </div>
      </div>

      <div className="client-total-card">
        <strong>${totalSpent.toFixed(0)}</strong>
        <span>{clt(lang, 'totalSpent')}</span>
      </div>

      <div className="client-panel-card">
        <div className="client-panel-title">{clt(lang, 'status')}</div>
        {[
          { label: clt(lang, 'accountActive'), tone: 'green' },
          { label: active.length ? clt(lang, 'liveMonitoring') : clt(lang, 'readyToBook'), tone: 'blue' },
          { label: clt(lang, 'mapsReady'), tone: 'green' },
        ].map((item) => (
          <div key={item.label} className={`client-status-row ${item.tone}`}>
            <span />
            <p>{item.label}</p>
          </div>
        ))}
      </div>

      <div className="client-panel-card">
        <div className="client-panel-title">{clt(lang, 'quickAccess')}</div>
        {[
          { href: '/dashboard/new-booking', label: clt(lang, 'bookService'), icon: '➕' },
          { href: '/dashboard', label: clt(lang, 'myServices'), icon: '🧹' },
          { href: '/dashboard/history', label: clt(lang, 'viewHistory'), icon: '📋' },
          { href: '/dashboard/profile', label: clt(lang, 'billingProfile'), icon: '👤' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="client-quick-link">
            <item.Icon c={isActive ? "#fff" : "rgba(255,255,255,0.5)"} s={18} />
            <p>{item.label}</p>
            <b>›</b>
          </Link>
        ))}
      </div>

      <div className="client-panel-card">
        <div className="client-panel-title">{clt(lang, 'activeServices')}</div>
        {active.length === 0 ? (
          <div className="client-empty-mini">
            <div>🧹</div>
            <p>{clt(lang, 'noActiveServices')}</p>
          </div>
        ) : (
          <div className="client-active-list">
            {active.slice(0, 5).map((booking) => {
              const status = STATUS[booking.status] || STATUS.PENDING_ASSIGNMENT;
              const pro = booking.professionals?.[0]?.professional;
              const isSelected = featured?.id === booking.id;

              return (
                <button
                  key={booking.id}
                  className={`client-active-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectBooking(booking)}
                  type="button"
                >
                  <div className="client-active-head">
                    <div>
                      <strong>
                        {SERVICE_ICONS[booking.service_type] || '🧹'}{' '}
                        {serviceLabel(booking.service_type, t)}
                      </strong>
                      {booking.scheduled_at && (
                        <span>{new Date(booking.scheduled_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <em style={{ background: status.bg, color: status.color }}>
                      <i style={{ background: status.dot }} />
                      {statusLabel(booking.status, status.label, t)}
                    </em>
                  </div>

                  {bookingAddress(booking) && (
                    <p className="client-address">{bookingAddress(booking)}</p>
                  )}

                  <div className="client-monitor-line">
                    <span>{etaLabel(booking.status, status.eta, lang)}</span>
                    {(booking.client_price || booking.total_amount) && (
                      <b>${booking.client_price || booking.total_amount}</b>
                    )}
                  </div>

                  {pro ? (
                    <div className="client-pro-row">
                      <span>{(pro.fullName || 'P')[0]}</span>
                      <p>{pro.fullName || clt(lang, 'assignedProfessional')}</p>
                      {pro.phone && (
                        <a href={`tel:${pro.phone}`} onClick={(e) => e.stopPropagation()}>
                          {clt(lang, 'call')}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="client-finding">{clt(lang, 'findingCleaner')}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {featured && bookingAddress(featured) && (
        <div className="client-panel-card">
          <div className="client-panel-title">{clt(lang, 'location')}</div>
          <div className="client-map">
            <iframe
              title="Service location"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                bookingAddress(featured)
              )}&output=embed&z=14`}
            />
          </div>
          <a className="client-map-link" href={mapsUrl(featured)} target="_blank" rel="noreferrer">
            {clt(lang, 'openGoogleMaps')}
          </a>
        </div>
      )}
    </aside>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientInitial, setClientInitial] = useState('C');
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, lang, setLang } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/');
      return;
    }

    if (role === 'PROFESSIONAL') {
      router.push('/pro/dashboard');
      return;
    }

    if (role === 'ADMIN') {
      window.location.href = 'https://everclean-admin.vercel.app';
      return;
    }

    setReady(true);

    fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .then((r) => r.json())
      .then((d) => {
        const name = d.name || d.fullName || d.email?.split('@')[0] || 'Client';
        setClientName(name);
        setClientInitial((name[0] || 'C').toUpperCase());
      })
      .catch(() => {});

    fetch(API + '/bookings', { headers: { Authorization: 'Bearer ' + token } })
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

  const active = bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status));

  if (!ready) return null;

  const SidebarContent = () => (
    <div className="client-sidebar-inner">
      <div className="client-brand-block">
        <div className="client-brand">
          <Image src="/logo.jpg" alt="EverClean" width={40} height={40} />
          <div>
            <strong>
              Ever<span>Clean</span>
            </strong>
            <small>{clt(lang, 'clientPortal')}</small>
          </div>
        </div>

        <div className="client-user-card">
          <div className="client-avatar">{clientInitial}</div>
          <div>
            <strong>{clientName || t('sidebar.client')}</strong>
            <small>{clt(lang, 'member')}</small>
          </div>
          
        </div>
      </div>

      <nav className="client-nav">
        <small>{clt(lang, 'menu')}</small>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} className={isActive ? 'active' : ''}>
              <span style={{fontSize:16}}>{item.icon}</span>
              <p>{item.label}</p>
            </Link>
          );
        })}
      </nav>

      <div className="client-language-block">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <button className="client-logout" onClick={logout} type="button">
        <span>SO</span>
        {clt(lang, 'signOut')}
      </button>
    </div>
  );

  return (
    <div className="client-layout-root">
      <style>{`
        .client-layout-root {
          min-height: 100vh;
          background: ${C.bg};
          color: ${C.text};
          font-family: Poppins, DM Sans, system-ui, sans-serif;
        }

        .client-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 244px;
          z-index: 40;
          background: linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 48%, #0d4a2e 100%);
          box-shadow: 8px 0 28px rgba(13, 55, 129, 0.16);
        }

        .client-sidebar-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .client-brand-block {
          padding: 20px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .client-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 18px;
        }

        .client-brand img {
          border-radius: 11px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        }

        .client-brand strong {
          display: block;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          line-height: 1;
        }

        .client-brand strong span {
          color: ${C.green};
        }

        .client-brand small {
          color: ${C.green}cc;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .client-user-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 13px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .client-avatar {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: linear-gradient(135deg, ${C.blue}, ${C.navy});
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          flex-shrink: 0;
        }

        .client-user-card div:nth-child(2) {
          min-width: 0;
          flex: 1;
        }

        .client-user-card strong {
          display: block;
          color: #fff;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .client-user-card small {
          color: rgba(255,255,255,0.48);
          font-size: 9px;
        }

        .client-user-card b {
          background: ${C.green};
          color: #fff;
          border-radius: 999px;
          padding: 2px 7px;
          font-size: 10px;
        }

        .client-nav {
          flex: 1;
          padding: 12px 10px;
        }

        .client-nav small {
          display: block;
          color: rgba(255,255,255,0.28);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 6px 8px;
          margin-bottom: 4px;
        }

        .client-nav a {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.58);
          padding: 10px;
          border-radius: 12px;
          border: 1px solid transparent;
          margin-bottom: 4px;
          position: relative;
        }

        .client-nav a span {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .client-nav a p {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
        }

        .client-nav a.active {
          background: rgba(21,101,192,0.28);
          border-color: rgba(96,165,250,0.25);
          color: #fff;
        }

        .client-nav a.active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 22%;
          bottom: 22%;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: ${C.blue};
        }

        .client-language-block {
          margin: auto 10px 0;
        }

        .client-logout {
          margin: 12px 10px;
          padding: 11px 10px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 700;
        }

        .client-mobile-header {
          display: none;
        }

        .client-mobile-backdrop {
          display: none;
        }

        .client-page-frame {
          min-height: 100vh;
          margin-left: 244px;
        }

        .dashboard-content-shell {
          width: 100%;
          max-width: 1460px;
          margin: 0 auto;
          padding: 24px 20px 40px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 20px;
          align-items: start;
        }

        .client-main {
          min-width: 0;
          width: 100%;
        }

        .client-right-panel {
          width: 300px;
          position: sticky;
          top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .client-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .client-stat,
        .client-total-card,
        .client-panel-card {
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(13,55,129,0.05);
        }

        .client-stat {
          padding: 12px;
          text-align: center;
        }

        .client-stat strong {
          display: block;
          font-size: 24px;
          font-weight: 900;
          line-height: 1;
        }

        .client-stat span,
        .client-total-card span {
          display: block;
          font-size: 10px;
          font-weight: 700;
          margin-top: 4px;
        }

        .client-stat.blue {
          background: #DBEAFE;
          color: ${C.blue};
        }

        .client-stat.green {
          background: #D1FAE5;
          color: ${C.greenDk};
        }

        .client-total-card {
          padding: 13px;
          text-align: center;
          background: linear-gradient(135deg, ${C.navy}12, ${C.blue}12);
        }

        .client-total-card strong {
          display: block;
          font-size: 24px;
          font-weight: 900;
          color: ${C.navy};
          line-height: 1;
        }

        .client-total-card span {
          color: ${C.muted};
        }

        .client-panel-card {
          padding: 12px 14px;
        }

        .client-panel-title {
          font-size: 10px;
          font-weight: 900;
          color: ${C.muted};
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 9px;
        }

        .client-status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 9px;
          border-radius: 10px;
          margin-bottom: 6px;
        }

        .client-status-row.green {
          background: #D1FAE5;
          color: ${C.greenDk};
        }

        .client-status-row.blue {
          background: #DBEAFE;
          color: ${C.blue};
        }

        .client-status-row span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: currentColor;
        }

        .client-status-row p {
          margin: 0;
          font-size: 11px;
          font-weight: 800;
        }

        .client-quick-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border: 1px solid ${C.border};
          border-radius: 10px;
          margin-bottom: 6px;
          text-decoration: none;
          color: ${C.text};
        }

        .client-quick-link span {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #EFF6FF;
          color: ${C.blue};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          flex-shrink: 0;
        }

        .client-quick-link p {
          flex: 1;
          margin: 0;
          font-size: 12px;
          font-weight: 700;
        }

        .client-quick-link b {
          color: ${C.muted};
        }

        .client-empty-mini {
          text-align: center;
          padding: 18px 0;
          border: 1px dashed ${C.border};
          border-radius: 12px;
          background: ${C.bg};
        }

        .client-empty-mini div {
          font-size: 24px;
          margin-bottom: 5px;
        }

        .client-empty-mini p {
          margin: 0;
          font-size: 11px;
          color: ${C.muted};
        }

        .client-active-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 330px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .client-active-card {
          width: 100%;
          text-align: left;
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
        }

        .client-active-card.selected {
          border-color: ${C.blue};
          box-shadow: 0 0 0 3px rgba(21,101,192,0.08);
        }

        .client-active-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 7px;
        }

        .client-active-head strong {
          display: block;
          color: ${C.text};
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .client-active-head span {
          display: block;
          color: ${C.muted};
          font-size: 10px;
          margin-top: 2px;
        }

        .client-active-head em {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          padding: 3px 7px;
          font-size: 9px;
          font-style: normal;
          font-weight: 900;
          white-space: nowrap;
        }

        .client-active-head i {
          width: 5px;
          height: 5px;
          border-radius: 999px;
        }

        .client-address {
          color: ${C.muted};
          font-size: 10px;
          margin: 0 0 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .client-monitor-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 10px;
          color: ${C.warning};
          font-weight: 800;
          margin-bottom: 7px;
        }

        .client-monitor-line b {
          color: ${C.greenDk};
        }

        .client-pro-row {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #D1FAE5;
          border-radius: 9px;
          padding: 7px 8px;
        }

        .client-pro-row span {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: ${C.green};
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .client-pro-row p {
          margin: 0;
          flex: 1;
          min-width: 0;
          color: ${C.greenDk};
          font-size: 10px;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .client-pro-row a {
          background: ${C.green};
          color: #fff;
          border-radius: 7px;
          padding: 4px 8px;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
        }

        .client-finding {
          color: ${C.warning};
          font-size: 10px;
          font-weight: 800;
        }

        .client-map {
          height: 150px;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid ${C.border};
          background: ${C.bg};
        }

        .client-map iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .client-map-link {
          margin-top: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, ${C.navy}, ${C.blue});
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
        }

        @media (max-width: 1180px) {
          .dashboard-content-shell {
            grid-template-columns: minmax(0, 1fr);
            max-width: 980px;
          }

          .client-right-panel {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .client-sidebar {
            display: none;
          }

          .client-mobile-header {
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
            background: linear-gradient(135deg, ${C.navyDark}, ${C.navy});
            box-shadow: 0 6px 18px rgba(13,55,129,0.18);
          }

          .client-page-frame {
            margin-left: 0;
          }

          .dashboard-content-shell {
            display: block;
            max-width: none;
            padding: 72px 14px 80px;
          }

          .client-mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 80;
            background: rgba(8,31,74,0.42);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.18s ease;
          }

          .client-mobile-backdrop.open {
            opacity: 1;
            pointer-events: auto;
          }

          .client-mobile-drawer {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: min(86vw, 300px);
            background: linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 48%, #0d4a2e 100%);
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: 12px 0 32px rgba(0,0,0,0.24);
          }

          .client-mobile-drawer.open {
            transform: translateX(0);
          }
        }
      `}</style>

      <aside className="client-sidebar">
        <SidebarContent />
      </aside>

      <header className="client-mobile-header">
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: 900,
          }}
          type="button"
          aria-label="Open menu"
        >
          ≡
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Image src="/logo.jpg" alt="EverClean" width={32} height={32} style={{ borderRadius: 9 }} />
          <div style={{ color: '#fff', fontWeight: 900 }}>
            Ever<span style={{ color: C.green }}>Clean</span>
          </div>
        </div>

        <div className="client-avatar">{clientInitial}</div>
      </header>

      <div className={`client-mobile-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className={`client-mobile-drawer ${menuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <SidebarContent />
        </div>
      </div>

      <div className="client-page-frame">
        <div className="dashboard-content-shell">
          <main className="client-main">{children}</main>
          <RightPanel
            bookings={bookings}
            selectedBooking={selectedBooking}
            onSelectBooking={setSelectedBooking}
            t={t}
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
}
