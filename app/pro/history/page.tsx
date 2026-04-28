'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ProHistory() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/professionals/me/bookings', { headers: { Authorization: 'Bearer '+token } });
      const data = await res.json();
      setJobs((data.data||[]).filter((b:any) => b.status === 'COMPLETED'));
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalEarned = jobs.reduce((s,j) => s + Number(j.total_amount||0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('sidebar.history')}</h1>

      <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
        <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[110px] flex-1">
          <p className="text-xs text-gray-500">{t('pro.dashboard.servicesCompleted')}</p>
          <p className="text-xl font-bold text-gray-900">{jobs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[110px] flex-1">
          <p className="text-xs text-gray-500">{t('pro.dashboard.totalEarnings')}</p>
          <p className="text-xl font-bold text-emerald-700">${totalEarned.toFixed(0)}</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-gray-500 text-sm">{t('pro.dashboard.noJobs')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-gray-900 text-sm truncate flex-1">{t('services.'+(b.service_type||b.serviceType))||b.service_type}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium text-emerald-700 bg-emerald-50 border-emerald-200">{t('statuses.COMPLETED')}</span>
              </div>
              <p className="text-xs text-gray-500 truncate mb-1">📍 {b.address}{b.city?', '+b.city:''}</p>
              <div className="flex flex-wrap gap-1">
                {b.scheduled_at && <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{new Date(b.scheduled_at).toLocaleDateString()}</span>}
                {b.total_amount && <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5 font-medium">${b.total_amount}</span>}
                {b.rating && <span className="text-[10px] bg-amber-50 text-amber-700 rounded px-1.5 py-0.5">⭐ {b.rating}</span>}
                {b.tip && Number(b.tip)>0 && <span className="text-[10px] bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">💰 ${b.tip} tip</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
