'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const SERVICES = [
  { id:'HOUSE_CLEANING', rate:35, unit:'hr', icon:'🏠', min:2 },
  { id:'DEEP_CLEANING', rate:45, unit:'hr', icon:'✨', min:3 },
  { id:'OFFICE_CLEANING', rate:40, unit:'hr', icon:'🏢', min:2 },
  { id:'MOVE_IN_OUT', rate:50, unit:'hr', icon:'📦', min:3 },
  { id:'POST_CONSTRUCTION', rate:55, unit:'hr', icon:'🔨', min:4 },
  { id:'CARPET_CLEANING', rate:45, unit:'hr', icon:'🧹', min:2 },
  { id:'WINDOW_CLEANING', rate:40, unit:'hr', icon:'🪟', min:2 },
  { id:'MEDICAL_CLEANING', rate:50, unit:'hr', icon:'🏥', min:3 },
  { id:'LAUNDRY_PICKUP', rate:2.25, unit:'lb', icon:'👔', min:10, flat:8.99, flatLabel:'Pickup & delivery' },
  { id:'CAR_WASH', rate:0, unit:'fixed', icon:'🚗', min:1, options:[
    {label:'Basic Exterior',price:39.99},
    {label:'Wash + Wax',price:79.99},
    {label:'Interior Detail',price:129.99},
    {label:'Full Detail',price:199.99}
  ]},
  { id:'DRY_CLEANING', rate:12, unit:'item', icon:'👗', min:3 },
  { id:'PRESSURE_WASHING', rate:45, unit:'hr', icon:'💦', min:2 },
  { id:'ORGANIZING', rate:40, unit:'hr', icon:'📋', min:3 },
];

const FREQUENCIES = ['ONE_TIME','WEEKLY','BI_WEEKLY','MONTHLY'];
const FREQ_DISCOUNT: Record<string,number> = { ONE_TIME:0, WEEKLY:15, BI_WEEKLY:10, MONTHLY:5 };

