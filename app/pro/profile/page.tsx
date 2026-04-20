'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ProProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:'ok'|'err'; text:string} | null>(null);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('NJ');
  const [zipCode, setZipCode] = useState('');
  const [serviceRadius, setServiceRadius] = useState('25');
  const [hourlyRate, setHourlyRate] = useState('25');
  const [newRate, setNewRate] = useState('');
  const [editingRate, setEditingRate] = useState(false);
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    if (!token) { router.push('/'); return; }
    try {
      const res = await fetch(API+'/professionals/me', { headers:{ Authorization:'Bearer '+token } });
      if (!res.ok) throw new Error('Could not load profile');
      const d = await res.json();
      setProfile(d);
      setFullName(d.fullName||d.full_name||'');
      setPhone(d.phone||'');
      setEmail(d.email||'');
      setBio(d.bio||'');
      setAddress(d.address||'');
      setCity(d.city||'');
      setState(d.state||'NJ');
      setZipCode(d.zipCode||d.zip_code||'');
      setServiceRadius(String(d.serviceRadiusMiles||d.service_radius_miles||25));
      setHourlyRate(String(d.hourlyRate||d.hourly_rate||25));
      setLanguages(d.language||['English']);
      setServicesOffered(d.servicesOffered||d.services_offered||[]);
    } catch(e:any) { setMsg({type:'err', text:e.message}); }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    setSaving(true); setMsg(null);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/professionals/me', {
        method: 'PATCH',
        headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json' },
        body: JSON.stringify({
          fullName, phone, email, bio, address, city, state,
          zipCode, serviceRadiusMiles: Number(serviceRadius),
          language: languages, servicesOffered,
        })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error||'Save failed'); }
      setMsg({type:'ok', text:'✅ Profile saved'});
      await load();
    } catch(e:any) { setMsg({type:'err', text:e.message}); }
    setSaving(false);
  }

  async function saveRate() {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 18 || rate > 30) {
      setMsg({type:'err', text:'Rate must be between $18 and $30/h'});
      return;
    }
    setSaving(true); setMsg(null);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/professionals/me', {
        method: 'PATCH',
        headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json' },
        body: JSON.stringify({ hourlyRate: rate })
      });
      if (!res.ok) throw new Error('Rate update failed');
      setHourlyRate(String(rate));
      setEditingRate(false);
      setMsg({type:'ok', text:'✅ Rate updated. Applies to new jobs only — not retroactive.'});
    } catch(e:any) { setMsg({type:'err', text:e.message}); }
    setSaving(false);
  }

  const SERVICE_OPTIONS = [
    'HOUSE_CLEANING','DEEP_CLEANING','MOVE_IN_OUT','OFFICE_CLEANING',
    'COMMERCIAL_CLEANING','POST_CONSTRUCTION','MEDICAL_CLEANING','SAME_DAY_CLEANING'
  ];
  const LANG_OPTIONS = ['English','Spanish','Portuguese','French','Haitian Creole'];

  function toggleService(s: string) {
    setServicesOffered(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s]);
  }
  function toggleLanguage(l: string) {
    setLanguages(prev => prev.includes(l) ? prev.filter(x=>x!==l) : [...prev, l]);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const rating = parseFloat(profile?.avgRating||profile?.avg_rating||0);
  const totalServices = profile?.totalServices||profile?.total_services||0;
  const totalEarnings = parseFloat(profile?.totalEarnings||profile?.total_earnings||0);
  const tipsReceived = parseFloat(profile?.tipsReceived||profile?.tips_received||0);
  const completionRate = parseFloat(profile?.completionRate||profile?.completion_rate||100);

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      {/* ── LEFT: editable form ── */}
      <div className="flex-1 min-w-0 space-y-4">

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
          <button onClick={saveProfile} disabled={saving}
            className="bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        {msg && (
          <div className={`rounded-lg px-4 py-3 text-sm ${msg.type==='ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Personal info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-600 block mb-1">Full name</label>
              <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Phone</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600 block mb-1">Bio</label>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3}
                placeholder="Tell clients about your experience and expertise..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Address & Service Area</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-600 block mb-1">Street address</label>
              <input type="text" value={address} onChange={e=>setAddress(e.target.value)}
                placeholder="123 Main St"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">City</label>
              <input type="text" value={city} onChange={e=>setCity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">State</label>
                <select value={state} onChange={e=>setState(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {['NJ','NY','CT','PA'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">ZIP</label>
                <input type="text" value={zipCode} onChange={e=>setZipCode(e.target.value)}
                  placeholder="07030" maxLength={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600 block mb-1">Service radius (miles): {serviceRadius}</label>
              <input type="range" value={serviceRadius} onChange={e=>setServiceRadius(e.target.value)}
                min="5" max="50" className="w-full" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5 mi</span><span>25 mi</span><span>50 mi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services & languages */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Services I Offer</h2>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {SERVICE_OPTIONS.map(s => (
              <button key={s} onClick={()=>toggleService(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${servicesOffered.includes(s) ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-700' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {s.replace(/_/g,' ')}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-3">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {LANG_OPTIONS.map(l => (
              <button key={l} onClick={()=>toggleLanguage(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${languages.includes(l) ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Hourly rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Hourly Rate</h2>
          {editingRate ? (
            <div>
              <p className="text-xs text-gray-500 mb-2">New rate ($18–$30/h)</p>
              <div className="flex gap-2">
                <input type="number" value={newRate} onChange={e=>setNewRate(e.target.value)}
                  min="18" max="30" step="0.5" placeholder={hourlyRate}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={saveRate} disabled={saving}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={()=>setEditingRate(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500">Cancel</button>
              </div>
              <p className="text-xs text-amber-600 mt-2">⚠️ Not retroactive — applies to new jobs only</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-700">${hourlyRate}<span className="text-sm text-gray-500">/h</span></p>
                <p className="text-xs text-gray-500 mt-1">Active rate for new bookings</p>
              </div>
              <button onClick={()=>{setEditingRate(true); setNewRate(hourlyRate);}}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                ✏️ Change rate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: stats + status ── */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Avatar & rating */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-700 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
            {(fullName||'P')[0]}
          </div>
          <p className="font-semibold text-gray-900">{fullName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{email || phone || ''}</p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm">
            <span className="text-amber-500">⭐</span>
            <span className="font-semibold">{rating ? rating.toFixed(1) : '—'}</span>
            <span className="text-gray-400 text-xs">({totalServices} services)</span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Performance</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-600">Total earnings</span><span className="font-semibold text-emerald-700">${totalEarnings.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Tips received</span><span className="font-semibold text-gray-900">${tipsReceived.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Services done</span><span className="font-semibold text-gray-900">{totalServices}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Completion rate</span><span className="font-semibold text-gray-900">{completionRate.toFixed(0)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Service radius</span><span className="font-semibold text-gray-900">{serviceRadius} mi</span></div>
          </div>
        </div>

        {/* Verification status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Verifications</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Background check</span>
              <span className={profile?.backgroundChecked||profile?.background_checked ? 'text-emerald-600' : 'text-amber-600'}>
                {profile?.backgroundChecked||profile?.background_checked ? '✓ Verified' : '⏳ Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ID verified</span>
              <span className={profile?.idVerified||profile?.id_verified ? 'text-emerald-600' : 'text-amber-600'}>
                {profile?.idVerified||profile?.id_verified ? '✓ Verified' : '⏳ Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payout setup</span>
              <span className={profile?.stripeAccountId ? 'text-emerald-600' : 'text-amber-600'}>
                {profile?.stripeAccountId ? '✓ Connected' : '⏳ Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Payout info */}
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <p className="text-xs font-semibold text-emerald-700 mb-2">💰 Payout schedule</p>
          <p className="text-xs text-emerald-600">
            Payments are sent every {profile?.payoutSchedule?.toLowerCase() || 'weekly'} on Fridays
            for services completed the previous week.
          </p>
        </div>

        {/* Support */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Need help?</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>📧 pros@everclean.com</p>
            <p>📞 (201) 555-0101</p>
          </div>
        </div>
      </div>
    </div>
  );
}
