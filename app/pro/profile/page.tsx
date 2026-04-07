'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const SERVICES = [
  'House Cleaning','Deep Cleaning','Move In/Out','Office Cleaning',
  'Post Construction','Carpet Cleaning','Window Cleaning','Laundry',
  'Organizing','Disinfection'
];

const LANGUAGES = ['English','Spanish','Portuguese','French','Creole'];

const PAYOUT_OPTIONS = [
  { value: 'WEEKLY', label: 'Semanal', desc: 'Pago cada lunes' },
  { value: 'IMMEDIATE', label: 'Inmediato (−10%)', desc: '1hr después de terminar el servicio' },
];

export default function ProProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [tab, setTab] = useState<'info'|'services'|'payments'>('info');
  const [payments, setPayments] = useState<any[]>([]);

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', bio: '',
    address: '', city: '', state: 'NJ', zipCode: '',
    serviceRadiusMiles: 20, maxRadiusMiles: 50,
    hourlyRate: 45, payoutSchedule: 'WEEKLY',
    language: ['English'] as string[],
    servicesOffered: [] as string[],
  });

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setForm({
          fullName: data.fullName || data.full_name || '',
          phone: data.phone || '',
          email: data.email || '',
          bio: data.bio || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || 'NJ',
          zipCode: data.zipCode || data.zip_code || '',
          serviceRadiusMiles: data.serviceRadiusMiles || data.service_radius_miles || 20,
          maxRadiusMiles: data.maxRadiusMiles || data.max_radius_miles || 50,
          hourlyRate: Number(data.hourlyRate || data.hourly_rate || 45),
          payoutSchedule: data.payoutSchedule || data.payout_schedule || 'WEEKLY',
          hourlyRateRecurring: Number(data.hourlyRateRecurring || data.hourly_rate_recurring || data.hourlyRate || data.hourly_rate || 45),
          language: data.language || ['English'],
          servicesOffered: data.servicesOffered || data.services_offered || [],
        });
        setLoading(false);
      }).catch(() => setLoading(false));

    fetch(API + '/professionals/me/payments', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setPayments(data.data || data || []))
      .catch(() => {});
  }, []);

  async function toggleAvailability() {
    setToggling(true);
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API + '/professionals/me/availability', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !(profile?.isAvailable ?? profile?.is_available) })
    });
    if (res.ok) {
      const d = await res.json();
      setProfile((p: any) => ({ ...p, isAvailable: d.isAvailable ?? d.is_available }));
    }
    setToggling(false);
  }

  async function save() {
    setSaving(true);
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API + '/professionals/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const d = await res.json();
      setProfile((p: any) => ({ ...p, ...d }));
      alert('✅ Perfil actualizado');
    }
    setSaving(false);
  }

  function toggleArr(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isAvailable = profile?.isAvailable ?? profile?.is_available ?? false;
  const totalEarnings = Number(profile?.totalEarnings || profile?.total_earnings || 0);
  const tipsReceived = Number(profile?.tipsReceived || profile?.tips_received || 0);
  const avgRating = Number(profile?.avgRating || profile?.avg_rating || 0).toFixed(1);
  const totalServices = profile?.totalServices || profile?.total_services || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mi perfil</h1>
        <button onClick={toggleAvailability} disabled={toggling}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {toggling ? 'Actualizando...' : isAvailable ? 'Disponible' : 'No disponible'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Rating', value: avgRating + ' ⭐' },
          { label: 'Servicios', value: totalServices },
          { label: 'Ganancias', value: '$' + totalEarnings.toFixed(0) },
          { label: 'Propinas', value: '$' + tipsReceived.toFixed(0) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {([['info','Información'],['services','Servicios'],['payments','Pagos']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* TAB: INFO */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nombre completo</label>
              <input value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Teléfono</label>
              <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                placeholder="+1 (201) 000-0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
              type="email"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Dirección</label>
            <input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))}
              placeholder="123 Main St"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Ciudad</label>
              <input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Estado</label>
              <input value={form.state} onChange={e => setForm(p => ({...p, state: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">ZIP</label>
              <input value={form.zipCode} onChange={e => setForm(p => ({...p, zipCode: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sobre mí</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))}
              rows={3} placeholder="Cuéntale a los clientes sobre tu experiencia..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-2">Idiomas</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button key={lang} onClick={() => setForm(p => ({...p, language: toggleArr(p.language, lang)}))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.language.includes(lang) ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'}`}>
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Radio de servicio (mi)</label>
              <input type="number" min={5} max={50} value={form.serviceRadiusMiles}
                onChange={e => setForm(p => ({...p, serviceRadiusMiles: Number(e.target.value)}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Radio máximo (mi)</label>
              <input type="number" min={5} max={50} value={form.maxRadiusMiles}
                onChange={e => setForm(p => ({...p, maxRadiusMiles: Number(e.target.value)}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <p className="text-xs text-gray-400 mt-1">Máximo 50 millas</p>
            </div>
          </div>
          <button onClick={save} disabled={saving}
            className="w-full bg-emerald-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {/* TAB: SERVICES */}
      {tab === 'services' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="text-xs text-gray-500 block mb-2">Tarifa por hora adicional</label>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">$</span>
              <input type="number" min={25} max={150} value={form.hourlyRate}
                onChange={e => setForm(p => ({...p, hourlyRate: Number(e.target.value)}))}
                className="w-32 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="text-gray-500 text-sm">/ hora</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Se aplica cuando el cliente autoriza horas extra</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-2">Servicios que ofrezco</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map(svc => (
                <button key={svc} onClick={() => setForm(p => ({...p, servicesOffered: toggleArr(p.servicesOffered, svc)}))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-colors text-left ${form.servicesOffered.includes(svc) ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
                  <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${form.servicesOffered.includes(svc) ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                    {form.servicesOffered.includes(svc) && <span className="text-white text-xs">✓</span>}
                  </span>
                  {svc}
                </button>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={saving}
            className="w-full bg-emerald-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {/* TAB: PAYMENTS */}
      {tab === 'payments' && (
        <div className="space-y-4">
          {/* Programación de pagos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Programación de pagos</h3>
            <div className="space-y-3">
              {PAYOUT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setForm(p => ({...p, payoutSchedule: opt.value}))}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${form.payoutSchedule === opt.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.payoutSchedule === opt.value ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                    {form.payoutSchedule === opt.value && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              ⚡ Pago inmediato tiene un descuento del 10% por procesamiento acelerado
            </p>
            <button onClick={save} disabled={saving}
              className="w-full mt-4 bg-emerald-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar preferencia'}
            </button>
          </div>

          {/* Historial de pagos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Historial de pagos</h3>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">💳</p>
                <p className="text-gray-400 text-sm">No hay pagos registrados aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">${Number(p.amount).toFixed(2)}</p>
                      {p.tipAmount > 0 && <p className="text-xs text-emerald-600">+ ${Number(p.tipAmount).toFixed(2)} propina</p>}
                      <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('es-US', {month:'short', day:'numeric', year:'numeric'})}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
