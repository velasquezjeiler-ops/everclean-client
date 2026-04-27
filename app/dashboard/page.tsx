'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings', { headers: { Authorization: 'Bearer '+token } });
      const data = await res.json();
      setBookings(data.data || []);
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = bookings.filter(b => !['COMPLETED','CANCELLED'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'COMPLETED');

  // Calendar
  const today = new Date();
  const days = Array.from({length:7}, (_,i) => { const d = new Date(today); d.setDate(today.getDate()+i); return d; });
  const jobsByDay = (d: Date) => bookings.filter(b => {
    const jd = new Date(b.scheduled_at || b.scheduledAt);
    return jd.toDateString() === d.toDateString();
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-semibold text-gray-900">{t('client.dashboard.title')}</h1>
        <Link href="/dashboard/new-booking" className="bg-emerald-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium">
          + {t('client.dashboard.bookNow')}
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
        <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[110px] flex-1">
          <p className="text-xs text-gray-500">{t('client.dashboard.upcomingServices')}</p>
          <p className="text-xl font-bold text-emerald-700">{active.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[110px] flex-1">
          <p className="text-xs text-gray-500">{t('client.history.totalServices')}</p>
          <p className="text-xl font-bold text-gray-900">{completed.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[110px] flex-1">
          <p className="text-xs text-gray-500">{t('client.history.totalSpent')}</p>
          <p className="text-xl font-bold text-blue-600">${completed.reduce((s,b) => s+Number(b.total_amount||0),0).toFixed(0)}</p>
        </div>
      </div>

      {/* Weekly calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
        <div className="flex gap-1 overflow-x-auto">
          {days.map((d,i) => {
            const hasJobs = jobsByDay(d).length > 0;
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} className={`flex flex-col items-center p-2 rounded-lg min-w-[48px] flex-1 ${isToday ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
                <span className="text-[10px] text-gray-400 uppercase">{d.toLocaleDateString('en',{weekday:'short'})}</span>
                <span className={`text-sm font-semibold ${isToday ? 'text-emerald-700' : 'text-gray-900'}`}>{d.getDate()}</span>
                {hasJobs && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings list */}
      {active.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-3xl mb-2">🧹</p>
          <p className="text-gray-600 font-medium text-sm">{t('client.dashboard.noServices')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('client.dashboard.bookFirst')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(b => {
            const pro = b.professionals?.[0]?.professional;
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{t('services.'+(b.service_type||b.serviceType)) || b.service_type}</p>
                    <p className="text-xs text-gray-500 truncate">📍 {b.address}{b.city?', '+b.city:''}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${
                    b.status==='CONFIRMED'?'text-blue-700 bg-blue-50 border-blue-200':
                    b.status==='IN_PROGRESS'?'text-purple-700 bg-purple-50 border-purple-200':
                    'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>{t('statuses.'+b.status)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {b.scheduled_at && <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{new Date(b.scheduled_at).toLocaleDateString()}</span>}
                  {b.total_amount && <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5 font-medium">${b.total_amount}</span>}
                </div>
                {pro ? (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">{(pro.fullName||'C')[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-emerald-800 truncate">{t('client.dashboard.assignedCleaner')}: {pro.fullName}</p>
                    </div>
                    {pro.phone && <a href={`tel:${pro.phone}`} className="px-2 py-1 bg-emerald-700 text-white rounded-lg text-[10px]">{t('client.dashboard.callCleaner')}</a>}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">⏳ {t('client.dashboard.findingCleaner')}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
