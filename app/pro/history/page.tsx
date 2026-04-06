'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ProHistory() {
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    const token = localStorage.getItem('token') || '';
    try {
      const data = await api.bookings.list(token);
      const proProfileRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } });
      const proProfile = await proProfileRes.json();

      const myHistory = (data.data || []).filter((b: any) => 
        b.professionals?.some((p: any) => p.professionalId === proProfile.id) &&
        b.status === 'COMPLETED'
      );
      setCompletedJobs(myHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.totalAmount) || 0), 0);

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Historial y Ganancias</h1>
          <p className="text-gray-500 mt-1">Tus servicios completados.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Generado</p>
          <p className="text-3xl font-bold text-emerald-700">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {loading ? <p className="text-gray-400">Cargando historial...</p> : completedJobs.length === 0 ? (
        <p className="text-gray-500">Aún no has completado ningún servicio.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3 font-medium text-gray-600">Servicio</th>
                <th className="px-4 py-3 font-medium text-gray-600">Ciudad</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {completedJobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(job.scheduledAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{job.serviceType?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{job.city}</td>
                  <td className="px-4 py-3 text-emerald-700 font-medium text-right">${job.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}