'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: 'Asignado a ti', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Completado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function ProDashboard() {
  const [assignedBookings, setAssignedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchMyBookings(); }, []);

  async function fetchMyBookings() {
    const token = localStorage.getItem('token') || '';
    try {
      const data = await api.bookings.list(token);
      const proProfileRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } });
      const proProfile = await proProfileRes.json();

      const myJobs = (data.data || []).filter((b: any) => 
        b.professionals?.some((p: any) => p.professionalId === proProfile.id) &&
        ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
      );
      setAssignedBookings(myJobs);
    } catch (err: any) {
      setError('Error cargando tus trabajos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(bookingId: string, newStatus: string) {
    setActionLoading(bookingId);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/bookings/' + bookingId + '/' + (newStatus === 'IN_PROGRESS' ? 'checkin' : 'checkout'), {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('No se pudo actualizar el estado');
      await fetchMyBookings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900">Mis Trabajos Asignados</h1></div>
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">{error}</div>}
      {loading ? <div className="text-center py-12 text-gray-400">Cargando tu agenda...</div>
      : assignedBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Agenda despejada</h2>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignedBookings.map((job) => {
            const statusInfo = statusConfig[job.status] || { label: job.status, color: 'bg-gray-100 text-gray-600' };
            return (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color} mb-3`}>{statusInfo.label}</span>
                      <h3 className="text-xl font-semibold text-gray-900">{job.serviceType?.replace(/_/g, ' ')}</h3>
                      <p className="text-gray-500 text-sm mt-1">{job.company?.name || 'Cliente'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-700">${job.totalAmount}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 my-4">
                    <div><p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Fecha</p><p className="text-sm font-medium text-gray-900">{new Date(job.scheduledAt).toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Dirección</p><p className="text-sm font-medium text-gray-900">{job.address}, {job.city}</p></div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    {job.status === 'CONFIRMED' && (
                      <button onClick={() => handleStatusChange(job.id, 'IN_PROGRESS')} disabled={actionLoading === job.id} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                        {actionLoading === job.id ? 'Procesando...' : '📍 Hacer Check-in'}
                      </button>
                    )}
                    {job.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleStatusChange(job.id, 'COMPLETED')} disabled={actionLoading === job.id} className="flex-1 bg-purple-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                        {actionLoading === job.id ? 'Procesando...' : '✅ Finalizar Servicio'}
                      </button>
                    )}
                    {job.status === 'COMPLETED' && (
                      <div className="flex-1 text-center py-3 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">Servicio Completado</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}