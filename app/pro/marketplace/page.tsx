'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',bg:'#F5F7FA',text:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',warning:'#F59E0B' };

const SVC_MARK: Record<string,string> = {
  HOUSE_CLEANING:'HC',DEEP_CLEANING:'DC',MOVE_IN_OUT:'MV',SAME_DAY_CLEANING:'SD',
  OFFICE_CLEANING:'OF',POST_CONSTRUCTION:'PC',MEDICAL_CLEANING:'MC',MEDICAL_FACILITY:'MF',
  CARPET_CLEANING:'CP',WINDOW_CLEANING:'WN',ORGANIZING:'OR',CAR_WASH:'CW',LAUNDRY_PICKUP:'LD',
};

function fill(text: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((acc, [key, value]) => acc.replaceAll(`{{${key}}}`, String(value)), text);
}

function serviceLabel(t: (key: string) => string, serviceType: string) {
  const key = serviceType || '';
  const translated = t(`services.${key}`);
  return translated === `services.${key}` ? key.replace(/_/g, ' ') : translated;
}

function localeFor(lang: string) {
  const map: Record<string, string> = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR', ru: 'ru-RU', ko: 'ko-KR', zh: 'zh-CN', vi: 'vi-VN', tl: 'fil-PH', ar: 'ar' };
  return map[lang] || 'en-US';
}

export default function ProMarketplace() {
  const { t, lang } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string|null>(null);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [proRate, setProRate] = useState<number>(18);
  const [proRadius, setProRadius] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/available', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      setJobs(d.data || []);
      setProRate(d.pro_rate || 18);
      setProRadius(d.pro_radius || null);
      setError('');
    } catch (e) {
      setError(t('pro.marketplace.loadError'));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { load(); }, [load]);

  async function claimJob(jobId: string) {
    setClaiming(jobId);
    setError('');
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + jobId + '/claim', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || t('pro.marketplace.loadError'));
      }
      setClaimed((previous) => [...previous, jobId]);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setClaiming(null);
  }

  const tierLabel =
    proRate <= 18 ? t('pro.marketplace.priorityAccess') :
    proRate <= 19 ? t('pro.marketplace.tier2Access') :
    proRate <= 20 ? t('pro.marketplace.tier3Access') :
    proRate <= 30 ? t('pro.marketplace.openMarket') : t('pro.marketplace.allRates');
  const openAfter = proRate <= 19 ? 5 : proRate <= 20 ? 10 : 15;
  const locale = localeFor(lang);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}/>
        <div style={{ color: C.muted, fontSize: 13 }}>{t('pro.marketplace.loading')}</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{t('pro.marketplace.title')}</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          {t('pro.marketplace.rateLine')}: <strong style={{ color: C.navy }}>${proRate}/{t('units.hour')}</strong> · {t('pro.marketplace.auctionLine')}
        </p>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
        borderRadius: 14,
        padding: '14px 18px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>{t('pro.marketplace.currentTier')}</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{tierLabel} - ${proRate}/{t('units.hour')}</div>
          <div style={{ fontSize: 11, opacity: 0.68, marginTop: 3 }}>
            {proRate <= 18 ? t('pro.marketplace.priorityHint') : fill(t('pro.marketplace.openAfter'), { minutes: openAfter })}
          </div>
          {proRadius && (
            <div style={{ fontSize: 11, opacity: 0.68, marginTop: 2 }}>
              {t('pro.marketplace.coverageRadius')}: {proRadius} {t('units.miles')}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{jobs.length}</div>
          <div style={{ fontSize: 11, opacity: 0.72 }}>{t('pro.marketplace.jobsAvailable')}</div>
        </div>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: C.bg, color: C.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, marginBottom: 12 }}>0</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 6 }}>{t('pro.marketplace.noJobsTitle')}</div>
          <div style={{ color: C.muted, fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
            {proRate > 18 ? t('pro.marketplace.noJobsRate') : t('pro.marketplace.noJobsDefault')}
          </div>
          {proRate > 18 && (
            <div style={{ marginTop: 16, padding: '10px 16px', background: `${C.warning}15`, border: `1px solid ${C.warning}30`, borderRadius: 10, fontSize: 12, color: '#92400E', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              {t('pro.marketplace.lowerRateHint')}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map((job, idx) => {
            const date = job.scheduled_at ? new Date(job.scheduled_at) : null;
            const mins = Math.round(job.minutes_posted || 0);
            const isClaimed = claimed.includes(job.id);
            return (
              <div key={job.id} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,55,129,0.06)', animation: `fadeIn 0.3s ease ${idx * 0.05}s both` }}>
                <div style={{ height: 3, background: `linear-gradient(135deg, ${C.navy}, ${C.green})` }}/>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, background: `${C.navy}10`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: C.navy, flexShrink: 0 }}>
                        {SVC_MARK[job.service_type] || 'EC'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{serviceLabel(t, job.service_type)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.blue, fontSize: 11, marginTop: 2 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {job.address}{job.city ? `, ${job.city}` : ''}{job.state ? `, ${job.state}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.greenDk }}>+${Number(job.estimated_payout || 0).toFixed(0)}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{t('pro.marketplace.estimatedPayout')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {date && (
                      <span style={{ background: C.bg, color: C.muted, padding: '3px 9px', borderRadius: 999, fontSize: 10 }}>
                        {date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {job.hours && <span style={{ background: C.bg, color: C.muted, padding: '3px 9px', borderRadius: 999, fontSize: 10 }}>{job.hours}{t('units.hours')}</span>}
                    {job.sqft && <span style={{ background: C.bg, color: C.muted, padding: '3px 9px', borderRadius: 999, fontSize: 10 }}>{job.sqft} {t('units.sqft')}</span>}
                    {job.frequency && job.frequency !== 'ONE_TIME' && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{serviceLabel(t, job.frequency)}</span>}
                    <span style={{ background: C.bg, color: C.muted, padding: '3px 9px', borderRadius: 999, fontSize: 10 }}>{fill(t('pro.marketplace.minutesAgo'), { minutes: mins })}</span>
                    {job.distance_miles && (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, background: job.distance_miles <= 10 ? '#D1FAE5' : '#F5F7FA', color: job.distance_miles <= 10 ? '#388E3C' : '#64748B', padding:'4px 10px', borderRadius:8, fontSize:11, border:'1px solid #E2E8F0', fontWeight: job.distance_miles <= 10 ? 700 : 400 }}>
                        {fill(t('pro.marketplace.miAway'), { miles: job.distance_miles })}
                      </span>
                    )}
                  </div>

                  {job.client_price && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{t('pro.marketplace.clientPays')}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>${Number(job.client_price).toFixed(2)}</span>
                    </div>
                  )}

                  {isClaimed ? (
                    <div style={{ textAlign: 'center', padding: '11px', background: '#D1FAE5', borderRadius: 12, color: C.greenDk, fontSize: 13, fontWeight: 700 }}>{t('pro.marketplace.jobClaimed')}</div>
                  ) : (
                    <button onClick={() => claimJob(job.id)} disabled={claiming === job.id} style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: claiming === job.id ? C.muted : `linear-gradient(135deg, ${C.green}, ${C.greenDk})`, color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(76,175,80,0.35)', transition: 'all 0.2s' }}>
                      {claiming === job.id ? t('pro.marketplace.claiming') : t('pro.marketplace.claimJob')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}