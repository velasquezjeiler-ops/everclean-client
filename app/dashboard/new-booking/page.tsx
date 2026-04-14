  'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

// ─── Architectural sqft standards (NAHB / Census Bureau averages) ─────────────
// Residential: base unit ~150sqft/bed, ~60sqft/bath, +200 common areas
const RESIDENTIAL_SQFT: Record<string, number> = {
  '1b1ba': 650,  '1b2ba': 750,
  '2b1ba': 950,  '2b2ba': 1100, '2b3ba': 1250,
  '3b1ba': 1200, '3b2ba': 1400, '3b2.5ba': 1550, '3b3ba': 1700,
  '4b2ba': 1800, '4b3ba': 2100, '4b4ba': 2400,
  '5b3ba': 2600, '5b4ba': 3000, '5b5ba': 3400,
};

function getStandardSqft(beds: number, baths: number): number {
  const key = `${beds}b${baths}ba`;
  if (RESIDENTIAL_SQFT[key]) return RESIDENTIAL_SQFT[key];
  // fallback formula: 150*beds + 80*baths + 250 common areas
  return Math.round(150 * beds + 80 * baths + 250);
}

// ─── Rates ────────────────────────────────────────────────────────────────────
const RATES: Record<string, { sqftRate: number; minCharge: number; label: string; icon: string; type: 'residential' | 'commercial' | 'specialized' }> = {
  HOUSE_CLEANING:     { sqftRate: 0.15, minCharge: 120, label: 'House Cleaning',      icon: '🏠', type: 'residential'  },
  DEEP_CLEANING:      { sqftRate: 0.20, minCharge: 150, label: 'Deep Cleaning',        icon: '✨', type: 'residential'  },
  MOVE_IN_OUT:        { sqftRate: 0.28, minCharge: 200, label: 'Move In / Out',        icon: '📦', type: 'residential'  },
  APARTMENT_CLEANING: { sqftRate: 0.15, minCharge: 120, label: 'Apartment Cleaning',   icon: '🏢', type: 'residential'  },
  MAID_SERVICES:      { sqftRate: 0.15, minCharge: 120, label: 'Maid Services',        icon: '🧹', type: 'residential'  },
  SAME_DAY_CLEANING:  { sqftRate: 0.18, minCharge: 130, label: 'Same Day',            icon: '⚡', type: 'residential'  },
  OFFICE_CLEANING:    { sqftRate: 0.14, minCharge: 150, label: 'Office Cleaning',      icon: '💼', type: 'commercial'   },
  COMMERCIAL_CLEANING:{ sqftRate: 0.14, minCharge: 150, label: 'Commercial',           icon: '🏪', type: 'commercial'   },
  POST_CONSTRUCTION:  { sqftRate: 0.22, minCharge: 180, label: 'Post Construction',    icon: '🔨', type: 'commercial'   },
  MEDICAL_CLEANING:   { sqftRate: 0.32, minCharge: 250, label: 'Medical / Clinic',     icon: '🏥', type: 'specialized'  },
};

const FREQ_DISCOUNTS: Record<string, { label: string; discount: number }> = {
  ONE_TIME:  { label: 'One time',      discount: 0    },
  WEEKLY:    { label: 'Weekly',        discount: 0.10 },
  BIWEEKLY:  { label: 'Every 2 weeks', discount: 0.08 },
  MONTHLY:   { label: 'Monthly',       discount: 0.05 },
};

const ADDONS = [
  { id: 'oven',     label: 'Oven cleaning',    price: 35, icon: '🔥' },
  { id: 'fridge',   label: 'Fridge cleaning',  price: 35, icon: '🧊' },
  { id: 'windows',  label: 'Interior windows', price: 40, icon: '🪟' },
  { id: 'cabinets', label: 'Inside cabinets',  price: 45, icon: '🗄️' },
  { id: 'laundry',  label: 'Wash & fold',      price: 25, icon: '👕' },
  { id: 'ironing',  label: 'Ironing',          price: 30, icon: '👔' },
];

// Commercial bathroom surcharge
function bathroomSurcharge(toilets: number, urinals: number): number {
  // Base: 1 toilet = $0, each additional = $15, each urinal = $12
  const extra = Math.max(0, toilets - 1) * 15 + urinals * 12;
  return extra;
}

