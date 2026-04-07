'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ProMarketplace() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings?status=PENDING_ASSIGNMENT&limit=20', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setJobs(data.data || data || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function accept(id: string) {
    setAccepting(id);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + id + '/accept', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
        alert('✅ Trabajo aceptado — aparecerá en Mis Trabajos');
      } else {
        alert('No se pudo aceptar. Intenta de nuevo.');
      }
    } catch (e) {}
    setAccepting(null);
  }

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
          <h1 className="text-2xl font-semibold text-gray-900">Trabajos disponibles</h1>
          <p className="text-sm text-gray-500 mt-1">{pending.length} en tu zona</p>
        </div>
        <button onClick={load} className="text-sm text-emerald-700 hover:text-emerald-800 font-medium px-4 py-2 bg-emerald-50 rounded-xl">
          Actualizar
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 font-medium">No hay trabajos disponibles ahora</p>
          <p className="text-sm text-gray-400 mt-1">Vuelve a revisar en unos minutos</p>
          <button onClick={load} className="mt-4 text-sm text-emerald-700 font-medium">Actualizar</button>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((job: any) => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">{job.serviceType?.replace(/_/g, ' ') || job.service_type}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(job.scheduledAt || job.scheduled_at).toLocaleDateString('es-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {(job.totalAmount || job.total_amount) && (
                  <p className="text-xl font-bold text-emerald-700">${job.totalAmount || job.total_amount}</p>
                )}
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                <span className="text-emerald-600 mt-0.5">📍</span>
                <span>{job.address}, {job.city}</span>
              </div>

              <div className="flex gap-2 flex-wrap mb-5">
                <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-3 py-1.5">{job.sqft} sqft</span>
                <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-3 py-1.5">{job.frequency}</span>
              </div>

              <button
                onClick={() => accept(job.id)}
                disabled={accepting === job.id}
                className="w-full bg-emerald-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-800 active:scale-95 transition-all disabled:opacity-50"
              >
                {accepting === job.id ? 'Aceptando...' : '✋ Aceptar este trabajo'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