export default function NewBooking() {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState('HOUSE_CLEANING');
  const [frequency, setFrequency] = useState('ONE_TIME');
  const [sqft, setSqft] = useState(1000);
  const [lbs, setLbs] = useState(15);
  const [carOption, setCarOption] = useState(0);
  const [items, setItems] = useState(5);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('NJ');
  const [zip, setZip] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [suvSurcharge, setSuvSurcharge] = useState(false);

  const svc = SERVICES.find(s => s.id === serviceId)!;
  
  let hours = 0, total = 0;
  if (svc.unit === 'hr') {
    hours = Math.max(svc.min, Math.ceil(sqft / 500));
    total = hours * svc.rate;
  } else if (svc.unit === 'lb') {
    total = lbs * svc.rate + (svc.flat || 0);
    hours = 1;
  } else if (svc.unit === 'fixed' && svc.options) {
    total = svc.options[carOption].price + (suvSurcharge ? 25 : 0);
    hours = 1;
  } else if (svc.unit === 'item') {
    total = items * svc.rate;
    hours = 1;
  }
  
  const disc = FREQ_DISCOUNT[frequency] || 0;
  const discountedTotal = total * (1 - disc/100);

  async function submit() {
    setSubmitting(true);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings', {
        method:'POST', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body: JSON.stringify({ serviceType:serviceId, frequency, sqft, address, city, state, zip, hours, totalAmount:discountedTotal.toFixed(2), scheduledAt:scheduledAt||new Date().toISOString(), notes })
      });
      if (res.ok) router.push('/dashboard');
      else { const e = await res.json(); alert(e.error); }
    } catch(e) { alert('Error'); }
    setSubmitting(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">{t('client.booking.title')}</h1>

      {/* Step 1: Service selection */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('client.booking.serviceType')}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SERVICES.map(s => (
              <button key={s.id} onClick={() => { setServiceId(s.id); setStep(2); }}
                className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${serviceId===s.id?'border-blue-500 bg-blue-50 shadow-md':'border-gray-100 bg-white hover:border-gray-200'}`}>
                <span className="text-2xl">{s.icon}</span>
                <p className="font-semibold text-gray-900 text-sm mt-2">{t('services.'+s.id)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.unit === 'hr' ? `$${s.rate}/hr` : s.unit === 'lb' ? `$${s.rate}/lb` : s.unit === 'item' ? `$${s.rate}/item` : `From $${s.options?.[0].price}`}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-5">
          <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">← {t('common.back')}</button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{svc.icon}</span>
              <div><p className="font-bold text-gray-900">{t('services.'+serviceId)}</p><p className="text-xs text-gray-500">{svc.unit === 'hr' ? `$${svc.rate}/hr · min ${svc.min}h` : svc.unit === 'lb' ? `$${svc.rate}/lb + $${svc.flat} delivery` : svc.unit === 'item' ? `$${svc.rate}/item` : 'Select option below'}</p></div>
            </div>

            {svc.unit === 'hr' && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">{t('client.booking.squareFootage')}: {sqft} ft²</label>
                <input type="range" min={200} max={10000} step={100} value={sqft} onChange={e=>setSqft(Number(e.target.value))} className="w-full accent-blue-600" />
                <div className="flex justify-between text-[10px] text-gray-400"><span>200</span><span>10,000</span></div>
              </div>
            )}

            {svc.unit === 'lb' && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Weight: {lbs} lbs</label>
                <input type="range" min={10} max={60} step={1} value={lbs} onChange={e=>setLbs(Number(e.target.value))} className="w-full accent-blue-600" />
                <p className="text-xs text-gray-400 mt-1">Min 10 lbs · Pickup & delivery: ${svc.flat}</p>
              </div>
            )}

            {svc.unit === 'fixed' && svc.options && (
              <div className="space-y-2">
                {svc.options.map((opt,i) => (
                  <button key={i} onClick={() => setCarOption(i)}
                    className={`w-full p-3 rounded-xl border-2 text-left flex justify-between items-center ${carOption===i?'border-blue-500 bg-blue-50':'border-gray-100'}`}>
                    <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                    <span className="text-sm font-bold text-blue-600">${opt.price}</span>
                  </button>
                ))}
                <label className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <input type="checkbox" checked={suvSurcharge} onChange={e=>setSuvSurcharge(e.target.checked)} className="rounded accent-blue-600" />
                  SUV/Truck (+$25)
                </label>
              </div>
            )}

            {svc.unit === 'item' && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Items: {items}</label>
                <input type="range" min={3} max={30} step={1} value={items} onChange={e=>setItems(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
            )}
          </div>

          {/* Frequency */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-600 mb-3">{t('client.booking.frequency')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FREQUENCIES.map(f => (
                <button key={f} onClick={()=>setFrequency(f)}
                  className={`py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${frequency===f?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-100 text-gray-600'}`}>
                  {f.replace(/_/g,' ')}
                  {FREQ_DISCOUNT[f] > 0 && <span className="block text-[10px] text-green-600 mt-0.5">-{FREQ_DISCOUNT[f]}%</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div><label className="text-xs font-medium text-gray-600 block mb-1">{t('common.address')}</label><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="123 Main St" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs font-medium text-gray-600 block mb-1">{t('common.city')}</label><input value={city} onChange={e=>setCity(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1">{t('common.state')}</label><input value={state} onChange={e=>setState(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1">{t('common.zip')}</label><input value={zip} onChange={e=>setZip(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-medium text-gray-600 block mb-1">{t('client.booking.scheduledDate')}</label><input type="date" value={scheduledAt?.split('T')[0]||''} onChange={e=>setScheduledAt(e.target.value+'T09:00:00')} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1">{t('client.booking.specialInstructions')}</label><input value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          {/* Total */}
          <div className="rounded-2xl p-5 text-white shadow-lg" style={{background:'linear-gradient(135deg, #166534 0%, #22c55e 100%)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{t('services.'+serviceId)}</p>
                <p className="text-white/60 text-xs mt-0.5">
                  {svc.unit === 'hr' ? `${hours}h · ${sqft} ft²` : svc.unit === 'lb' ? `${lbs} lbs + delivery` : svc.unit === 'item' ? `${items} items` : svc.options?.[carOption].label}
                  {disc > 0 ? ` · ${disc}% off` : ''}
                </p>
              </div>
              <div className="text-right">
                {disc > 0 && <p className="text-white/50 text-sm line-through">${total.toFixed(2)}</p>}
                <p className="text-3xl font-bold">${discountedTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <button onClick={submit} disabled={submitting||!address}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-lg transition-all hover:shadow-xl"
            style={{background:'linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%)'}}>
            {submitting ? t('client.booking.submitting') : t('client.booking.submit')}
          </button>
        </div>
      )}
    </div>
  );
}
