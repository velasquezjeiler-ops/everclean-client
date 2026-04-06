'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const serviceTypes = [
  { value: 'OFFICE_CLEANING', label: 'Limpieza de oficinas' },
  { value: 'COMMERCIAL_CLEANING', label: 'Limpieza comercial' },
  { value: 'DEEP_CLEANING', label: 'Limpieza profunda' },
  { value: 'MOVE_IN_OUT', label: 'Mudanza (entrada/salida)' },
  { value: 'POST_CONSTRUCTION', label: 'Post construccion' },
];

const frequencies = [
  { value: 'ONE_TIME', label: 'Una vez' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'MONTHLY', label: 'Mensual' },
];

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    serviceType: 'OFFICE_CLEANING',
    frequency: 'ONE_TIME',
    scheduledAt: '',
    address: '',
    city: '',
    state: 'NJ',
    sqft: '',
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
      const companyRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/me', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const me = await companyRes.json();

      const companies = await fetch(process.env.NEXT_PUBLIC_API_URL + '/bookings', {
        headers: { Authorization: 'Bearer ' + token }
      });

      await api.bookings.create(token, {
        companyId: me.companyId || '00000000-0000-0000-0000-000000000000',
        serviceType: form.serviceType,
        frequency: form.frequency,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        address: form.address,
        city: form.city,
        state: form.state,
        sqft: Number(form.sqft),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-500 mb-6 hover:text-gray-700">← Volver</button>
      <h1 className="text-xl font-medium text-gray-900 mb-6">Solicitar limpieza</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Tipo de servicio</h2>
          <div className="grid grid-cols-2 gap-3">
            {serviceTypes.map(s => (
              <button key={s.value} type="button" onClick={() => update('serviceType', s.value)}
                className={"p-3 rounded-lg border text-sm text-left " + (form.serviceType === s.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Detalles</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Frecuencia</label>
              <select value={form.frequency} onChange={e => update('frequency', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Pies cuadrados (sqft)</label>
              <input type="number" value={form.sqft} onChange={e => update('sqft', e.target.value)} placeholder="ej: 2500" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Fecha y hora</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => update('scheduledAt', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Direccion del servicio</h2>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Direccion</label>
            <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main St" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Ciudad</label>
              <input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Newark" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Estado</label>
              <select value={form.state} onChange={e => update('state', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="NJ">New Jersey</option>
                <option value="NY">New York</option>
                <option value="CT">Connecticut</option>
                <option value="PA">Pennsylvania</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
          {loading ? 'Enviando...' : 'Solicitar servicio'}
        </button>
      </form>
    </div>
  );
}