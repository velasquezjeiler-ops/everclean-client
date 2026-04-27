'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ClientHistory() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [stars, setStars] = useState(5);
  const [tip, setTip] = useState(0);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings', { headers: { Authorization: 'Bearer '+token } });
      const data = await res.json();
      setBookings((data.data||[]).filter((b:any) => b.status === 'COMPLETED'));
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitRating() {
    const token = localStorage.getItem('token') || '';
    await fetch(API+'/bookings/'+ratingModal.id+'/rate', {
      method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' },
      body: JSON.stringify({ rating: stars, tip })
    });
    setRatingModal(null); load();
  }

  const totalSpent = bookings.reduce((s,b) => s + Number(b.total_amount||0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('client.history.title')}</h1>

      <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
        <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[100px] flex-1"><p className="text-xs text-gray-500">{t('client.history.totalServices')}</p><p className="text-xl font-bold text-gray-900">{bookings.length}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[100px] flex-1"><p className="text-xs text-gray-500">{t('client.history.totalSpent')}</p><p className="text-xl font-bold text-emerald-700">${totalSpent.toFixed(0)}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[100px] flex-1"><p className="text-xs text-gray-500">{t('client.history.unrated')}</p><p className="text-xl font-bold text-amber-600">{bookings.filter(b=>!b.rated).length}</p></div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200"><p className="text-3xl mb-2">📋</p><p className="text-gray-600 text-sm">{t('client.history.noCompleted')}</p></div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const pro = b.professionals?.[0]?.professional;
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-sm truncate flex-1">{t('services.'+(b.service_type||b.serviceType))||b.service_type}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium text-emerald-700 bg-emerald-50 border-emerald-200">{t('statuses.COMPLETED')}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mb-1">📍 {b.address}{b.city?', '+b.city:''}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {b.scheduled_at && <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{new Date(b.scheduled_at).toLocaleDateString()}</span>}
                  {b.total_amount && <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5 font-medium">${b.total_amount}</span>}
                </div>
                {pro && <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">{(pro.fullName||'C')[0]}</div><p className="text-xs text-gray-600">{pro.fullName}</p></div>}
                <div className="flex gap-2">
                  {!b.rated ? (
                    <button onClick={()=>{setRatingModal(b);setStars(5);setTip(0);}} className="flex-1 py-2 bg-emerald-700 text-white rounded-lg text-xs font-medium">⭐ {t('client.history.rateAndTip')}</button>
                  ) : (
                    <div className="flex-1 py-2 text-center text-xs text-emerald-600 font-medium bg-emerald-50 rounded-lg">⭐ {t('client.history.rated')}</div>
                  )}
                  <button className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs">📄 {t('client.history.invoice')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal - full screen on mobile */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{t('client.history.rateService')}</h3>
            <div className="flex justify-center gap-3 mb-5">{[1,2,3,4,5].map(s=>(<button key={s} onClick={()=>setStars(s)} className={`text-3xl ${s<=stars?'':'opacity-30'}`}>⭐</button>))}</div>
            <p className="text-sm text-gray-600 mb-2">{t('client.history.addTip')}</p>
            <div className="flex gap-2 mb-5">{[0,5,10,15,20].map(ti=>(<button key={ti} onClick={()=>setTip(ti)} className={`flex-1 py-2 rounded-xl text-sm font-medium border ${tip===ti?'bg-emerald-700 text-white border-emerald-700':'border-gray-200 text-gray-600'}`}>{ti===0?t('client.history.none'):'$'+ti}</button>))}</div>
            <button onClick={submitRating} className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium">{t('client.history.submit')}{tip>0?` + $${tip}`:''}</button>
            <button onClick={()=>setRatingModal(null)} className="w-full mt-2 text-gray-400 text-sm py-2">{t('client.history.skip')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
