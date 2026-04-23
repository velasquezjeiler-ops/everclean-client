'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS_STYLE: Record<string, { color: string; dot: string }> = {
  PENDING_ASSIGNMENT: { color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  CONFIRMED: { color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  IN_PROGRESS: { color: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  COMPLETED: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
};

export default function ProDashboard() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string|null>(null);
  const [etaData, setEtaData] = useState<Record<string, any>>({});
  const [isAvailable, setIsAvailable] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [jobsRes, proRes] = await Promise.all([
        fetch(API+'/professionals/me/bookings', { headers: { Authorization: 'Bearer '+token } }),
        fetch(API+'/professionals/me', { headers: { Authorization: 'Bearer '+token } }),
      ]);
      const jobsData = await jobsRes.json();
      const proData = await proRes.json();
      setJobs(jobsData.data || []);
      setProfile(proData);
      setIsAvailable(proData.is_available ?? proData.isAvailable ?? false);
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  async function doAction(id: string, action: string) {
    setActing(id);
    const token = localStorage.getItem('token') || '';
    await fetch(API+'/bookings/'+id+'/'+action, { method: 'POST', headers: { Authorization: 'Bearer '+token } });
    await load();
    setActing(null);
  }

  async function toggleAvail() {
    const token = localStorage.getItem('token') || '';
    await fetch(API+'/professionals/me/availability', {
      method: 'PATCH', headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !isAvailable })
    });
    setIsAvailable(!isAvailable);
  }

  const active = jobs.filter(j => ['CONFIRMED','IN_PROGRESS'].includes(j.status));
  const completed = jobs.filter(j => j.status === 'COMPLETED');
  const earnings = completed.reduce((s, j) => s + Number(j.total_amount || j.totalAmount || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{t('pro.dashboard.title')}</h1>
          <button onClick={toggleAvail} className={`px-4 py-1.5 rounded-full text-xs font-medium ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {isAvailable ? t('pro.dashboard.available') : t('pro.dashboard.unavailable')}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{t('pro.dashboard.totalEarnings')}</p>
            <p className="text-2xl font-bold text-emerald-700">${earnings.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{t('pro.dashboard.servicesCompleted')}</p>
            <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{t('pro.dashboard.activeJobs')}</p>
            <p className="text-2xl font-bold text-blue-600">{active.length}</p>
          </div>
        </div>

        {active.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-gray-200"><p className="text-gray-400">{t('pro.dashboard.noJobs')}</p></div>}

        <div className="space-y-3">
          {jobs.filter(j => j.status !== 'CANCELLED').map(b => {
            const st = STATUS_STYLE[b.status] || STATUS_STYLE.CONFIRMED;
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t('services.'+(b.service_type||b.serviceType)) || b.service_type}</p>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((b.address||'')+(b.city?', '+b.city:'')+(b.state?' '+b.state:''))}`}
                      target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      📍 {b.address}{b.city?', '+b.city:''}{b.zip?' '+b.zip:''}
                    </a>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                    {t('statuses.'+b.status)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                  {b.scheduled_at && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">{new Date(b.scheduled_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                  {b.sqft && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">{b.sqft} {t('pro.marketplace.sqft')}</span>}
                  {b.total_amount && <span className="text-xs bg-emerald-50 text-emerald-700 rounded-md px-2 py-0.5 font-medium">${b.total_amount}</span>}
                </div>

                {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                  <div className="mt-2">
                    {etaData[b.id] ? (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-medium text-blue-700 mb-2">🚗 {etaData[b.id].distanceMiles} {t('pro.dashboard.milesAway')} · {t('pro.dashboard.etaTime')} {etaData[b.id].etaText}</p>
                        <a href={etaData[b.id].mapsUrl} target="_blank" rel="noopener noreferrer"
                          className="block w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 text-center">
                          🗺️ {t('pro.dashboard.startNavigation')}
                        </a>
                        <p className="text-xs text-emerald-600 mt-2 text-center">✅ {t('pro.dashboard.etaSent')}</p>
                      </div>
                    ) : (
                      <button onClick={() => fetchETA(b.id)}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                        🚗 {t('pro.dashboard.sendEta')}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  {b.status === 'CONFIRMED' && (
                    <button onClick={() => doAction(b.id, 'checkin')} disabled={acting===b.id}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50">
                      {t('pro.dashboard.checkIn')}
                    </button>
                  )}
                  {b.status === 'IN_PROGRESS' && (
                    <button onClick={() => doAction(b.id, 'checkout')} disabled={acting===b.id}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">
                      {t('pro.dashboard.checkOut')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-2 flex items-center justify-center text-emerald-700 text-xl font-bold">
            {(profile?.full_name||'P')[0]}
          </div>
          <p className="font-semibold text-gray-900 text-sm">{profile?.full_name}</p>
          <p className="text-xs text-gray-400">${profile?.hourly_rate || 25}{t('pro.dashboard.perHour')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('pro.dashboard.earnings')}</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-600">{t('pro.dashboard.todayEarnings')}</span><span className="font-semibold">$0</span></div>
            <div className="flex justify-between"><span className="text-gray-600">{t('pro.dashboard.weekEarnings')}</span><span className="font-semibold">${earnings.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">{t('pro.dashboard.completionRate')}</span><span className="font-semibold">100%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
