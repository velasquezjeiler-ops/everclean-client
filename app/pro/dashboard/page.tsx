'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS: Record<string, { label: string; color: string; dot: string }> = {
  PENDING_ASSIGNMENT: { label: 'Pending',    color: 'text-amber-700 bg-amber-50 border-amber-200',      dot: 'bg-amber-500'   },
  CONFIRMED:          { label: 'Confirmed',  color: 'text-blue-700 bg-blue-50 border-blue-200',         dot: 'bg-blue-500'    },
  IN_PROGRESS:        { label: 'In progress',color: 'text-purple-700 bg-purple-50 border-purple-200',   dot: 'bg-purple-500'  },
  COMPLETED:          { label: 'Completed',  color: 'text-emerald-700 bg-emerald-50 border-emerald-200',dot: 'bg-emerald-500' },
  CANCELLED:          { label: 'Cancelled',  color: 'text-red-700 bg-red-50 border-red-200',            dot: 'bg-red-500'     },
};

const SERVICE_LABELS: Record<string,string> = {
  HOUSE_CLEANING:'House Cleaning', DEEP_CLEANING:'Deep Cleaning', MOVE_IN_OUT:'Move In/Out',
  OFFICE_CLEANING:'Office Cleaning', COMMERCIAL_CLEANING:'Commercial', POST_CONSTRUCTION:'Post Construction',
  MEDICAL_CLEANING:'Medical / Clinic', APARTMENT_CLEANING:'Apartment', MAID_SERVICES:'Maid Services',
  SAME_DAY_CLEANING:'Same Day',
};

function formatService(raw: string): string {
  return SERVICE_LABELS[raw] || raw?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Service';
}

function getWeekDays(base: Date): Date[] {
  const start = new Date(base);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({length:7}, (_,i) => { const d = new Date(start); d.setDate(start.getDate()+i); return d; });
}

