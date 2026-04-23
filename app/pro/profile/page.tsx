'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';
const SERVICES_LIST = ['House Cleaning','Deep Cleaning','Move In/Out','Office Cleaning','Post Construction','Carpet Cleaning','Medical Facility','Industrial'];
const LANGUAGES = ['English','Spanish','Portuguese','French','Mandarin','Hindi','Korean','Arabic'];

export default function ProProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState(25);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    fullName:'', phone:'', email:'', bio:'', address:'', city:'', state:'NJ', zipCode:'',
    serviceRadiusMiles:25, hourlyRate:25, payoutSchedule:'WEEKLY',
    language:['English'] as string[], servicesOffered:[] as string[],
  });

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/professionals/me', { headers: { Authorization: 'Bearer '+token } });
      if (res.ok) {
        const d = await res.json();
        setProfile(d);
        setForm({
          fullName: d.full_name||'', phone: d.phone||'', email: d.email||'', bio: d.bio||'',
          address: d.address||'', city: d.city||'', state: d.state||'NJ', zipCode: d.zip_code||'',
          serviceRadiusMiles: Number(d.service_radius_miles||25), hourlyRate: Number(d.hourly_rate||25),
          payoutSchedule: d.payout_schedule||'WEEKLY',
          language: d.language ? (typeof d.language === 'string' ? JSON.parse(d.language) : d.language) : ['English'],
          servicesOffered: d.services_offered ? (typeof d.services_offered === 'string' ? JSON.parse(d.services_offered) : d.services_offered) : [],
        });
        setNewRate(Number(d.hourly_rate||25));
      }
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function saveProfile() {
    setSaving(true); setMessage('');
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API+'/professionals/me', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}, body:JSON.stringify(form) });
    if (res.ok) { setMessage(t('pro.profile.profileSaved')); loadProfile(); }
    else { const e = await res.json(); setMessage('Error: '+e.error); }
    setSaving(false);
  }

  async function saveRate() {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API+'/professionals/me', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}, body:JSON.stringify({hourlyRate:newRate}) });
    if (res.ok) { setEditingRate(false); setForm(p=>({...p,hourlyRate:newRate})); loadProfile(); }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">{t('common.loading')}</div>;

  const rating = Number(profile?.avg_rating||0);
  const services = Number(profile?.total_services||0);
  const earnings = Number(profile?.total_earnings||0);
  const completion = Number(profile?.completion_rate||100);

  return (
    <div className="max-w-5xl mx-auto">
      {message && <div className={`mb-4 p-3 rounded-xl text-sm ${message.startsWith('Error')?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-700'}`}>{message}<button onClick={()=>setMessage('')} className="float-right text-xs opacity-60">✕</button></div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('pro.profile.personalInfo')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-500 block mb-1">{t('pro.profile.fullName')}</label><input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">{t('common.phone')}</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">{t('common.email')}</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">{t('pro.profile.bio')}</label><textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder={t('pro.profile.bioPlaceholder')} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('pro.profile.addressSection')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">{t('pro.profile.streetAddress')}</label><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">{t('common.city')}</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">{t('common.state')}</label><input value={form.state} onChange={e=>setForm({...form,state:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">{t('common.zip')}</label><input value={form.zipCode} onChange={e=>setForm({...form,zipCode:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">{t('pro.profile.serviceRadius')} ({form.serviceRadiusMiles} mi)</label><input type="range" min={5} max={50} value={form.serviceRadiusMiles} onChange={e=>setForm({...form,serviceRadiusMiles:Number(e.target.value)})} className="w-full accent-emerald-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('pro.profile.servicesOffered')}</h2>
            <div className="flex flex-wrap gap-2">
              {SERVICES_LIST.map(svc => (<button key={svc} onClick={()=>setForm(p=>({...p,servicesOffered:p.servicesOffered.includes(svc)?p.servicesOffered.filter(s=>s!==svc):[...p.servicesOffered,svc]}))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.servicesOffered.includes(svc)?'bg-emerald-100 text-emerald-700 border border-emerald-300':'bg-gray-50 text-gray-500 border border-gray-200'}`}>{form.servicesOffered.includes(svc)?'✓ ':''}{svc}</button>))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('pro.profile.languages')}</h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (<button key={lang} onClick={()=>setForm(p=>({...p,language:p.language.includes(lang)?p.language.filter(l=>l!==lang):[...p.language,lang]}))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.language.includes(lang)?'bg-blue-100 text-blue-700 border border-blue-300':'bg-gray-50 text-gray-500 border border-gray-200'}`}>{form.language.includes(lang)?'✓ ':''}{lang}</button>))}
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">{saving ? t('pro.profile.saving') : t('pro.profile.saveProfile')}</button>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold mx-auto mb-3">{(form.fullName||'?').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
            <p className="font-semibold text-gray-900">{form.fullName||'Professional'}</p>
            <p className="text-xs text-gray-500 mt-1">{form.city||'NJ'}, {form.state}</p>
            <div className="flex items-center justify-center gap-1 mt-2"><span className="text-amber-500 text-sm">{'★'.repeat(Math.round(rating))}</span><span className="text-xs text-gray-500">{rating.toFixed(1)}</span></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-gray-900">{t('pro.profile.hourlyRate')}</h3><button onClick={()=>setEditingRate(!editingRate)} className="text-xs text-emerald-600">{editingRate?t('common.cancel'):t('pro.profile.editRate')}</button></div>
            {editingRate ? (<div><div className="flex items-center gap-2 mb-2"><span className="text-sm text-gray-500">$</span><input type="number" min={18} max={30} value={newRate} onChange={e=>setNewRate(Number(e.target.value))} className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" /><span className="text-sm text-gray-500">/hr</span></div><p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-2">{t('pro.profile.rateWarning')}</p><button onClick={saveRate} className="w-full bg-emerald-700 text-white rounded-lg py-2 text-xs font-medium">{t('pro.profile.saveRate')}</button></div>) : (<p className="text-2xl font-bold text-gray-900">${form.hourlyRate}<span className="text-sm font-normal text-gray-400">{t('pro.dashboard.perHour')}</span></p>)}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('pro.profile.performance')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('pro.profile.totalEarnings')}</span><span className="font-medium">${earnings.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('pro.profile.servicesCompleted')}</span><span className="font-medium">{services}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('pro.profile.completionRate')}</span><span className="font-medium">{completion}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('pro.profile.serviceRadiusStat')}</span><span className="font-medium">{form.serviceRadiusMiles} mi</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('pro.profile.payoutSchedule')}</span><span className="font-medium">{form.payoutSchedule}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('pro.profile.verifications')}</h3>
            <div className="space-y-2">
              {[{label:t('pro.profile.backgroundCheck'),done:profile?.background_checked},{label:t('pro.profile.idVerified'),done:profile?.id_verified},{label:t('pro.profile.payoutSetup'),done:!!profile?.stripe_account_id}].map(v=>(<div key={v.label} className="flex items-center gap-2 text-sm"><span className={`text-xs ${v.done?'text-emerald-500':'text-amber-500'}`}>{v.done?'✓':'⏳'}</span><span className={v.done?'text-gray-700':'text-gray-400'}>{v.label}</span></div>))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-center"><p className="text-xs text-gray-500 mb-2">{t('pro.profile.needHelp')}</p><button className="text-xs text-emerald-600 font-medium">{t('pro.profile.contactSupport')}</button></div>
        </div>
      </div>
    </div>
  );
}
