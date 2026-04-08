'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS = {
  PENDING_ASSIGNMENT: { label: 'Finding your cleaner', color: 'bg-amber-50 text-amber-700', icon: '🔍', step: 1 },
  CONFIRMED:          { label: 'Cleaner assigned',      color: 'bg-blue-50 text-blue-700',   icon: '✅', step: 2 },
  IN_PROGRESS:        { label: 'Cleaning in progress',  color: 'bg-purple-50 text-purple-700',icon: '🧹', step: 3 },
  COMPLETED:          { label: 'Completed',              color: 'bg-emerald-50 text-emerald-700', icon: '🏁', step: 4 },
  CANCELLED:          { label: 'Cancelled',              color: 'bg-red-50 text-red-700',     icon: '❌', step: 0 },
};

function TrackingBar({ status }: { status: string }) {
  const steps = ['PENDING_ASSIGNMENT','CONFIRMED','IN_PROGRESS','COMPLETED'];
  const current = STATUS[status]?.step || 0;
  return (
    <div className="flex items-center gap-1 my-4">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < current ? 'bg-emerald-600 text-white' : i === current - 1 ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : 'bg-gray-200 text-gray-400'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-1 flex-1 mx-1 rounded ${i < current - 1 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ClientDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [stars, setStars] = useState(5);
  const [tip, setTip] = useState(0);

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

  // Auto-refresh cada 30s para trabajos activos
  useEffect(() => {
    const hasActive = bookings.some(b => ['CONFIRMED','IN_PROGRESS'].includes(b.status));
    if (!hasActive) return;
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [bookings, load]);

  async function sendMessage(bookingId: string) {
    if (!msgText.trim()) return;
    const token = localStorage.getItem('token') || '';
    try {
      await fetch(API + '/twilio/proxy-sms', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, message: msgText })
      });
      setMsgText('');
      setMessaging(null);
      alert('✅ Message sent to your cleaner');
    } catch(e) { alert('Error sending message'); }
  }

  async function callCleaner(bookingId: string) {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/twilio/proxy-call', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      if (res.ok) alert('📞 Calling your cleaner now...');
      else alert('Unable to connect call. Try again.');
    } catch(e) { alert('Error initiating call'); }
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
      alert('✅ Thank you for your feedback!');
    } catch(e) {}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Rate your service</h3>
            <p className="text-sm text-gray-500 mb-4">How was your cleaning experience?</p>
            <div className="flex justify-center gap-2 mb-5">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setStars(s)}
                  className={`text-3xl transition-transform ${s <= stars ? '' : 'opacity-30'} hover:scale-110`}>
                  ⭐
                </button>
              ))}
            </div>
            <div className="mb-5">
              <p className="text-sm text-gray-600 mb-2">Add a tip (optional)</p>
              <div className="flex gap-2">
                {[0, 5, 10, 15, 20].map(t => (
                  <button key={t} onClick={() => setTip(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${tip === t ? 'bg-emerald-700 text-white border-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-400'}`}>
                    {t === 0 ? 'No tip' : '$' + t}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={submitRating}
              className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800">
              Submit Rating {tip > 0 ? '+ $' + tip + ' tip' : ''}
            </button>
            <button onClick={() => setRatingModal(null)}
              className="w-full mt-2 text-gray-400 text-sm py-2">
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messaging && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Message your cleaner</h3>
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setMessaging(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600">
                Cancel
              </button>
              <button onClick={() => sendMessage(messaging)}
                className="flex-1 py-3 bg-emerald-700 text-white rounded-xl text-sm font-medium">
                Send SMS
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">My Services</h1>
        <Link href="/dashboard/new-booking"
          className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800">
          + Book Cleaning
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🧹</p>
          <h2 className="text-lg font-medium text-gray-900 mb-2">No services yet</h2>
          <p className="text-gray-500 text-sm mb-6">Book your first professional cleaning</p>
          <Link href="/dashboard/new-booking"
            className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800">
            Book Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => {
            const st = STATUS[b.status] || { label: b.status, color: 'bg-gray-50 text-gray-600', icon: '•', step: 0 };
            const isActive = ['CONFIRMED','IN_PROGRESS'].includes(b.status);
            const isCompleted = b.status === 'COMPLETED';

            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {b.serviceType?.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-gray-500">{b.address}, {b.city}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${st.color}`}>
                    {st.icon} {st.label}
                  </span>
                </div>

                {/* Tracking bar */}
                <TrackingBar status={b.status} />

                {/* ETA */}
                {b.status === 'CONFIRMED' && b.clientNotes?.startsWith('ETA:') && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">🚗</span>
                    <div>
                      <p className="text-sm font-medium text-blue-900">{b.clientNotes}</p>
                      <p className="text-xs text-blue-600">Your cleaner is on the way</p>
                    </div>
                  </div>
                )}

                {/* In progress indicator */}
                {b.status === 'IN_PROGRESS' && (
                  <div className="bg-purple-50 rounded-xl p-3 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <p className="text-sm font-medium text-purple-700">Cleaning in progress...</p>
                  </div>
                )}

                {/* Details */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                  <span className="bg-gray-100 rounded-lg px-3 py-1.5">
                    {new Date(b.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="bg-gray-100 rounded-lg px-3 py-1.5">{b.sqft} sqft</span>
                  <span className="bg-gray-100 rounded-lg px-3 py-1.5">{b.frequency}</span>
                  {b.totalAmount && (
                    <span className="bg-emerald-50 text-emerald-700 rounded-lg px-3 py-1.5 font-medium">
                      ${b.totalAmount}
                    </span>
                  )}
                </div>

                {/* Actions for active bookings */}
                {isActive && (
                  <div className="flex gap-2">
                    <button onClick={() => { setMessaging(b.id); setMsgText(''); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                      💬 Message
                    </button>
                    <button onClick={() => callCleaner(b.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                      📞 Call
                    </button>
                  </div>
                )}

                {/* Rate service */}
                {isCompleted && !b.rated && (
                  <button onClick={() => setRatingModal(b)}
                    className="w-full bg-emerald-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-800">
                    ⭐ Rate your service + Add tip
                  </button>
                )}

                {isCompleted && b.rated && (
                  <div className="text-center py-2 text-sm text-gray-400">
                    ✓ Rated · Thank you!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
