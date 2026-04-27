'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ClientProfile() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
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
      const [uRes, cRes] = await Promise.all([
        fetch(API+'/auth/me', { headers: { Authorization: 'Bearer '+token } }),
        fetch(API+'/companies/me', { headers: { Authorization: 'Bearer '+token } }),
      ]);
      if (uRes.ok) { const d = await uRes.json(); setUser(d); setEmail(d.email||''); setPhone(d.phone||''); setFullName(d.name||''); }
      if (cRes.ok) { const c = await cRes.json(); setCompanyName(c.name||''); setBillingAddress(c.address||''); setBillingCity(c.city||''); setBillingState(c.state||'NJ'); setBillingZip(c.zip||''); setTaxId(c.tax_id||''); }
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    setSaving(true); setMsg('');
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/companies/me', { method:'PATCH', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}, body:JSON.stringify({name:companyName,billingAddress,billingCity,billingState,billingZip,taxId}) });
      if (res.ok) { setMsg(t('common.success')); load(); } else { const e = await res.json(); setMsg('Error: '+e.error); }
    } catch(e:any) { setMsg('Error: '+e.message); }
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-semibold text-gray-900">{t('client.profile.title')}</h1>
        <button onClick={saveProfile} disabled={saving} className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50">{saving?t('common.loading'):t('client.profile.saveChanges')}</button>
      </div>
      {msg && <div className={`rounded-lg px-3 py-2 text-xs mb-3 ${msg.startsWith('Error')?'bg-red-50 text-red-600':'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}

      {/* Avatar card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">{(fullName||email||'C')[0].toUpperCase()}</div>
        <div className="min-w-0"><p className="font-semibold text-gray-900 text-sm truncate">{fullName||'Client'}</p><p className="text-xs text-gray-500 truncate">{email}</p></div>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('client.profile.personalInfo')}</h2>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-600 block mb-1">{t('client.profile.fullName')}</label><input value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.phone')}</label><input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" /></div>
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.email')}</label><input value={email} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500" /></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('client.profile.billingInfo')}</h2>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-600 block mb-1">{t('client.profile.companyName')}</label><input value={companyName} onChange={e=>setCompanyName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs text-gray-600 block mb-1">{t('client.profile.billingAddress')}</label><input value={billingAddress} onChange={e=>setBillingAddress(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.city')}</label><input value={billingCity} onChange={e=>setBillingCity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" /></div>
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.state')}</label><select value={billingState} onChange={e=>setBillingState(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">{['NJ','NY','CT','PA','FL','TX','CA'].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="text-xs text-gray-600 block mb-1">{t('common.zip')}</label><input value={billingZip} onChange={e=>setBillingZip(e.target.value)} maxLength={5} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" /></div>
            </div>
            <div><label className="text-xs text-gray-600 block mb-1">{t('client.profile.taxId')}</label><input value={taxId} onChange={e=>setTaxId(e.target.value)} placeholder="XX-XXXXXXX" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('client.profile.paymentMethods')}</h2>
          <div className="text-center py-4">
            <p className="text-2xl mb-1">💳</p>
            <p className="text-xs text-gray-600 font-medium">{t('client.profile.stripeIntegration')}</p>
            <p className="text-[10px] text-gray-400 mt-1">{t('client.profile.stripeDesc')}</p>
            <button className="mt-3 bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium">{t('client.profile.setupPayment')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
