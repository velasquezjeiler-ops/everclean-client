'use client';
import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ClientProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:'ok'|'err'; text:string} | null>(null);
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  // Editable fields
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
      if (res.ok) {
        const d = await res.json();
        setUser(d);
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setFullName(d.name || d.email?.split('@')[0] || '');
      }
      // Try to load company
      const compRes = await fetch(API+'/companies/me', { headers: { Authorization: 'Bearer '+token } });
      if (compRes.ok) {
        const c = await compRes.json();
        setCompany(c);
        setCompanyName(c.name || '');
        setBillingAddress(c.billingAddress || c.billing_address || c.address || '');
        setBillingCity(c.billingCity || c.billing_city || c.city || '');
        setBillingState(c.billingState || c.billing_state || c.state || 'NJ');
        setBillingZip(c.billingZip || c.billing_zip || c.zip || '');
        setTaxId(c.taxId || c.tax_id || '');
      }
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    setSaving(true); setMsg(null);
    const token = localStorage.getItem('token') || '';
    try {
      // Update company/billing info
      const res = await fetch(API+'/companies/me', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          billingAddress, billingCity, billingState, billingZip, taxId,
        })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Save failed');
      }
      setMsg({type:'ok', text:'Profile saved'});
      await load();
    } catch(e:any) { setMsg({type:'err', text:e.message}); }
    setSaving(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      {/* LEFT: editable form */}
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
              <input type="email" value={email} readOnly
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Company / Billing */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Billing Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-600 block mb-1">Company name (optional)</label>
              <input type="text" value={companyName} onChange={e=>setCompanyName(e.target.value)}
                placeholder="Your company or personal name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600 block mb-1">Billing address</label>
              <input type="text" value={billingAddress} onChange={e=>setBillingAddress(e.target.value)}
                placeholder="123 Main St"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">City</label>
              <input type="text" value={billingCity} onChange={e=>setBillingCity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">State</label>
                <select value={billingState} onChange={e=>setBillingState(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {['NJ','NY','CT','PA','FL','TX','CA'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">ZIP</label>
                <input type="text" value={billingZip} onChange={e=>setBillingZip(e.target.value)}
                  placeholder="07030" maxLength={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Tax ID / EIN (optional)</label>
              <input type="text" value={taxId} onChange={e=>setTaxId(e.target.value)}
                placeholder="XX-XXXXXXX"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm text-gray-600 font-medium">Stripe payment integration</p>
            <p className="text-xs text-gray-400 mt-1">Add credit cards and bank accounts securely via Stripe</p>
            <button className="mt-3 bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
              onClick={() => alert('Stripe Connect coming soon! Payments will be processed via Stripe for maximum security.')}>
              Set up payment method
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: account summary */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Avatar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-700 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
            {(fullName||email||'C')[0].toUpperCase()}
          </div>
          <p className="font-semibold text-gray-900">{fullName || 'Client'}</p>
          <p className="text-xs text-gray-500 mt-0.5">{email}</p>
          {phone && <p className="text-xs text-gray-400 mt-0.5">{phone}</p>}
        </div>

        {/* Account status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Account</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-600">Member since</span><span className="font-semibold text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Status</span><span className="font-semibold text-emerald-600">Active</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Payment method</span><span className="font-semibold text-amber-600">Pending</span></div>
          </div>
        </div>

        {/* Billing summary */}
        {companyName && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Billing</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p className="font-medium text-gray-900">{companyName}</p>
              {billingAddress && <p>{billingAddress}</p>}
              {(billingCity || billingState) && <p>{billingCity}{billingCity && billingState ? ', ':''}{billingState} {billingZip}</p>}
              {taxId && <p className="text-gray-400">EIN: {taxId}</p>}
            </div>
          </div>
        )}

        {/* Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Invoices</p>
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">Invoices will appear here after completed services</p>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Support</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>support@everclean.com</p>
            <p>(201) 555-0100</p>
            <p>Mon–Sat 8am–8pm ET</p>
          </div>
        </div>
      </div>
    </div>
  );
}
