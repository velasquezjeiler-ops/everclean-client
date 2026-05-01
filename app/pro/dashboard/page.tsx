'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const C = {
  navy: '#0D3781', navyDark: '#081f4a', blue: '#1565C0',
  green: '#4CAF50', greenDk: '#388E3C', bg: '#F5F7FA',
  text: '#0D1B2A', muted: '#64748B', border: '#E2E8F0',
  warning: '#F59E0B', danger: '#DC2626',
};

const IC = {
  ETA: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><path d="M3 12h18M15 6l6 6-6 6" stroke={p.c||'#fff'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||'#fff'} strokeWidth="1.8"/><path d="M9 12l2 2 4-4" stroke={p.c||'#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Clock: (p: any) => <svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||C.muted} strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke={p.c||C.muted} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Dollar: (p: any) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={p.c||C.green} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Sqft: (p: any) => <svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke={p.c||C.muted} strokeWidth="1.8"/><path d="M3 9h18M9 3v18" stroke={p.c||C.muted} strokeWidth="1.2"/></svg>,
};

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  PENDING_ASSIGNMENT: { label: 'Pending', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  CONFIRMED:          { label: 'Confirmed', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  IN_PROGRESS:        { label: 'In Progress', bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6' },
  COMPLETED:          { label: 'Completed', bg: '#D1FAE5', color: '#065F46', dot: C.green },
  CANCELLED:          { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', dot: C.danger },
};

const SVC: Record<string, string> = {
  HOUSE_CLEANING: '🏠', DEEP_CLEANING: '✨', MOVE_IN_OUT: '📦',
  SAME_DAY_CLEANING: '⚡', OFFICE_CLEANING: '🏢', POST_CONSTRUCTION: '🔨',
  MEDICAL_CLEANING: '🏥', CARPET_CLEANING: '🛋', WINDOW_CLEANING: '🪟',
  ORGANIZING: '📋', CAR_WASH: '🚗', LAUNDRY_PICKUP: '👕', DRY_CLEANING: '👔',
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.PENDING_ASSIGNMENT;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }}/>
      {s.label}
    </span>
  );
}

function CalendarStrip({ jobs }: { jobs: any[] }) {
  const [selected, setSelected] = useState(new Date().toISOString().split('T')[0]);
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i - 2); return d; });
  const hasJob = (d: Date) => jobs.some(j => j.scheduled_at && new Date(j.scheduled_at).toDateString() === d.toDateString());
  const dayJobs = jobs.filter(j => j.scheduled_at && new Date(j.scheduled_at).toISOString().split('T')[0] === selected);

  return (
    <div>
      <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
        <div style={{ display: 'flex', gap: 5, minWidth: 'max-content' }}>
          {days.map((d, i) => {
            const key = d.toISOString().split('T')[0];
            const isToday = d.toDateString() === today.toDateString();
            const isSel = key === selected;
            const busy = hasJob(d);
            return (
              <button key={i} onClick={() => setSelected(key)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', minWidth: 50,
                background: isSel ? `linear-gradient(135deg, ${C.navy}, ${C.blue})` : isToday ? `${C.blue}15` : C.bg,
                boxShadow: isSel ? '0 4px 12px rgba(13,55,129,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: isSel ? 'rgba(255,255,255,0.7)' : C.muted }}>{d.toLocaleDateString('en', { weekday: 'short' })}</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: isSel ? '#fff' : isToday ? C.blue : C.text, marginTop: 2 }}>{d.getDate()}</span>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: busy ? (isSel ? '#fff' : C.green) : 'transparent', marginTop: 3 }}/>
              </button>
            );
          })}
        </div>
      </div>
      {dayJobs.length > 0 ? (
        <div style={{ marginTop: 10, padding: '10px 12px', background: `${C.green}10`, border: `1px solid ${C.green}25`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.greenDk, marginBottom: 6 }}>
            {dayJobs.length} job{dayJobs.length > 1 ? 's' : ''} · {new Date(selected + 'T12:00:00').toLocaleDateString('en', { month: 'long', day: 'numeric' })}
          </div>
          {dayJobs.map(j => (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: `1px solid ${C.green}20` }}>
              <span style={{ fontSize: 14 }}>{SVC[j.service_type] || '🧹'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{(j.service_type || '').replace(/_/g, ' ')}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{j.address}</div>
              </div>
              <StatusBadge status={j.status}/>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '10px 0', color: C.muted, fontSize: 12 }}>No jobs on this date</div>
      )}
    </div>
  );
}

