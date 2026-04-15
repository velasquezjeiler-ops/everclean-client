'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS: Record<string, { label: string; color: string; dot: string; step: number }> = {
  PENDING_ASSIGNMENT: { label: 'Finding cleaner',  color: 'text-amber-700 bg-amber-50 border-amber-200',   dot: 'bg-amber-500',   step: 1 },
  CONFIRMED:          { label: 'Cleaner assigned', color: 'text-blue-700 bg-blue-50 border-blue-200',       dot: 'bg-blue-500',    step: 2 },
  IN_PROGRESS:        { label: 'In progress',      color: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-500',  step: 3 },
  COMPLETED:          { label: 'Completed',        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', step: 4 },
  CANCELLED:          { label: 'Cancelled',        color: 'text-red-700 bg-red-50 border-red-200',          dot: 'bg-red-500',     step: 0 },
};

function formatService(raw: string): string {
  const MAP: Record<string,string> = {
    HOUSE_CLEANING:'House Cleaning', DEEP_CLEANING:'Deep Cleaning', MOVE_IN_OUT:'Move In/Out',
    OFFICE_CLEANING:'Office Cleaning', COMMERCIAL_CLEANING:'Commercial', POST_CONSTRUCTION:'Post Construction',
    MEDICAL_CLEANING:'Medical / Clinic', APARTMENT_CLEANING:'Apartment', MAID_SERVICES:'Maid Services',
    SAME_DAY_CLEANING:'Same Day', ONE_TIME:'One-Time', STANDARD_CLEANING:'Standard Cleaning',
  };
  return MAP[raw] || raw?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Service';
}

function TrackingBar({ status }: { status: string }) {
  const steps = ['PENDING_ASSIGNMENT','CONFIRMED','IN_PROGRESS','COMPLETED'];
  const labels = ['Finding','Assigned','Cleaning','Done'];
  const cur = STATUS[status]?.step || 0;
  return (
    <div className="flex items-center my-3">
      {steps.map((s,i) => (
        <div key={s} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${i < cur ? 'bg-emerald-600 text-white' : i === cur-1 ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : 'bg-gray-200 text-gray-400'}`}>
              {i < cur ? '✓' : i+1}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{labels[i]}</span>
          </div>
          {i < steps.length-1 && <div className={`h-1 flex-1 mx-1 mb-4 rounded ${i < cur-1 ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function ClientDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'services'|'calendar'|'cleaners'|'history'>('services');
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [stars, setStars] = useState(5);
  const [tip, setTip] = useState(0);
  const [claimModal, setClaimModal] = useState<any>(null);
  const [claimText, setClaimText] = useState('');
  const [messaging, setMessaging] = useState<string|null>(null);
  const [msgText, setMsgText] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings', { headers: { Authorization: 'Bearer '+token } });
      const data = await res.json();
      setBookings(data.data || data || []);
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const hasActive = bookings.some(b => ['CONFIRMED','IN_PROGRESS'].includes(b.status));
    if (!hasActive) return;
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [bookings, load]);

  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const active = bookings.filter(b => ['PENDING_ASSIGNMENT','CONFIRMED','IN_PROGRESS'].includes(b.status));
  const loyaltyCount = completed.length;
  const loyaltyDiscount = loyaltyCount >= 6;

  const myCleaners = (() => {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const b of completed) {
      const pro = b.professionals?.[0]?.professional;
      if (pro?.id && !seen.has(pro.id)) { seen.add(pro.id); result.push({ ...pro, lastBooking: b }); }
    }
    return result;
  })();

  function getWeekDays(base: Date) {
    const start = new Date(base);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({length:7}, (_,i) => { const d = new Date(start); d.setDate(start.getDate()+i); return d; });
  }
  const weekDays = getWeekDays(weekBase);
  const today = new Date();

  function bookingsForDay(day: Date) {
    return bookings.filter(b => b.scheduledAt && new Date(b.scheduledAt).toDateString() === day.toDateString());
  }

  async function submitRating() {
    const token = localStorage.getItem('token') || '';
    await fetch(API+'/bookings/'+ratingModal.id+'/rate', {
      method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' },
      body: JSON.stringify({ rating: stars, tip })
    });
    setRatingModal(null); load();
  }

  async function submitClaim() {
    const token = localStorage.getItem('token') || '';
    try {
      await fetch(API+'/bookings/'+claimModal.id+'/claim-report', {
        method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' },
        body: JSON.stringify({ description: claimText })
      });
      setClaimModal(null); setClaimText('');
      alert('✅ Report submitted. Our team will contact you within 24h.');
    } catch(e) { alert('Error submitting report.'); }
  }

  async function sendMessage(bookingId: string) {
    if (!msgText.trim()) return;
    const token = localStorage.getItem('token') || '';
    await fetch(API+'/twilio/proxy-sms', {
      method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' },
      body: JSON.stringify({ bookingId, message: msgText })
    });
    setMsgText(''); setMessaging(null);
    alert('✅ Message sent');
  }

  function BookingCard({ b, compact=false }: { b: any; compact?: boolean }) {
    const st = STATUS[b.status] || { label: b.status, color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400', step: 0 };
    const isActive = ['CONFIRMED','IN_PROGRESS'].includes(b.status);
    const isCompleted = b.status === 'COMPLETED';
    const scheduledDate = b.scheduledAt ? new Date(b.scheduledAt) : null;

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex">
          {/* Left color bar */}
          <div className={`w-1 flex-shrink-0 ${st.dot}`} />
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{formatService(b.serviceType)}</p>
                <p className="text-xs text-gray-500 truncate">{b.address}{b.city ? ', '+b.city : ''}{b.zip ? ' '+b.zip : ''}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${st.color}`}>{st.label}</span>
            </div>

            {!compact && !isCompleted && <TrackingBar status={b.status} />}

            {b.status === 'IN_PROGRESS' && (
              <div className="flex items-center gap-2 mb-2 py-1.5 px-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <p className="text-xs font-medium text-purple-700">Cleaning in progress...</p>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-2">
              {scheduledDate && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-1">
                  {scheduledDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})} · {scheduledDate.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                </span>
              )}
              {b.sqft && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-1">{b.sqft} sqft</span>}
              {b.totalAmount && <span className="text-xs bg-emerald-50 text-emerald-700 rounded-md px-2 py-1 font-medium">${b.totalAmount}{loyaltyDiscount?' (-5%)':''}</span>}
            </div>

            {isActive && !compact && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setMessaging(b.id); setMsgText(''); }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                  💬 Message cleaner
                </button>
                <button onClick={async () => {
                  const token = localStorage.getItem('token') || '';
                  await fetch(API+'/twilio/proxy-call', { method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' }, body: JSON.stringify({ bookingId: b.id }) });
                  alert('📞 Calling your cleaner...');
                }} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                  📞 Call
                </button>
              </div>
            )}

            {isCompleted && !compact && (
              <div className="flex gap-2 mt-3">
                {!b.rated && (
                  <button onClick={() => { setRatingModal(b); setStars(5); setTip(0); }}
                    className="flex-1 py-2 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800">
                    ⭐ Rate + Tip
                  </button>
                )}
                <button onClick={() => {
                  const text = `EverClean Invoice\n${formatService(b.serviceType)}\n${b.address}, ${b.city} ${b.zip||''}\nDate: ${scheduledDate?.toLocaleDateString()}\nTotal: $${b.totalAmount}\nID: ${b.id}`;
                  const blob = new Blob([text],{type:'text/plain'});
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                  a.download = `invoice-${b.id?.slice(0,8)}.txt`; a.click();
                }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                  📄 Invoice
                </button>
                <button onClick={() => { setClaimModal(b); setClaimText(''); }}
                  className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50">
                  ⚠️
                </button>
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

        {/* Loyalty bar */}
        {loyaltyCount < 6 && loyaltyCount > 0 && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-700">🎁 {6-loyaltyCount} more to unlock 5% loyalty discount</p>
              <div className="h-1.5 bg-purple-200 rounded-full mt-1.5">
                <div className="h-1.5 bg-purple-500 rounded-full" style={{width:`${(loyaltyCount/6)*100}%`}} />
              </div>
            </div>
            <span className="text-xl font-bold text-purple-600">{loyaltyCount}/6</span>
          </div>
        )}
        {loyaltyDiscount && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span>🎉</span>
            <p className="text-sm font-medium text-emerald-700">5% loyalty discount active on all bookings!</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {([
            {id:'services', label:`Services${active.length>0?` (${active.length})`:''}` },
            {id:'calendar', label:'Calendar'},
            {id:'cleaners', label:`Cleaners${myCleaners.length>0?` (${myCleaners.length})`:''}`},
            {id:'history',  label:`History${completed.length>0?` (${completed.length})`:''}`},
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${tab===t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Services */}
        {tab === 'services' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                <p className="text-4xl mb-3">🧹</p>
                <p className="font-medium text-gray-900 mb-1">No services yet</p>
                <p className="text-sm text-gray-500 mb-4">Book your first professional cleaning</p>
                <Link href="/dashboard/new-booking" className="bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800">Book now</Link>
              </div>
            ) : (
              <>
                {active.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active</p>
                    {active.map(b => <BookingCard key={b.id} b={b} />)}
                  </>
                )}
                {completed.slice(0,2).length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Recent</p>
                    {completed.slice(0,2).map(b => <BookingCard key={b.id} b={b} />)}
                    {completed.length > 2 && (
                      <button onClick={() => setTab('history')} className="w-full text-sm text-emerald-700 py-2 hover:underline">
                        View all {completed.length} completed →
                      </button>
                    )}
                  </>
                )}
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
                const dayBookings = bookingsForDay(day);
                const isToday = day.toDateString() === today.toDateString();
                const isSel = selectedDay.toDateString() === day.toDateString();
                return (
                  <button key={i} onClick={() => setSelectedDay(day)}
                    className={`rounded-xl p-2 text-center transition-all ${isSel ? 'bg-emerald-700' : isToday ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-gray-200 hover:border-emerald-300'}`}>
                    <p className={`text-xs mb-1 ${isSel ? 'text-emerald-200' : 'text-gray-400'}`}>{'SMTWTFS'[i]}</p>
                    <p className={`text-sm font-bold ${isSel ? 'text-white' : isToday ? 'text-emerald-700' : 'text-gray-900'}`}>{day.getDate()}</p>
                    {dayBookings.length > 0 && <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${isSel ? 'bg-emerald-300' : 'bg-emerald-500'}`} />}
                  </button>
                );
              })}
            </div>
            <p className="text-sm font-medium text-gray-600 mb-3">
              {selectedDay.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
              {bookingsForDay(selectedDay).length > 0 ? ` · ${bookingsForDay(selectedDay).length} service${bookingsForDay(selectedDay).length>1?'s':''}` : ' · No services'}
            </p>
            {bookingsForDay(selectedDay).length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No services scheduled</p>
                <Link href="/dashboard/new-booking" className="text-emerald-600 text-sm mt-1 block hover:underline">+ Book for this day</Link>
              </div>
            ) : (
              <div className="space-y-3">{bookingsForDay(selectedDay).map(b => <BookingCard key={b.id} b={b} />)}</div>
            )}
          </div>
        )}

        {/* TAB: Cleaners */}
        {tab === 'cleaners' && (
          <div className="space-y-3">
            {myCleaners.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-4xl mb-3">👷</p>
                <p className="text-gray-600 font-medium">No cleaners yet</p>
                <p className="text-sm text-gray-400 mt-1">Complete your first service to see your cleaners here</p>
              </div>
            ) : myCleaners.map((pro,i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-base font-bold text-emerald-700 flex-shrink-0">
                    {(pro.fullName||pro.full_name||'C')[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{pro.fullName||pro.full_name||'Cleaner'}</p>
                    <p className="text-xs text-gray-500">
                      {pro.avgRating ? `⭐ ${parseFloat(pro.avgRating).toFixed(1)}` : ''}
                      {pro.totalServices ? ` · ${pro.totalServices} services` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${pro.isAvailable||pro.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {pro.isAvailable||pro.is_available ? '🟢 Available' : '⚫ Busy'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">Last service: {pro.lastBooking?.scheduledAt ? new Date(pro.lastBooking.scheduledAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</p>
                <Link href={`/dashboard/new-booking?preferredPro=${pro.id}`}
                  className="w-full bg-emerald-700 text-white py-2 rounded-lg text-xs font-medium text-center hover:bg-emerald-800 block">
                  📅 Rebook with {(pro.fullName||pro.full_name||'cleaner').split(' ')[0]}
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* TAB: History */}
        {tab === 'history' && (
          <div className="space-y-3">
            {completed.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-600 font-medium">No completed services yet</p>
              </div>
            ) : completed.sort((a,b) => new Date(b.scheduledAt).getTime()-new Date(a.scheduledAt).getTime()).map(b => (
              <BookingCard key={b.id} b={b} />
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: control panel ── */}
      <div className="w-72 flex-shrink-0 space-y-4">

        {/* Profile & loyalty */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">C</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">My Account</p>
              {loyaltyCount >= 10 ? <span className="text-xs text-amber-600 font-medium">⭐ VIP Client</span>
                : loyaltyCount >= 5 ? <span className="text-xs text-purple-600 font-medium">💎 Frequent Client</span>
                : loyaltyCount >= 3 ? <span className="text-xs text-blue-600 font-medium">✨ Regular Client</span>
                : <span className="text-xs text-gray-400">New Client</span>}
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between"><span>Services completed</span><span className="font-semibold text-gray-900">{loyaltyCount}</span></div>
            <div className="flex justify-between"><span>Active bookings</span><span className="font-semibold text-gray-900">{active.length}</span></div>
            {loyaltyDiscount && <div className="flex justify-between text-emerald-600"><span>Loyalty discount</span><span className="font-semibold">5% active</span></div>}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="space-y-2">
            <Link href="/dashboard/new-booking"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-all">
              <span className="text-base">➕</span>
              <span className="text-sm font-medium">Book a cleaning</span>
            </Link>
            <button onClick={() => setTab('calendar')}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
              <span className="text-base">📅</span>
              <span className="text-sm">View calendar</span>
            </button>
            <button onClick={() => setTab('cleaners')}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
              <span className="text-base">👷</span>
              <span className="text-sm">My cleaners</span>
            </button>
            <button onClick={() => setTab('history')}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
              <span className="text-base">📋</span>
              <span className="text-sm">Service history</span>
            </button>
          </div>
        </div>

        {/* Active service status */}
        {active.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Services</p>
            <div className="space-y-2">
              {active.map(b => {
                const st = STATUS[b.status];
                return (
                  <div key={b.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st?.dot} ${b.status==='IN_PROGRESS'?'animate-pulse':''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{formatService(b.serviceType)}</p>
                      <p className="text-xs text-gray-500">{st?.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending ratings */}
        {completed.filter(b => !b.rated).length > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">⭐ Pending ratings</p>
            <div className="space-y-2">
              {completed.filter(b => !b.rated).slice(0,3).map(b => (
                <button key={b.id} onClick={() => { setRatingModal(b); setStars(5); setTip(0); }}
                  className="w-full text-left p-2 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 transition-all">
                  <p className="text-xs font-medium text-gray-900">{formatService(b.serviceType)}</p>
                  <p className="text-xs text-amber-600">Tap to rate →</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Support */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Support</p>
          <div className="space-y-2 text-xs text-gray-600">
            <p>📧 support@everclean.com</p>
            <p>📞 (201) 555-0100</p>
            <p>🕐 Mon–Sat 8am–8pm ET</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-1">Rate your service</h3>
            <p className="text-sm text-gray-500 mb-4">{formatService(ratingModal.serviceType)}</p>
            <div className="flex justify-center gap-3 mb-5">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setStars(s)} className={`text-3xl transition-all hover:scale-110 ${s<=stars?'':'opacity-30'}`}>⭐</button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-2">Add a tip (optional)</p>
            <div className="flex gap-2 mb-5">
              {[0,5,10,15,20].map(t => (
                <button key={t} onClick={() => setTip(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${tip===t ? 'bg-emerald-700 text-white border-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                  {t===0?'None':'$'+t}
                </button>
              ))}
            </div>
            <button onClick={submitRating} className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800">
              Submit{tip>0?` + $${tip} tip`:''}
            </button>
            <button onClick={() => setRatingModal(null)} className="w-full mt-2 text-gray-400 text-sm py-2">Skip</button>
          </div>
        </div>
      )}

      {claimModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-1">Report a problem</h3>
            <p className="text-sm text-gray-500 mb-4">{formatService(claimModal.serviceType)}</p>
            <textarea value={claimText} onChange={e => setClaimText(e.target.value)}
              placeholder="Describe the issue..." rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-3" />
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
              📸 Send photos to support@everclean.com · Booking ID: {claimModal.id?.slice(0,8)}
            </div>
            <button onClick={submitClaim} disabled={!claimText.trim()}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50">Submit Report</button>
            <button onClick={() => setClaimModal(null)} className="w-full mt-2 text-gray-400 text-sm py-2">Cancel</button>
          </div>
        </div>
      )}

      {messaging && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Message your cleaner</h3>
            <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
              placeholder="Type your message..." rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setMessaging(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button onClick={() => sendMessage(messaging)} className="flex-1 py-3 bg-emerald-700 text-white rounded-xl text-sm font-medium">Send SMS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
