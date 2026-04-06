'use client';
import { useState, useEffect } from 'react';

export default function ProDashboard() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setJobs(data || []))
    .catch(err => console.error("Error cargando servicios:", err));
  }, []);

  const openInGoogleMaps = (address, city) => {
    const q = encodeURIComponent(`${address}, ${city}`);
    // URL corregida para navegación directa
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  const sendETAReport = async (id) => {
    const min = prompt("¿En cuántos minutos llegas?", "15");
    if (min) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}/eta`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ etaValue: min + " min" })
        });
        if (res.ok) alert("🕒 ETA enviado con éxito");
      } catch (err) {
        alert("Error al enviar el ETA");
      }
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Mis Servicios</h1>
      <div className="space-y-4">
        {jobs.length === 0 && <p className="text-gray-400 text-center">No hay servicios asignados.</p>}
        {jobs.map((job: any) => (
          <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                {job.status}
              </span>
              <p className="text-lg font-bold text-gray-900">${job.totalAmount}</p>
            </div>
            
            {/* DIRECCIÓN CON LINK GPS REAL */}
            <div 
              onClick={() => openInGoogleMaps(job.address, job.city)}
              className="bg-gray-50 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors mb-4"
            >
              <p className="text-emerald-600 font-semibold flex items-center gap-2">
                📍 {job.address}
              </p>
              <p className="text-gray-500 text-sm ml-6">{job.city}, {job.state}</p>
            </div>

            {job.status === 'CONFIRMED' && (
              <button 
                onClick={() => sendETAReport(job.id)}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
              >
                🕒 Reportar ETA
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
