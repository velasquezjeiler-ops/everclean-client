'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING_ASSIGNMENT: { label: 'Buscando profesional', color: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-50 text-blue-700' },
  IN_PROGRESS: { label: 'En progreso', color: 'bg-purple-50 text-purple-700' },
  COMPLETED: { label: 'Completado', color: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-50 text-red-700' },
};

export default function ClientDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    api.bookings.list(token).then(data => {
      setBookings(data.data || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Mis servicios</h1>
        <Link href="/dashboard/new-booking" className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800">+ Solicitar limpieza</Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-emerald-200 rounded-full"></div>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">No tienes servicios aun</h2>
          <p className="text-gray-500 text-sm mb-6">Solicita tu primera limpieza profesional</p>
          <Link href="/dashboard/new-booking" className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800">Solicitar ahora</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => {
            const st = statusLabels[b.status] || { label: b.status, color: 'bg-gray-50 text-gray-600' };
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{b.serviceType.replace(/_/g, ' ')}</h3>
                    <p className="text-sm text-gray-500">{b.address}, {b.city}, {b.state}</p>
                  </div>
                  <span className={"text-xs px-3 py-1 rounded-full font-medium " + st.color}>{st.label}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Fecha: {new Date(b.scheduledAt).toLocaleDateString()}</span>
                  <span>Frecuencia: {b.frequency}</span>
                  {b.totalAmount && <span className="text-emerald-700 font-medium">Total: ${b.totalAmount}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}