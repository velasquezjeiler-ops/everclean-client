'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ProProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', serviceRadiusMiles: 25 });

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API + '/professionals/me', {
      headers: { Authorization: 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(data => {
      setProfile(data);
      setForm({
        fullName: data.fullName || data.full_name || '',
        phone: data.phone || '',
        serviceRadiusMiles: data.serviceRadiusMiles || data.service_radius_miles || 25,
      });
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  async function toggleAvailability() {
    setToggling(true);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/professionals/me/availability', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !profile.isAvailable && !profile.is_available })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev: any) => ({ ...prev, isAvailable: updated.isAvailable ?? updated.is_available }));
      }
    } catch (e) {}
    setToggling(false);
  }

  async function saveProfile() {
    setSaving(true);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/professionals/me', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev: any) => ({ ...prev, ...updated }));
        alert('Perfil actualizado');
      }
    } catch (e) {}
    setSaving(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isAvailable = profile?.isAvailable ?? profile?.is_available ?? false;
  const rating = Number(profile?.avgRating || profile?.avg_rating || 0).toFixed(1);
  const totalServices = profile?.totalServices || profile?.total_services || 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Mi perfil</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Rating', value: rating + ' ⭐' },
          { label: 'Servicios', value: totalServices },
          { label: 'Radio', value: (profile?.serviceRadiusMiles || profile?.service_radius_miles || 25) + ' mi' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Disponibilidad */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Disponibilidad</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {isAvailable ? 'Estás recibiendo trabajos' : 'No estás recibiendo trabajos'}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`relative w-14 h-7 rounded-full transition-colors ${isAvailable ? 'bg-emerald-600' : 'bg-gray-300'} disabled:opacity-50`}
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isAvailable ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Editar perfil */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-medium text-gray-900 mb-4">Datos personales</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Nombre completo</label>
            <input
              value={form.fullName}
              onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Teléfono</label>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Radio de servicio (millas)</label>
            <input
              type="number"
              min={5}
              max={50}
              value={form.serviceRadiusMiles}
              onChange={e => setForm(p => ({ ...p, serviceRadiusMiles: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full bg-emerald-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
