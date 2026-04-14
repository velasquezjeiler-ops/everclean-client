'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS: Record<string, { label: string; color: string; icon: string; step: number }> = {
  PENDING_ASSIGNMENT: { label: 'Finding cleaner',    color: 'bg-amber-50 text-amber-700',     icon: '🔍', step: 1 },
  CONFIRMED:          { label: 'Cleaner assigned',   color: 'bg-blue-50 text-blue-700',       icon: '✅', step: 2 },
  IN_PROGRESS:        { label: 'In progress',        color: 'bg-purple-50 text-purple-700',   icon: '🧹', step: 3 },
  COMPLETED:          { label: 'Completed',          color: 'bg-emerald-50 text-emerald-700', icon: '🏁', step: 4 },
  CANCELLED:          { label: 'Cancelled',          color: 'bg-red-50 text-red-700',         icon: '❌', step: 0 },
};

const SERVICE_LABELS: Record<string, string> = {
  HOUSE_CLEANING: 'House Cleaning', DEEP_CLEANING: 'Deep Cleaning', MOVE_IN_OUT: 'Move In/Out',
  OFFICE_CLEANING: 'Office Cleaning', COMMERCIAL_CLEANING: 'Commercial', POST_CONSTRUCTION: 'Post Construction',
  MEDICAL_CLEANING: 'Medical / Clinic', APARTMENT_CLEANING: 'Apartment', MAID_SERVICES: 'Maid Services',
  SAME_DAY_CLEANING: 'Same Day',
};

