'use client';
import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

function formatService(raw: string): string {
  const MAP: Record<string,string> = {
    HOUSE_CLEANING:'House Cleaning', DEEP_CLEANING:'Deep Cleaning', MOVE_IN_OUT:'Move In/Out',
    OFFICE_CLEANING:'Office Cleaning', COMMERCIAL_CLEANING:'Commercial', POST_CONSTRUCTION:'Post Construction',
    MEDICAL_CLEANING:'Medical / Clinic', APARTMENT_CLEANING:'Apartment', MAID_SERVICES:'Maid Services',
    SAME_DAY_CLEANING:'Same Day', ONE_TIME:'One-Time', STANDARD_CLEANING:'Standard Cleaning',
  };
  return MAP[raw] || raw?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Service';
}

export default function ClientHistory() {
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
      const all = data.data || data || [];
      setBookings(all.filter((b: any) => b.status === 'COMPLETED'));
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

  const totalSpent = bookings.reduce((s,b) => s + Number(b.totalAmount || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      {/* LEFT: history list */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Service History</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total services</p>
            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total spent</p>
            <p className="text-2xl font-bold text-emerald-700">${totalSpent.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Unrated</p>
            <p className="text-2xl font-bold text-amber-600">{bookings.filter(b => !b.rated).length}</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-600 font-medium">No completed services yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.sort((a,b) => new Date(b.scheduledAt||b.scheduled_at).getTime()-new Date(a.scheduledAt||a.scheduled_at).getTime()).map(b => {
              const pro = b.professionals?.[0]?.professional || b.professionals?.[0];
              const scheduledDate = b.scheduledAt || b.scheduled_at ? new Date(b.scheduledAt || b.scheduled_at) : null;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex">
                    <div className="w-1 flex-shrink-0 bg-emerald-500" />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{formatService(b.serviceType || b.service_type)}</p>
                          <p className="text-xs text-gray-500 truncate">{b.address}{b.city ? ', '+b.city : ''}{b.zip ? ' '+b.zip : ''}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium text-emerald-700 bg-emerald-50 border-emerald-200">Completed</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {scheduledDate && (
                          <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-1">
                            {scheduledDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                          </span>
                        )}
                        {b.sqft && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-1">{b.sqft} sqft</span>}
                        {b.totalAmount && <span className="text-xs bg-emerald-50 text-emerald-700 rounded-md px-2 py-1 font-medium">${b.totalAmount}</span>}
                      </div>

                      {pro && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                            {(pro.fullName||pro.full_name||'C')[0]}
                          </div>
                          <p className="text-xs text-gray-600">{pro.fullName||pro.full_name||'Cleaner'}</p>
                          {(pro.avgRating||pro.avg_rating) && <p className="text-xs text-amber-500">⭐ {Number(pro.avgRating||pro.avg_rating).toFixed(1)}</p>}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {!b.rated ? (
                          <button onClick={() => { setRatingModal(b); setStars(5); setTip(0); }}
                            className="flex-1 py-2 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800">
                            ⭐ Rate & Tip
                          </button>
                        ) : (
                          <div className="flex-1 py-2 text-center text-xs text-emerald-600 font-medium bg-emerald-50 rounded-lg">
                            ⭐ Rated
                          </div>
                        )}
                        <button onClick={() => {
                          const text = `EverClean Invoice\n${formatService(b.serviceType||b.service_type)}\n${b.address}, ${b.city} ${b.zip||''}\nDate: ${scheduledDate?.toLocaleDateString()}\nTotal: $${b.totalAmount}\nID: ${b.id}`;
                          const blob = new Blob([text],{type:'text/plain'});
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                          a.download = `invoice-${b.id?.slice(0,8)}.txt`; a.click();
                        }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                          📄 Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: summary */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <p className="text-xs font-semibold text-emerald-700 mb-1">Service summary</p>
          <p className="text-3xl font-bold text-emerald-700">{bookings.length}</p>
          <p className="text-xs text-emerald-600">completed services</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Support</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>support@everclean.com</p>
            <p>(201) 555-0100</p>
          </div>
        </div>
      </div>

      {/* Rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-1">Rate your service</h3>
            <p className="text-sm text-gray-500 mb-4">{formatService(ratingModal.serviceType||ratingModal.service_type)}</p>
            <div className="flex justify-center gap-3 mb-5">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setStars(s)} className={`text-3xl transition-all hover:scale-110 ${s<=stars?'':'opacity-30'}`}>⭐</button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-2">Add a tip (optional)</p>
            <div className="flex gap-2 mb-5">
              {[0,5,10,15,20].map(t => (
                <button key={t} onClick={() => setTip(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${tip===t ? 'bg-emerald-700 text-white border-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                  {t===0?'None':'$'+t}
                </button>
              ))}
            </div>
            <button onClick={submitRating} className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800">
              Submit{tip>0?` + $${tip} tip`:''}
            </button>
            <button onClick={() => setRatingModal(null)} className="w-full mt-2 text-gray-400 text-sm py-2">Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}
