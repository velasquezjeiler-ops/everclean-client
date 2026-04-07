'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS_LABEL: Record<string, string> = {
  PENDING_ASSIGNMENT: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING_ASSIGNMENT: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function ProDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(API + '/bookings', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setJobs(data.data || data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function checkIn(id: string) {
    setActing(id);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + id + '/checkin', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 0, lng: 0 })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'IN_PROGRESS' } : j));
      }
    } catch (e) {}
    setActing(null);
  }

  async function checkOut(id: string) {
    setActing(id);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + id + '/checkout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'COMPLETED' } : j));
      }
    } catch (e) {}
    setActing(null);
  }

  const active = jobs.filter(j => ['CONFIRMED','IN_PROGRESS'].includes(j.status));
  const pending = jobs.filter(j => j.status === 'PENDING_ASSIGNMENT');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mis trabajos</h1>
          <p className="text-sm text-gray-500 mt-1">{active.length} activos · {pending.length} pendientes</p>
        </div>
        <button onClick={load} className="text-sm text-emerald-700 hover:text-emerald-800 font-medium px-4 py-2 bg-emerald-50 rounded-xl">
          Actualizar
        </button>
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-4xl mb-3">🧹</p>
          <p className="text-gray-500">No tienes trabajos asignados aún</p>
        </div>
      )}

      <div className="space-y-4">
        {jobs.map((job: any) => (
          <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[job.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[job.status] || job.status}
                </span>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(job.scheduledAt || job.scheduled_at).toLocaleDateString('es-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              {(job.totalAmount || job.total_amount) && (
                <p className="text-xl font-bold text-gray-900">${job.totalAmount || job.total_amount}</p>
              )}
            </div>

            <div
              onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((job.address || '') + ', ' + (job.city || '')), '_blank')}
              className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-emerald-50 transition-colors mb-4"
            >
              <span className="text-emerald-600 mt-0.5">📍</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">{job.address}</p>
                <p className="text-gray-500 text-xs">{job.city}, {job.state}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-5">
              <span className="bg-gray-100 rounded-lg px-3 py-1.5">{job.serviceType || job.service_type}</span>
              <span className="bg-gray-100 rounded-lg px-3 py-1.5">{job.sqft} sqft</span>
              {job.frequency && <span className="bg-gray-100 rounded-lg px-3 py-1.5">{job.frequency}</span>}
            </div>

            {job.status === 'CONFIRMED' && (
              <button
                onClick={() => checkIn(job.id)}
                disabled={acting === job.id}
                className="w-full bg-emerald-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-800 active:scale-95 transition-all disabled:opacity-50"
              >
                {acting === job.id ? 'Procesando...' : '✅ Iniciar servicio — Check-in'}
              </button>
            )}

            {job.status === 'IN_PROGRESS' && (
              <button
                onClick={() => checkOut(job.id)}
                disabled={acting === job.id}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {acting === job.id ? 'Procesando...' : '🏁 Finalizar servicio — Check-out'}
              </button>
            )}

            {job.status === 'COMPLETED' && (
              <div className="w-full text-center py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
                ✓ Servicio completado
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