function TrackingBar({ status }: { status: string }) {
  const steps = ['PENDING_ASSIGNMENT','CONFIRMED','IN_PROGRESS','COMPLETED'];
  const stepLabels = ['Finding','Assigned','Cleaning','Done'];
  const current = STATUS[status]?.step || 0;
  return (
    <div className="flex items-center my-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < current ? 'bg-emerald-600 text-white' : i === current - 1 ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : 'bg-gray-200 text-gray-400'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-xs text-gray-400 mt-1">{stepLabels[i]}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-1 flex-1 mx-1 mb-4 rounded ${i < current - 1 ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function LoyaltyBadge({ count }: { count: number }) {
  if (count < 3) return null;
  const badge = count >= 10 ? { label: '⭐ VIP Client', color: 'bg-amber-50 text-amber-700 border-amber-200' }
    : count >= 5 ? { label: '💎 Frequent Client', color: 'bg-purple-50 text-purple-700 border-purple-200' }
    : { label: '✨ Regular Client', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium border ${badge.color}`}>{badge.label}</span>
  );
}

export default function ClientDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'services' | 'calendar' | 'cleaners' | 'history'>('services');
  const [weekBase, setWeekBase] = useState(new Date());

  // Modals
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [stars, setStars] = useState(5);
  const [tip, setTip] = useState(0);
  const [claimModal, setClaimModal] = useState<any>(null);
  const [claimText, setClaimText] = useState('');
  const [messaging, setMessaging] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings', { headers: { Authorization: 'Bearer ' + token } });
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
  const loyaltyDiscount = loyaltyCount >= 6 ? 0.05 : 0;

  // My cleaners: unique professionals from completed bookings
  const myCleaners = (() => {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const b of completed) {
      const pro = b.professionals?.[0]?.professional || b.professional;
      if (pro?.id && !seen.has(pro.id)) {
        seen.add(pro.id);
        result.push({ ...pro, lastBooking: b });
      }
    }
    return result;
  })();

  // Calendar week
  function getWeekDays(base: Date) {
    const start = new Date(base);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }
  const weekDays = getWeekDays(weekBase);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  function bookingsForDay(day: Date) {
    return bookings.filter(b => {
      if (!b.scheduledAt) return false;
      return new Date(b.scheduledAt).toDateString() === day.toDateString();
    });
  }

  async function submitRating() {
    const token = localStorage.getItem('token') || '';
    try {
      await fetch(API + '/bookings/' + ratingModal.id + '/rate', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars, tip })
      });
      setRatingModal(null);
      load();
    } catch(e) {}
  }

  async function submitClaim() {
    const token = localStorage.getItem('token') || '';
    try {
      await fetch(API + '/bookings/' + claimModal.id + '/claim-report', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: claimText })
      });
      setClaimModal(null);
      setClaimText('');
      alert('✅ Report submitted. Our team will contact you within 24h.');
    } catch(e) { alert('Error submitting report. Please try again.'); }
  }

  async function sendMessage(bookingId: string) {
    if (!msgText.trim()) return;
    const token = localStorage.getItem('token') || '';
    try {
      await fetch(API + '/twilio/proxy-sms', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, message: msgText })
      });
      setMsgText(''); setMessaging(null);
      alert('✅ Message sent');
    } catch(e) { alert('Error sending message'); }
  }

  function BookingCard({ b, showActions = true }: { b: any; showActions?: boolean }) {
    const st = STATUS[b.status] || { label: b.status, color: 'bg-gray-50 text-gray-600', icon: '•', step: 0 };
    const isActive = ['CONFIRMED','IN_PROGRESS'].includes(b.status);
    const isCompleted = b.status === 'COMPLETED';
    const svcLabel = SERVICE_LABELS[b.serviceType] || b.serviceType?.replace(/_/g, ' ');
    const scheduledDate = b.scheduledAt ? new Date(b.scheduledAt) : null;

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-gray-900">{svcLabel}</p>
            <p className="text-xs text-gray-500">{b.address}{b.city ? ', ' + b.city : ''}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.icon} {st.label}</span>
        </div>

        {!isCompleted && <TrackingBar status={b.status} />}

        {b.status === 'IN_PROGRESS' && (
          <div className="bg-purple-50 rounded-xl p-3 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <p className="text-sm font-medium text-purple-700">Cleaning in progress...</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs mb-3">
          {scheduledDate && (
            <span className="bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">
              📅 {scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' · '}{scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {b.sqft && <span className="bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">{b.sqft} sqft</span>}
          {b.totalAmount && (
            <span className="bg-emerald-50 text-emerald-700 rounded-lg px-2.5 py-1 font-medium">
              ${b.totalAmount}{loyaltyDiscount > 0 ? ' (-5% loyalty)' : ''}
            </span>
          )}
        </div>

        {showActions && isActive && (
          <div className="flex gap-2">
            <button onClick={() => { setMessaging(b.id); setMsgText(''); }}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">💬 Message</button>
            <button onClick={async () => {
              const token = localStorage.getItem('token') || '';
              await fetch(API + '/twilio/proxy-call', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: b.id }) });
              alert('📞 Calling your cleaner...');
            }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">📞 Call</button>
          </div>
        )}

        {showActions && isCompleted && !b.rated && (
          <div className="space-y-2">
            <button onClick={() => { setRatingModal(b); setStars(5); setTip(0); }}
              className="w-full bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-800">⭐ Rate your service + Tip</button>
            <button onClick={() => { setClaimModal(b); setClaimText(''); }}
              className="w-full border border-red-200 text-red-600 py-2 rounded-xl text-sm hover:bg-red-50">⚠️ Report a problem</button>
          </div>
        )}

        {showActions && isCompleted && b.rated && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">✓ Rated</span>
            <button onClick={() => { setClaimModal(b); setClaimText(''); }}
              className="text-xs text-red-500 hover:text-red-700">Report issue</button>
          </div>
        )}
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 sm:items-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-1">Rate your service</h3>
            <p className="text-sm text-gray-500 mb-4">{SERVICE_LABELS[ratingModal.serviceType]}</p>
            <div className="flex justify-center gap-3 mb-5">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setStars(s)} className={`text-3xl transition-all hover:scale-110 ${s <= stars ? '' : 'opacity-30'}`}>⭐</button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-2">Add a tip (optional)</p>
            <div className="flex gap-2 mb-5">
              {[0,5,10,15,20].map(t => (
                <button key={t} onClick={() => setTip(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${tip === t ? 'bg-emerald-700 text-white border-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                  {t === 0 ? 'None' : '$' + t}
                </button>
              ))}
            </div>
            <button onClick={submitRating} className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800">
              Submit{tip > 0 ? ` + $${tip} tip` : ''}
            </button>
            <button onClick={() => setRatingModal(null)} className="w-full mt-2 text-gray-400 text-sm py-2">Skip</button>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {claimModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 sm:items-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-1">Report a problem</h3>
            <p className="text-sm text-gray-500 mb-4">{SERVICE_LABELS[claimModal.serviceType]} · {claimModal.city}</p>
            <textarea value={claimText} onChange={e => setClaimText(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4" />
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
              📸 Please send before/after photos to support@everclean.com with your booking ID: {claimModal.id?.slice(0,8)}
            </div>
            <button onClick={submitClaim} disabled={!claimText.trim()}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50">Submit Report</button>
            <button onClick={() => setClaimModal(null)} className="w-full mt-2 text-gray-400 text-sm py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messaging && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 sm:items-center">
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

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Services</h1>
          <div className="flex items-center gap-2 mt-1">
            <LoyaltyBadge count={loyaltyCount} />
            {loyaltyCount > 0 && <span className="text-xs text-gray-400">{loyaltyCount} service{loyaltyCount !== 1 ? 's' : ''} completed</span>}
          </div>
        </div>
        <Link href="/dashboard/new-booking"
          className="bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-800">
          + Book
        </Link>
      </div>

      {/* Loyalty progress */}
      {loyaltyCount < 6 && loyaltyCount > 0 && (
        <div className="bg-purple-50 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-purple-700">🎁 {6 - loyaltyCount} more service{6 - loyaltyCount !== 1 ? 's' : ''} to unlock 5% loyalty discount</p>
            <div className="h-1.5 bg-purple-200 rounded-full mt-2">
              <div className="h-1.5 bg-purple-500 rounded-full transition-all" style={{ width: `${(loyaltyCount / 6) * 100}%` }} />
            </div>
          </div>
          <span className="text-2xl font-bold text-purple-700">{loyaltyCount}/6</span>
        </div>
      )}
      {loyaltyDiscount > 0 && (
        <div className="bg-emerald-50 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span className="text-emerald-700">🎉</span>
          <p className="text-sm font-medium text-emerald-700">5% loyalty discount active on all bookings!</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {([
          { id: 'services', label: `Services${active.length > 0 ? ` (${active.length})` : ''}` },
          { id: 'calendar', label: 'Calendar' },
          { id: 'cleaners', label: `Cleaners${myCleaners.length > 0 ? ` (${myCleaners.length})` : ''}` },
          { id: 'history',  label: `History${completed.length > 0 ? ` (${completed.length})` : ''}` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Services ── */}
      {tab === 'services' && (
        <div>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-4xl mb-3">🧹</p>
              <h2 className="text-lg font-medium text-gray-900 mb-2">No services yet</h2>
              <p className="text-gray-500 text-sm mb-6">Book your first professional cleaning</p>
              <Link href="/dashboard/new-booking" className="bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-800">Book Now</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {active.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active</p>
                  {active.map(b => <BookingCard key={b.id} b={b} />)}
                </>
              )}
              {completed.slice(0, 2).length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Recent</p>
                  {completed.slice(0, 2).map(b => <BookingCard key={b.id} b={b} />)}
                  {completed.length > 2 && (
                    <button onClick={() => setTab('history')} className="w-full text-sm text-emerald-700 py-2 hover:underline">
                      View all {completed.length} completed services →
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Calendar ── */}
      {tab === 'calendar' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 text-lg">‹</button>
            <p className="text-sm font-medium text-gray-700">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 text-lg">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day, i) => {
              const dayBookings = bookingsForDay(day);
              const isToday = day.toDateString() === today.toDateString();
              const isSel = selectedDay.toDateString() === day.toDateString();
              const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
              return (
                <button key={i} onClick={() => setSelectedDay(day)}
                  className={`rounded-xl p-2 text-center transition-all ${isSel ? 'bg-emerald-700' : isToday ? 'bg-emerald-50' : 'bg-white border border-gray-200 hover:border-emerald-300'}`}>
                  <p className={`text-xs font-medium mb-1 ${isSel ? 'text-emerald-200' : 'text-gray-400'}`}>{dayNames[i]}</p>
                  <p className={`text-sm font-bold ${isSel ? 'text-white' : isToday ? 'text-emerald-700' : 'text-gray-900'}`}>{day.getDate()}</p>
                  {dayBookings.length > 0 && (
                    <div className="flex justify-center mt-1 gap-0.5">
                      {dayBookings.map((_, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">
              {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {bookingsForDay(selectedDay).length > 0 ? ` · ${bookingsForDay(selectedDay).length} service${bookingsForDay(selectedDay).length > 1 ? 's' : ''}` : ' · No services'}
            </p>
            {bookingsForDay(selectedDay).length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-gray-200 border-dashed">
                <p className="text-gray-400 text-sm">No services scheduled</p>
                <Link href="/dashboard/new-booking" className="text-emerald-600 text-sm mt-2 block hover:underline">+ Book for this day</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookingsForDay(selectedDay).map(b => <BookingCard key={b.id} b={b} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: My Cleaners ── */}
      {tab === 'cleaners' && (
        <div>
          {myCleaners.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-4xl mb-3">👷</p>
              <p className="text-gray-600 font-medium">No cleaners yet</p>
              <p className="text-sm text-gray-400 mt-1">Complete your first service to see your cleaners here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCleaners.map((pro, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700">
                      {(pro.fullName || pro.full_name || 'C')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pro.fullName || pro.full_name || 'Cleaner'}</p>
                      <p className="text-xs text-gray-500">
                        {pro.avgRating ? `⭐ ${parseFloat(pro.avgRating).toFixed(1)}` : ''}
                        {pro.totalServices ? ` · ${pro.totalServices} services` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${pro.isAvailable || pro.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {pro.isAvailable || pro.is_available ? '🟢 Available' : '⚫ Busy'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Last service: {pro.lastBooking?.scheduledAt
                      ? new Date(pro.lastBooking.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                    {' · '}{SERVICE_LABELS[pro.lastBooking?.serviceType] || ''}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/new-booking?preferredPro=${pro.id}`}
                      className="flex-1 bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium text-center hover:bg-emerald-800">
                      📅 Rebook with {(pro.fullName || pro.full_name || 'this cleaner').split(' ')[0]}
                    </Link>
                    <button onClick={() => { setClaimModal(pro.lastBooking); setClaimText(''); }}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                      ⚠️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: History ── */}
      {tab === 'history' && (
        <div>
          {completed.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-600 font-medium">No completed services yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completed.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{SERVICE_LABELS[b.serviceType] || b.serviceType?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{b.address}{b.city ? ', ' + b.city : ''}</p>
                    </div>
                    {b.totalAmount && (
                      <span className="text-sm font-bold text-emerald-700">${b.totalAmount}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                    {b.scheduledAt && (
                      <span className="bg-gray-100 rounded-lg px-2.5 py-1">
                        {new Date(b.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    {b.sqft && <span className="bg-gray-100 rounded-lg px-2.5 py-1">{b.sqft} sqft</span>}
                    <span className="bg-emerald-50 text-emerald-700 rounded-lg px-2.5 py-1">✓ Completed</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const text = `EverClean Invoice\n${SERVICE_LABELS[b.serviceType]}\n${b.address}, ${b.city}\n${b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : ''}\nTotal: $${b.totalAmount}\nBooking ID: ${b.id}`;
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url;
                      a.download = `everclean-invoice-${b.id?.slice(0,8)}.txt`; a.click();
                    }} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-50">
                      📄 Download invoice
                    </button>
                    {!b.rated && (
                      <button onClick={() => { setRatingModal(b); setStars(5); setTip(0); }}
                        className="flex-1 bg-emerald-700 text-white py-2 rounded-xl text-xs font-medium hover:bg-emerald-800">⭐ Rate</button>
                    )}
                    <button onClick={() => { setClaimModal(b); setClaimText(''); }}
                      className="px-3 py-2 border border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50">⚠️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
