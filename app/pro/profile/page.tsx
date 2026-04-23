'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ClientProfile() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:'ok'|'err';text:string}|null>(null);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('NJ');
  const [billingZip, setBillingZip] = useState('');
  const [taxId, setTaxId] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/auth/me', { headers: { Authorization: 'Bearer '+token } });
      if (res.ok) { const d = await res.json(); setUser(d); setEmail(d.email||''); setPhone(d.phone||''); setFullName(d.name||d.email?.split('@')[0]||''); }
      const compRes = await fetch(API+'/companies/me', { headers: { Authorization: 'Bearer '+token } });
      if (compRes.ok) { const c = await compRes.json(); setCompanyName(c.name||''); setBillingAddress(c.address||''); setBillingCity(c.city||''); setBillingState(c.state||'NJ'); setBillingZip(c.zip||''); setTaxId(c.tax_id||''); }
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    setSaving(true); setMsg(null);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/companies/me', { method:'PATCH', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}, body:JSON.stringify({name:companyName,billingAddress,billingCity,billingState,billingZip,taxId}) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setMsg({type:'ok',text:t('common.success')}); load();
    } catch(e:any) { setMsg({type:'err',text:e.message}); }
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{t('client.profile.title')}</h1>
          <button onClick={saveProfile} disabled={saving} className="bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">{saving?t('common.loading'):t('client.profile.saveChanges')}</button>
        </div>
        {msg && <div className={`rounded-lg px-4 py-3 text-sm ${msg.type==='ok'?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-600'}`}>{msg.text}</div>}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('client.profile.personalInfo')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-xs text-gray-600 block mb-1">{t('client.profile.fullName')}</label><input value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="text-xs text-gray-600 block mb-1">{t('common.phone')}</label><input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="text-xs text-gray-600 block mb-1">{t('common.email')}</label><input value={email} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('client.profile.billingInfo')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-xs text-gray-600 block mb-1">{t('client.profile.companyName')}</label><input value={companyName} onChange={e=>setCompanyName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div className="col-span-2"><label className="text-xs text-gray-600 block mb-1">{t('client.profile.billingAddress')}</label><input value={billingAddress} onChange={e=>setBillingAddress(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="text-xs text-gray-600 block mb-1">{t('common.city')}</label><input value={billingCity} onChange={e=>setBillingCity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.state')}</label><select value={billingState} onChange={e=>setBillingState(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">{['NJ','NY','CT','PA','FL','TX','CA'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.zip')}</label><input value={billingZip} onChange={e=>setBillingZip(e.target.value)} maxLength={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
            <div><label className="text-xs text-gray-600 block mb-1">{t('client.profile.taxId')}</label><input value={taxId} onChange={e=>setTaxId(e.target.value)} placeholder="XX-XXXXXXX" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('client.profile.paymentMethods')}</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm text-gray-600 font-medium">{t('client.profile.stripeIntegration')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('client.profile.stripeDesc')}</p>
            <button className="mt-3 bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800">{t('client.profile.setupPayment')}</button>
          </div>
        </div>
      </div>
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-700 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">{(fullName||email||'C')[0].toUpperCase()}</div>
          <p className="font-semibold text-gray-900">{fullName||'Client'}</p>
          <p className="text-xs text-gray-500 mt-0.5">{email}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('client.profile.account')}</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-600">{t('client.profile.memberSince')}</span><span className="font-semibold">{user?.createdAt?new Date(user.createdAt).toLocaleDateString('en-US',{month:'short',year:'numeric'}):'—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">{t('common.status')}</span><span className="font-semibold text-emerald-600">{t('client.profile.active')}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">{t('client.profile.paymentMethod')}</span><span className="font-semibold text-amber-600">{t('client.profile.pending')}</span></div>
          </div>
        </div>
        {companyName && <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('client.profile.billing')}</p><div className="text-xs text-gray-600"><p className="font-medium text-gray-900">{companyName}</p>{billingAddress&&<p>{billingAddress}</p>}<p>{billingCity}{billingCity&&billingState?', ':''}{billingState} {billingZip}</p></div></div>}
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('client.profile.support')}</p><div className="text-xs text-gray-600"><p>support@everclean.com</p><p>(201) 555-0100</p></div></div>
      </div>
    </div>
  );
}
