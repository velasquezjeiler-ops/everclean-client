'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const SERVICES_LIST = [
  'House Cleaning', 'Deep Cleaning', 'Move In/Out', 'Office Cleaning',
  'Post Construction', 'Carpet Cleaning', 'Medical Facility', 'Industrial'
];

const LANGUAGES = ['English', 'Spanish', 'Portuguese', 'French', 'Mandarin', 'Hindi', 'Korean', 'Arabic'];

export default function ProProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState(25);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', bio: '',
    address: '', city: '', state: 'NJ', zipCode: '',
    serviceRadiusMiles: 25, maxRadiusMiles: 50,
    hourlyRate: 25, payoutSchedule: 'WEEKLY',
    language: ['English'] as string[],
    servicesOffered: [] as string[],
  });

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/professionals/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          fullName: data.full_name || data.fullName || '',
          phone: data.phone || '',
          email: data.email || '',
          bio: data.bio || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || 'NJ',
          zipCode: data.zip_code || data.zipCode || '',
          serviceRadiusMiles: Number(data.service_radius_miles || data.serviceRadiusMiles || 25),
          maxRadiusMiles: Number(data.max_radius_miles || data.maxRadiusMiles || 50),
          hourlyRate: Number(data.hourly_rate || data.hourlyRate || 25),
          payoutSchedule: data.payout_schedule || data.payoutSchedule || 'WEEKLY',
          language: data.language || ['English'],
          servicesOffered: data.services_offered || data.servicesOffered || [],
        });
        setNewRate(Number(data.hourly_rate || data.hourlyRate || 25));
      }
    } catch (e) { console.error('Load profile error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/professionals/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage('Profile saved successfully');
        await loadProfile();
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error}`);
      }
    } catch (e: any) { setMessage(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  const saveRate = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/professionals/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hourlyRate: newRate }),
      });
      if (res.ok) {
        setEditingRate(false);
        setMessage('Hourly rate updated. Changes apply to new jobs only (not retroactive).');
        setForm(prev => ({ ...prev, hourlyRate: newRate }));
        await loadProfile();
      }
    } catch (e: any) { setMessage(`Error: ${e.message}`); }
  };

  const toggleService = (svc: string) => {
    setForm(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(svc)
        ? prev.servicesOffered.filter(s => s !== svc)
        : [...prev.servicesOffered, svc]
    }));
  };

  const toggleLang = (lang: string) => {
    setForm(prev => ({
      ...prev,
      language: prev.language.includes(lang)
        ? prev.language.filter(l => l !== lang)
        : [...prev.language, lang]
    }));
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading profile...</div>;

  const rating = Number(profile?.avg_rating || profile?.avgRating || 0);
  const services = Number(profile?.total_services || profile?.totalServices || 0);
  const earnings = Number(profile?.total_earnings || profile?.totalEarnings || 0);
  const completion = Number(profile?.completion_rate || profile?.completionRate || 100);

  return (
    <div className="max-w-5xl mx-auto">
      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {message}
          <button onClick={() => setMessage('')} className="float-right text-xs opacity-60 hover:opacity-100">dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Editable form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Personal information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Full name</label>
                <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Email</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Tell clients about yourself and your experience..." />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Address</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Street address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">City</label>
                <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">State</label>
                <input value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ZIP code</label>
                <input value={form.zipCode} onChange={e => setForm({...form, zipCode: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Service radius ({form.serviceRadiusMiles} mi)</label>
                <input type="range" min={5} max={50} value={form.serviceRadiusMiles}
                  onChange={e => setForm({...form, serviceRadiusMiles: Number(e.target.value)})}
                  className="w-full accent-emerald-600" />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Services offered</h2>
            <div className="flex flex-wrap gap-2">
              {SERVICES_LIST.map(svc => (
                <button key={svc} onClick={() => toggleService(svc)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.servicesOffered.includes(svc)
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
                  }`}>
                  {form.servicesOffered.includes(svc) ? '✓ ' : ''}{svc}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button key={lang} onClick={() => toggleLang(lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.language.includes(lang)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
                  }`}>
                  {form.language.includes(lang) ? '✓ ' : ''}{lang}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button onClick={saveProfile} disabled={saving}
            className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-all">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>

        {/* RIGHT: Stats panel */}
        <div className="space-y-5">
          {/* Avatar + Name */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold mx-auto mb-3">
              {(form.fullName || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <p className="font-semibold text-gray-900">{form.fullName || 'Professional'}</p>
            <p className="text-xs text-gray-500 mt-1">{form.city || 'New Jersey'}, {form.state}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-amber-500 text-sm">{'★'.repeat(Math.round(rating))}</span>
              <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Rate */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Hourly rate</h3>
              <button onClick={() => setEditingRate(!editingRate)}
                className="text-xs text-emerald-600 hover:text-emerald-700">
                {editingRate ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingRate ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input type="number" min={18} max={30} value={newRate}
                    onChange={e => setNewRate(Number(e.target.value))}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
                  <span className="text-sm text-gray-500">/hr</span>
                </div>
                <input type="range" min={18} max={30} step={1} value={newRate}
                  onChange={e => setNewRate(Number(e.target.value))}
                  className="w-full accent-emerald-600 mb-2" />
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-2">
                  Changes apply to new jobs only. Already accepted jobs keep the current rate.
                </p>
                <button onClick={saveRate}
                  className="w-full bg-emerald-700 text-white rounded-lg py-2 text-xs font-medium hover:bg-emerald-800">
                  Save new rate
                </button>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">${form.hourlyRate}<span className="text-sm font-normal text-gray-400">/hr</span></p>
            )}
          </div>

          {/* Performance */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total earnings</span>
                <span className="font-medium text-gray-900">${earnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Services completed</span>
                <span className="font-medium text-gray-900">{services}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completion rate</span>
                <span className="font-medium text-gray-900">{completion}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service radius</span>
                <span className="font-medium text-gray-900">{form.serviceRadiusMiles} mi</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payout schedule</span>
                <span className="font-medium text-gray-900">{form.payoutSchedule}</span>
              </div>
            </div>
          </div>

          {/* Verifications */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Verifications</h3>
            <div className="space-y-2">
              {[
                { label: 'Background check', done: profile?.background_checked || profile?.backgroundChecked },
                { label: 'ID verified', done: profile?.id_verified || profile?.idVerified },
                { label: 'Payout setup', done: !!profile?.stripe_account_id },
              ].map(v => (
                <div key={v.label} className="flex items-center gap-2 text-sm">
                  <span className={`text-xs ${v.done ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {v.done ? '✓' : '⏳'}
                  </span>
                  <span className={v.done ? 'text-gray-700' : 'text-gray-400'}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-2">Need help?</p>
            <button className="text-xs text-emerald-600 font-medium hover:text-emerald-700">
              Contact support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