export default function ProDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [etaData, setEtaData] = useState<Record<string, any>>({});
  const [isAvailable, setIsAvailable] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [jR, pR] = await Promise.all([
        fetch(API + '/professionals/me/bookings', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } }),
      ]);
      const jD = await jR.json();
      const pD = await pR.json();
      setJobs(jD.data || []);
      setProfile(pD);
      setIsAvailable(pD.is_available ?? false);
    } catch (e) { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function fetchETA(id: string) {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API + '/bookings/' + id + '/eta', { headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) { const d = await res.json(); setEtaData(p => ({ ...p, [id]: d })); }
  }

  async function doAction(id: string, action: string) {
    setActing(id);
    const token = localStorage.getItem('token') || '';
    await fetch(API + '/bookings/' + id + '/' + action, { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    await load();
    setActing(null);
  }

  async function toggleAvail() {
    const token = localStorage.getItem('token') || '';
    await fetch(API + '/professionals/me/availability', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    setIsAvailable(!isAvailable);
  }

  const active = jobs.filter(j => ['CONFIRMED', 'IN_PROGRESS'].includes(j.status));
  const completed = jobs.filter(j => j.status === 'COMPLETED');
  const earnings = completed.reduce((s, j) => s + Number(j.payout_amount || j.total_amount || 0), 0);
  const proName = profile?.full_name || profile?.fullName || 'Professional';
  const visible = jobs.filter(j => j.status !== 'CANCELLED');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, fontFamily: 'Poppins, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>
            Good morning, {proName.split(' ')[0]} 👋
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '3px 0 0' }}>Here's your schedule overview</p>
        </div>
        <button onClick={toggleAvail} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 999,
          border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
          background: isAvailable ? `linear-gradient(135deg, ${C.green}, ${C.greenDk})` : 'rgba(100,116,139,0.15)',
          color: isAvailable ? '#fff' : C.muted,
          boxShadow: isAvailable ? '0 4px 12px rgba(76,175,80,0.35)' : 'none',
          transition: 'all 0.2s',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isAvailable ? '#fff' : C.muted, display: 'inline-block' }}/>
          {isAvailable ? 'Available' : 'Go Available'}
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Earnings', val: `$${earnings.toFixed(0)}`, gradient: `linear-gradient(135deg, ${C.green}, ${C.greenDk})`, icon: '💰' },
          { label: 'Active Jobs', val: active.length, gradient: `linear-gradient(135deg, ${C.blue}, ${C.navy})`, icon: '⚡' },
          { label: 'Completed', val: completed.length, gradient: 'linear-gradient(135deg, #7C3AED, #5B21B6)', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: s.gradient, borderRadius: 16, padding: '18px 16px', color: '#fff', boxShadow: '0 4px 20px rgba(13,55,129,0.2)', position: 'relative', overflow: 'hidden', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }}/>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Schedule */}
      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 18, marginBottom: 16, boxShadow: '0 2px 12px rgba(13,55,129,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <IC.Clock c={C.navy} s={16}/>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: C.text }}>Schedule</span>
        </div>
        <CalendarStrip jobs={jobs}/>
      </div>

      {/* Jobs List */}
      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 18, boxShadow: '0 2px 12px rgba(13,55,129,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: C.text }}>My Jobs</span>
          {visible.length > 0 && <span style={{ background: `${C.navy}15`, color: C.navy, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{visible.length}</span>}
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🧹</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>No active jobs</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Check Available Jobs to find work nearby</div>
            <Link href="/pro/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Find Available Jobs →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visible.slice(0, 10).map(job => {
              const date = job.scheduled_at ? new Date(job.scheduled_at) : null;
              const payout = Number(job.payout_amount || 0);
              const eta = etaData[job.id];
              return (
                <div key={job.id} style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                  {/* Job Header */}
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, background: `${C.navy}12`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                        {SVC[job.service_type] || '🧹'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>
                          {(job.service_type || '').replace(/_/g, ' ')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.blue, fontSize: 11, fontWeight: 500 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={C.blue} strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke={C.blue} strokeWidth="1.8"/></svg>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            {job.address}{job.city ? `, ${job.city}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={job.status}/>
                  </div>

                  {/* Job Meta */}
                  <div style={{ padding: '0 14px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {date && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', color: C.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11, border: `1px solid ${C.border}` }}>
                        <IC.Clock s={11} c={C.muted}/>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {job.sqft && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', color: C.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11, border: `1px solid ${C.border}` }}>
                        <IC.Sqft s={11} c={C.muted}/>{job.sqft} sqft
                      </span>
                    )}
                    {payout > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#D1FAE5', color: C.greenDk, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                        <IC.Dollar s={11} c={C.greenDk}/>+${payout.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {(job.status === 'CONFIRMED' || job.status === 'IN_PROGRESS') && (
                    <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* ETA */}
                      {eta ? (
                        <div style={{ background: '#EFF6FF', border: `1px solid ${C.blue}25`, borderRadius: 12, padding: '10px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.blue, marginBottom: 8 }}>
                            🚗 {eta.distanceMiles} mi · ETA {eta.etaText}
                          </div>
                          <a href={eta.mapsUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 0', borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                            🗺️ Open Navigation
                          </a>
                          <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: C.green, fontWeight: 600 }}>✅ ETA sent to client</div>
                        </div>
                      ) : (
                        <button onClick={() => fetchETA(job.id)} style={{
                          width: '100%', padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                          background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
                          color: '#fff', fontSize: 12, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                          <IC.ETA c="#fff" s={14}/> Send ETA to Client
                        </button>
                      )}

                      {job.status === 'CONFIRMED' && (
                        <button onClick={() => doAction(job.id, 'checkin')} disabled={acting === job.id} style={{
                          width: '100%', padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                          background: `linear-gradient(135deg, ${C.blue}, #1976D2)`,
                          color: '#fff', fontSize: 12, fontWeight: 700, opacity: acting === job.id ? 0.6 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                          <IC.Check c="#fff" s={14}/> Check In
                        </button>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <button onClick={() => doAction(job.id, 'checkout')} disabled={acting === job.id} style={{
                          width: '100%', padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                          background: `linear-gradient(135deg, ${C.green}, ${C.greenDk})`,
                          color: '#fff', fontSize: 12, fontWeight: 700, opacity: acting === job.id ? 0.6 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                          <IC.Check c="#fff" s={14}/> Complete Job ✓
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
