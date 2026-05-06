'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',bg:'#F5F7FA',text:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',warning:'#F59E0B' };

const SVC: Record<string,string> = {
  HOUSE_CLEANING:'🏠',DEEP_CLEANING:'✨',MOVE_IN_OUT:'📦',SAME_DAY_CLEANING:'⚡',
  OFFICE_CLEANING:'🏢',POST_CONSTRUCTION:'🔨',MEDICAL_CLEANING:'🏥',
  CARPET_CLEANING:'🛋',WINDOW_CLEANING:'🪟',ORGANIZING:'📋',CAR_WASH:'🚗',
};

export default function ProEarnings() {
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

  return (
    <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 20px' }}>My Earnings</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Earned', val: `$${Number(total).toFixed(2)}`, gradient: `linear-gradient(135deg, ${C.green}, ${C.greenDk})`, icon: '💰' },
          { label: 'Total Paid', val: `$${Number(paid).toFixed(2)}`, gradient: `linear-gradient(135deg, ${C.blue}, ${C.navy})`, icon: '✅' },
          { label: 'Pending', val: `$${Number(pending).toFixed(2)}`, gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{ background: s.gradient, borderRadius: 16, padding: '18px 16px', color: '#fff', boxShadow: '0 4px 20px rgba(13,55,129,0.18)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }}/>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Payout History */}
      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,55,129,0.06)' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: C.text }}>Payout History</span>
        </div>

        {payouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>💳</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>No payouts yet</div>
            <div style={{ color: C.muted, fontSize: 13 }}>Complete jobs to start earning</div>
          </div>
        ) : (
          <div>
            {payouts.map((p, i) => {
              const date = p.scheduled_at ? new Date(p.scheduled_at) : null;
              const isPaid = p.payout_status === 'paid';
              return (
                <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < payouts.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 40, height: 40, background: isPaid ? '#D1FAE5' : '#FEF3C7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {SVC[p.service_type] || '🧹'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{(p.service_type || '').replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      {p.hours ? ` · ${p.hours}h` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: isPaid ? C.greenDk : C.warning }}>
                      +${Number(p.payout_amount || 0).toFixed(2)}
                    </div>
                    <span style={{ display: 'inline-block', background: isPaid ? '#D1FAE5' : '#FEF3C7', color: isPaid ? C.greenDk : '#92400E', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                      {isPaid ? '✓ Paid' : '⏳ Pending'}
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
