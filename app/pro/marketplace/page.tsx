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

export default function ProMarketplace() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [bonusMessage, setBonusMessage] = useState('');
  const [sortBy, setSortBy] = useState<'hours' | 'distance' | 'payout'>('hours');

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

  async function claim(id: string) {
    setClaiming(id);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + id + '/claim', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
        alert('✅ Job claimed! Check My Jobs tab.');
      } else {
        const err = await res.json();
        alert(err.error || 'Could not claim job. Try again.');
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
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Find Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {jobs.length} available · ${hourlyRate}/hr rate
          </p>
        </div>
        <button onClick={load} className="text-sm text-emerald-700 font-medium px-4 py-2 bg-emerald-50 rounded-xl hover:bg-emerald-100">
          Refresh
        </button>
      </div>

      {/* Bonus banner */}
      {bonusMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <span>🎁</span>
          <p className="text-sm text-amber-800 font-medium">{bonusMessage}</p>
        </div>
      )}

      {/* Sort */}
      {jobs.length > 0 && (
        <div className="flex gap-2 mb-4">
          {(['hours', 'payout', 'distance'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sortBy === s ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200'}`}>
              {s === 'hours' ? '⏱ Hours' : s === 'payout' ? '💰 Payout' : '📍 Distance'}
            </button>
          ))}
        </div>
      )}

      {/* Jobs list */}
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
            const date = new Date(job.scheduledAt);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const serviceLabel = SERVICE_LABELS[job.serviceType] || job.serviceType?.replace(/_/g, ' ') || 'Cleaning';

            return (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                {/* Top row: name + payout */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{serviceLabel}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>📅</span> {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>⏱</span> {job.hours} hr{job.hours > 1 ? 's' : ''}
                      </span>
                      {job.distanceMiles && (
                        <span className="flex items-center gap-1">
                          <span>📍</span> {job.distanceMiles} mi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-700">${job.payout.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">${hourlyRate}/hr</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                  <span className="text-emerald-600">📍</span>
                  <span>{job.city}{job.state ? `, ${job.state}` : ''}</span>
                  {job.zip && <span className="text-gray-400">{job.zip}</span>}
                </div>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {job.sqft && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">
                      {job.sqft} sqft
                    </span>
                  )}
                  {job.frequency && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">
                      {job.frequency.replace(/_/g, ' ')}
                    </span>
                  )}
                  {job.hours >= 4 && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 rounded-lg px-2.5 py-1 font-medium">
                      🔥 Big job
                    </span>
                  )}
                </div>

                {/* Claim button */}
                <button
                  onClick={() => claim(job.id)}
                  disabled={claiming === job.id}
                  className="w-full bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-800 active:scale-95 transition-all disabled:opacity-50"
                >
                  {claiming === job.id ? 'Claiming...' : `Schedule this job · $${job.payout.toFixed(2)}`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
