'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n/useTranslation';

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{t('client.dashboard.title')}</h1>
          <Link href="/dashboard/new-booking" className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800">
            + {t('client.dashboard.bookNow')}
          </Link>
        </div>

        {active.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">🧹</p>
            <p className="text-gray-600 font-medium">{t('client.dashboard.noServices')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('client.dashboard.bookFirst')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(b => {
              const pro = b.professionals?.[0]?.professional;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t('services.'+(b.service_type||b.serviceType)) || b.service_type}</p>
                      <p className="text-xs text-gray-500">📍 {b.address}{b.city?', '+b.city:''}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      b.status==='CONFIRMED'?'text-blue-700 bg-blue-50 border-blue-200':
                      b.status==='IN_PROGRESS'?'text-purple-700 bg-purple-50 border-purple-200':
                      'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>{t('statuses.'+b.status)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {b.scheduled_at && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">{t('client.dashboard.serviceDate')}: {new Date(b.scheduled_at).toLocaleDateString()}</span>}
                    {b.total_amount && <span className="text-xs bg-emerald-50 text-emerald-700 rounded-md px-2 py-0.5">{t('client.dashboard.estimatedTotal')}: ${b.total_amount}</span>}
                  </div>
                  {pro ? (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">{(pro.fullName||'C')[0]}</div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-emerald-800">{t('client.dashboard.assignedCleaner')}: {pro.fullName}</p>
                        {pro.avgRating && <p className="text-xs text-emerald-600">⭐ {Number(pro.avgRating).toFixed(1)}</p>}
                      </div>
                      {pro.phone && (
                        <a href={`tel:${pro.phone}`} className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs">{t('client.dashboard.callCleaner')}</a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 mt-2">⏳ {t('client.dashboard.findingCleaner')}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <p className="text-xs text-emerald-600">{t('client.dashboard.upcomingServices')}</p>
          <p className="text-3xl font-bold text-emerald-700">{active.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{t('client.history.totalServices')}</p>
          <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
        </div>
      </div>
    </div>
  );
}
