'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-blue-500',
  IN_PROGRESS: 'bg-purple-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const SERVICE_LABELS: Record<string, string> = {
  HOUSE_CLEANING: 'House Cleaning',
  DEEP_CLEANING: 'Deep Cleaning',
  MOVE_IN_OUT: 'Move In/Out',
  OFFICE_CLEANING: 'Office Cleaning',
  POST_CONSTRUCTION: 'Post Construction',
};

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function ProDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [view, setView] = useState<'week' | 'list'>('week');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/professionals/me/bookings', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setBookings(data.data || data || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const weekDays = getWeekDays(weekBase);

  function bookingsForDay(day: Date) {
    return bookings.filter(b => {
      const d = new Date(b.scheduledAt || b.scheduled_at);
      return d.toDateString() === day.toDateString();
    });
  }

  function bookingsForSelectedDay() {
    if (!selectedDay) return [];
    return bookingsForDay(selectedDay);
  }

  const today = new Date();

  const stats = {
    upcoming: bookings.filter(b => ['CONFIRMED'].includes(b.status) && new Date(b.scheduledAt || b.scheduled_at) >= today).length,
    inProgress: bookings.filter(b => b.status === 'IN_PROGRESS').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    earnings: bookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + Number(b.payoutAmount || b.payout_amount || 0), 0),
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Jobs</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setView('week')} className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' + (view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
            📅 Week
          </button>
          <button onClick={() => setView('list')} className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' + (view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
            📋 List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Upcoming', value: stats.upcoming, color: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'In Progress', value: stats.inProgress, color: 'bg-purple-50', text: 'text-purple-700' },
          { label: 'Completed', value: stats.completed, color: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'Earnings', value: '$' + stats.earnings.toFixed(0), color: 'bg-amber-50', text: 'text-amber-700' },
        ].map(s => (
          <div key={s.label} className={'rounded-2xl p-3 text-center ' + s.color}>
            <p className={'text-lg font-bold ' + s.text}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {view === 'week' ? (
        <div>
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">‹</button>
            <p className="text-sm font-medium text-gray-700">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">›</button>
          </div>

          {/* Week grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day, i) => {
              const dayBookings = bookingsForDay(day);
              const isToday = day.toDateString() === today.toDateString();
              const isSelected = selectedDay?.toDateString() === day.toDateString();
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return (
                <button key={i} onClick={() => setSelectedDay(day)}
                  className={'rounded-xl p-2 text-center transition-colors ' + (isSelected ? 'bg-emerald-700' : isToday ? 'bg-emerald-50' : 'bg-white border border-gray-200 hover:border-emerald-300')}>
                  <p className={'text-xs font-medium mb-1 ' + (isSelected ? 'text-emerald-200' : 'text-gray-400')}>{dayNames[i]}</p>
                  <p className={'text-sm font-bold ' + (isSelected ? 'text-white' : isToday ? 'text-emerald-700' : 'text-gray-900')}>{day.getDate()}</p>
                  {dayBookings.length > 0 && (
                    <div className="flex justify-center mt-1 gap-0.5">
                      {dayBookings.slice(0, 3).map((_, j) => (
                        <div key={j} className={'w-1.5 h-1.5 rounded-full ' + (isSelected ? 'bg-emerald-300' : 'bg-emerald-500')} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day jobs */}
          {selectedDay && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-3">
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {bookingsForSelectedDay().length > 0 ? ` · ${bookingsForSelectedDay().length} job${bookingsForSelectedDay().length > 1 ? 's' : ''}` : ' · No jobs'}
              </p>
              {bookingsForSelectedDay().length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-gray-200 border-dashed">
                  <p className="text-gray-400 text-sm">No jobs scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookingsForSelectedDay().sort((a, b) => new Date(a.scheduledAt || a.scheduled_at).getTime() - new Date(b.scheduledAt || b.scheduled_at).getTime()).map((b: any) => (
                    <JobCard key={b.id} booking={b} onRefresh={load} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-4xl mb-3">🧹</p>
              <p className="text-gray-600 font-medium">No jobs yet</p>
              <p className="text-sm text-gray-400 mt-1">Find jobs in the Find Jobs tab</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings
                .sort((a, b) => new Date(a.scheduledAt || a.scheduled_at).getTime() - new Date(b.scheduledAt || b.scheduled_at).getTime())
                .map((b: any) => <JobCard key={b.id} booking={b} onRefresh={load} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JobCard({ booking: b, onRefresh }: { booking: any; onRefresh: () => void }) {
  const [acting, setActing] = useState(false);
  const scheduledAt = new Date(b.scheduledAt || b.scheduled_at);
  const sqft = Number(b.sqft || 0);
  const hours = Math.max(2, Math.ceil(sqft / 400));
  const endTime = new Date(scheduledAt.getTime() + hours * 3600000);
  const statusColor = STATUS_COLORS[b.status] || 'bg-gray-400';
  const statusLabel = STATUS_LABELS[b.status] || b.status;
  const serviceLabel = SERVICE_LABELS[b.serviceType || b.service_type] || (b.serviceType || b.service_type)?.replace(/_/g, ' ');

  async function checkIn() {
    setActing(true);
    const token = localStorage.getItem('token') || '';
    await fetch(API + '/bookings/' + b.id + '/checkin', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    onRefresh();
    setActing(false);
  }

  async function checkOut() {
    setActing(true);
    const token = localStorage.getItem('token') || '';
    await fetch(API + '/bookings/' + b.id + '/checkout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    onRefresh();
    setActing(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={'w-3 h-3 rounded-full flex-shrink-0 ' + statusColor} />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{serviceLabel}</p>
            <p className="text-xs text-gray-400">{statusLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-700">
            {scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-400">{hours}h</p>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        <p>📍 {b.address || ''}{b.city ? ', ' + b.city : ''}</p>
        <p className="mt-0.5">📅 {scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>

      {b.status === 'CONFIRMED' && (
        <button onClick={checkIn} disabled={acting}
          className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
          {acting ? 'Updating...' : '▶ Start Job (Check In)'}
        </button>
      )}
      {b.status === 'IN_PROGRESS' && (
        <button onClick={checkOut} disabled={acting}
          className="w-full bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
          {acting ? 'Updating...' : '✓ Complete Job (Check Out)'}
        </button>
      )}
      {b.status === 'COMPLETED' && (
        <div className="text-center py-2 text-xs text-emerald-600 font-medium">✓ Completed</div>
      )}
    </div>
  );
}

