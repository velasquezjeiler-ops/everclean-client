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
      setIsAvailable(pD.is_available ?? false);
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

  const today = new Date();
  const days = Array.from({length:7}, (_,i) => { const d = new Date(today); d.setDate(today.getDate()+i); return d; });
  const jobsByDay = (d: Date) => jobs.filter(j => new Date(j.scheduled_at).toDateString() === d.toDateString());

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('pro.dashboard.title')}</h1>
        <button onClick={toggleAvail} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm ${isAvailable ? 'bg-green-500 text-white shadow-green-200' : 'bg-gray-200 text-gray-500'}`}>
          <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isAvailable ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {isAvailable ? t('pro.dashboard.available') : t('pro.dashboard.unavailable')}
        </button>
      </div>

      {/* Gradient stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="ec-stat-green rounded-2xl p-4 text-white shadow-lg shadow-green-900/20">
          <p className="text-white/70 text-xs">{t('pro.dashboard.totalEarnings')}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">${earnings.toFixed(0)}</p>
        </div>
        <div className="ec-stat-blue rounded-2xl p-4 text-white shadow-lg shadow-blue-900/20">
          <p className="text-white/70 text-xs">{t('pro.dashboard.servicesCompleted')}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">{completed.length}</p>
        </div>
        <div className="ec-stat-purple rounded-2xl p-4 text-white shadow-lg shadow-purple-900/20">
          <p className="text-white/70 text-xs">{t('pro.dashboard.activeJobs')}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">{active.length}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('pro.dashboard.calendar')}</p>
        <div className="flex gap-1.5 overflow-x-auto">
          {days.map((d,i) => {
            const hasJobs = jobsByDay(d).length > 0;
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} className={`flex flex-col items-center py-2 px-3 rounded-xl min-w-[52px] flex-1 transition-all ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-300' : hasJobs ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <span className={`text-[10px] uppercase ${isToday ? 'text-blue-200' : 'text-gray-400'}`}>{d.toLocaleDateString('en',{weekday:'short'})}</span>
                <span className={`text-base font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>{d.getDate()}</span>
                {hasJobs && !isToday && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-0.5" />}
                {hasJobs && isToday && <div className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Jobs */}
      {jobs.filter(j => j.status !== 'CANCELLED').length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-gray-500 text-sm">{t('pro.dashboard.noJobs')}</p>
        </div>
      )}

      <div className="space-y-3">
        {jobs.filter(j => j.status !== 'CANCELLED').slice(0,10).map(b => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm">{t('services.'+(b.service_type||b.serviceType)) || b.service_type}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((b.address||'')+(b.city?', '+b.city:''))}`}
                  target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block mt-0.5">
                  📍 {b.address}{b.city?', '+b.city:''}
                </a>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold whitespace-nowrap ${STATUS_STYLE[b.status]||''}`}>
                {t('statuses.'+b.status)}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {b.scheduled_at && <span className="text-[10px] bg-gray-100 text-gray-600 rounded-lg px-2 py-1">{new Date(b.scheduled_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>}
              {b.sqft && <span className="text-[10px] bg-gray-100 text-gray-600 rounded-lg px-2 py-1">{b.sqft} ft²</span>}
              {b.total_amount && <span className="text-[10px] ec-stat-green text-white rounded-lg px-2 py-1 font-semibold">${b.total_amount}</span>}
            </div>

            {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
              <div className="mt-3">
                {etaData[b.id] ? (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-2">🚗 {etaData[b.id].distanceMiles} mi · {t('pro.dashboard.etaTime')} {etaData[b.id].etaText}</p>
                    <a href={etaData[b.id].mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="block w-full py-2.5 rounded-xl text-xs font-semibold text-white text-center shadow-md" style={{background:'linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%)'}}>
                      🗺️ {t('pro.dashboard.startNavigation')}
                    </a>
                    <p className="text-[10px] text-green-600 mt-2 text-center font-medium">✅ {t('pro.dashboard.etaSent')}</p>
                  </div>
                ) : (
                  <button onClick={() => fetchETA(b.id)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white shadow-md" style={{background:'linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%)'}}>
                    🚗 {t('pro.dashboard.sendEta')}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {b.status === 'CONFIRMED' && <button onClick={() => doAction(b.id,'checkin')} disabled={acting===b.id} className="flex-1 py-2.5 ec-stat-purple text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-md">{t('pro.dashboard.checkIn')}</button>}
              {b.status === 'IN_PROGRESS' && <button onClick={() => doAction(b.id,'checkout')} disabled={acting===b.id} className="flex-1 py-2.5 ec-stat-green text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-md">{t('pro.dashboard.checkOut')}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
