'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

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
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 2px 12px rgba(13,55,129,0.05)',
      }}
    >
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1.05 }}>
        {value}
      </div>
    </div>
  );
}

export default function ProHistory() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/professionals/me/bookings', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setJobs((data.data || []).filter((b: any) => b.status === 'COMPLETED'));
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalEarned = jobs.reduce(
      (s, j) => s + Number(j.payout_amount || j.total_amount || 0),
      0
    );
    const rated = jobs.filter((j) => Number(j.rating || 0) > 0);
    const avgRating = rated.length
      ? (
          rated.reduce((s, j) => s + Number(j.rating || 0), 0) / rated.length
        ).toFixed(1)
      : '5.0';

    return {
      totalEarned,
      avgRating,
      completed: jobs.length,
    };
  }, [jobs]);

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
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.05,
            marginBottom: 4,
          }}
        >
          {t('sidebar.history')}
        </h1>
        <p style={{ fontSize: 14, color: C.muted }}>
          Review completed jobs with the same visual language as My Jobs.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <StatCard
          label={t('pro.dashboard.servicesCompleted')}
          value={String(stats.completed)}
          color={C.navy}
        />
        <StatCard
          label={t('pro.dashboard.totalEarnings')}
          value={`$${stats.totalEarned.toFixed(0)}`}
          color={C.greenDk}
        />
        <StatCard label="Average rating" value={stats.avgRating} color={C.blue} />
      </div>

      {jobs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            background: '#fff',
            borderRadius: 18,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.text,
              marginBottom: 6,
            }}
          >
            No completed jobs yet
          </div>
          <div style={{ fontSize: 14, color: C.muted }}>
            Completed services will appear here with the same card layout as My Jobs.
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 14,
            boxShadow: '0 2px 14px rgba(13,55,129,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>
              Completed Jobs
            </div>
            <div
              style={{
                minWidth: 30,
                height: 28,
                padding: '0 10px',
                borderRadius: 999,
                background: '#EFF6FF',
                color: C.blue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {jobs.length}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {jobs.map((b) => {
              const serviceKey = b.service_type || b.serviceType || 'HOUSE_CLEANING';
              const title = String(serviceKey).replace(/_/g, ' ');
              const icon = SVC_ICONS[serviceKey] || '🧹';
              const address = [b.address, b.city].filter(Boolean).join(', ');
              const payout = Number(b.payout_amount || b.total_amount || 0);

              return (
                <div
                  key={b.id}
                  style={{
                    background: '#F8FBFF',
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '14px 14px 10px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: '#EEF3FB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: C.text,
                              textTransform: 'uppercase',
                              lineHeight: 1.1,
                              marginBottom: 4,
                            }}
                          >
                            {title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: C.blue,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            📍 {address || 'Address unavailable'}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '5px 12px',
                          borderRadius: 999,
                          background: '#D1FAE5',
                          color: C.greenDk,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        • Completed
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {b.scheduled_at && (
                        <span
                          style={{
                            background: '#fff',
                            border: `1px solid ${C.border}`,
                            color: C.muted,
                            borderRadius: 10,
                            padding: '5px 10px',
                            fontSize: 12,
                          }}
                        >
                          🕒 {new Date(b.scheduled_at).toLocaleDateString()} ·{' '}
                          {new Date(b.scheduled_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}

                      {(b.square_feet || b.sqft) && (
                        <span
                          style={{
                            background: '#fff',
                            border: `1px solid ${C.border}`,
                            color: C.muted,
                            borderRadius: 10,
                            padding: '5px 10px',
                            fontSize: 12,
                          }}
                        >
                          ☐ {b.square_feet || b.sqft} sqft
                        </span>
                      )}

                      {payout > 0 && (
                        <span
                          style={{
                            background: '#DCFCE7',
                            color: C.greenDk,
                            borderRadius: 10,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          $ +{payout.toFixed(2)}
                        </span>
                      )}

                      {b.rating && (
                        <span
                          style={{
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ⭐ {b.rating}/5
                        </span>
                      )}

                      {b.tip && Number(b.tip) > 0 && (
                        <span
                          style={{
                            background: '#DBEAFE',
                            color: C.blue,
                            borderRadius: 10,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          🎁 ${Number(b.tip).toFixed(2)} tip
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ height: 1, background: C.border }} />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      padding: 12,
                      background: '#fff',
                    }}
                  >
                    <div
                      style={{
                        height: 38,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Completed Service
                    </div>
                    <div
                      style={{
                        height: 38,
                        borderRadius: 12,
                        background: '#EAF3FF',
                        color: C.blue,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Archived Job
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
