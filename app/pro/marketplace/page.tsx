'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ProMarketplace() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [sortBy, setSortBy] = useState<'hours'|'payout'|'distance'>('hours');
  const [claiming, setClaiming] = useState<string|null>(null);
  const [scheduleModal, setScheduleModal] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string|null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings/available', { headers: { Authorization: 'Bearer '+token } });
      const data = await res.json();
      setJobs(data.data || []);
      setHourlyRate(data.hourlyRate || 25);
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function claimJob(jobId: string, scheduledAt?: string) {
    setClaiming(jobId);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings/'+jobId+'/claim', {
        method: 'POST', headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt })
      });
      const data = await res.json();
      if (res.ok) { setScheduleModal(null); load(); }
      else alert('Error: ' + (data.error || 'Could not claim'));
    } catch(e) { alert('Error claiming job'); }
    setClaiming(null);
  }

  const sorted = [...jobs].sort((a,b) => {
    if (sortBy === 'payout') return b.payout - a.payout;
    if (sortBy === 'distance') return (a.distanceMiles||999) - (b.distanceMiles||999);
    return b.hours - a.hours;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('pro.marketplace.title')}</h1>
          <p className="text-sm text-gray-500">{jobs.length} {t('pro.marketplace.available')} · ${hourlyRate}/{t('pro.marketplace.rate')}</p>
        </div>
        <button onClick={load} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">{t('common.refresh')}</button>
      </div>

      <div className="flex gap-2 mb-4">
        {([{id:'hours' as const,label:t('pro.marketplace.sortByHours'),icon:'⏱'},{id:'payout' as const,label:t('pro.marketplace.sortByPayout'),icon:'💰'},{id:'distance' as const,label:t('pro.marketplace.sortByDistance'),icon:'📍'}]).map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sortBy===s.id ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 font-medium">{t('pro.marketplace.noJobs')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('pro.marketplace.checkBackSoon')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{t('services.'+job.serviceType) || job.serviceType}</p>
                  <p className="text-xs text-gray-500">📅 {job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) : '—'} · ⏱ {job.hours}h</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-700">${Number(job.payout||0).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">${hourlyRate}/hr</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">📍 {job.address}{job.city ? ', '+job.city : ''}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">{Number(job.sqft||0).toFixed(0)} {t('pro.marketplace.sqft')}</span>
                {job.hours >= 4 && <span className="text-xs bg-amber-50 text-amber-700 rounded-md px-2 py-0.5">🔥 {t('pro.marketplace.bigJob')}</span>}
              </div>
              {job.clientNotes && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">📝 {job.clientNotes}</p>}
              <button onClick={() => { setScheduleModal(job); setSelectedTime(job.scheduledAt); }} disabled={claiming === job.id}
                className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
                {claiming === job.id ? t('pro.marketplace.scheduling') : `${t('pro.marketplace.scheduleJob')} · $${Number(job.payout||0).toFixed(2)}`}
              </button>
            </div>
          ))}
        </div>
      )}

      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-1">{t('pro.marketplace.chooseTime')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('services.'+scheduleModal.serviceType)} · {scheduleModal.hours}h · ${Number(scheduleModal.payout||0).toFixed(2)}</p>
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">⚠️ {t('pro.marketplace.cancelWarning')}</div>
            <button onClick={() => claimJob(scheduleModal.id, selectedTime || undefined)} disabled={claiming === scheduleModal.id}
              className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800 disabled:opacity-50">
              {claiming === scheduleModal.id ? t('pro.marketplace.scheduling') : t('pro.marketplace.confirmSchedule')}
            </button>
            <button onClick={() => setScheduleModal(null)} className="w-full mt-2 text-gray-400 text-sm py-2">{t('common.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
