'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const SERVICE_TYPES = ['HOUSE_CLEANING','DEEP_CLEANING','MOVE_IN_OUT','OFFICE_CLEANING','COMMERCIAL_CLEANING','POST_CONSTRUCTION','MEDICAL_CLEANING','CARPET_CLEANING','INDUSTRIAL'];
const FREQUENCIES = ['ONE_TIME','WEEKLY','BI_WEEKLY','MONTHLY'];

export default function NewBooking() {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    serviceType: 'HOUSE_CLEANING', frequency: 'ONE_TIME', sqft: 1000,
    address: '', city: '', state: 'NJ', zip: '',
    scheduledAt: '', notes: '',
  });

  const hours = Math.max(2, Math.ceil(form.sqft / 500));
  const rate = 35;
  const total = hours * rate;

  async function submit() {
    setSubmitting(true);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings', {
        method:'POST', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, hours, totalAmount: total, scheduledAt: form.scheduledAt || new Date().toISOString() })
      });
      if (res.ok) router.push('/dashboard');
      else { const e = await res.json(); alert(e.error); }
    } catch(e) { alert('Error'); }
    setSubmitting(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">{t('client.booking.title')}</h1>
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="text-sm font-medium text-gray-700 block mb-2">{t('client.booking.serviceType')}</label>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_TYPES.map(st => (
              <button key={st} onClick={()=>setForm({...form,serviceType:st})}
                className={`p-2 rounded-lg text-xs font-medium border transition-all ${form.serviceType===st?'bg-emerald-50 border-emerald-300 text-emerald-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {t('services.'+st)||st.replace(/_/g,' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="text-sm font-medium text-gray-700 block mb-2">{t('client.booking.frequency')}</label>
          <div className="flex gap-2">
            {FREQUENCIES.map(f => (
              <button key={f} onClick={()=>setForm({...form,frequency:f})}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border ${form.frequency===f?'bg-emerald-50 border-emerald-300 text-emerald-700':'border-gray-200 text-gray-600'}`}>
                {f.replace(/_/g,' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="text-sm font-medium text-gray-700 block mb-2">{t('client.booking.squareFootage')}: {form.sqft} ft²</label>
          <input type="range" min={200} max={10000} step={100} value={form.sqft} onChange={e=>setForm({...form,sqft:Number(e.target.value)})} className="w-full accent-emerald-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>200</span><span>10,000</span></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-xs text-gray-600 block mb-1">{t('common.address')}</label><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="text-xs text-gray-600 block mb-1">{t('common.city')}</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.state')}</label><input value={form.state} onChange={e=>setForm({...form,state:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.zip')}</label><input value={form.zip} onChange={e=>setForm({...form,zip:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-600 block mb-1">{t('client.booking.scheduledDate')}</label><input type="date" value={form.scheduledAt?.split('T')[0]||''} onChange={e=>setForm({...form,scheduledAt:e.target.value+'T09:00:00'})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="text-xs text-gray-600 block mb-1">{t('client.booking.specialInstructions')}</label><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
          <div><p className="text-sm text-emerald-800 font-medium">{hours}h · {form.sqft} ft²</p><p className="text-xs text-emerald-600">{t('services.'+form.serviceType)}</p></div>
          <p className="text-2xl font-bold text-emerald-700">${total}</p>
        </div>
        <button onClick={submit} disabled={submitting||!form.address} className="w-full bg-emerald-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
          {submitting ? t('client.booking.submitting') : t('client.booking.submit')}
        </button>
      </div>
    </div>
  );
}
