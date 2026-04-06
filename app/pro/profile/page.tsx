'use client';
import { useEffect, useState } from 'react';

export default function ProProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(process.env.NEXT_PUBLIC_API_URL + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => { setProfile(data); setLoading(false); });
  }, []);

  if (loading) return <p>Cargando perfil...</p>;
  if (!profile || profile.error) return <p>Error cargando perfil.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Mi Perfil</h1>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div><label className="text-sm text-gray-500">Nombre Completo</label><p className="font-medium text-lg">{profile.fullName}</p></div>
        <div><label className="text-sm text-gray-500">Email</label><p>{profile.email}</p></div>
        <div><label className="text-sm text-gray-500">Teléfono</label><p>{profile.phone || 'No registrado'}</p></div>
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-medium text-gray-900 mb-2">Métricas de Calidad</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs text-gray-500 mb-1">Rating</p><p className="text-xl font-bold text-gray-900">★ {Number(profile.avgRating).toFixed(1)}</p></div>
            <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs text-gray-500 mb-1">Trabajos</p><p className="text-xl font-bold text-gray-900">{profile.totalServices}</p></div>
            <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs text-gray-500 mb-1">Verificación</p><p className="text-sm font-bold text-emerald-600">{profile.backgroundChecked ? 'Aprobada' : 'Pendiente'}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}