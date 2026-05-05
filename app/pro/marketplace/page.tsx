'use client';
import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',bg:'#F5F7FA',text:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',warning:'#F59E0B' };

const SVC: Record<string,string> = {
  HOUSE_CLEANING:'🏠',DEEP_CLEANING:'✨',MOVE_IN_OUT:'📦',SAME_DAY_CLEANING:'⚡',
  OFFICE_CLEANING:'🏢',POST_CONSTRUCTION:'🔨',MEDICAL_CLEANING:'🏥',
  CARPET_CLEANING:'🛋',WINDOW_CLEANING:'🪟',ORGANIZING:'📋',CAR_WASH:'🚗',
};

const AUCTION_ZONES: Record<string,{label:string;color:string;bg:string}> = {
  '$18/hr only':   { label: 'Priority Access', color: '#065F46', bg: '#D1FAE5' },
  'Up to $19/hr':  { label: 'Tier 2 Access',   color: '#1E40AF', bg: '#DBEAFE' },
  'Up to $20/hr':  { label: 'Tier 3 Access',   color: '#5B21B6', bg: '#EDE9FE' },
  'Open $18-$30':  { label: 'Open Market',      color: '#92400E', bg: '#FEF3C7' },
  'Open all rates':{ label: 'All Pros',          color: C.muted,   bg: C.bg      },
};

export default function ProMarketplace() {
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
    } catch (e) { setError('Could not load available jobs.'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function claimJob(jobId: string) {
    setClaiming(jobId); setError('');
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + jobId + '/claim', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setClaimed(p => [...p, jobId]);
      await load();
    } catch (e: any) { setError(e.message); }
    setClaiming(null);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}/>
        <div style={{ color: C.muted, fontSize: 13 }}>Loading marketplace...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Available Jobs</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Your rate: <strong style={{ color: C.navy }}>${proRate}/hr</strong> · Jobs available based on your auction tier</p>
      </div>

      {/* Rate Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
        borderRadius: 14, padding: '14px 18px', marginBottom: 20, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Your current tier</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {proRate <= 18 ? '⚡ Priority Access — $18/hr' :
             proRate <= 19 ? '🥈 Tier 2 — $19/hr' :
             proRate <= 20 ? '🥉 Tier 3 — $20/hr' :
             proRate <= 30 ? '🔓 Open Market' : '🌐 All Rates'}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>
            {proRate <= 18 ? 'You see jobs first — lowest rate gets priority' : `Jobs open after ${proRate <= 19 ? '5' : proRate <= 20 ? '10' : '15'}+ min`}
          </div>
          {proRadius && (
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
              Coverage radius: {proRadius} mi
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{jobs.length}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>jobs available</div>
        </div>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 6 }}>No jobs available right now</div>
          <div style={{ color: C.muted, fontSize: 13, maxWidth: 300, margin: '0 auto' }}>
            {proRate > 18 ? `Jobs will appear for your rate ($${proRate}/hr) after the auction timer opens.` : 'New jobs will appear here as clients book services.'}
          </div>
          {proRate > 18 && (
            <div style={{ marginTop: 16, padding: '10px 16px', background: `${C.warning}15`, border: `1px solid ${C.warning}30`, borderRadius: 10, fontSize: 12, color: '#92400E', maxWidth: 320, margin: '16px auto 0' }}>
              💡 Lower your hourly rate to get priority access to jobs
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map((job, idx) => {
            const zone = AUCTION_ZONES[job.auction_zone] || AUCTION_ZONES['Open all rates'];
            const date = job.scheduled_at ? new Date(job.scheduled_at) : null;
            const mins = Math.round(job.minutes_posted || 0);
            const isClaimed = claimed.includes(job.id);
            return (
              <div key={job.id} style={{
                background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`,
                overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,55,129,0.06)',
                animation: `fadeIn 0.3s ease ${idx * 0.05}s both`,
              }}>
                {/* Top stripe */}
                <div style={{ height: 3, background: `linear-gradient(135deg, ${C.navy}, ${C.green})` }}/>

                <div style={{ padding: '14px 16px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, background: `${C.navy}10`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {SVC[job.service_type] || '🧹'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{(job.service_type || '').replace(/_/g, ' ')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.blue, fontSize: 11, marginTop: 2 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={C.blue} strokeWidth="2"/><circle cx="12" cy="9" r="2.5" stroke={C.blue} strokeWidth="2"/></svg>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {job.address}{job.city ? `, ${job.city}` : ''}{job.state ? `, ${job.state}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.greenDk }}>
                        +${Number(job.estimated_payout || 0).toFixed(0)}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>est. payout</div>
                    </div>
                  </div>

                  {/* Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    <span style={{ background: zone.bg, color: zone.color, padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                      {zone.label}
                    </span>
                    {date && (
                      <span style={{ background: C.bg, color: C.muted, padding: '3px 9px', borderRadius: 999, fontSize: 10 }}>
                        📅 {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {job.hours && <span style={{ background: C.bg, color: C.muted, padding: '3px 9px', borderRadius: 999, fontSize: 10 }}>⏱ ~{job.hours}h</span>}
                    {job.sqft && <span style={{ background: C.bg, color: C.muted, padding: '3px 9px', borderRadius: 999, fontSize: 10 }}>📐 {job.sqft} sqft</span>}
                    {job.frequency && job.frequency !== 'ONE_TIME' && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>🔄 {job.frequency}</span>}
                    <span style={{ background: C.bg, color: C.muted, padding: '3px 9px', borderRadius: 999, fontSize: 10 }}>🕐 {mins}m ago</span>
                    {job.distance_miles && (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                        background: job.distance_miles <= 10 ? '#D1FAE5' : '#F5F7FA',
                        color: job.distance_miles <= 10 ? '#388E3C' : '#64748B',
                        padding:'4px 10px', borderRadius:8, fontSize:11,
                        border:'1px solid #E2E8F0', fontWeight: job.distance_miles <= 10 ? 700 : 400
                      }}>
                        📍 {job.distance_miles} mi away
                      </span>
                    )}
                  </div>

                  {/* Client price */}
                  {job.client_price && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Client pays</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>${Number(job.client_price).toFixed(2)}</span>
                    </div>
                  )}

                  {/* CTA */}
                  {isClaimed ? (
                    <div style={{ textAlign: 'center', padding: '11px', background: '#D1FAE5', borderRadius: 12, color: C.greenDk, fontSize: 13, fontWeight: 700 }}>
                      ✅ Job Claimed!
                    </div>
                  ) : (
                    <button onClick={() => claimJob(job.id)} disabled={claiming === job.id}
                      style={{
                        width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: claiming === job.id ? C.muted : `linear-gradient(135deg, ${C.green}, ${C.greenDk})`,
                        color: '#fff', fontSize: 13, fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(76,175,80,0.35)',
                        transition: 'all 0.2s',
                      }}>
                      {claiming === job.id ? 'Claiming...' : '⚡ Claim This Job'}
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
