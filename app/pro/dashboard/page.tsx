'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS_STYLE: Record<string, string> = {
  PENDING_ASSIGNMENT: 'text-amber-700 bg-amber-50 border-amber-200',
  CONFIRMED: 'text-blue-700 bg-blue-50 border-blue-200',
  IN_PROGRESS: 'text-purple-700 bg-purple-50 border-purple-200',
  COMPLETED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CANCELLED: 'text-red-700 bg-red-50 border-red-200',
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
      const [jR, pR] = await Promise.all([
        fetch(API+'/professionals/me/bookings', { headers: { Authorization: 'Bearer '+token } }),
        fetch(API+'/professionals/me', { headers: { Authorization: 'Bearer '+token } }),
      ]);
      const jD = await jR.json(); const pD = await pR.json();
      setJobs(jD.data || []); setProfile(pD);
      setIsAvailable(pD.is_available ?? pD.isAvailable ?? false);
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function fetchETA(id: string) {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API+'/bookings/'+id+'/eta', { headers: { Authorization: 'Bearer '+token } });
    if (res.ok) { const d = await res.json(); setEtaData(p => ({ ...p, [id]: d })); }
  }

  async function doAction(id: string, action: string) {
    setActing(id);
    const token = localStorage.getItem('token') || '';
    await fetch(API+'/bookings/'+id+'/'+action, { method: 'POST', headers: { Authorization: 'Bearer '+token } });
    await load(); setActing(null);
  }

  async function toggleAvail() {
    const token = localStorage.getItem('token') || '';
    await fetch(API+'/professionals/me/availability', { method: 'PATCH', headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' }, body: JSON.stringify({ isAvailable: !isAvailable }) });
    setIsAvailable(!isAvailable);
  }

  const active = jobs.filter(j => ['CONFIRMED','IN_PROGRESS'].includes(j.status));
  const completed = jobs.filter(j => j.status === 'COMPLETED');
  const earnings = completed.reduce((s, j) => s + Number(j.total_amount || 0), 0);

  // Calendar - next 7 days
  const today = new Date();
  const days = Array.from({length:7}, (_,i) => { const d = new Date(today); d.setDate(today.getDate()+i); return d; });
  const jobsByDay = (d: Date) => jobs.filter(j => {
    const jd = new Date(j.scheduled_at || j.scheduledAt);
    return jd.toDateString() === d.toDateString();
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-semibold text-gray-900">{t('pro.dashboard.title')}</h1>
        <button onClick={toggleAvail} className={`px-3 py-1.5 rounded-full text-xs font-medium ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {isAvailable ? t('pro.dashboard.available') : t('pro.dashboard.unavailable')}
        </button>
      </div>

      {/* Stats - horizontal scroll on mobile */}
      <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 min-w-[120px] flex-1">
          <p className="text-xs text-gray-500">{t('pro.dashboard.totalEarnings')}</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-700">${earnings.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 min-w-[120px] flex-1">
          <p className="text-xs text-gray-500">{t('pro.dashboard.servicesCompleted')}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{completed.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 min-w-[120px] flex-1">
          <p className="text-xs text-gray-500">{t('pro.dashboard.activeJobs')}</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{active.length}</p>
        </div>
      </div>

      {/* Weekly calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">{t('pro.dashboard.calendar')}</p>
        <div className="flex gap-1 overflow-x-auto">
          {days.map((d,i) => {
            const hasJobs = jobsByDay(d).length > 0;
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} className={`flex flex-col items-center p-2 rounded-lg min-w-[48px] ${isToday ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
                <span className="text-[10px] text-gray-400 uppercase">{d.toLocaleDateString('en',{weekday:'short'})}</span>
                <span className={`text-sm font-semibold ${isToday ? 'text-emerald-700' : 'text-gray-900'}`}>{d.getDate()}</span>
                {hasJobs && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Jobs list */}
      {active.length === 0 && <div className="text-center py-10 bg-white rounded-xl border border-gray-200"><p className="text-gray-400 text-sm">{t('pro.dashboard.noJobs')}</p></div>}

      <div className="space-y-3">
        {jobs.filter(j => j.status !== 'CANCELLED').slice(0,10).map(b => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm truncate">{t('services.'+(b.service_type||b.serviceType)) || b.service_type}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((b.address||'')+(b.city?', '+b.city:''))}`}
                  target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                  📍 {b.address}{b.city?', '+b.city:''}
                </a>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_STYLE[b.status]||''}`}>
                {t('statuses.'+b.status)}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {b.scheduled_at && <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{new Date(b.scheduled_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>}
              {b.sqft && <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{b.sqft} ft²</span>}
              {b.total_amount && <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5 font-medium">${b.total_amount}</span>}
            </div>

            {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
              <div className="mt-2">
                {etaData[b.id] ? (
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 mb-2">🚗 {etaData[b.id].distanceMiles} mi · {t('pro.dashboard.etaTime')} {etaData[b.id].etaText}</p>
                    <a href={etaData[b.id].mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="block w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium text-center">
                      🗺️ {t('pro.dashboard.startNavigation')}
                    </a>
                    <p className="text-[10px] text-emerald-600 mt-1 text-center">✅ {t('pro.dashboard.etaSent')}</p>
                  </div>
                ) : (
                  <button onClick={() => fetchETA(b.id)} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium">
                    🚗 {t('pro.dashboard.sendEta')}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              {b.status === 'CONFIRMED' && <button onClick={() => doAction(b.id,'checkin')} disabled={acting===b.id} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">{t('pro.dashboard.checkIn')}</button>}
              {b.status === 'IN_PROGRESS' && <button onClick={() => doAction(b.id,'checkout')} disabled={acting===b.id} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">{t('pro.dashboard.checkOut')}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
