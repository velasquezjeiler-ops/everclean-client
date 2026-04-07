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

// Duración estimada por sqft
function estimatedHours(sqft: number): number {
  if (sqft <= 1000) return 2;
  if (sqft <= 2000) return 3;
  if (sqft <= 3500) return 4;
  return 5;
}

// Calcula minutos extra sobre la duración estimada
function overtimeMinutes(job: any): number {
  if (!job.checkInAt) return 0;
  const checkIn = new Date(job.checkInAt).getTime();
  const estimated = estimatedHours(Number(job.sqft || 1000)) * 60 * 60 * 1000;
  const elapsed = Date.now() - checkIn;
  const diff = elapsed - estimated;
  return diff > 0 ? Math.floor(diff / 60000) : 0;
}

interface OvertimeModal {
  jobId: string;
  extraMinutes: number;
  hourlyRate: number;
}

interface ETAState {
  jobId: string;
  minutes: number | null;
  loading: boolean;
}

export default function ProDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [overtimeModal, setOvertimeModal] = useState<OvertimeModal | null>(null);
  const [overtimeHours, setOvertimeHours] = useState(1);
  const [etaMap, setEtaMap] = useState<Record<string, ETAState>>({});
  const [proHourlyRate, setProHourlyRate] = useState(45);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const [bookingsRes, profileRes] = await Promise.all([
        fetch(API + '/bookings', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } })
      ]);
      const bookingsData = await bookingsRes.json();
      const profileData = await profileRes.json();
      setJobs(bookingsData.data || bookingsData || []);
      setProHourlyRate(Number(profileData.hourlyRate || profileData.hourly_rate || 45));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Actualizar timer cada minuto para trabajos en curso
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prev => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ETA automático con GPS del browser
  async function calculateETA(job: any) {
    setEtaMap(prev => ({ ...prev, [job.id]: { jobId: job.id, minutes: null, loading: true } }));
    
    if (!navigator.geolocation) {
      setEtaMap(prev => ({ ...prev, [job.id]: { jobId: job.id, minutes: -1, loading: false } }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const dest = encodeURIComponent(`${job.address}, ${job.city}, ${job.state}`);
        const origin = `${latitude},${longitude}`;
        
        try {
          // Estimación por distancia lineal (sin API key requerida)
          const destRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${dest}&format=json&limit=1`
          );
          const destData = await destRes.json();
          
          if (destData.length > 0) {
            const destLat = parseFloat(destData[0].lat);
            const destLng = parseFloat(destData[0].lon);
            
            // Haversine distance
            const R = 3959; // miles
            const dLat = (destLat - latitude) * Math.PI / 180;
            const dLng = (destLng - longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(latitude * Math.PI/180) * Math.cos(destLat * Math.PI/180) * Math.sin(dLng/2)**2;
            const distMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            
            // Velocidad promedio en NJ: 25mph en ciudad, 45mph en carretera
            const speed = distMiles < 5 ? 20 : 35;
            const minutes = Math.round((distMiles / speed) * 60);
            
            setEtaMap(prev => ({ ...prev, [job.id]: { jobId: job.id, minutes, loading: false } }));
          } else {
            setEtaMap(prev => ({ ...prev, [job.id]: { jobId: job.id, minutes: -1, loading: false } }));
          }
        } catch {
          setEtaMap(prev => ({ ...prev, [job.id]: { jobId: job.id, minutes: -1, loading: false } }));
        }
      },
      () => {
        setEtaMap(prev => ({ ...prev, [job.id]: { jobId: job.id, minutes: -1, loading: false } }));
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

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
        setJobs(prev => prev.map(j => j.id === id
          ? { ...j, status: 'IN_PROGRESS', checkInAt: new Date().toISOString() }
          : j
        ));
      }
    } catch (e) {}
    setActing(null);
  }

  async function initiateCheckout(job: any) {
    const extra = overtimeMinutes(job);
    // Si hay más de 20 min extra, mostrar modal de horas adicionales
    if (extra > 20) {
      setOvertimeHours(Math.ceil(extra / 60));
      setOvertimeModal({ jobId: job.id, extraMinutes: extra, hourlyRate: proHourlyRate });
    } else {
      await doCheckout(job.id, 0);
    }
  }

  async function doCheckout(id: string, extraHours: number) {
    setActing(id);
    setOvertimeModal(null);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + id + '/checkout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraHours, extraAmount: extraHours * proHourlyRate })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'COMPLETED' } : j));
      }
    } catch (e) {}
    setActing(null);
  }

  const active = jobs.filter(j => ['CONFIRMED','IN_PROGRESS'].includes(j.status));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Overtime Modal */}
      {overtimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <p className="text-3xl mb-2">⏰</p>
              <h3 className="text-lg font-semibold text-gray-900">Tiempo adicional detectado</h3>
              <p className="text-sm text-gray-500 mt-1">
                Llevas {overtimeModal.extraMinutes} minutos extra sobre el tiempo estimado
              </p>
            </div>
            
            <div className="bg-amber-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-amber-700 font-medium mb-2">¿Necesitas horas adicionales?</p>
              <p className="text-xs text-amber-600">
                El cliente recibirá una notificación para autorizar el cargo. 
                Si no autoriza, el checkout procede sin cobro extra.
              </p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Horas extra</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setOvertimeHours(h => Math.max(1, h - 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                <span className="text-lg font-bold w-8 text-center">{overtimeHours}</span>
                <button onClick={() => setOvertimeHours(h => Math.min(8, h + 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5 flex justify-between">
              <span className="text-sm text-gray-600">Cargo adicional al cliente</span>
              <span className="font-bold text-gray-900">${(overtimeHours * overtimeModal.hourlyRate).toFixed(0)}</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => doCheckout(overtimeModal.jobId, overtimeHours)}
                className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium text-sm hover:bg-emerald-800"
              >
                Solicitar {overtimeHours}h extra — ${(overtimeHours * overtimeModal.hourlyRate).toFixed(0)}
              </button>
              <button
                onClick={() => doCheckout(overtimeModal.jobId, 0)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-200"
              >
                Terminar sin horas extra
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mis trabajos</h1>
          <p className="text-sm text-gray-500 mt-1">{active.length} activos</p>
        </div>
        <button onClick={load} className="text-sm text-emerald-700 font-medium px-4 py-2 bg-emerald-50 rounded-xl">
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
        {jobs.map((job: any) => {
          const eta = etaMap[job.id];
          const extra = job.status === 'IN_PROGRESS' ? overtimeMinutes(job) : 0;
          const estHours = estimatedHours(Number(job.sqft || 1000));

          return (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              {/* Status + amount */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[job.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[job.status] || job.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(job.scheduledAt || job.scheduled_at).toLocaleDateString('es-US', {
                      weekday: 'long', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
                {(job.totalAmount || job.total_amount) && (
                  <p className="text-xl font-bold text-gray-900">
                    ${job.totalAmount || job.total_amount}
                  </p>
                )}
              </div>

              {/* Tiempo en curso */}
              {job.status === 'IN_PROGRESS' && job.checkInAt && (
                <div className={`rounded-xl p-3 mb-4 ${extra > 20 ? 'bg-red-50 border border-red-200' : 'bg-purple-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-medium ${extra > 20 ? 'text-red-700' : 'text-purple-700'}`}>
                        {extra > 20 ? '⚠️ Tiempo extra: ' + extra + ' min' : '🕐 En progreso'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Duración estimada: {estHours}h
                      </p>
                    </div>
                    {extra > 20 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-medium">
                        +{Math.ceil(extra/60)}h extra
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Dirección + GPS */}
              <div
                onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((job.address || '') + ', ' + (job.city || '')), '_blank')}
                className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-emerald-50 transition-colors mb-3"
              >
                <span className="text-emerald-600 mt-0.5 text-lg">📍</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{job.address}</p>
                  <p className="text-gray-500 text-xs">{job.city}, {job.state}</p>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Ver mapa →</span>
              </div>

              {/* ETA */}
              {job.status === 'CONFIRMED' && (
                <div className="mb-4">
                  {!eta ? (
                    <button
                      onClick={() => calculateETA(job)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      🧭 Calcular tiempo de llegada (ETA)
                    </button>
                  ) : eta.loading ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 rounded-xl">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">Calculando ETA...</span>
                    </div>
                  ) : eta.minutes === -1 ? (
                    <div className="py-2.5 bg-amber-50 rounded-xl text-center">
                      <p className="text-xs text-amber-700">Activa la ubicación para ver el ETA</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-2.5 px-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">🚗</span>
                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            {eta.minutes! < 60
                              ? eta.minutes + ' min de llegada'
                              : Math.floor(eta.minutes! / 60) + 'h ' + (eta.minutes! % 60) + 'min'}
                          </p>
                          <p className="text-xs text-blue-600">ETA automático · GPS activo</p>
                        </div>
                      </div>
                      <button onClick={() => calculateETA(job)} className="text-xs text-blue-600 hover:text-blue-800">
                        Actualizar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Detalles */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-5">
                <span className="bg-gray-100 rounded-lg px-3 py-1.5">{job.serviceType || job.service_type}</span>
                <span className="bg-gray-100 rounded-lg px-3 py-1.5">{job.sqft} sqft</span>
                <span className="bg-gray-100 rounded-lg px-3 py-1.5">~{estimatedHours(Number(job.sqft || 1000))}h estimadas</span>
                {job.frequency && <span className="bg-gray-100 rounded-lg px-3 py-1.5">{job.frequency}</span>}
              </div>

              {/* Acciones */}
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
                  onClick={() => initiateCheckout(job)}
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
          );
        })}
      </div>
    </div>
  );
}
