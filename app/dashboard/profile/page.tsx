'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = {
  navy: '#0D3781',
  navyDark: '#081f4a',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  canvas: '#FFFFFF',
  soft: '#F5F7FA',
  ink: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  shadow: '0 2px 8px rgba(13,55,129,0.06)',
  bg: '#F5F7FA',
  text: '#0D1B2A',
  warning: '#F59E0B',
  danger: '#DC2626',
};
const R = { sm: '8px', md: '14px', lg: '20px', full: '9999px' };
const font = "'Inter', system-ui, sans-serif";
const CLIENT_PROFILE_ENDPOINTS = ['/companies/me', '/clients/me', '/clients/profile'];

type ClientProfileFields = {
  fullName?: string;
  full_name?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zip_code?: string;
  zip?: string;
  billing_address?: string;
  billingAddress?: string;
  billing_city?: string;
  billingCity?: string;
  billing_state?: string;
  billingState?: string;
  billing_zip?: string;
  billingZip?: string;
  id?: string;
  userId?: string;
  user_id?: string;
  profile?: ClientProfileFields;
  user?: ClientProfileFields;
  client?: ClientProfileFields;
  data?: ClientProfileFields;
};

function decodeToken(token: string): any {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

async function readJsonResponse(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text.includes('<!DOCTYPE')
        ? 'Backend returned HTML instead of JSON'
        : text.trim() || res.statusText,
    };
  }
}

function unwrapProfile(raw: any): ClientProfileFields {
  return (
    raw?.client ||
    raw?.profile ||
    raw?.user?.profile ||
    raw?.user ||
    raw?.data?.client ||
    raw?.data?.profile ||
    raw?.data?.user ||
    raw?.data ||
    raw ||
    {}
  );
}

function normalizeProfile(raw: any) {
  const p = unwrapProfile(raw);
  return {
    fullName: p.fullName || p.full_name || p.name || '',
    phone: p.phone || '',
    email: p.email || '',
    address: p.address || p.billing_address || p.billingAddress || '',
    city: p.city || p.billing_city || p.billingCity || '',
    state: p.state || p.billing_state || p.billingState || 'NJ',
    zipCode: p.zipCode || p.zip_code || p.zip || p.billing_zip || p.billingZip || '',
  };
}

function profileIdentity(raw: any, tokenPayload: any, fallbackEmail = '') {
  const p = unwrapProfile(raw);
  return (
    p.id ||
    p.userId ||
    p.user_id ||
    raw?.id ||
    raw?.userId ||
    raw?.user_id ||
    tokenPayload?.sub ||
    fallbackEmail ||
    'current'
  );
}

function profileStorageKey(identity: string) {
  return `everclean_client_profile_${identity}`;
}

function readStoredProfile(key: string) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

