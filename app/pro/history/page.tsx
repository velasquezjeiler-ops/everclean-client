'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', bg:'#F5F7FA', text:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', warning:'#F59E0B' };

const SVC_MARK: Record<string, string> = { HOUSE_CLEANING:'HC', DEEP_CLEANING:'DC', MOVE_IN_OUT:'MV', SAME_DAY_CLEANING:'SD', OFFICE_CLEANING:'OF', POST_CONSTRUCTION:'PC', MEDICAL_CLEANING:'MC', CARPET_CLEANING:'CP', WINDOW_CLEANING:'WN', ORGANIZING:'OR', CAR_WASH:'CW', LAUNDRY_PICKUP:'LD' };

function serviceLabel(t: (key: string) => string, serviceType: string) {
  const key = serviceType || '';
  const translated = t(`services.${key}`);
  return translated === `services.${key}` ? key.replace(/_/g, ' ') : translated;
}

function localeFor(lang: string) {
  const map: Record<string, string> = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR', ru: 'ru-RU', ko: 'ko-KR', zh: 'zh-CN', vi: 'vi-VN', tl: 'fil-PH', ar: 'ar' };
  return map[lang] || 'en-US';
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 12px rgba(13,55,129,0.05)' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1.05 }}>{value}</div>
    </div>
  );
}

export default function ProHistory() {
  const { t, lang } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/professionals/me/bookings', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setJobs((data.data || []).filter((b: any) => b.status === 'COMPLETED'));
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const totalEarned = jobs.reduce((s, j) => s + Number(j.payout_amount || j.total_amount || 0), 0);
    const rated = jobs.filter((j) => Number(j.rating || 0) > 0);
    const avgRating = rated.length ? (rated.reduce((s, j) => s + Number(j.rating || 0), 0) / rated.length).toFixed(1) : '5.0';
    return { totalEarned, avgRating, completed: jobs.length };
  }, [jobs]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-9 h-9 rounded-full animate-spin" style={{ border: `3px solid ${C.border}`, borderTopColor: C.blue }} />
    </div>
  );

  const locale = localeFor(lang);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, lineHeight: 1.05, marginBottom: 4 }}>{t('sidebar.history')}</h1>
        <p style={{ fontSize: 14, color: C.muted }}>{t('pro.history.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        <StatCard label={t('pro.dashboard.servicesCompleted')} value={String(stats.completed)} color={C.navy} />
        <StatCard label={t('pro.dashboard.totalEarnings')} value={`$${stats.totalEarned.toFixed(0)}`} color={C.greenDk} />
        <StatCard label={t('pro.history.averageRating')} value={stats.avgRating} color={C.blue} />
      </div>

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#fff', borderRadius: 18, border: `1px solid ${C.border}` }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: C.bg, color: C.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: 10 }}>0</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t('pro.history.noCompletedTitle')}</div>
          <div style={{ fontSize: 14, color: C.muted }}>{t('pro.history.noCompletedDesc')}</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 14, boxShadow: '0 2px 14px rgba(13,55,129,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{t('pro.history.completedJobs')}</div>
            <div style={{ minWidth: 30, height: 28, padding: '0 10px', borderRadius: 999, background: '#EFF6FF', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{jobs.length}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {jobs.map((b) => {
              const serviceKey = b.service_type || b.serviceType || 'HOUSE_CLEANING';
              const address = [b.address, b.city].filter(Boolean).join(', ');
              const payout = Number(b.payout_amount || b.total_amount || 0);
              const scheduled = b.scheduled_at ? new Date(b.scheduled_at) : null;
              return (
                <div key={b.id} style={{ background: '#F8FBFF', border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 14px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF3FB', color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{SVC_MARK[serviceKey] || 'EC'}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 4 }}>{serviceLabel(t, serviceKey)}</div>
                          <div style={{ fontSize: 12, color: C.blue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{address || t('pro.history.addressUnavailable')}</div>
                        </div>
                      </div>
                      <div style={{ padding: '5px 12px', borderRadius: 999, background: '#D1FAE5', color: C.greenDk, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{t('statuses.COMPLETED')}</div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {scheduled && <span style={{ background: '#fff', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: '5px 10px', fontSize: 12 }}>{scheduled.toLocaleDateString(locale)} · {scheduled.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>}
                      {(b.square_feet || b.sqft) && <span style={{ background: '#fff', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: '5px 10px', fontSize: 12 }}>{b.square_feet || b.sqft} {t('units.sqft')}</span>}
                      {payout > 0 && <span style={{ background: '#DCFCE7', color: C.greenDk, borderRadius: 10, padding: '5px 10px', fontSize: 12, fontWeight: 700 }}>+${payout.toFixed(2)}</span>}
                      {b.rating && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{b.rating}/5</span>}
                      {b.tip && Number(b.tip) > 0 && <span style={{ background: '#DBEAFE', color: C.blue, borderRadius: 10, padding: '5px 10px', fontSize: 12, fontWeight: 700 }}>${Number(b.tip).toFixed(2)} {t('pro.history.tip')}</span>}
                    </div>
                  </div>

                  <div style={{ height: 1, background: C.border }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12, background: '#fff' }}>
                    <div style={{ height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{t('pro.history.completedService')}</div>
                    <div style={{ height: 38, borderRadius: 12, background: '#EAF3FF', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{t('pro.history.archivedJob')}</div>
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