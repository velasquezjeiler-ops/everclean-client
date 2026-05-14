'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://everclean-platform.replit.app/api';
const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', shadow:'0 2px 8px rgba(13,55,129,0.06)' };
const VIP_DISCOUNT = 0.20;
const FEE = 49;

function Badge({ label }: { label: string }) {
  return <span style={{ width: 34, height: 34, borderRadius: 10, background: '#0D378114', border: '1px solid #0D378130', color: C.navy, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{label}</span>;
}

function money(value: number) {
  return '$' + value.toFixed(2).replace(/\.00$/, '');
}

export default function MembershipPage() {
  const [user, setUser] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [estimatedTotal, setEstimatedTotal] = useState(180);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('everclean_client_token') || localStorage.getItem('token') || '';
    fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + t } }).then(r => r.json()).then(setUser).catch(() => {});
    fetch(API + '/membership/wallet', { headers: { Authorization: 'Bearer ' + t } }).then(r => r.json()).then(w => setTxns(w.transactions || [])).catch(() => {});
  }, []);

  const isVIP = user?.membership_status === 'vip';
  const discountAmount = estimatedTotal * VIP_DISCOUNT;
  const vipTotal = Math.max(0, estimatedTotal - discountAmount);
  const card = (bg: string, padding: string) => ({ background: bg, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, padding });

  const benefits = [
    { label: '20', title: '20% off every cleaning', desc: 'Applied to the full calculated cleaning total at checkout.' },
    { label: 'HM', title: 'Hours never expire', desc: 'Unused VIP balance carries over month to month.' },
    { label: 'GM', title: 'Guaranteed match', desc: 'Favorite professionals get exclusive priority when available.' },
    { label: '2M', title: 'Up to $2M liability coverage', desc: 'Eligible services are protected up to $2M.' },
    { label: 'PS', title: 'Priority support', desc: 'Dedicated VIP support line 7 days a week.' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: '0 0 4px', color: C.greenDk, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Membership</p>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: C.ink }}>VIP Membership</h1>
        <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>Save 20% on every calculated cleaning total. No fixed hourly rate.</p>
      </div>

      <div style={{ ...card(isVIP ? 'linear-gradient(135deg,#0D3781,#1565C0)' : '#fff', '28px'), marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge label={isVIP ? 'VIP' : 'FR'} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: isVIP ? '#fff' : C.ink }}>{isVIP ? 'VIP Member' : 'Free Plan'}</div>
              <div style={{ fontSize: 13, color: isVIP ? 'rgba(255,255,255,0.76)' : C.muted }}>{isVIP ? 'Your 20% discount is active on eligible cleaning services.' : 'Upgrade for 20% off every calculated cleaning total.'}</div>
            </div>
          </div>
          {!isVIP && <button onClick={() => setMsg('Stripe activation coming soon. Contact support@evercleanapp.com')} style={{ padding: '14px 28px', borderRadius: 9999, border: 0, background: C.green, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Upgrade to VIP - ${FEE}/mo</button>}
        </div>
        {msg && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: isVIP ? 'rgba(0,0,0,0.12)' : '#F8FAFC', color: isVIP ? '#fff' : C.ink, fontSize: 13 }}>{msg}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ ...card('#fff', '24px') }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: C.ink }}>Savings Calculator</h3>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estimated cleaning total</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
            <button onClick={() => setEstimatedTotal(v => Math.max(50, v - 25))} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.border}`, background: '#fff', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>-</button>
            <input value={estimatedTotal} onChange={(e) => setEstimatedTotal(Math.max(0, Number(e.target.value) || 0))} inputMode="numeric" style={{ width: 120, height: 42, borderRadius: 10, border: `1px solid ${C.border}`, textAlign: 'center', fontSize: 22, fontWeight: 700, color: C.ink }} />
            <button onClick={() => setEstimatedTotal(v => v + 25)} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.border}`, background: '#fff', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>+</button>
          </div>
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: C.muted }}>Calculated service total</span><span style={{ color: C.ink }}>{money(estimatedTotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: C.greenDk }}>VIP discount (20%)</span><span style={{ color: C.greenDk }}>-{money(discountAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}><span style={{ color: C.ink }}>VIP total</span><span style={{ color: C.greenDk }}>{money(vipTotal)}</span></div>
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 12, color: C.greenDk }}>VIP saves {money(discountAmount)} on this calculated service total.</div>
        </div>

        <div style={{ ...card('#fff', '24px') }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: C.ink }}>VIP Benefits</h3>
          {benefits.map((b) => (
            <div key={b.title} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <Badge label={b.label} />
              <div><div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{b.title}</div><div style={{ fontSize: 12, color: C.muted }}>{b.desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card('#fff', '24px') }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: C.ink }}>VIP Savings History</h3>
        {txns.length === 0 ? <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontSize: 14 }}>VIP savings and credits will appear here after checkout.</div> : txns.map((tx: any) => (
          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, marginBottom: 10 }}>
            <span style={{ color: C.ink, fontWeight: 600, fontSize: 13 }}>{tx.description || tx.type}</span>
            <span style={{ color: C.greenDk, fontWeight: 700, fontSize: 13 }}>{tx.amount ? money(Number(tx.amount)) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