export default function ClientProfile() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ fullName:'', phone:'', email:'', address:'', city:'', state:'NJ', zipCode:'' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string|null>(null);
  const [stats, setStats] = useState({ total:0, spent:0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [payingBooking, setPayingBooking] = useState<string|null>(null);
  const [storageKey, setStorageKey] = useState(profileStorageKey('current'));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = localStorage.getItem('client_photo');
    if (s) setPhoto(s);
  }, []);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    const tokenPayload = decodeToken(token);
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        fetch(API+'/auth/me', { headers:{ Authorization:'Bearer '+token } }),
        fetch(API+'/bookings', { headers:{ Authorization:'Bearer '+token } }),
      ]);
      const [ur, br] = await Promise.all([
        readJsonResponse(profileRes),
        readJsonResponse(bookingsRes),
      ]);
      const remoteProfile = normalizeProfile(ur);
      const nextKey = profileStorageKey(profileIdentity(ur, tokenPayload, remoteProfile.email));
      const storedProfile = readStoredProfile(nextKey);
      setStorageKey(nextKey);
      setForm({
        ...remoteProfile,
        ...storedProfile,
        state: storedProfile.state || remoteProfile.state || 'NJ',
      });
      const bookingRows = Array.isArray(br.data) ? br.data : [];
      setBookings(bookingRows);
      const completed = bookingRows.filter((b:any) => b.status==='COMPLETED');
      const spent = completed.reduce((s:number,b:any) => s+Number(b.client_price||b.total_amount||0), 0);
      setStats({ total: completed.length, spent });
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { alert('Max 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const r = ev.target?.result as string;
      localStorage.setItem('client_photo', r);
      setPhoto(r);
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true); setMessage('');
    const token = localStorage.getItem('token') || '';
    try {
      const payload = {
        fullName: form.fullName,
        full_name: form.fullName,
        name: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        zip_code: form.zipCode,
        billingAddress: form.address,
        billingCity: form.city,
        billingState: form.state,
        billingZip: form.zipCode,
      };

      let savedOnBackend = false;
      let backendError = '';

      for (const endpoint of CLIENT_PROFILE_ENDPOINTS) {
        const res = await fetch(API+endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json', Authorization:'Bearer '+token },
          body: JSON.stringify(payload),
        });
        const data = await readJsonResponse(res);
        if (res.ok) {
          savedOnBackend = true;
          break;
        }
        backendError = data.error || res.statusText;
        if (![404, 405].includes(res.status)) break;
      }

      localStorage.setItem(storageKey, JSON.stringify(form));

      if (savedOnBackend) {
        setMessage(t('client.profileExtra.profileSaved'));
        load();
      } else if (backendError.includes('Cannot PATCH') || backendError.includes('Backend returned HTML')) {
        setMessage(t('client.profileExtra.profileSavedLocal'));
      } else {
        setMessage('Error: '+(backendError || t('client.profileExtra.errorSaving')));
      }
    } catch(e) { setMessage(t('client.profileExtra.errorSaving')); }
    setSaving(false);
  }

  async function startCheckout(bookingId: string) {
    setPayingBooking(bookingId); setMessage('');
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:'Bearer '+token },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('client.profileExtra.errorPayment'));
      if (data.url) window.location.href = data.url;
      else throw new Error(t('client.profileExtra.errorPayment'));
    } catch(e:any) {
      setMessage('Error: '+(e.message || t('client.profileExtra.errorPayment')));
      setPayingBooking(null);
    }
  }

  const payableBookings = bookings.filter((b:any) => !['CANCELLED'].includes(b.status) && Number(b.client_price || b.total_amount || 0) > 0);
  const latestPayable = payableBookings[0];

  const initials = (form.fullName||'C').split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  const inputStyle = { width:'100%', border:`1px solid ${C.border}`, borderRadius: 8, padding:'10px 12px', fontSize:13, color:C.text, outline:'none', fontFamily:font, background:'#fff' };
  const labelStyle = { fontSize:11, fontWeight:600 as const, color:C.muted, display:'block' as const, marginBottom:5, textTransform:'uppercase' as const, letterSpacing:'0.5px' };
  const cardStyle = { background:'#fff', borderRadius: 14, border:`1px solid ${C.border}`, padding:'24px', boxShadow:C.shadow };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.blue, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth:860, fontFamily:font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,textarea:focus{border-color:${C.blue}!important;box-shadow:0 0 0 3px ${C.blue}15;}`}</style>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto}/>

      {message && (
        <div style={{ marginBottom:16, padding:'10px 14px', borderRadius: 8, fontSize:13, background: message.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', color: message.startsWith('Error') ? '#991B1B' : C.greenDk, display:'flex', justifyContent:'space-between' }}>
          {message}
          <button onClick={()=>setMessage('')} style={{ background:'none', border:'none', cursor:'pointer', opacity:0.6 }}>x</button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <div style={cardStyle}>
            <div style={{ fontSize:14, fontWeight: 600, color:C.text, marginBottom:16 }}>{t('client.profileExtra.personalInfo')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div><label style={labelStyle}>{t('profile.fullName')}</label><input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} style={inputStyle}/></div>
              <div><label style={labelStyle}>{t('profile.phone')}</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={inputStyle}/></div>
              <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>{t('profile.email')}</label><input value={form.email} readOnly style={{ ...inputStyle, background:C.bg, cursor:'not-allowed' }}/></div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize:14, fontWeight: 600, color:C.text, marginBottom:16 }}>{t('client.profileExtra.billingAddress')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>{t('client.profileExtra.streetAddress')}</label><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={inputStyle}/></div>
              <div><label style={labelStyle}>{t('profile.city')}</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} style={inputStyle}/></div>
              <div><label style={labelStyle}>{t('profile.state')}</label><input value={form.state} onChange={e=>setForm({...form,state:e.target.value})} style={inputStyle}/></div>
              <div><label style={labelStyle}>{t('client.profileExtra.zipCode')}</label><input value={form.zipCode} onChange={e=>setForm({...form,zipCode:e.target.value})} style={inputStyle}/></div>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize:14, fontWeight: 600, color:C.text, marginBottom:12 }}>{t('client.profileExtra.paymentMethod')}</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>{t('client.profileExtra.stripeText')}</div>
            {latestPayable ? (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', border:`1px solid ${C.border}`, borderRadius: 8, background:C.bg, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight: 600, color:C.text }}>{String(latestPayable.service_type || 'Service').replaceAll('_',' ')}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{latestPayable.scheduled_at ? new Date(latestPayable.scheduled_at).toLocaleDateString() : t('client.profileExtra.pendingSchedule')}</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight: 600, color:C.navy }}>${Number(latestPayable.client_price || latestPayable.total_amount || 0).toFixed(2)}</div>
                </div>
                <button onClick={()=>startCheckout(latestPayable.id)} disabled={payingBooking===latestPayable.id} style={{ width:'100%', padding:'12px 0', borderRadius: 8, border:'none', cursor:'pointer', background:C.green, color:'#fff', fontSize:13, fontWeight: 600 }}>
                  {payingBooking===latestPayable.id ? t('client.profileExtra.openingCheckout') : t('client.profileExtra.payWithCard')}
                </button>
              </div>
            ) : (
              <div style={{ padding:'12px 14px', borderRadius: 8, background:C.bg, color:C.muted, fontSize:12 }}>{t('client.profileExtra.noPayable')}</div>
            )}
          </div>

          <button onClick={save} disabled={saving} style={{
            width:'100%', padding:'13px 0', borderRadius: 8, border:'none', cursor:'pointer',
            background:C.navy,
            color:'#fff', fontSize:14, fontWeight: 600,
            boxShadow: C.shadow,
            opacity: saving ? 0.7 : 1, fontFamily:font,
          }}>
            {saving ? t('client.profileExtra.saving') : t('client.profileExtra.saveProfile')}
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ ...cardStyle, textAlign:'center' }}>
            <div style={{ position:'relative', display:'inline-block', marginBottom:12, cursor:'pointer' }} onClick={()=>inputRef.current?.click()}>
              {photo
                ? <img src={photo} alt="Profile" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:`3px solid ${C.blue}` }}/>
                : <div style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg, ${C.blue}, ${C.navy})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight: 600, color:'#fff', margin:'0 auto' }}>{initials}</div>
              }
              <div style={{ position:'absolute', bottom:0, right:0, width:30, height:24, background:C.blue, borderRadius: 8, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff', fontSize:9, color:'#fff', fontWeight: 600 }}>{t('client.profileExtra.photo')}</div>
            </div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>{t('client.profileExtra.clickPhoto')}</div>
            <div style={{ fontWeight: 600, fontSize:15, color:C.text }}>{form.fullName || t('client.profileExtra.client')}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{form.city||''}{form.city&&form.state?', ':''}{form.state}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize:13, fontWeight: 600, color:C.text, marginBottom:12 }}>{t('client.profileExtra.accountSummary')}</div>
            {[
              { label: t('client.profileExtra.servicesCompleted'), val:stats.total },
              { label: t('client.profileExtra.totalSpent'), val:`${stats.spent.toFixed(2)}` },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.muted }}>{s.label}</span>
                <span style={{ fontSize:12, fontWeight: 600, color:C.text }}>{s.val}</span>
              </div>
            ))}
          </div>

          <div style={{ ...cardStyle, background:C.bg, textAlign:'center' }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>{t('client.profileExtra.needHelp')}</div>
            <button style={{ fontSize:12, color:C.blue, fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>{t('client.profileExtra.contactSupport')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
