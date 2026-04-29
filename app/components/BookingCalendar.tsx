'use client';

import { useState, useRef } from 'react';

// ─── TYPES ──────────────────────────────────────────────────
interface Booking {
  id: string;
  service_type: string;
  scheduled_date: string; // ISO yyyy-mm-dd
  scheduled_time: string;
  address?: string;
  status: string;
  client_price?: number;
  payout_amount?: number;
  hours?: number;
}

interface BookingCalendarProps {
  bookings: Booking[];
  role?: 'client' | 'professional';
}

// ─── HELPERS ────────────────────────────────────────────────
const SERVICE_LABELS: Record<string, string> = {
  HOUSE_CLEANING:    'House Cleaning',
  DEEP_CLEANING:     'Deep Cleaning',
  MOVE_IN_OUT:       'Move In/Out',
  SAME_DAY_CLEANING: 'Same Day',
  OFFICE_CLEANING:   'Office Cleaning',
  POST_CONSTRUCTION: 'Post Construction',
  MEDICAL_CLEANING:  'Medical',
  CARPET_CLEANING:   'Carpet',
  WINDOW_CLEANING:   'Windows',
  ORGANIZING:        'Organizing',
  CAR_WASH:          'Car Wash',
  LAUNDRY_PICKUP:    'Laundry',
  DRY_CLEANING:      'Dry Cleaning',
};

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  claimed:     'bg-blue-100 text-blue-800 border-blue-200',
  checked_in:  'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed:   'bg-green-100 text-green-800 border-green-200',
  cancelled:   'bg-red-100 text-red-800 border-red-200',
};

const DOT_COLORS: Record<string, string> = {
  pending:    'bg-yellow-400',
  claimed:    'bg-blue-500',
  checked_in: 'bg-indigo-500',
  completed:  'bg-green-500',
  cancelled:  'bg-red-400',
};

function toYMD(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── COMPONENT ──────────────────────────────────────────────
export default function BookingCalendar({ bookings, role = 'client' }: BookingCalendarProps) {
  const today       = new Date();
  const [viewDate, setViewDate] = useState(today); // month in view
  const [selected,  setSelected] = useState(toYMD(today));
  const scrollRef   = useRef<HTMLDivElement>(null);

  // Build calendar grid for current month
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startPad  = firstDay.getDay(); // 0=Sun

  // All days to render (padding + actual days)
  const days: (string | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return toYMD(d);
    }),
  ];

  // Index bookings by date
  const byDate: Record<string, Booking[]> = {};
  for (const b of bookings) {
    if (!byDate[b.scheduled_date]) byDate[b.scheduled_date] = [];
    byDate[b.scheduled_date].push(b);
  }

  const selectedBookings = byDate[selected] ?? [];

  // Week strip (7 days starting from today) for mobile quick nav
  const weekDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 3); // 3 days back, 10 forward
    return toYMD(d);
  });

  return (
    <div className="space-y-4">
      {/* ── MONTH NAVIGATOR ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-bold text-gray-800 text-lg">
          {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* ── WEEK STRIP (mobile quick nav) ── */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {weekDays.map(ymd => {
          const [y, m, d] = ymd.split('-').map(Number);
          const dayObj    = new Date(y, m - 1, d);
          const isToday   = ymd === toYMD(today);
          const isSel     = ymd === selected;
          const hasBkgs   = (byDate[ymd]?.length ?? 0) > 0;

          return (
            <button
              key={ymd}
              onClick={() => {
                setSelected(ymd);
                setViewDate(new Date(y, m - 1, 1));
              }}
              className={`flex-shrink-0 w-12 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                isSel
                  ? 'bg-gradient-to-b from-blue-600 to-green-500 text-white shadow-lg'
                  : isToday
                  ? 'bg-blue-50 border-2 border-blue-300 text-blue-700'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              <span className="text-xs font-medium opacity-70">
                {dayObj.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
              </span>
              <span className="text-base font-bold">{d}</span>
              {hasBkgs && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-blue-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── FULL MONTH GRID ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((ymd, idx) => {
            if (!ymd) return <div key={`pad-${idx}`} className="h-10" />;
            const [, , dd] = ymd.split('-');
            const isSel    = ymd === selected;
            const isToday  = ymd === toYMD(today);
            const dayBkgs  = byDate[ymd] ?? [];

            return (
              <button
                key={ymd}
                onClick={() => setSelected(ymd)}
                className={`h-10 flex flex-col items-center justify-center relative transition-all active:scale-90 ${
                  isSel
                    ? 'bg-gradient-to-br from-blue-600 to-green-500 text-white rounded-xl mx-0.5'
                    : isToday
                    ? 'text-blue-600 font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`text-sm ${isSel ? 'font-bold' : ''}`}>{parseInt(dd)}</span>
                {dayBkgs.length > 0 && (
                  <div className="flex gap-0.5 absolute bottom-1">
                    {dayBkgs.slice(0, 3).map((b, i) => (
                      <span key={i} className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : DOT_COLORS[b.status] ?? 'bg-gray-400'}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SELECTED DAY BOOKINGS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 text-sm">
            {formatDate(selected)}
          </h3>
          {selectedBookings.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {selectedBookings.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-sm text-gray-400">No bookings on this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedBookings.map(b => (
              <div key={b.id} className={`bg-white rounded-2xl border p-4 ${STATUS_COLORS[b.status] ?? 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {SERVICE_LABELS[b.service_type] ?? b.service_type}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ⏰ {b.scheduled_time}
                      {b.hours && ` · ${b.hours}h`}
                    </p>
                    {b.address && (
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">
                        📍 {b.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {role === 'client' && b.client_price && (
                      <p className="font-bold text-gray-800">${b.client_price.toFixed(2)}</p>
                    )}
                    {role === 'professional' && b.payout_amount && (
                      <p className="font-bold text-green-600">+${b.payout_amount.toFixed(2)}</p>
                    )}
                    <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[b.status]}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
