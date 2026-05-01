'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n/useTranslation';
import BookingCalendar from '../../app/components/BookingCalendar';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const C = {
  navy: '#0D3781',
  blue: '#1565C0',
  greenDk: '#388E3C',
  text: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
};

function serviceLabel(value: string) {
  return String(value || 'HOUSE_CLEANING').replace(/_/g, ' ');
}

function calculatedSqft(b: any) {
  return Number(
    b.sqft_used ||
      b.calculated_sqft ||
      b.square_feet ||
      b.sqft ||
      b.sqftUsed ||
      0
  );
}

function estimatedHoursFromBooking(b: any) {
  const direct = Number(
    b.estimated_hours ||
      b.estimatedHours ||
      b.hours ||
      b.duration_hours ||
      b.durationHours ||
      0
  );

  if (direct > 0) return direct;

  const sqft = calculatedSqft(b);
  if (!sqft) return null;

  if (sqft <= 1000) return 2;
  if (sqft <= 2000) return 3;
  if (sqft <= 3500) return 4;
  return 5;
}

function moneyValue(b: any) {
  return Number(b.client_price || b.total_amount || 0);
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(API + '/bookings', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setBookings(Array.isArray(data.data) ? data.data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const totalSpent = completed.reduce((sum, b) => sum + moneyValue(b), 0);

  const calendarBookings = bookings.map((b) => ({
    id: b.id,
    service_type: b.service_type || b.serviceType || '',
    scheduled_date: b.scheduled_at ? b.scheduled_at.split('T')[0] : '',
    scheduled_time: b.scheduled_at ? b.scheduled_at.split('T')[1]?.slice(0, 5) : '',
    address: b.address,
    status: (b.status || '').toLowerCase(),
    client_price: moneyValue(b),
    hours: estimatedHoursFromBooking(b),
  }));

  const dayBookings = active.filter((b) => {
    const d = b.scheduled_at ? b.scheduled_at.split('T')[0] : '';
    return d === selectedDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-9 h-9 rounded-full animate-spin"
          style={{
            border: `3px solid ${C.border}`,
            borderTopColor: C.blue,
          }}
        />
      </div>
    );
  }

  return (
    <div className="client-dashboard-page">
      <style>{`
        .client-dashboard-page {
          width: 100%;
        }

        .client-dashboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .client-dashboard-title {
          font-size: 28px;
          font-weight: 900;
          line-height: 1.05;
          color: ${C.text};
          margin: 0 0 5px;
        }

        .client-dashboard-subtitle {
          margin: 0;
          color: ${C.muted};
          font-size: 14px;
        }

        .client-dashboard-book {
          border-radius: 12px;
          min-height: 40px;
          padding: 0 16px;
          background: ${C.greenDk};
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
        }

        .client-dashboard-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .client-dashboard-stat {
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 2px 12px rgba(13, 55, 129, 0.05);
        }

        .client-dashboard-stat p {
          margin: 0 0 7px;
          color: ${C.muted};
          font-size: 12px;
        }

        .client-dashboard-stat strong {
          display: block;
          font-size: 28px;
          line-height: 1;
          font-weight: 900;
        }

        .client-dashboard-card {
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 18px;
          box-shadow: 0 2px 14px rgba(13, 55, 129, 0.05);
          margin-bottom: 14px;
        }

        .client-calendar-wrap {
          padding: 16px;
        }

        .client-day-title {
          color: ${C.text};
          font-size: 15px;
          font-weight: 900;
          margin: 0 0 10px;
        }

        .client-empty-day {
          text-align: center;
          padding: 30px 16px;
          background: #F8FAFC;
          border-radius: 16px;
          color: #94A3B8;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .client-bookings-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .client-booking-card {
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 2px 14px rgba(13, 55, 129, 0.05);
        }

        .client-booking-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .client-booking-title {
          color: ${C.text};
          font-size: 15px;
          font-weight: 900;
          margin: 0 0 3px;
        }

        .client-booking-address {
          color: ${C.muted};
          font-size: 12px;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .client-status {
          border-radius: 999px;
          border: 1px solid;
          padding: 4px 9px;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .client-status.confirmed {
          color: #1E40AF;
          background: #DBEAFE;
          border-color: #BFDBFE;
        }

        .client-status.progress {
          color: #5B21B6;
          background: #EDE9FE;
          border-color: #DDD6FE;
        }

        .client-status.pending {
          color: #92400E;
          background: #FEF3C7;
          border-color: #FDE68A;
        }

        .client-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 10px;
        }

        .client-chip {
          border-radius: 9px;
          padding: 5px 8px;
          font-size: 11px;
          font-weight: 800;
          background: #F1F5F9;
          color: #475569;
        }

        .client-chip.blue {
          background: #EFF6FF;
          color: ${C.blue};
        }

        .client-chip.indigo {
          background: #EEF2FF;
          color: #4F46E5;
        }

        .client-chip.green {
          background: #DCFCE7;
          color: ${C.greenDk};
        }

        .client-pro-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px;
          background: #ECFDF5;
          border-radius: 12px;
        }

        .client-pro-avatar {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #34C759;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .client-pro-row p {
          margin: 0;
          flex: 1;
          min-width: 0;
          color: ${C.greenDk};
          font-size: 12px;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .client-pro-row a {
          background: ${C.greenDk};
          color: #fff;
          border-radius: 9px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 900;
          text-decoration: none;
        }

        .client-finding {
          color: #D97706;
          font-size: 12px;
          font-weight: 800;
          margin: 0;
        }

        @media (max-width: 760px) {
          .client-dashboard-header {
            flex-direction: column;
          }

          .client-dashboard-book {
            width: 100%;
          }

          .client-dashboard-stats {
            grid-template-columns: 1fr;
          }

          .client-booking-head {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="client-dashboard-header">
        <div>
          <h1 className="client-dashboard-title">{t('client.dashboard.title')}</h1>
          <p className="client-dashboard-subtitle">
            Track upcoming services, assigned professionals, hours and pricing.
          </p>
        </div>

        <Link href="/dashboard/new-booking" className="client-dashboard-book">
          + {t('client.dashboard.bookNow')}
        </Link>
      </div>

      <div className="client-dashboard-stats">
        <div className="client-dashboard-stat">
          <p>{t('client.dashboard.upcomingServices')}</p>
          <strong style={{ color: C.greenDk }}>{active.length}</strong>
        </div>
        <div className="client-dashboard-stat">
          <p>{t('client.history.totalServices')}</p>
          <strong style={{ color: C.text }}>{completed.length}</strong>
        </div>
        <div className="client-dashboard-stat">
          <p>{t('client.history.totalSpent')}</p>
          <strong style={{ color: C.blue }}>${totalSpent.toFixed(0)}</strong>
        </div>
      </div>

      <div className="client-dashboard-card">
        <div className="client-calendar-wrap">
          <BookingCalendar bookings={calendarBookings} role="client" />
        </div>
      </div>

      <p className="client-day-title">
        {new Date(selectedDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </p>

      {dayBookings.length === 0 && (
        <div className="client-empty-day">
          <div style={{ fontSize: 28, marginBottom: 6 }}>🗓️</div>
          No bookings on this day
        </div>
      )}

      {active.length === 0 ? (
        <div className="client-dashboard-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🧹</div>
          <div style={{ color: C.text, fontSize: 18, fontWeight: 900, marginBottom: 5 }}>
            {t('client.dashboard.noServices')}
          </div>
          <div style={{ color: C.muted, fontSize: 14 }}>{t('client.dashboard.bookFirst')}</div>
        </div>
      ) : (
        <div className="client-bookings-list">
          {active.map((b) => {
            const pro = b.professionals?.[0]?.professional;
            const sqft = calculatedSqft(b);
            const estimatedHours = estimatedHoursFromBooking(b);
            const amount = moneyValue(b);
            const statusClass =
              b.status === 'CONFIRMED'
                ? 'confirmed'
                : b.status === 'IN_PROGRESS'
                  ? 'progress'
                  : 'pending';

            return (
              <div key={b.id} className="client-booking-card">
                <div className="client-booking-head">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="client-booking-title">
                      {t('services.' + (b.service_type || b.serviceType)) ||
                        serviceLabel(b.service_type || b.serviceType)}
                    </p>
                    <p className="client-booking-address">
                      📍 {b.address}
                      {b.city ? `, ${b.city}` : ''}
                    </p>
                  </div>

                  <span className={`client-status ${statusClass}`}>
                    {t('statuses.' + b.status)}
                  </span>
                </div>

                <div className="client-chip-row">
                  {b.scheduled_at && (
                    <span className="client-chip">
                      {new Date(b.scheduled_at).toLocaleDateString()}
                    </span>
                  )}

                  {sqft > 0 && <span className="client-chip blue">{sqft} sqft</span>}

                  {estimatedHours && (
                    <span className="client-chip indigo">{estimatedHours}h estimated</span>
                  )}

                  {amount > 0 && (
                    <span className="client-chip green">${amount.toFixed(2)}</span>
                  )}
                </div>

                {pro ? (
                  <div className="client-pro-row">
                    <div className="client-pro-avatar">{(pro.fullName || 'P')[0]}</div>
                    <p>
                      {t('client.dashboard.assignedCleaner')}: {pro.fullName}
                    </p>
                    {pro.phone && (
                      <a href={`tel:${pro.phone}`}>{t('client.dashboard.callCleaner')}</a>
                    )}
                  </div>
                ) : (
                  <p className="client-finding">⏳ {t('client.dashboard.findingCleaner')}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
