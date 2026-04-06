'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ProMarketplace() {
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAvailableJobs(); }, []);

  async function fetchAvailableJobs() {
    const token = localStorage.getItem('token') || '';
    try {
      // Obtenemos todos los bookings
      const data = await api.bookings.list(token);
      
      // Filtramos solo los que están PENDING_ASSIGNMENT
      const pendingJobs = (data.data || []).filter((b: any) => b.status === 'PENDING_ASSIGNMENT');
      setAvailableJobs(pendingJobs);
    } catch (err: any) {
      setError('Error cargando trabajos disponibles: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // En la Fase 2, esta función enviará una solicitud al backend para tomar el trabajo.
  // Por ahora, solo muestra un mensaje de que el Admin debe asignarlo.
  function handleRequestJob(jobId: string) {
    alert('Esta funcionalidad estará disponible en la Fase 2. Por ahora, contacta al Administrador para que te asigne este trabajo (ID: ' + jobId + ').');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Trabajos Disponibles</h1>
        <p className="text-gray-500 mt-1">Encuentra nuevos servicios cerca de ti y llena tu agenda.</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Buscando oportunidades...</div>
      ) : availableJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">No hay trabajos nuevos</h2>
          <p className="text-gray-500 text-sm">Vuelve más tarde, ¡siempre entran nuevas solicitudes!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {availableJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 mb-3">
                      Buscando Profesional
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">{job.serviceType?.replace(/_/g, ' ')}</h3>
                    <p className="text-gray-500 text-sm mt-1">{job.city}, {job.state}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-700">${job.totalAmount}</div>
                    <div className="text-xs text-gray-400 mt-1">Pago Estimado</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100 mt-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Fecha</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(job.scheduledAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Tamaño</p>
                    <p className="text-sm font-medium text-gray-900">{job.sqft} sqft</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestJob(job.id)}
                  className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Solicitar este trabajo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}