export default function ProDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'overview'|'jobs'|'calendar'|'earnings'>('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [acting, setActing] = useState<string|null>(null);
  const [etaData, setEtaData] = useState<Record<string, any>>({});
  const [editRate, setEditRate] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    if (!token) { router.push('/login'); return; }
    try {
      const [meRes, bkRes] = await Promise.all([
        fetch(API+'/professionals/me', { headers: { Authorization: 'Bearer '+token } }),
        fetch(API+'/professionals/me/bookings', { headers: { Authorization: 'Bearer '+token } }),
      ]);
      if (meRes.ok) setProfile(await meRes.json());
      if (bkRes.ok) { const d = await bkRes.json(); setBookings(d.data || d || []); }
    } catch(e) {}
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const hasActive = bookings.some(b => b.status === 'IN_PROGRESS');
    if (!hasActive) return;
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [bookings, load]);

  async function toggleAvailability() {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API+'/professionals/me/availability', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !profile?.isAvailable })
    });
    if (res.ok) setProfile((p: any) => ({ ...p, isAvailable: !p?.isAvailable }));
  }

  async function fetchETA(bookingId: string) {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings/'+bookingId+'/eta', { headers: { Authorization: 'Bearer '+token } });
      if (res.ok) {
        const data = await res.json();
        setEtaData(prev => ({ ...prev, [bookingId]: data }));
      }
    } catch(e) {}
  }

  async function updateRate() {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 18 || rate > 30) { alert('Rate must be between $18 and $30/h'); return; }
    setSavingRate(true);
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API+'/professionals/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hourlyRate: rate })
    });
    if (res.ok) {
      setProfile((p: any) => ({ ...p, hourlyRate: rate }));
      setEditRate(false);
      alert('✅ Rate updated. Applies to new jobs only — not retroactive.');
    } else { alert('Error updating rate'); }
    setSavingRate(false);
  }

  async function checkIn(bookingId: string) {
    setActing(bookingId);
    const token = localStorage.getItem('token') || '';
    navigator.geolocation?.getCurrentPosition(
      async pos => {
        await fetch(API+`/bookings/${bookingId}/checkin`, {
          method: 'POST',
          headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        });
        setActing(null); load();
      },
      async () => {
        await fetch(API+`/bookings/${bookingId}/checkin`, {
          method: 'POST',
          headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: 0, lng: 0 })
        });
        setActing(null); load();
      }
    );
  }

  async function checkOut(bookingId: string) {
    setActing(bookingId);
    const token = localStorage.getItem('token') || '';
    await fetch(API+`/bookings/${bookingId}/checkout`, {
      method: 'POST',
      headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
    });
    setActing(null); load();
  }

  const weekDays = getWeekDays(weekBase);
  const today = new Date();

  function bookingsForDay(day: Date) {
    return bookings.filter(b => {
      const d = b.scheduledAt || b.scheduled_at;
      return d && new Date(d).toDateString() === day.toDateString();
    });
  }

  const confirmed  = bookings.filter(b => b.status === 'CONFIRMED');
  const inProgress = bookings.filter(b => b.status === 'IN_PROGRESS');
  const completed  = bookings.filter(b => b.status === 'COMPLETED');
  const thisMonth  = completed.filter(b => new Date(b.scheduledAt||b.scheduled_at).getMonth() === today.getMonth());
  const monthEarnings = thisMonth.reduce((s,b) => s + parseFloat(b.payoutAmount||b.payout_amount||0), 0);
  const totalEarnings = completed.reduce((s,b) => s + parseFloat(b.payoutAmount||b.payout_amount||0), 0);

  function JobCard({ b }: { b: any }) {
    const st = STATUS[b.status] || { label: b.status, color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400' };
    const isConfirmed  = b.status === 'CONFIRMED';
    const isInProgress = b.status === 'IN_PROGRESS';
    const isCompleted  = b.status === 'COMPLETED';
    const scheduledDate = b.scheduledAt||b.scheduled_at ? new Date(b.scheduledAt||b.scheduled_at) : null;
    const sqft = Number(b.sqft || 0);
    const hours = sqft ? Math.max(2, Math.ceil(sqft/400)) : 0;
    const rate = parseFloat(profile?.hourlyRate || profile?.hourly_rate || 25);
    const payout = b.payoutAmount || b.payout_amount || (hours ? (rate * hours).toFixed(0) : null);

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex">
          <div className={`w-1 flex-shrink-0 ${st.dot}`} />
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{formatService(b.serviceType||b.service_type)}</p>
                <p className="text-xs text-gray-500 truncate">📍 {b.address}{b.city?', '+b.city:''}{b.zip?' '+b.zip:''}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${st.color}`}>{st.label}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {scheduledDate && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-1">
                  📅 {scheduledDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})} · {scheduledDate.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                </span>
              )}
              {sqft > 0 && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-1">{sqft} sqft</span>}
              {hours > 0 && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-1">~{hours}h</span>}
              {payout && <span className="text-xs bg-emerald-50 text-emerald-700 rounded-md px-2 py-1 font-semibold">💰 ${payout}</span>}
            </div>

            {/* Map & ETA for active jobs */}
            {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
              <div className="mt-2">
                {etaData[b.id] ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-700 mb-2">
                        📍 {etaData[b.id].distanceMiles} mi away · ETA {etaData[b.id].etaText}
                      </p>
                      <a href={etaData[b.id].previewUrl || `https://www.google.com/maps?q=${encodeURIComponent(b.address + ', ' + (b.city||''))}`}
                        target="_blank" rel="noopener noreferrer"
                        className="block w-full py-2 bg-white border border-blue-200 rounded-lg text-xs text-blue-700 text-center hover:bg-blue-50 mb-2">
                        🔎 Preview location on map
                      </a>
                      <div className="flex gap-2">
                        <a href={etaData[b.id].mapsUrl} target="_blank" rel="noopener noreferrer"
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 text-center">
                          🗺️ Navigate
                        </a>
                      </div>
                      <p className="text-xs text-emerald-600 mt-2 text-center">✅ ETA sent to client</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <a href={`https://www.google.com/maps?q=${encodeURIComponent((b.address||'') + ', ' + (b.city||'') + ' ' + (b.state||''))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="block w-full py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 text-center">
                      🔎 Preview location
                    </a>
                    <button onClick={() => fetchETA(b.id)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                      📍 Send ETA & get directions
                    </button>
                  </div>
                )}
              </div>
            )}

            {(b.clientNotes||b.client_notes) && (
              <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2 truncate">
                📝 {b.clientNotes||b.client_notes}
              </p>
            )}

            {isInProgress && (
              <div className="flex items-center gap-2 mt-2 py-1.5 px-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <p className="text-xs font-medium text-purple-700">In progress — remember to check out when done</p>
              </div>
            )}

            {(isConfirmed || isInProgress) && (
              <div className="flex gap-2 mt-3">
                {isConfirmed && (
                  <button onClick={() => checkIn(b.id)} disabled={acting === b.id}
                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50">
                    {acting === b.id ? 'Updating...' : '▶ Start Job (Check In)'}
                  </button>
                )}
                {isInProgress && (
                  <button onClick={() => checkOut(b.id)} disabled={acting === b.id}
                    className="flex-1 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50">
                    {acting === b.id ? 'Updating...' : '✓ Complete Job (Check Out)'}
                  </button>
                )}
              </div>
            )}

            {isCompleted && (
              <div className="mt-3 py-2 text-center text-xs text-emerald-600 font-medium bg-emerald-50 rounded-lg">
                ✓ Completed · ${payout||'—'} earned
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">

      {/* ── LEFT: main content ── */}
      <div className="flex-1 min-w-0">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {([
            { id:'overview', label:'Overview' },
            { id:'jobs',     label:`My Jobs${confirmed.length+inProgress.length>0?` (${confirmed.length+inProgress.length})`:''}`},
            { id:'calendar', label:'Calendar' },
            { id:'earnings', label:'Earnings' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${tab===t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:'This month',    value:`$${monthEarnings.toFixed(0)}`, sub:`${thisMonth.length} services`,           color:'text-emerald-700' },
                { label:'Total services',value:String(completed.length),       sub:profile?.avgRating?`⭐ ${parseFloat(profile.avgRating).toFixed(1)}`:'No ratings', color:'text-gray-900' },
                { label:'Active jobs',   value:String(confirmed.length+inProgress.length), sub:inProgress.length>0?'🟣 In progress':'None active', color:'text-gray-900' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {inProgress.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">In progress now</p>
                {inProgress.map(b => <JobCard key={b.id} b={b} />)}
              </>
            )}
            {confirmed.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Upcoming</p>
                {confirmed.slice(0,3).map(b => <JobCard key={b.id} b={b} />)}
                {confirmed.length > 3 && (
                  <button onClick={() => setTab('jobs')} className="w-full text-sm text-emerald-700 py-2 hover:underline">
                    View all {confirmed.length} upcoming →
                  </button>
                )}
              </>
            )}
            {completed.slice(0,2).length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent completed</p>
                {completed.slice(0,2).map(b => <JobCard key={b.id} b={b} />)}
              </>
            )}
            {bookings.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                <p className="text-4xl mb-3">🧹</p>
                <p className="font-medium text-gray-900 mb-1">No jobs yet</p>
                <p className="text-sm text-gray-500 mb-4">Browse available jobs in the marketplace</p>
                <a href="/pro/marketplace" className="bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800">Browse jobs</a>
              </div>
            )}
          </div>
        )}

        {/* TAB: My Jobs */}
        {tab === 'jobs' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-600 font-medium">No jobs assigned yet</p>
                <a href="/pro/marketplace" className="text-emerald-600 text-sm mt-2 block hover:underline">Browse marketplace →</a>
              </div>
            ) : (
              <>
                {inProgress.length > 0 && <><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">In progress</p>{inProgress.map(b => <JobCard key={b.id} b={b} />)}</>}
                {confirmed.length > 0 && <><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Upcoming</p>{confirmed.map(b => <JobCard key={b.id} b={b} />)}</>}
                {completed.length > 0 && <><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Completed</p>{completed.map(b => <JobCard key={b.id} b={b} />)}</>}
              </>
            )}
          </div>
        )}

        {/* TAB: Calendar */}
        {tab === 'calendar' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => { const d=new Date(weekBase); d.setDate(d.getDate()-7); setWeekBase(d); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">‹</button>
              <p className="text-sm font-medium text-gray-700">
                {weekDays[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {weekDays[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
              </p>
              <button onClick={() => { const d=new Date(weekBase); d.setDate(d.getDate()+7); setWeekBase(d); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map((day,i) => {
                const dayBks = bookingsForDay(day);
                const isToday = day.toDateString() === today.toDateString();
                const isSel = selectedDay.toDateString() === day.toDateString();
                return (
                  <button key={i} onClick={() => setSelectedDay(day)}
                    className={`rounded-xl p-2 text-center transition-all ${isSel ? 'bg-emerald-700' : isToday ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-gray-200 hover:border-emerald-300'}`}>
                    <p className={`text-xs mb-1 ${isSel ? 'text-emerald-200' : 'text-gray-400'}`}>{'SMTWTFS'[i]}</p>
                    <p className={`text-sm font-bold ${isSel ? 'text-white' : isToday ? 'text-emerald-700' : 'text-gray-900'}`}>{day.getDate()}</p>
                    {dayBks.length > 0 && <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${isSel ? 'bg-emerald-300' : 'bg-emerald-500'}`} />}
                  </button>
                );
              })}
            </div>
            <p className="text-sm font-medium text-gray-600 mb-3">
              {selectedDay.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
              {bookingsForDay(selectedDay).length > 0 ? ` · ${bookingsForDay(selectedDay).length} job${bookingsForDay(selectedDay).length>1?'s':''}` : ' · No jobs'}
            </p>
            {bookingsForDay(selectedDay).length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No jobs scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">{bookingsForDay(selectedDay).map(b => <JobCard key={b.id} b={b} />)}</div>
            )}
          </div>
        )}

        {/* TAB: Earnings */}
        {tab === 'earnings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                <p className="text-xs text-emerald-600 mb-1">This month</p>
                <p className="text-3xl font-bold text-emerald-700">${monthEarnings.toFixed(0)}</p>
                <p className="text-xs text-emerald-600 mt-1">{thisMonth.length} services</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Total earned</p>
                <p className="text-3xl font-bold text-gray-900">${totalEarnings.toFixed(0)}</p>
                <p className="text-xs text-gray-400 mt-1">{completed.length} services total</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Completed services</p>
            {completed.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No completed services yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completed.sort((a,b) => new Date(b.scheduledAt||b.scheduled_at).getTime()-new Date(a.scheduledAt||a.scheduled_at).getTime()).map(b => (
                  <JobCard key={b.id} b={b} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: control panel ── */}
      <div className="w-72 flex-shrink-0 space-y-4">

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
              {(profile?.fullName||profile?.full_name||'P')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{profile?.fullName||profile?.full_name||'Professional'}</p>
              <p className="text-xs text-gray-500">${profile?.hourlyRate||profile?.hourly_rate||25}/h · {profile?.avgRating||profile?.avg_rating ? `⭐ ${parseFloat(profile?.avgRating||profile?.avg_rating).toFixed(1)}` : 'No ratings'}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600 mb-3">
            <div className="flex justify-between"><span>Services done</span><span className="font-semibold text-gray-900">{completed.length}</span></div>
            <div className="flex justify-between"><span>Active jobs</span><span className="font-semibold text-gray-900">{confirmed.length+inProgress.length}</span></div>
            <div className="flex justify-between"><span>This month</span><span className="font-semibold text-emerald-700">${monthEarnings.toFixed(0)}</span></div>
          </div>

          {editRate ? (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">New hourly rate ($18–$30/h)</p>
              <div className="flex gap-2">
                <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)}
                  min="18" max="30" step="0.5" placeholder={String(profile?.hourlyRate||25)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={updateRate} disabled={savingRate}
                  className="px-3 py-2 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 disabled:opacity-50">
                  {savingRate ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditRate(false)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500">✕</button>
              </div>
              <p className="text-xs text-amber-600 mt-1">⚠️ Not retroactive — applies to new jobs only</p>
            </div>
          ) : (
            <button onClick={() => { setEditRate(true); setNewRate(String(profile?.hourlyRate||25)); }}
              className="w-full py-2 mb-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
              ✏️ Edit hourly rate (${profile?.hourlyRate||profile?.hourly_rate||25}/h)
            </button>
          )}

          <button onClick={toggleAvailability}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${profile?.isAvailable||profile?.is_available ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {profile?.isAvailable||profile?.is_available ? '🟢 Available for jobs' : '⚫ Set as available'}
          </button>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="space-y-2">
            <a href="/pro/marketplace"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-all">
              <span className="text-base">🔍</span>
              <span className="text-sm font-medium">Find jobs</span>
            </a>
            <button onClick={() => setTab('calendar')}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
              <span className="text-base">📅</span>
              <span className="text-sm">My calendar</span>
            </button>
            <button onClick={() => setTab('earnings')}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
              <span className="text-base">💰</span>
              <span className="text-sm">My earnings</span>
            </button>
            <button onClick={() => setTab('jobs')}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
              <span className="text-base">📋</span>
              <span className="text-sm">All my jobs</span>
            </button>
          </div>
        </div>

        {/* Active jobs status */}
        {(inProgress.length + confirmed.length) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Jobs</p>
            <div className="space-y-2">
              {[...inProgress, ...confirmed].map(b => {
                const st = STATUS[b.status];
                return (
                  <div key={b.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st?.dot} ${b.status==='IN_PROGRESS'?'animate-pulse':''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{formatService(b.serviceType||b.service_type)}</p>
                      <p className="text-xs text-gray-500">{st?.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bonus notice */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">🎁 Compliance bonus</p>
          <p className="text-xs text-amber-600">All services include a completion bonus paid at invoicing. Keep your completion rate high to maximize earnings.</p>
        </div>

        {/* Support */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Support</p>
          <div className="space-y-2 text-xs text-gray-600">
            <p>📧 pros@everclean.com</p>
            <p>📞 (201) 555-0101</p>
            <p>🕐 Mon–Sat 8am–8pm ET</p>
          </div>
        </div>
      </div>
    </div>
  );
}
