'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup.replit.app/api';

const C = {
  navy: '#0D3781',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  bg: '#F5F7FA',
  text: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
};

const SERVICE_MARKS: Record<string, string> = {
  HOUSE_CLEANING: 'HC',
  DEEP_CLEANING: 'DC',
  MOVE_IN_OUT: 'MV',
  SAME_DAY_CLEANING: 'SD',
  OFFICE_CLEANING: 'OF',
  POST_CONSTRUCTION: 'PC',
  MEDICAL_CLEANING: 'MC',
  CARPET_CLEANING: 'CP',
  WINDOW_CLEANING: 'WN',
  ORGANIZING: 'OR',
  CAR_WASH: 'CW',
  LAUNDRY_PICKUP: 'LD',
};

type Booking = {
  id: string | number;
  status?: string;
  service_type?: string;
  serviceType?: string;
  address?: string;
  city?: string;
  state?: string;
  scheduled_at?: string;
  total_amount?: string | number;
  client_price?: string | number;
  rated?: boolean;
  rating?: number;
  professionals?: Array<{
    professional?: {
      fullName?: string;
      full_name?: string;
      phone?: string;
    };
  }>;
};

function serviceName(booking: Booking, t: (key: string) => string) {
  const key = String(booking.service_type || booking.serviceType || 'HOUSE_CLEANING');
  const translated = t(`services.${key}`);
  return translated === `services.${key}` ? key.replace(/_/g, ' ') : translated;
}

function serviceIcon(booking: Booking) {
  return SERVICE_MARKS[String(booking.service_type || booking.serviceType)] || 'EC';
}

function localeFor(lang: string) {
  const map: Record<string, string> = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR', ru: 'ru-RU', ko: 'ko-KR', zh: 'zh-CN', vi: 'vi-VN', tl: 'fil-PH', ar: 'ar' };
  return map[lang] || 'en-US';
}

function bookingAddress(booking: Booking) {
  return [booking.address, booking.city, booking.state].filter(Boolean).join(', ');
}

function bookingAmount(booking: Booking) {
  return Number(booking.client_price || booking.total_amount || 0);
}

