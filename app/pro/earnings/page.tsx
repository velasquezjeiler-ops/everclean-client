'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',bg:'#F5F7FA',text:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',warning:'#F59E0B' };

const SVC_MARK: Record<string,string> = {
  HOUSE_CLEANING:'HC',DEEP_CLEANING:'DC',MOVE_IN_OUT:'MV',SAME_DAY_CLEANING:'SD',
  OFFICE_CLEANING:'OF',POST_CONSTRUCTION:'PC',MEDICAL_CLEANING:'MC',CARPET_CLEANING:'CP',
  WINDOW_CLEANING:'WN',ORGANIZING:'OR',CAR_WASH:'CW',LAUNDRY_PICKUP:'LD',
};

function serviceLabel(t: (key: string) => string, serviceType: string) {
  const key = serviceType || '';
  const translated = t(`services.${key}`);
  return translated === `services.${key}` ? key.replace(/_/g, ' ') : translated;
}

function localeFor(lang: string) {
  const map: Record<string, string> = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR', ru: 'ru-RU', ko: 'ko-KR', zh: 'zh-CN', vi: 'vi-VN', tl: 'fil-PH', ar: 'ar' };
  return map[lang] || 'en-US';
}

export default function ProEarnings() {
  const { t, lang } = useTranslation();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API + '/payouts/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setPayouts(d.payouts || []); setSummary(d.summary || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const total = summary?.total_earned || 0;
  const paid = summary?.total_paid || 0;
  const pending = summary?.pending_payout || 0;
  const locale = localeFor(lang);

  return (
    <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 20px' }}>{t('pro.earnings.title')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: t('pro.earnings.totalEarned'), val: `$${Number(total).toFixed(2)}`, gradient: `linear-gradient(135deg, ${C.green}, ${C.greenDk})`, mark: '$' },
          { label: t('pro.earnings.totalPaid'), val: `$${Number(paid).toFixed(2)}`, gradient: `linear-gradient(135deg, ${C.blue}, ${C.navy})`, mark: 'P' },
          { label: t('pro.earnings.pending'), val: `$${Number(pending).toFixed(2)}`, gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', mark: 'T' },
        ].map(s => (
          <div key={s.label} style={{ background: s.gradient, borderRadius: 16, padding: '18px 16px', color: '#fff', boxShadow: '0 4px 20px rgba(13,55,129,0.18)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }}/>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>{s.mark}</div>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,55,129,0.06)' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t('pro.earnings.payoutHistory')}</span>
        </div>

        {payouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width: 58, height: 58, borderRadius: '50%', background: C.bg, color: C.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, marginBottom: 10 }}>0</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{t('pro.earnings.noPayouts')}</div>
            <div style={{ color: C.muted, fontSize: 13 }}>{t('pro.earnings.completeJobs')}</div>
          </div>
        ) : (
          <div>
            {payouts.map((p, i) => {
              const date = p.scheduled_at ? new Date(p.scheduled_at) : null;
              const isPaid = p.payout_status === 'paid';
              return (
                <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < payouts.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = C.bg)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 40, height: 40, background: isPaid ? '#D1FAE5' : '#FEF3C7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: isPaid ? C.greenDk : '#92400E', flexShrink: 0 }}>
                    {SVC_MARK[p.service_type] || 'EC'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{serviceLabel(t, p.service_type)}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {date ? date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      {p.hours ? ` · ${p.hours}${t('units.hours')}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: isPaid ? C.greenDk : C.warning }}>+${Number(p.payout_amount || 0).toFixed(2)}</div>
                    <span style={{ display: 'inline-block', background: isPaid ? '#D1FAE5' : '#FEF3C7', color: isPaid ? C.greenDk : '#92400E', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                      {isPaid ? t('pro.earnings.paid') : t('pro.earnings.pending')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}