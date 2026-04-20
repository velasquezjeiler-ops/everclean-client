use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

function formatService(raw: string): string {
  const MAP: Record<string,string> = {
    HOUSE_CLEANING:'House Cleaning', DEEP_CLEANING:'Deep Cleaning', MOVE_IN_OUT:'Move In/Out',
    OFFICE_CLEANING:'Office Cleaning', COMMERCIAL_CLEANING:'Commercial', POST_CONSTRUCTION:'Post Construction',
    MEDICAL_CLEANING:'Medical / Clinic', APARTMENT_CLEANING:'Apartment', SAME_DAY_CLEANING:'Same Day',
    STANDARD_CLEANING:'Standard Cleaning', ONE_TIME:'One-Time', MAID_SERVICES:'Maid Services',
  };
  return MAP[raw] || raw?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Service';
}

export default function ProMarketplace() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [bonusMsg, setBonusMsg] = useState('');
  const [sortBy, setSortBy] = useState<'hours'|'payout'|'distance'>('hours');
  const [claiming, setClaiming] = useState<string|null>(null);
  const [scheduleModal, setScheduleModal] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string|null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings/available', { headers: { Authorization: 'Bearer '+token } });
      const data = await res.json();
      setJobs(data.data || []);
      setHourlyRate(data.hourlyRate || 25);
      setBonusMsg(data.bonusMessage || '');
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function claimJob(jobId: string, scheduledAt?: string) {
    setClaiming(jobId);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API+'/bookings/'+jobId+'/claim', {
        method: 'POST',
        headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Job scheduled for ${new Date(data.scheduledAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}!\nPayout: $${data.payout}`);
        setScheduleModal(null);
        load();
      } else {
        alert('Error: ' + (data.error || 'Could not claim'));
      }
    } catch(e) { alert('Error claiming job'); }
    setClaiming(null);
  }

  function openScheduleModal(job: any) {
    setScheduleModal(job);
    setSelectedTime(job.scheduledAt);
  }

  function getTimeSlots(job: any) {
    const clientTime = new Date(job.scheduledAt);
    const hours = job.hours || 2;
    const slots = [];
    for (let i = 0; i <= hours + 1; i++) {
      const t = new Date(clientTime.getTime() + i * 3600000);
      const end = new Date(t.getTime() + hours * 3600000);
      slots.push({
        time: t.toISOString(),
        label: t.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) + ' – ' + end.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
        day: t.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}),
        isClient: i === 0,
      });
    }
    return slots;
  }

  const sorted = [...jobs].sort((a,b) => {
    if (sortBy === 'payout') return b.payout - a.payout;
    if (sortBy === 'distance') return (a.distanceMiles||999) - (b.distanceMiles||999);
    return b.hours - a.hours;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Find Jobs</h1>
          <p className="text-sm text-gray-500">{jobs.length} available · ${hourlyRate}/hr rate</p>
        </div>
        <button onClick={load} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Refresh</button>
      </div>

      {bonusMsg && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-sm text-amber-700">
          🎁 {bonusMsg}
        </div>
      )}

      {/* Sort buttons */}
      <div className="flex gap-2 mb-4">
        {([
          {id:'hours' as const, label:'Hours', icon:'⏱'},
          {id:'payout' as const, label:'Payout', icon:'💰'},
          {id:'distance' as const, label:'Distance', icon:'📍'},
        ]).map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sortBy===s.id ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Jobs list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 font-medium">No jobs available right now</p>
          <p className="text-sm text-gray-400 mt-1">Check back soon or expand your service radius</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{formatService(job.serviceType)}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    📅 {new Date(job.scheduledAt).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
                    <span className="text-gray-300">·</span>
                    ⏱ {job.hours}h
                    {job.distanceMiles != null && <>
                      <span className="text-gray-300">·</span>
                      📍 {job.distanceMiles} mi
                    </>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-700">${job.payout?.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">${hourlyRate}/hr</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-1">📍 {job.address}{job.city ? ', '+job.city : ''}{job.state ? ' '+job.state : ''}{job.zip ? ' '+job.zip : ''}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">{job.sqft?.toFixed(0) || '?'} sqft</span>
                <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">{job.frequency || 'ONE TIME'}</span>
                {job.hours >= 4 && <span className="text-xs bg-amber-50 text-amber-700 rounded-md px-2 py-0.5">🔥 Big job</span>}
              </div>

              {job.clientNotes && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">📝 {job.clientNotes}</p>
              )}

              <button onClick={() => openScheduleModal(job)} disabled={claiming === job.id}
                className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-all">
                {claiming === job.id ? 'Scheduling...' : `Schedule this job · $${job.payout?.toFixed(2)}`}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Schedule modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-1">Choose your start time</h3>
            <p className="text-sm text-gray-500 mb-1">{formatService(scheduleModal.serviceType)} · {scheduleModal.hours}h · ${scheduleModal.payout?.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mb-4">📍 {scheduleModal.address}{scheduleModal.city ? ', '+scheduleModal.city : ''}{scheduleModal.distanceMiles != null ? ' · '+scheduleModal.distanceMiles+' mi away' : ''}</p>

            <div className="space-y-2 mb-4">
              {getTimeSlots(scheduleModal).map((slot,i) => (
                <button key={i} onClick={() => setSelectedTime(slot.time)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${selectedTime === slot.time ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{slot.label}</p>
                      <p className="text-xs text-gray-400">{slot.day}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.isClient && <span className="text-xs text-emerald-600 font-medium">Client time</span>}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTime === slot.time ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                        {selectedTime === slot.time && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
              ⚠️ Once scheduled, this job cannot be cancelled or rescheduled. Cancellations result in account suspension.
            </div>

            <button onClick={() => claimJob(scheduleModal.id, selectedTime || undefined)}
              disabled={claiming === scheduleModal.id}
              className="w-full bg-emerald-700 text-white py-3 rounded-xl font-medium hover:bg-emerald-800 disabled:opacity-50">
              {claiming === scheduleModal.id ? 'Scheduling...' : 'Confirm schedule'}
            </button>
            <button onClick={() => setScheduleModal(null)} className="w-full mt-2 text-gray-400 text-sm py-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
