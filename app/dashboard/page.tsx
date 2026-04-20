'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_ASSIGNMENT: { label: 'Finding your cleaner', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED: { label: 'Cleaner assigned', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'Cleaning in progress', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const SERVICE_LABELS: Record<string, string> = {
  HOUSE_CLEANING: 'House cleaning', DEEP_CLEANING: 'Deep cleaning',
  MOVE_IN_OUT: 'Move in/out', OFFICE_CLEANING: 'Office cleaning',
  POST_CONSTRUCTION: 'Post construction', MEDICAL_FACILITY: 'Medical facility',
  INDUSTRIAL: 'Industrial', ONE_TIME: 'One time',
};

export default function ClientDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history' | 'cleaners'>('active');
  const [etaData, setEtaData] = useState<Record<string, any>>({});

  const loadBookings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const bks = data.data || [];
      setBookings(bks);

      // Load ETA for confirmed/in-progress bookings
      for (const b of bks) {
        if (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') {
          try {
            const etaRes = await fetch(`${API}/bookings/${b.id}/eta`, { headers: { Authorization: `Bearer ${token}` } });
            if (etaRes.ok) {
              const eta = await etaRes.json();
              setEtaData(prev => ({ ...prev, [b.id]: eta }));
            }
          } catch (e) { /* ETA not available */ }
        }
      }
    } catch (e) { console.error('Load bookings error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 60000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  const active = bookings.filter(b => ['PENDING_ASSIGNMENT', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const uniqueCleaners = Array.from(
    new Map(
      bookings
        .filter(b => b.professionals?.length > 0)
        .map(b => {
          const pro = b.professionals[0]?.professional || b.professionals[0];
          return [pro?.id, pro] as [string, any];
        })
        .filter(([id]) => id)
    ).values()
  );

  const getProFromBooking = (b: any) => {
    if (!b.professionals || b.professionals.length === 0) return null;
    return b.professionals[0]?.professional || b.professionals[0];
  };

  const openDirections = (b: any) => {
    const addr = encodeURIComponent(`${b.address}, ${b.city}, ${b.state} ${b.zip || ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Main content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
            {[
              { key: 'active' as const, label: `Services (${active.length})` },
              { key: 'history' as const, label: `History (${completed.length})` },
              { key: 'cleaners' as const, label: `My cleaners (${uniqueCleaners.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Active services */}
          {tab === 'active' && (
            <div className="space-y-3">
              {active.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm mb-3">No active services</p>
                  <Link href="/dashboard/new-booking"
                    className="inline-block bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-800">
                    Book a cleaning
                  </Link>
                </div>
              ) : active.map(b => {
                const status = STATUS[b.status] || STATUS.PENDING_ASSIGNMENT;
                const pro = getProFromBooking(b);
                const eta = etaData[b.id];
                return (
                  <div key={b.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Status bar */}
                    <div className={`px-4 py-2 border-b ${status.bg}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                        {b.status === 'IN_PROGRESS' && (
                          <span className="flex items-center gap-1 text-xs text-purple-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {SERVICE_LABELS[b.serviceType || b.service_type] || b.serviceType || b.service_type}
                          </p>
                          <button onClick={() => openDirections(b)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                            📍 {b.address}, {b.city} ↗
                          </button>
                        </div>
                        <p className="text-lg font-bold text-gray-900">${Number(b.totalAmount || b.total_amount || 0).toFixed(0)}</p>
                      </div>

                      <div className="text-xs text-gray-500 flex gap-3 mb-3">
                        <span>{new Date(b.scheduledAt || b.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span>{Number(b.sqft || 0)} sqft</span>
                      </div>

                      {/* ETA display */}
                      {eta && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-blue-600 font-medium">ETA: {eta.etaText}</p>
                              <p className="text-xs text-blue-500">{eta.distanceMiles} mi away</p>
                            </div>
                            <a href={eta.mapsUrl} target="_blank" rel="noopener noreferrer"
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700">
                              Track
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Assigned professional */}
                      {pro && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-sm font-bold flex-shrink-0">
                              {(pro.fullName || pro.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{pro.fullName || pro.full_name}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="text-amber-500">{'★'.repeat(Math.round(Number(pro.avgRating || pro.avg_rating || 0)))}</span>
                                <span>{Number(pro.avgRating || pro.avg_rating || 0).toFixed(1)}</span>
                                <span>· {Number(pro.totalServices || pro.total_services || 0)} services</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm hover:bg-emerald-200" title="Message">
                                💬
                              </button>
                              <button className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm hover:bg-emerald-200" title="Call">
                                📞
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* History */}
          {tab === 'history' && (
            <div className="space-y-2">
              {completed.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-12">No completed services yet</p>
              ) : completed.map(b => {
                const pro = getProFromBooking(b);
                return (
                  <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                    <div className="w-1.5 h-10 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {SERVICE_LABELS[b.serviceType || b.service_type] || b.serviceType || b.service_type}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{b.address}, {b.city}</p>
                    </div>
                    {pro && <p className="text-xs text-gray-500">{pro.fullName || pro.full_name}</p>}
                    <p className="text-sm font-semibold text-gray-900">${Number(b.totalAmount || b.total_amount || 0).toFixed(0)}</p>
                    <Link href={`/dashboard/invoice/${b.id}`} className="text-xs text-emerald-600 hover:text-emerald-700">
                      Invoice
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* My cleaners */}
          {tab === 'cleaners' && (
            <div className="space-y-3">
              {uniqueCleaners.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-12">No cleaners yet. Book your first service to get matched.</p>
              ) : uniqueCleaners.map((pro: any) => (
                <div key={pro.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg font-bold flex-shrink-0">
                    {(pro.fullName || pro.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{pro.fullName || pro.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="text-amber-500">{'★'.repeat(Math.round(Number(pro.avgRating || pro.avg_rating || 0)))}</span>
                      <span>{Number(pro.avgRating || pro.avg_rating || 0).toFixed(1)} rating</span>
                      <span>· {Number(pro.totalServices || pro.total_services || 0)} services</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/new-booking?preferredPro=${pro.id}`}
                      className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-800">
                      Rebook
                    </Link>
                    <button className="bg-gray-100 px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-200">
                      💬 Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Control panel */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick actions</h3>
            <div className="space-y-2">
              <Link href="/dashboard/new-booking"
                className="flex items-center gap-2 w-full p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-all">
                <span>🧹</span> Book a cleaning
              </Link>
              <button onClick={() => setTab('cleaners')}
                className="flex items-center gap-2 w-full p-2.5 rounded-lg bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 transition-all text-left">
                <span className="text-base">👤</span> My cleaners
              </button>
              <button onClick={() => setTab('history')}
                className="flex items-center gap-2 w-full p-2.5 rounded-lg bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 transition-all text-left">
                <span className="text-base">📋</span> Service history
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">My account</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Services</span>
                <span className="font-medium text-gray-900">{bookings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Completed</span>
                <span className="font-medium text-gray-900">{completed.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active</span>
                <span className="font-medium text-gray-900">{active.length}</span>
              </div>
              {completed.length >= 5 && (
                <div className="bg-amber-50 rounded-lg p-2 mt-2">
                  <p className="text-xs text-amber-700 font-medium">
                    Frequent client — 5% discount applied
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active service pulse */}
          {active.filter(b => b.status === 'IN_PROGRESS').map(b => (
            <div key={b.id} className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <p className="text-xs font-medium text-purple-700">Service in progress</p>
              </div>
              <p className="text-xs text-purple-600">{b.address}, {b.city}</p>
              {etaData[b.id] && (
                <a href={etaData[b.id].mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-purple-700 underline">
                  Track on map →
                </a>
              )}
            </div>
          ))}

          {/* Support */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Need help?</p>
            <button className="text-xs text-emerald-600 font-medium hover:text-emerald-700">Contact support</button>
          </div>
        </div>
      </div>
    </div>
  );
}