function proName(booking: Booking) {
  const pro = booking.professionals?.[0]?.professional;
  return pro?.fullName || pro?.full_name || '';
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="client-history-stat">
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export default function ClientHistory() {
  const { t, lang } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<Booking | null>(null);
  const [stars, setStars] = useState(5);
  const [tip, setTip] = useState(0);
  const locale = localeFor(lang);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(API + '/bookings', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      const completed = Array.isArray(data.data)
        ? data.data.filter((b: Booking) => b.status === 'COMPLETED')
        : [];

      setBookings(completed);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitRating() {
    if (!ratingModal) return;

    const token = localStorage.getItem('token') || '';

    await fetch(API + '/bookings/' + ratingModal.id + '/rate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating: stars, tip }),
    });

    setRatingModal(null);
    load();
  }

  const stats = useMemo(() => {
    const totalSpent = bookings.reduce((sum, booking) => sum + bookingAmount(booking), 0);
    const unrated = bookings.filter((booking) => !booking.rated).length;

    return {
      totalServices: bookings.length,
      totalSpent,
      unrated,
    };
  }, [bookings]);

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
    <div className="client-history-page">
      <style>{`
        .client-history-page {
          width: 100%;
        }

        .client-history-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .client-history-title {
          font-size: 28px;
          font-weight: 900;
          color: ${C.text};
          line-height: 1.05;
          margin: 0 0 5px;
        }

        .client-history-subtitle {
          margin: 0;
          color: ${C.muted};
          font-size: 14px;
        }

        .client-history-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .client-history-stat {
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 2px 12px rgba(13, 55, 129, 0.05);
          min-width: 0;
        }

        .client-history-panel {
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 2px 14px rgba(13, 55, 129, 0.05);
        }

        .client-history-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .client-history-count {
          min-width: 30px;
          height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: #EFF6FF;
          color: ${C.blue};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
        }

        .client-history-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .client-history-card {
          background: #F8FBFF;
          border: 1px solid ${C.border};
          border-radius: 18px;
          overflow: hidden;
        }

        .client-history-card-body {
          padding: 14px 14px 10px;
        }

        .client-history-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .client-history-service {
          display: flex;
          gap: 10px;
          min-width: 0;
        }

        .client-history-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #EEF3FB;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .client-history-name {
          font-size: 14px;
          font-weight: 900;
          color: ${C.text};
          text-transform: uppercase;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .client-history-address {
          font-size: 12px;
          color: ${C.blue};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .client-history-badge {
          padding: 5px 12px;
          border-radius: 999px;
          background: #D1FAE5;
          color: ${C.greenDk};
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .client-history-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .client-history-chip {
          background: #fff;
          border: 1px solid ${C.border};
          color: ${C.muted};
          border-radius: 10px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .client-history-chip.green {
          background: #DCFCE7;
          color: ${C.greenDk};
          border-color: transparent;
          font-weight: 900;
        }

        .client-history-chip.amber {
          background: #FEF3C7;
          color: #92400E;
          border-color: transparent;
          font-weight: 900;
        }

        .client-history-pro {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ECFDF5;
          border-radius: 12px;
          padding: 8px 10px;
        }

        .client-history-pro-avatar {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: ${C.green};
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .client-history-pro p {
          margin: 0;
          color: ${C.greenDk};
          font-size: 12px;
          font-weight: 800;
        }

        .client-history-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 12px;
          background: #fff;
        }

        .client-history-action {
          min-height: 38px;
          border-radius: 12px;
          border: 1px solid ${C.border};
          background: #fff;
          color: ${C.muted};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .client-history-action.primary {
          border: 0;
          background: linear-gradient(135deg, ${C.navy}, ${C.blue});
          color: #fff;
        }

        .client-history-action.done {
          border: 0;
          background: #DCFCE7;
          color: ${C.greenDk};
          cursor: default;
        }

        .client-history-empty {
          text-align: center;
          padding: 48px;
          background: #fff;
          border-radius: 18px;
          border: 1px solid ${C.border};
        }

        .client-rating-backdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
          background: rgba(8, 31, 74, 0.46);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .client-rating-modal {
          width: 100%;
          max-width: 390px;
          background: #fff;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 18px 60px rgba(13, 55, 129, 0.24);
        }

        @media (max-width: 760px) {
          .client-history-header {
            flex-direction: column;
          }

          .client-history-title {
            font-size: 26px;
          }

          .client-history-stats {
            grid-template-columns: 1fr;
          }

          .client-history-card-head {
            flex-direction: column;
          }

          .client-history-actions {
            grid-template-columns: 1fr;
          }

          .client-rating-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .client-rating-modal {
            max-width: none;
            border-radius: 20px 20px 0 0;
          }
        }
      `}</style>

      <div className="client-history-header">
        <div>
          <h1 className="client-history-title">{t('client.history.title')}</h1>
          <p className="client-history-subtitle">
            {t('client.historyExtra.subtitle')}
          </p>
        </div>
      </div>

      <div className="client-history-stats">
        <StatCard
          label={t('client.history.totalServices')}
          value={String(stats.totalServices)}
          color={C.navy}
        />
        <StatCard
          label={t('client.history.totalSpent')}
          value={`$${stats.totalSpent.toFixed(0)}`}
          color={C.greenDk}
        />
        <StatCard
          label={t('client.history.unrated')}
          value={String(stats.unrated)}
          color={C.warning}
        />
      </div>

      {bookings.length === 0 ? (
        <div className="client-history-empty">
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>
            {t('client.history.noCompleted')}
          </div>
          <div style={{ fontSize: 14, color: C.muted }}>
            {t('client.historyExtra.noCompletedDesc')}
          </div>
        </div>
      ) : (
        <div className="client-history-panel">
          <div className="client-history-panel-head">
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>
              {t('client.historyExtra.completedServices')}
            </div>
            <div className="client-history-count">{bookings.length}</div>
          </div>

          <div className="client-history-list">
            {bookings.map((booking) => {
              const name = serviceName(booking, t);
              const address = bookingAddress(booking);
              const amount = bookingAmount(booking);
              const professional = proName(booking);

              return (
                <div key={booking.id} className="client-history-card">
                  <div className="client-history-card-body">
                    <div className="client-history-card-head">
                      <div className="client-history-service">
                        <div className="client-history-icon">{serviceIcon(booking)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className="client-history-name">{name}</div>
                          <div className="client-history-address">
                            {address || t('client.historyExtra.addressUnavailable')}
                          </div>
                        </div>
                      </div>

                      <div className="client-history-badge">
                        {t('statuses.COMPLETED')}
                      </div>
                    </div>

                    <div className="client-history-chips">
                      {booking.scheduled_at && (
                        <span className="client-history-chip">
                          {new Date(booking.scheduled_at).toLocaleDateString(locale)} ? {new Date(booking.scheduled_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}

                      {amount > 0 && (
                        <span className="client-history-chip green">
                          ${amount.toFixed(2)}
                        </span>
                      )}

                      {booking.rated && (
                        <span className="client-history-chip amber">{t('client.history.rated')}</span>
                      )}
                    </div>

                    {professional && (
                      <div className="client-history-pro">
                        <div className="client-history-pro-avatar">{professional[0]}</div>
                        <p>{professional}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ height: 1, background: C.border }} />

                  <div className="client-history-actions">
                    {!booking.rated ? (
                      <button
                        className="client-history-action primary"
                        onClick={() => {
                          setRatingModal(booking);
                          setStars(5);
                          setTip(0);
                        }}
                        type="button"
                      >{t('client.history.rateAndTip')}</button>
                    ) : (
                      <div className="client-history-action done">{t('client.history.rated')}</div>
                    )}

                    <button className="client-history-action" type="button">{t('client.history.invoice')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ratingModal && (
        <div className="client-rating-backdrop">
          <div className="client-rating-modal">
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 16px', color: C.text }}>
              {t('client.history.rateService')}
            </h3>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setStars(s)}
                  style={{
                    border: 0,
                    background: 'transparent',
                    fontSize: 30,
                    cursor: 'pointer',
                    opacity: s <= stars ? 1 : 0.28,
                  }}
                  type="button"
                >
                  ⭐
                </button>
              ))}
            </div>

            <p style={{ fontSize: 14, color: C.muted, margin: '0 0 10px' }}>
              {t('client.history.addTip')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 18 }}>
              {[0, 5, 10, 15, 20].map((tipAmount) => (
                <button
                  key={tipAmount}
                  onClick={() => setTip(tipAmount)}
                  style={{
                    minHeight: 40,
                    borderRadius: 12,
                    border: tip === tipAmount ? `1px solid ${C.greenDk}` : `1px solid ${C.border}`,
                    background: tip === tipAmount ? C.greenDk : '#fff',
                    color: tip === tipAmount ? '#fff' : C.muted,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  type="button"
                >
                  {tipAmount === 0 ? t('client.history.none') : `$${tipAmount}`}
                </button>
              ))}
            </div>

            <button
              onClick={submitRating}
              style={{
                width: '100%',
                minHeight: 44,
                border: 0,
                borderRadius: 14,
                background: C.greenDk,
                color: '#fff',
                fontWeight: 900,
                cursor: 'pointer',
              }}
              type="button"
            >
              {t('client.history.submit')}
              {tip > 0 ? ` + $${tip}` : ''}
            </button>

            <button
              onClick={() => setRatingModal(null)}
              style={{
                width: '100%',
                marginTop: 8,
                minHeight: 38,
                border: 0,
                background: 'transparent',
                color: C.muted,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              type="button"
            >
              {t('client.history.skip')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
