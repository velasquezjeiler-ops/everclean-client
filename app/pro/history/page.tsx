'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function ProHistory() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API + '/bookings?status=COMPLETED', {
      headers: { Authorization: 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(data => { setJobs(data.data || data || []); setLoading(false); })
    .catch(() => setLoading(false));
  }, []);

  const completed = jobs.filter(j => j.status === 'COMPLETED');
  const total = completed.reduce((sum, j) => sum + Number(j.totalAmount || j.total_amount || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Historial</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-emerald-700">{completed.length}</p>
          <p className="text-sm text-gray-500 mt-1">Servicios completados</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-gray-900">${total.toFixed(0)}</p>
          <p className="text-sm text-gray-500 mt-1">Total ganado</p>
        </div>
      </div>

      {completed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-gray-500">Aún no tienes servicios completados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {completed.map((job: any) => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">{job.address}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {job.city} · {job.serviceType || job.service_type} · {job.sqft} sqft
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(job.scheduledAt || job.scheduled_at).toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{job.totalAmount ? '$' + job.totalAmount : '—'}</p>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Completado</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
