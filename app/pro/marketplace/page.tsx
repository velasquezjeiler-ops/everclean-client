'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const SERVICE_LABELS: Record<string, string> = {
  HOUSE_CLEANING: 'House Cleaning',
  DEEP_CLEANING: 'Deep Cleaning',
  MOVE_IN_OUT: 'Move In/Out',
  OFFICE_CLEANING: 'Office Cleaning',
  POST_CONSTRUCTION: 'Post Construction',
  CARPET_CLEANING: 'Carpet Cleaning',
  WINDOW_CLEANING: 'Window Cleaning',
};

function getAvailableSlots(scheduledAt: string, hours: number): Date[] {
  const clientTime = new Date(scheduledAt);
  const slots: Date[] = [];
  for (let i = 0; i <= hours + 1; i++) {
    slots.push(new Date(clientTime.getTime() + i * 3600000));
  }
  return slots;
}

export default function ProMarketplace() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [bonusMessage, setBonusMessage] = useState('');
  const [sortBy, setSortBy] = useState<'hours' | 'distance' | 'payout'>('hours');
  const [modal, setModal] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/available/list', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setJobs(data.data || []);
      setHourlyRate(data.hourlyRate || 25);
      setBonusMessage(data.bonusMessage || '');
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openModal(job: any) {
    setModal(job);
    const slots = getAvailableSlots(job.scheduledAt, job.hours);
    setSelectedSlot(slots[0]);
  }

  async function confirmClaim() {
    if (!modal || !selectedSlot) return;
    setClaiming(modal.id);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + modal.id + '/claim', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: selectedSlot.toISOString() })
      });
      const data = await res.json();
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== modal.id));
        setModal(null);
        alert('✅ Job scheduled for ' + selectedSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + '!\nPayout: $' + data.payout);
      } else {
        alert(data.error || 'Could not claim job. Try again.');
      }
    } catch (e) {
      alert('Connection error. Try again.');
    }
    setClaiming(null);
  }

  const sorted = [...jobs].sort((a, b) => {
    if (sortBy === 'hours') return b.hours - a.hours;
    if (sortBy === 'payout') return b.payout - a.payout;
    if (sortBy === 'distance') return (a.distanceMiles || 999) - (b.distanceMiles || 999);
    return 0;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 sm:items-center">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Choose your start time</h3>
              <p className="text-sm text-gray-500 mb-1">
                {SERVICE_LABELS[modal.serviceType] || modal.serviceType} · {modal.hours}h · ${modal.payout.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mb-5">📍 {modal.city}, {modal.state} · {modal.distanceMiles} mi away</p>

              <div className="space-y-2 mb-6">
                {getAvailableSlots(modal.scheduledAt, modal.hours).map((slot, i) => {
                  const isSelected = selectedSlot?.getTime() === slot.getTime();
                  return (
                    <button key={i} onClick={() => setSelectedSlot(slot)}
                      className={'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ' + (isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300')}>
                      <div className="text-left">
                        <p className={'font-semibold text-sm ' + (isSelected ? 'text-emerald-700' : 'text-gray-900')}>
                          {slot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(slot.getTime() + modal.hours * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {slot.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Client time</span>}
                        <span className={'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' + (isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300')}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-amber-50 rounded-xl p-3 mb-5 text-xs text-amber-800">
                ⚠️ Once scheduled, this job cannot be cancelled or rescheduled. Cancellations result in account suspension.
              </div>

              <button onClick={confirmClaim} disabled={claiming === modal.id || !selectedSlot}
                className="w-full bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-800 disabled:opacity-50 mb-2">
                {claiming === modal.id ? 'Scheduling...' : 'Confirm · $' + modal.payout.toFixed(2)}
              </button>
              <button onClick={() => setModal(null)} className="w-full py-2 text-sm text-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Find Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} available · ${hourlyRate}/hr rate</p>
        </div>
        <button onClick={load} className="text-sm text-emerald-700 font-medium px-4 py-2 bg-emerald-50 rounded-xl hover:bg-emerald-100">Refresh</button>
      </div>

      {bonusMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <span>🎁</span>
          <p className="text-sm text-amber-800 font-medium">{bonusMessage}</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="flex gap-2 mb-4">
          {(['hours', 'payout', 'distance'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ' + (sortBy === s ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200')}>
              {s === 'hours' ? '⏱ Hours' : s === 'payout' ? '💰 Payout' : '📍 Distance'}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 font-medium">No jobs available right now</p>
          <p className="text-sm text-gray-400 mt-1">Check back in a few minutes</p>
          <button onClick={load} className="mt-4 text-sm text-emerald-700 font-medium">Refresh</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((job: any) => {
            const serviceLabel = SERVICE_LABELS[job.serviceType] || job.serviceType?.replace(/_/g, ' ') || 'Cleaning';
            const dateStr = new Date(job.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{serviceLabel}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>📅 {dateStr}</span>
                      <span>⏱ {job.hours}h</span>
                      {job.distanceMiles && <span>📍 {job.distanceMiles} mi</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-700">${job.payout.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">${hourlyRate}/hr</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                  <span className="text-emerald-600">📍</span>
                  <span>{job.city}{job.state ? ', ' + job.state : ''} {job.zip || ''}</span>
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {job.sqft && <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">{job.sqft} sqft</span>}
                  {job.frequency && <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">{job.frequency.replace(/_/g, ' ')}</span>}
                  {job.hours >= 4 && <span className="text-xs bg-emerald-50 text-emerald-700 rounded-lg px-2.5 py-1 font-medium">🔥 Big job</span>}
                </div>
                <button onClick={() => openModal(job)}
                  className="w-full bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-800 active:scale-95 transition-all">
                  Schedule this job · ${job.payout.toFixed(2)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