function calcPrice(
  serviceType: string, sqft: number, frequency: string,
  addons: string[], hasPets: boolean,
  toilets: number, urinals: number
) {
  const rate = RATES[serviceType];
  if (!rate || !sqft) return { base: 0, discount: 0, addonsTotal: 0, petFee: 0, bathroomFee: 0, total: 0, hours: 0 };
  const hours = Math.max(2, Math.ceil(sqft / 400));
  const base = Math.max(rate.minCharge, sqft * rate.sqftRate);
  const discountPct = FREQ_DISCOUNTS[frequency]?.discount || 0;
  const discountAmt = Math.round(base * discountPct);
  const addonsTotal = ADDONS.filter(a => addons.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const petFee = hasPets ? 20 : 0;
  const bathFee = rate.type !== 'residential' ? bathroomSurcharge(toilets, urinals) : 0;
  const total = Math.round(base - discountAmt + addonsTotal + petFee + bathFee);
  return { base: Math.round(base), discount: discountAmt, addonsTotal, petFee, bathroomFee: bathFee, total, hours };
}

// ─── Components ───────────────────────────────────────────────────────────────
function Steps({ step }: { step: number }) {
  const labels = ['Service', 'Details', 'Address'];
  return (
    <div className="flex items-center gap-2 mb-6">
      {labels.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step > i + 1 ? 'bg-emerald-600 text-white' : step === i + 1 ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
            {step > i + 1 ? '✓' : i + 1}
          </div>
          <span className={`text-xs ${step === i + 1 ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>{l}</span>
          {i < 2 && <div className={`h-0.5 w-8 rounded ${step > i + 1 ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function PriceBar({ price, serviceType, frequency }: { price: ReturnType<typeof calcPrice>; serviceType: string; frequency: string }) {
  if (!price.total) return null;
  const disc = FREQ_DISCOUNTS[frequency];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{RATES[serviceType]?.label} · {price.hours}h est.</p>
          {disc.discount > 0 && <p className="text-xs text-emerald-600">🎉 {Math.round(disc.discount * 100)}% recurring savings</p>}
        </div>
        <div className="text-right">
          {price.discount > 0 && <p className="text-xs text-gray-400 line-through">${price.base + price.addonsTotal + price.petFee + price.bathroomFee}</p>}
          <p className="text-xl font-bold text-emerald-700">${price.total}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [serviceType, setServiceType] = useState('');
  const [frequency, setFrequency] = useState('ONE_TIME');
  const [sqft, setSqft] = useState('');
  const [sqftSource, setSqftSource] = useState<'auto' | 'manual'>('auto');
  const [scheduledAt, setScheduledAt] = useState('');
  const [addons, setAddons] = useState<string[]>([]);
  const [hasPets, setHasPets] = useState(false);
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('NJ');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  // Commercial sanitary units
  const [toilets, setToilets] = useState(1);
  const [urinals, setUrinals] = useState(0);
  const [commercialSqft, setCommercialSqft] = useState('');

  const isResidential = RATES[serviceType]?.type === 'residential';
  const isCommercial = RATES[serviceType]?.type === 'commercial' || RATES[serviceType]?.type === 'specialized';

  // Auto-calculate sqft from bedrooms/bathrooms
  useEffect(() => {
    if (isResidential && bedrooms > 0 && bathrooms > 0 && sqftSource === 'auto') {
      const standard = getStandardSqft(bedrooms, bathrooms);
      setSqft(String(standard));
    }
  }, [bedrooms, bathrooms, isResidential, sqftSource]);

  // If user manually edits sqft below the standard, snap back
  function handleSqftChange(val: string) {
    setSqftSource('manual');
    if (isResidential && bedrooms > 0 && bathrooms > 0) {
      const standard = getStandardSqft(bedrooms, bathrooms);
      const entered = Number(val);
      if (entered < standard) {
        setSqft(String(standard));
        return;
      }
    }
    setSqft(val);
  }

  const activeSqft = isCommercial ? commercialSqft : sqft;
  const price = calcPrice(serviceType, Number(activeSqft), frequency, addons, hasPets, toilets, urinals);

  function toggleAddon(id: string) {
    setAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || '';
      const meRes = await fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } });
      const me = await meRes.json().catch(() => ({}));
      let companyId = me.companyId;
      if (!companyId) {
        const r = await fetch(API + '/companies/me', { headers: { Authorization: 'Bearer ' + token } });
        if (r.ok) { const c = await r.json(); companyId = c.id; }
      }
      if (!companyId) {
        const r = await fetch(API + '/companies', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: me.email || 'Client', city, state })
        });
        if (r.ok) { const c = await r.json(); companyId = c.id; }
      }
      if (!companyId) { setError('Could not find your account.'); setLoading(false); return; }

      const clientNotes = [
        notes,
        isResidential && bedrooms ? `Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms}` : '',
        isCommercial ? `Toilets: ${toilets}, Urinals: ${urinals}` : '',
        addons.length ? 'Add-ons: ' + addons.join(', ') : '',
        hasPets ? 'Pets at home' : '',
      ].filter(Boolean).join(' | ');

      const res = await fetch(API + '/bookings', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId, serviceType, frequency,
          scheduledAt: new Date(scheduledAt).toISOString(),
          address, city, state,
          sqft: Number(activeSqft),
          clientNotes,
          totalAmount: price.total,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create booking');
      router.push('/dashboard?success=1');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
        className="text-sm text-gray-500 mb-4 hover:text-gray-700">← Back</button>
      <Steps step={step} />
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">What do you need cleaned?</h1>
            <p className="text-sm text-gray-500 mb-5">Transparent pricing. No contracts. Cancel anytime.</p>

            {(['residential', 'commercial', 'specialized'] as const).map(type => {
              const entries = Object.entries(RATES).filter(([,v]) => v.type === type);
              const labels: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', specialized: 'Specialized' };
              return (
                <div key={type} className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{labels[type]}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {entries.map(([key, val]) => (
                      <button key={key} type="button" onClick={() => { setServiceType(key); setStep(2); }}
                        className={`p-3 rounded-xl border text-left transition-all ${serviceType === key ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
                        <div className="text-xl mb-1">{val.icon}</div>
                        <div className="text-xs font-semibold text-gray-900">{val.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {key === 'MAID_SERVICES' ? 'Per visit · recurring' : `$${val.sqftRate}/sqft`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Details & pricing</h1>
              <p className="text-sm text-gray-500 mt-0.5">{RATES[serviceType]?.label}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">How often?</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(FREQ_DISCOUNTS).map(([key, val]) => (
                  <button key={key} type="button" onClick={() => setFrequency(key)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${frequency === key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {val.label}
                    {val.discount > 0 && <span className="ml-1 text-xs text-emerald-600">-{Math.round(val.discount * 100)}%</span>}
                  </button>
                ))}
              </div>
            </div>
            {isResidential && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Bedrooms & Bathrooms</label>
                  <p className="text-xs text-gray-400 mb-3">Square footage is estimated automatically using architectural standards (NAHB)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Bedrooms</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {[1,2,3,4,5,6].map(n => (
                          <button key={n} type="button" onClick={() => { setBedrooms(n); setSqftSource('auto'); }}
                            className={`w-9 h-9 rounded-lg border text-sm font-medium transition-all ${bedrooms === n ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>{n}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Bathrooms</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {[1,1.5,2,2.5,3,4].map(n => (
                          <button key={n} type="button" onClick={() => { setBathrooms(n); setSqftSource('auto'); }}
                            className={`w-10 h-9 rounded-lg border text-xs font-medium transition-all ${bathrooms === n ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {bedrooms > 0 && bathrooms > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-700 font-medium">Standard size for {bedrooms}bd/{bathrooms}ba</p>
                      <p className="text-xs text-emerald-600">Based on architectural industry standards</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-700">{getStandardSqft(bedrooms, bathrooms)} sqft</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Actual sqft
                    {sqftSource === 'auto' && bedrooms > 0 && <span className="ml-2 text-xs text-amber-600">⚠ Auto-corrected — can only increase</span>}
                  </label>
                  <input type="number" value={sqft} onChange={e => handleSqftChange(e.target.value)}
                    placeholder="Auto-calculated above"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            )}
            {isCommercial && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Space size</label>
                  <input type="number" value={commercialSqft} onChange={e => setCommercialSqft(e.target.value)}
                    placeholder="Total cleanable sqft"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Sanitary units</p>
                  <p className="text-xs text-gray-400 mb-3">Each additional toilet +$15, each urinal +$12</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Toilets / stalls</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setToilets(t => Math.max(1, t - 1))}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">−</button>
                        <span className="w-8 text-center font-semibold text-gray-900">{toilets}</span>
                        <button type="button" onClick={() => setToilets(t => t + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">+</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Urinals</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setUrinals(u => Math.max(0, u - 1))}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">−</button>
                        <span className="w-8 text-center font-semibold text-gray-900">{urinals}</span>
                        <button type="button" onClick={() => setUrinals(u => u + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">+</button>
                      </div>
                    </div>
                  </div>
                  {(toilets > 1 || urinals > 0) && (
                    <div className="mt-3 bg-amber-50 rounded-lg p-2 text-xs text-amber-700">
                      Sanitary surcharge: +${bathroomSurcharge(toilets, urinals)}
                      {' '}({toilets > 1 ? `${toilets - 1} extra toilet${toilets > 2 ? 's' : ''}` : ''}
                      {urinals > 0 ? `${toilets > 1 ? ', ' : ''}${urinals} urinal${urinals > 1 ? 's' : ''}` : ''})
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="text-sm text-gray-600 block mb-1">Preferred date & time</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              <p className="text-xs text-gray-400 mt-1">Professional confirms exact time within ±2h window</p>
            </div>
            {Number(activeSqft) > 0 && (
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-3 uppercase tracking-wide">Your quote</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-emerald-700">
                    <span>{activeSqft} sqft × ${RATES[serviceType]?.sqftRate}/sqft</span>
                    <span>${Math.round(Number(activeSqft) * RATES[serviceType]?.sqftRate)}</span>
                  </div>
                  {price.base > Math.round(Number(activeSqft) * RATES[serviceType]?.sqftRate) && (
                    <div className="flex justify-between text-amber-600 text-xs">
                      <span>Minimum visit charge applied</span>
                      <span>${price.base}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Estimated hours</span>
                    <span>{price.hours}h</span>
                  </div>
                  {price.bathroomFee > 0 && (
                    <div className="flex justify-between text-amber-600 text-xs">
                      <span>Sanitary units surcharge</span>
                      <span>+${price.bathroomFee}</span>
                    </div>
                  )}
                  {price.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 text-xs">
                      <span>Recurring discount ({Math.round((FREQ_DISCOUNTS[frequency]?.discount || 0) * 100)}%)</span>
                      <span>-${price.discount}</span>
                    </div>
                  )}
                  {price.addonsTotal > 0 && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Add-ons</span>
                      <span>+${price.addonsTotal}</span>
                    </div>
                  )}
                  {price.petFee > 0 && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Pet-safe products</span>
                      <span>+${price.petFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-emerald-800 text-base pt-2 border-t border-emerald-200">
                    <span>Total</span>
                    <span>${price.total}</span>
                  </div>
                </div>
              </div>
            )}
            {isResidential && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h2 className="text-sm font-medium text-gray-700 mb-1">Add-on services</h2>
                  <p className="text-xs text-gray-400 mb-3">Optional extras · priced transparently</p>
                  <div className="space-y-2">
                    {ADDONS.map(addon => (
                      <label key={addon.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${addons.includes(addon.id) ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={addons.includes(addon.id)} onChange={() => toggleAddon(addon.id)} className="w-4 h-4 accent-emerald-600" />
                          <span className="text-lg">{addon.icon}</span>
                          <span className="text-sm text-gray-700">{addon.label}</span>
                        </div>
                        <span className="text-sm font-medium text-emerald-700">+${addon.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-medium text-gray-700">Pets at home?</h2>
                      <p className="text-xs text-gray-400">Pet-safe products · +$20</p>
                    </div>
                    <button type="button" onClick={() => setHasPets(!hasPets)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${hasPets ? 'bg-emerald-50 text-emerald-700 border-emerald-400' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {hasPets ? '🐾 Yes' : 'No pets'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-sm text-gray-600 block mb-1">Special instructions (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Access code, areas to focus on, allergies..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-16 resize-none" />
            </div>

            <button type="button"
              onClick={() => setStep(3)}
              disabled={!scheduledAt || (!sqft && !commercialSqft)}
              className="w-full bg-emerald-700 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-all">
              Continue to address →
            </button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-gray-900">Service address</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Street address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Newark"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">State</label>
                  <select value={state} onChange={e => setState(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {['NJ','NY','CT','PA','FL','TX','CA'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-3 uppercase tracking-wide">Booking summary</p>
              <div className="space-y-1 text-sm text-emerald-700">
                <div className="flex justify-between"><span>Service</span><span className="font-medium">{RATES[serviceType]?.label}</span></div>
                <div className="flex justify-between"><span>Frequency</span><span>{FREQ_DISCOUNTS[frequency]?.label}</span></div>
                <div className="flex justify-between"><span>Size</span><span>{activeSqft} sqft · {price.hours}h</span></div>
                {isResidential && bedrooms > 0 && <div className="flex justify-between"><span>Layout</span><span>{bedrooms}bd / {bathrooms}ba</span></div>}
                {isCommercial && <div className="flex justify-between"><span>Sanitary units</span><span>{toilets} toilet{toilets > 1 ? 's' : ''}{urinals > 0 ? ` · ${urinals} urinal${urinals > 1 ? 's' : ''}` : ''}</span></div>}
                {addons.length > 0 && <div className="flex justify-between"><span>Add-ons</span><span>{addons.length} selected</span></div>}
                <div className="flex justify-between font-bold text-emerald-800 text-base pt-2 border-t border-emerald-200">
                  <span>Total</span><span>${price.total}</span>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-3">{error}</p>}

            <button type="submit" disabled={loading || !address || !city}
              className="w-full bg-emerald-700 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-all">
              {loading ? 'Booking...' : `Request service · $${price.total}`}
            </button>
            <p className="text-center text-xs text-gray-400">Cancel free up to 24h before. No hidden fees.</p>
          </div>
        )}
      </form>

      {step >= 2 && <PriceBar price={price} serviceType={serviceType} frequency={frequency} />}
    </div>
  );
}
