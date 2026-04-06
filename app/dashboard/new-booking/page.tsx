'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const serviceTypes = [
  { value: 'HOUSE_CLEANING', label: 'House cleaning', icon: '🏠', desc: 'Regular home cleaning' },
  { value: 'DEEP_CLEANING', label: 'Deep cleaning', icon: '✨', desc: 'Thorough top-to-bottom clean' },
  { value: 'MAID_SERVICES', label: 'Maid services', icon: '🧹', desc: 'Recurring maid service' },
  { value: 'ROOM_CLEANING', label: 'Room cleaning', icon: '🛏', desc: 'Single room deep clean' },
  { value: 'ONE_TIME_CLEANING', label: 'One-time cleaning', icon: '📅', desc: 'No commitment needed' },
  { value: 'SAME_DAY_CLEANING', label: 'Same day cleaning', icon: '⚡', desc: 'Available today' },
  { value: 'MOVE_IN_OUT', label: 'Move out/in cleaning', icon: '📦', desc: 'Before or after moving' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping', icon: '🏡', desc: 'Ongoing home management' },
  { value: 'APARTMENT_CLEANING', label: 'Apartment cleaning', icon: '🏢', desc: 'Studio to penthouse' },
  { value: 'OFFICE_CLEANING', label: 'Office cleaning', icon: '💼', desc: 'Commercial workspaces' },
  { value: 'COMMERCIAL_CLEANING', label: 'Commercial cleaning', icon: '🏪', desc: 'Retail & commercial' },
  { value: 'POST_CONSTRUCTION', label: 'Post construction', icon: '🔨', desc: 'After renovation cleanup' },
];

const frequencies = [
  { value: 'ONE_TIME', label: 'One time' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    serviceType: '',
    frequency: 'ONE_TIME',
    scheduledAt: '',
    address: '',
    city: '',
    state: 'NJ',
    sqft: '',
    notes: '',
  });

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || '';
      
      const meRes = await fetch(API + '/auth/me', {
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
      });
      const meText = await meRes.text();
      let me: any = {};
      try { me = JSON.parse(meText); } catch(e) {}

      let companyId = me.companyId;
      if (!companyId) {
        const compRes = await fetch(API + '/companies', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: me.email || 'My Home', city: form.city, state: form.state })
        });
        const compText = await compRes.text();
        try { const comp = JSON.parse(compText); companyId = comp.id; } catch(e) {}
      }

      if (!companyId) {
        setError('Could not find your account. Please contact support.');
        setLoading(false);
        return;
      }

      const bookRes = await fetch(API + '/bookings', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          serviceType: form.serviceType,
          frequency: form.frequency,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          address: form.address,
          city: form.city,
          state: form.state,
          sqft: Number(form.sqft),
          clientNotes: form.notes,
        })
      });
      const bookText = await bookRes.text();
      let book: any = {};
      try { book = JSON.parse(bookText); } catch(e) {}
      
      if (!bookRes.ok) throw new Error(book.error || 'Could not create booking');
      router.push('/dashboard?success=1');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => step > 1 ? setStep(step-1) : router.back()} className="text-sm text-gray-500 mb-4 hover:text-gray-700">← Back</button>
      
      <div className="flex items-center gap-2 mb-6">
        {[1,2,3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium " + (step >= s ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-400')}>{s}</div>
            {s < 3 && <div className={"h-0.5 w-12 " + (step > s ? 'bg-emerald-700' : 'bg-gray-200')}></div>}
          </div>
        ))}
        <span className="text-sm text-gray-500 ml-2">{step === 1 ? 'Service type' : step === 2 ? 'Details' : 'Address'}</span>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div>
            <h1 className="text-xl font-medium text-gray-900 mb-2">What do you need cleaned?</h1>
            <p className="text-sm text-gray-500 mb-6">No contracts. No surprises. Cancel anytime.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {serviceTypes.map(s => (
                <button key={s.value} type="button" onClick={() => { update('serviceType', s.value); setStep(2); }}
                  className={"p-4 rounded-xl border text-left transition-all " + (form.serviceType === s.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50')}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-xl font-medium text-gray-900 mb-6">Service details</h1>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-4">
              <div>
                <label className="text-sm text-gray-600 block mb-2">How often?</label>
                <div className="grid grid-cols-2 gap-3">
                  {frequencies.map(f => (
                    <button key={f.value} type="button" onClick={() => update('frequency', f.value)}
                      className={"py-2.5 rounded-lg border text-sm font-medium " + (form.frequency === f.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Square feet (sqft)</label>
                  <input type="number" value={form.sqft} onChange={e => update('sqft', e.target.value)} placeholder="e.g. 1200" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Date & time</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e => update('scheduledAt', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Special notes (optional)</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Pets, access instructions, areas to focus on..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none" />
              </div>
            </div>
            <button type="button" onClick={() => setStep(3)} disabled={!form.sqft || !form.scheduledAt}
              className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-xl font-medium text-gray-900 mb-6">Service address</h1>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Street address</label>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main St" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">City</label>
                  <input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Newark" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">State</label>
                  <select value={form.state} onChange={e => update('state', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="NJ">New Jersey</option>
                    <option value="NY">New York</option>
                    <option value="CT">Connecticut</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="FL">Florida</option>
                    <option value="TX">Texas</option>
                    <option value="CA">California</option>
                  </select>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-emerald-700 font-medium mb-1">Your booking summary</p>
                <p className="text-xs text-emerald-600">{serviceTypes.find(s => s.value === form.serviceType)?.label} · {frequencies.find(f => f.value === form.frequency)?.label} · {form.sqft} sqft</p>
                <p className="text-xs text-emerald-600">{form.scheduledAt ? new Date(form.scheduledAt).toLocaleString() : ''}</p>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button type="submit" disabled={loading || !form.address || !form.city}
              className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
              {loading ? 'Booking...' : 'Request service — No contract required'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">Cancel anytime. No membership fees. No hidden charges.</p>
          </div>
        )}
      </form>
    </div>
  );
}