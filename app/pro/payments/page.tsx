'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';
const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', bg:'#F5F7FA', text:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', warning:'#F59E0B' };

export default function ProPayments() {
  const [profile, setProfile] = useState<any>(null);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [completedJobs, setCompletedJobs] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    Promise.all([
      fetch(API+'/professionals/me', { headers:{ Authorization:'Bearer '+token } }).then(r=>r.json()),
      fetch(API+'/stripe/connect/status', { headers:{ Authorization:'Bearer '+token } }).then(r=>r.json()).catch(()=>({})),
      fetch(API+'/professionals/me/bookings', { headers:{ Authorization:'Bearer '+token } }).then(r=>r.json()).catch(()=>({data:[]})),
    ]).then(([pd, sd, bd]) => {
      setProfile(pd);
      setStripeStatus(sd);
      const completed = (bd.data||[]).filter((j:any) => j.status === 'COMPLETED');
      setCompletedJobs(completed.length);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  async function startOnboarding() {
    setOnboarding(true);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/stripe/connect/onboard', {
        method: 'POST',
        headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json' },
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } catch(e) { setOnboarding(false); }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.green, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const isConnected = stripeStatus?.connected;
  const canRequestCard = completedJobs >= 3;
  const hourlyRate = Number(profile?.hourly_rate || 18);
  const card = { background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:'20px 22px', boxShadow:'0 2px 12px rgba(13,55,129,0.06)', marginBottom:16 };

  return (
    <div style={{ maxWidth:760, fontFamily:'Poppins, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h1 style={{ fontSize:22, fontWeight:700, color:C.text, margin:'0 0 20px' }}>Payment Setup</h1>

      {/* Stripe Connect */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>Direct Deposit</div>
          <span style={{ padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700, background: isConnected ? '#D1FAE5' : '#FEF3C7', color: isConnected ? C.greenDk : '#92400E' }}>
            {isConnected ? '✓ Connected' : '⏳ Not Connected'}
          </span>
        </div>
        {isConnected ? (
          <div style={{ padding:'12px 14px', background:C.bg, borderRadius:10, fontSize:12, color:C.muted }}>
            🔒 Bank account connected. Payouts process weekly every Friday.
          </div>
        ) : (
          <div>
            <p style={{ fontSize:13, color:C.muted, marginBottom:14 }}>Connect your bank account to receive weekly payouts.</p>
            <button onClick={startOnboarding} disabled={onboarding} style={{
              width:'100%', padding:'13px 0', borderRadius:12, border:'none', cursor:'pointer',
              background:`linear-gradient(135deg, ${C.navy}, ${C.blue})`,
              color:'#fff', fontSize:14, fontWeight:700, opacity: onboarding ? 0.7 : 1,
            }}>
              {onboarding ? 'Redirecting to Stripe...' : '🏦 Connect Bank Account'}
            </button>
          </div>
        )}
      </div>

      {/* Rate & Tier */}
      <div style={card}>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:12 }}>Your Rate & Auction Tier</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ padding:'14px 16px', background:C.bg, borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:800, color:C.navy }}>${hourlyRate}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>per hour</div>
          </div>
          <div style={{ padding:'14px 16px', background: hourlyRate <= 18 ? '#D1FAE5' : '#FEF3C7', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color: hourlyRate <= 18 ? C.greenDk : '#92400E' }}>
              {hourlyRate <= 18 ? '⚡ Priority' : hourlyRate <= 20 ? '🥈 Tier 2' : '🔓 Open'}
            </div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>auction tier</div>
          </div>
        </div>
        <div style={{ marginTop:10, fontSize:12, color:C.muted }}>
          💡 Lower rate = higher priority. Update in{' '}
          <Link href="/pro/profile" style={{ color:C.blue, fontWeight:600 }}>Profile</Link>.
        </div>
      </div>

      {/* EverClean Pro Card */}
      <div style={card}>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:14 }}>EverClean Pro Card</div>
        <div style={{ borderRadius:16, padding:'22px 20px', marginBottom:14, position:'relative', overflow:'hidden', background:`linear-gradient(135deg, ${C.navy}, ${C.blue} 60%, #0d4a2e)`, minHeight:150 }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:110, height:110, background:'rgba(255,255,255,0.06)', borderRadius:'50%' }}/>
          <div style={{ color:'#fff', fontWeight:800, fontSize:16, marginBottom:20 }}>Ever<span style={{ color:C.green }}>Clean</span> <span style={{ fontSize:10, opacity:0.6, fontWeight:400 }}>PRO CARD</span></div>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13, letterSpacing:'2px', marginBottom:8 }}>•••• •••• •••• {canRequestCard ? '????' : '────'}</div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:9, textTransform:'uppercase' }}>Card Holder</div>
              <div style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{profile?.full_name || 'EverClean Pro'}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:9, textTransform:'uppercase' }}>Status</div>
              <div style={{ color: canRequestCard ? C.green : C.warning, fontSize:11, fontWeight:700 }}>{canRequestCard ? 'Eligible' : 'Pending'}</div>
            </div>
          </div>
        </div>
        {canRequestCard ? (
          <button style={{ width:'100%', padding:'12px 0', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${C.green}, ${C.greenDk})`, color:'#fff', fontSize:13, fontWeight:700 }}>
            💳 Request Physical Card (Free)
          </button>
        ) : (
          <div>
            <div style={{ padding:'10px 12px', background:'#FEF3C7', borderRadius:10, marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#92400E' }}>{completedJobs}/3 services completed</div>
              <div style={{ fontSize:11, color:'#92400E', marginTop:2 }}>Complete {3-completedJobs} more to unlock your free Pro Card.</div>
            </div>
            <div style={{ height:6, background:C.border, borderRadius:999, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min((completedJobs/3)*100,100)}%`, background:`linear-gradient(135deg, ${C.green}, ${C.blue})`, borderRadius:999 }}/>
            </div>
          </div>
        )}
        <div style={{ marginTop:10, fontSize:11, color:C.muted, textAlign:'center' }}>🔒 Free card. No fees, no minimum balance.</div>
      </div>

      {/* Payout Schedule */}
      <div style={card}>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:12 }}>Payout Schedule</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {['WEEKLY','BI_WEEKLY'].map(s => (
            <div key={s} style={{ padding:'12px 14px', borderRadius:12, border:`2px solid ${profile?.payout_schedule===s ? C.blue : C.border}`, background: profile?.payout_schedule===s ? `${C.blue}08` : '#fff', textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:700, color: profile?.payout_schedule===s ? C.blue : C.text }}>{s==='WEEKLY' ? 'Weekly' : 'Bi-Weekly'}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s==='WEEKLY' ? 'Every Friday' : 'Every 2 weeks'}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, fontSize:11, color:C.muted }}>
          Change schedule in <Link href="/pro/profile" style={{ color:C.blue, fontWeight:600 }}>Profile</Link>.
        </div>
      </div>
    </div>
  );
}
