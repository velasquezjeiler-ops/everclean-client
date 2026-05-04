'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const C = {
  navy: '#0D3781',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  text: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
  danger: '#DC2626',
};

const STATE_OPTIONS = [
  { code: 'NJ', name: 'New Jersey', tier: 'A' },
  { code: 'NY', name: 'New York', tier: 'A' },
  { code: 'CT', name: 'Connecticut', tier: 'A' },
  { code: 'CA', name: 'California', tier: 'A' },
  { code: 'MA', name: 'Massachusetts', tier: 'A' },
  { code: 'WA', name: 'Washington', tier: 'A' },
  { code: 'FL', name: 'Florida', tier: 'B' },
  { code: 'TX', name: 'Texas', tier: 'B' },
  { code: 'IL', name: 'Illinois', tier: 'B' },
  { code: 'CO', name: 'Colorado', tier: 'B' },
  { code: 'MD', name: 'Maryland', tier: 'B' },
  { code: 'VA', name: 'Virginia', tier: 'B' },
  { code: 'GA', name: 'Georgia', tier: 'C' },
  { code: 'NC', name: 'North Carolina', tier: 'C' },
  { code: 'TN', name: 'Tennessee', tier: 'C' },
  { code: 'OH', name: 'Ohio', tier: 'C' },
  { code: 'PA', name: 'Pennsylvania', tier: 'C' },
  { code: 'MI', name: 'Michigan', tier: 'C' },
  { code: 'AL', name: 'Alabama', tier: 'D' },
  { code: 'MO', name: 'Missouri', tier: 'D' },
  { code: 'AZ', name: 'Arizona', tier: 'B' },
];

const STATE_MULTIPLIERS: Record<string, number> = {
  A: 1.2,
  B: 1,
  C: 0.9,
  D: 0.85,
};

const SERVICE_RATES: Record<
  string,
  { label: string; icon: string; rate: number; min: number; commercial: boolean; desc: string }
> = {
  HOUSE_CLEANING: { label: 'House Cleaning', icon: '🏠', rate: 0.15, min: 120, commercial: false, desc: 'Regular residential' },
  DEEP_CLEANING: { label: 'Deep Cleaning', icon: '✨', rate: 0.2, min: 150, commercial: false, desc: 'Top-to-bottom' },
  MOVE_IN_OUT: { label: 'Move In / Out', icon: '📦', rate: 0.28, min: 200, commercial: false, desc: 'Full property reset' },
  SAME_DAY_CLEANING: { label: 'Same Day', icon: '⚡', rate: 0.18, min: 130, commercial: false, desc: 'Available today' },
  OFFICE_CLEANING: { label: 'Office Cleaning', icon: '🏢', rate: 0.14, min: 150, commercial: true, desc: 'Pros $18-$22/hr' },
  POST_CONSTRUCTION: { label: 'Post Construction', icon: '🔨', rate: 0.22, min: 180, commercial: true, desc: 'After remodel' },
  MEDICAL_CLEANING: { label: 'Medical / Clinical', icon: '🏥', rate: 0.32, min: 250, commercial: true, desc: 'Hospital-grade' },
  CARPET_CLEANING: { label: 'Carpet Cleaning', icon: '🛋️', rate: 0.18, min: 130, commercial: false, desc: 'Deep extraction' },
  WINDOW_CLEANING: { label: 'Window Cleaning', icon: '🪟', rate: 0.16, min: 120, commercial: false, desc: 'Interior & exterior' },
  ORGANIZING: { label: 'Organizing', icon: '📋', rate: 0.15, min: 120, commercial: false, desc: 'Declutter & organize' },
};

const FREQ_OPTIONS = [
  { key: 'ONE_TIME', label: 'One Time', disc: 0 },
  { key: 'MONTHLY', label: 'Monthly', disc: 0.05 },
  { key: 'BI_WEEKLY', label: 'Bi-Weekly', disc: 0.1 },
  { key: 'WEEKLY', label: 'Weekly', disc: 0.15 },
];

const ROOM_SQFT_MIN: Record<string, number> = {
  '0-1': 400,
  '1-1': 500,
  '1-2': 650,
  '2-1': 750,
  '2-2': 1000,
  '3-2': 1200,
  '3-3': 1500,
  '4-2': 1800,
  '4-3': 2200,
  '4-4': 2600,
  '5-3': 2800,
  '5-4': 3200,
  '6-4': 3800,
};

const VEHICLE_TYPES = [
  { code: 'COMPACT', label: 'Compact / Hatchback', examples: 'Corolla, Civic, Elantra, Golf, Mazda3' },
  { code: 'SEDAN', label: 'Sedan', examples: 'Camry, Accord, Altima, BMW 3, Audi A4' },
  { code: 'SUV_MID', label: 'SUV Mediano', examples: 'RAV4, CR-V, Rogue, Equinox, Tucson' },
  { code: 'SUV_LG', label: 'SUV Grande', examples: 'Highlander, Explorer, Telluride, Palisade' },
  { code: 'SUV_XL', label: 'SUV Full-Size', examples: 'Expedition, Suburban, Yukon XL, Sequoia' },
  { code: 'TRUCK_S', label: 'Pickup Cabina Sencilla', examples: 'F-150 Regular, Silverado Regular, Ram Regular' },
  { code: 'TRUCK_DC', label: 'Pickup Doble Cabina', examples: 'F-150 Crew, Ram Crew, Tacoma DC, Frontier DC' },
  { code: 'TRUCK_HD', label: 'Pickup Heavy Duty', examples: 'F-250, F-350, Ram 2500/3500, Silverado 2500HD' },
  { code: 'VAN', label: 'Van / Minivan', examples: 'Odyssey, Pacifica, Sienna, Carnival, Grand Caravan' },
];

const CAR_PKG_DETAILS = {
  BASIC: { label: 'Basic Wash', includes: 'Exterior wash + secado + ventanas' },
  STANDARD: { label: 'Standard', includes: 'Basic + aspirado interior + tablero' },
  INTERIOR: { label: 'Interior Only', includes: 'Aspirado + superficies + vidrios int.' },
  FULL: { label: 'Full Detail', includes: 'Exterior completo + interior completo' },
  PREMIUM: { label: 'Premium', includes: 'Full + cera + llantas + aromatizante' },
  VIP: { label: 'VIP', includes: 'Premium + protector + cuero + motor' },
};

const CAR_WASH_RATES: Record<string, Record<string, number>> = {
  COMPACT: { BASIC: 45, STANDARD: 65, INTERIOR: 60, FULL: 95, PREMIUM: 130, VIP: 180 },
  SEDAN: { BASIC: 50, STANDARD: 70, INTERIOR: 65, FULL: 105, PREMIUM: 140, VIP: 195 },
  SUV_MID: { BASIC: 60, STANDARD: 85, INTERIOR: 75, FULL: 125, PREMIUM: 165, VIP: 220 },
  SUV_LG: { BASIC: 70, STANDARD: 95, INTERIOR: 85, FULL: 140, PREMIUM: 185, VIP: 245 },
  SUV_XL: { BASIC: 80, STANDARD: 110, INTERIOR: 95, FULL: 160, PREMIUM: 210, VIP: 275 },
  TRUCK_S: { BASIC: 65, STANDARD: 90, INTERIOR: 80, FULL: 130, PREMIUM: 170, VIP: 230 },
  TRUCK_DC: { BASIC: 75, STANDARD: 100, INTERIOR: 90, FULL: 150, PREMIUM: 195, VIP: 260 },
  TRUCK_HD: { BASIC: 90, STANDARD: 120, INTERIOR: 105, FULL: 175, PREMIUM: 225, VIP: 295 },
  VAN: { BASIC: 80, STANDARD: 105, INTERIOR: 95, FULL: 155, PREMIUM: 200, VIP: 265 },
};

const ADDONS = [
  { code: 'OZONE', label: 'Eliminación de olores', price: 35 },
  { code: 'PAINT_LIGHT', label: 'Corrección de pintura', price: 60 },
  { code: 'CERAMIC', label: 'Recubrimiento cerámico', price: 120 },
  { code: 'ENGINE', label: 'Limpieza de motor', price: 45 },
];

function getRoomSqftMin(beds: number, baths: number) {
  return ROOM_SQFT_MIN[`${beds}-${baths}`] ?? null;
}

function estimatedHours(sqft: number) {
  if (sqft <= 1000) return 2;
  if (sqft <= 2000) return 3;
  if (sqft <= 3500) return 4;
  return 5;
}

function calcPrice(
  serviceType: string,
  sqft: number,
  beds: number | null,
  baths: number | null,
  tier: string,
  frequency: string
) {
  const cfg = SERVICE_RATES[serviceType];
  if (!cfg) return null;

  const multi = STATE_MULTIPLIERS[tier] ?? 1;
  const disc = FREQ_OPTIONS.find((f) => f.key === frequency)?.disc ?? 0;
  let sqftUsed = sqft;
  let corrected = false;

  if (beds != null && baths != null) {
    const minSqft = getRoomSqftMin(beds, baths);
    if (minSqft && sqft < minSqft) {
      sqftUsed = minSqft;
      corrected = true;
    }
  }

  const base = Math.max(sqftUsed * cfg.rate * multi, cfg.min * multi);
  const price = parseFloat((base * (1 - disc)).toFixed(2));

  return { price, hours: estimatedHours(sqftUsed), sqftUsed, corrected };
}

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [serviceType, setServiceType] = useState('');
  const [state, setState] = useState('NJ');
  const stateTier = STATE_OPTIONS.find((s) => s.code === state)?.tier ?? 'B';

  const [sqft, setSqft] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [frequency, setFrequency] = useState('ONE_TIME');

  const [vehicleCode, setVehicleCode] = useState('');
  const [carPkg, setCarPkg] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [weightLbs, setWeightLbs] = useState('10');
  const [itemCount, setItemCount] = useState('1');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');

  const isCleaning = serviceType in SERVICE_RATES;
  const isCarWash = serviceType === 'CAR_WASH';
  const isLaundry = serviceType === 'LAUNDRY_PICKUP';
  const isDry = serviceType === 'DRY_CLEANING';

  const priceCalc = (() => {
    if (!serviceType) return null;

    if (isCleaning) {
      const s = parseInt(sqft) || 0;
      if (s === 0 && !beds) return null;
      return calcPrice(
        serviceType,
        s,
        beds ? parseInt(beds) : null,
        baths ? parseInt(baths) : null,
        stateTier,
        frequency
      );
    }

    if (isCarWash && vehicleCode && carPkg) {
      const base = CAR_WASH_RATES[vehicleCode]?.[carPkg] ?? 0;
      const addonsTotal = selectedAddons.reduce(
        (sum, addon) => sum + (ADDONS.find((x) => x.code === addon)?.price ?? 0),
        0
      );
      return { price: base + addonsTotal, hours: null, sqftUsed: null, corrected: false };
    }

    if (isLaundry) {
      const lbs = Math.max(parseFloat(weightLbs) || 10, 10);
      return { price: Math.max(lbs * 3 + 30, 60), hours: null, sqftUsed: null, corrected: false };
    }

    if (isDry) {
      return { price: (parseInt(itemCount) || 1) * 12, hours: null, sqftUsed: null, corrected: false };
    }

    return null;
  })();

  const canStep1 = Boolean(serviceType && priceCalc && priceCalc.price > 0);

  async function handleSubmit() {
    if (!address || !scheduledDate || !scheduledTime) {
      setError('Completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const body: Record<string, unknown> = {
        service_type: serviceType,
        address,
        city,
        state,
        zip_code: zipCode,
        scheduledAt: `${scheduledDate}T${scheduledTime}:00`,
        notes,
        frequency,
      };

      if (isCleaning) {
        body.sqft = parseInt(sqft) || 0;
        body.bedrooms = beds ? parseInt(beds) : null;
        body.bathrooms = baths ? parseInt(baths) : null;
      }

      if (isCarWash) {
        body.vehicle_code = vehicleCode;
        body.package = carPkg;
        body.car_wash_addons = selectedAddons;
      }

      if (isLaundry) body.weight_lbs = parseFloat(weightLbs) || 10;
      if (isDry) body.item_count = parseInt(itemCount) || 1;

      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Error');
      }

      const data = await res.json();
      const bookingId = data.id || data.booking?.id;
      if (bookingId) localStorage.setItem('last_booking_id', String(bookingId));
      router.push('/dashboard?booked=1');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="booking-page">
      <style>{`
        .booking-page { width: 100%; }
        .booking-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; }
        .booking-title { margin:0 0 5px; color:${C.text}; font-size:28px; line-height:1.05; font-weight:900; }
        .booking-subtitle { margin:0; color:${C.muted}; font-size:14px; }
        .booking-shell { background:#fff; border:1px solid ${C.border}; border-radius:18px; box-shadow:0 2px 14px rgba(13,55,129,0.05); overflow:hidden; }
        .booking-steps { display:flex; align-items:center; gap:10px; padding:16px; border-bottom:1px solid ${C.border}; background:#F8FBFF; }
        .booking-step { width:32px; height:32px; border-radius:999px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:900; background:#E2E8F0; color:${C.muted}; }
        .booking-step.active { color:#fff; background:linear-gradient(135deg, ${C.blue}, ${C.green}); box-shadow:0 8px 18px rgba(21,101,192,0.18); }
        .booking-step-label { color:${C.muted}; font-size:13px; font-weight:800; }
        .booking-body { padding:16px; }
        .booking-section { margin-bottom:18px; }
        .booking-label { display:block; color:${C.text}; font-size:13px; font-weight:800; margin-bottom:8px; }
        .booking-kicker { color:${C.muted}; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1.4px; margin:0 0 9px; }
        .booking-input, .booking-select, .booking-textarea { width:100%; border:1px solid ${C.border}; border-radius:12px; background:#fff; color:${C.text}; min-height:42px; padding:0 12px; outline:none; font-size:14px; }
        .booking-textarea { min-height:82px; padding:12px; resize:none; }
        .booking-input:focus, .booking-select:focus, .booking-textarea:focus { border-color:${C.blue}; box-shadow:0 0 0 4px rgba(21,101,192,0.1); }
        .booking-help { margin:7px 0 0; color:${C.muted}; font-size:12px; }
        .booking-grid { display:grid; gap:10px; }
        .booking-grid.three { grid-template-columns:repeat(3, minmax(0, 1fr)); }
        .booking-grid.two { grid-template-columns:repeat(2, minmax(0, 1fr)); }
        .booking-option { border:1px solid ${C.border}; background:#fff; border-radius:14px; padding:13px; min-height:86px; cursor:pointer; text-align:left; transition:border .15s, box-shadow .15s, background .15s; }
        .booking-option:hover { border-color:${C.blue}; }
        .booking-option.selected { border-color:${C.blue}; background:#EFF6FF; box-shadow:0 0 0 3px rgba(21,101,192,0.08); }
        .booking-option.green.selected { border-color:${C.green}; background:#ECFDF5; box-shadow:0 0 0 3px rgba(76,175,80,0.1); }
        .booking-option-icon { font-size:21px; margin-bottom:6px; }
        .booking-option strong { display:block; color:${C.text}; font-size:13px; font-weight:900; line-height:1.15; }
        .booking-option span { display:block; color:${C.muted}; font-size:12px; margin-top:4px; }
        .booking-option em { display:block; color:${C.warning}; font-size:11px; font-style:normal; font-weight:800; margin-top:4px; }
        .booking-price-card { border-radius:18px; padding:18px; color:#fff; background:linear-gradient(135deg, ${C.navy}, ${C.blue} 55%, ${C.green}); margin-bottom:16px; }
        .booking-price-card p { margin:0 0 4px; color:rgba(255,255,255,.76); font-size:13px; font-weight:700; }
        .booking-price-card strong { display:block; font-size:38px; line-height:1; font-weight:900; }
        .booking-price-meta { display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; color:rgba(255,255,255,.8); font-size:13px; font-weight:800; }
        .booking-actions { display:flex; gap:10px; }
        .booking-button { width:100%; min-height:46px; border:0; border-radius:14px; color:#fff; background:linear-gradient(135deg, ${C.navy}, ${C.blue}); font-size:15px; font-weight:900; cursor:pointer; }
        .booking-button:disabled { opacity:.45; cursor:not-allowed; }
        .booking-button.secondary { background:#fff; color:${C.text}; border:1px solid ${C.border}; }
        .booking-summary { background:#F8FBFF; border:1px solid ${C.border}; border-radius:16px; padding:14px; display:flex; justify-content:space-between; gap:12px; margin-bottom:16px; }
        .booking-summary strong { color:${C.text}; font-size:15px; font-weight:900; }
        .booking-summary span { display:block; color:${C.muted}; font-size:12px; margin-top:3px; }
        .booking-summary b { color:${C.blue}; font-size:24px; white-space:nowrap; }
        .booking-error { background:#FEF2F2; border:1px solid #FECACA; color:${C.danger}; border-radius:14px; padding:12px 14px; font-size:13px; font-weight:800; margin-bottom:14px; }
        @media (max-width:760px) {
          .booking-header { flex-direction:column; }
          .booking-grid.three, .booking-grid.two { grid-template-columns:1fr; }
          .booking-actions { flex-direction:column; }
          .booking-title { font-size:26px; }
        }
      `}</style>

      <div className="booking-header">
        <div>
          <h1 className="booking-title">Book a Service</h1>
          <p className="booking-subtitle">Choose a service, review pricing, then schedule your visit.</p>
        </div>
      </div>

      <div className="booking-shell">
        <div className="booking-steps">
          {[1, 2].map((s) => (
            <div key={s} className={`booking-step ${step >= s ? 'active' : ''}`}>
              {s}
            </div>
          ))}
          <span className="booking-step-label">
            {step === 1 ? 'Servicio y precio' : 'Cuándo y dónde'}
          </span>
        </div>

        <div className="booking-body">
          {step === 1 && (
            <>
              <div className="booking-section">
                <label className="booking-label">Estado</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className="booking-select">
                  {STATE_OPTIONS.filter((s, i, a) => a.findIndex((x) => x.code === s.code) === i).map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="booking-section">
                <p className="booking-kicker">Servicios de limpieza (por sqft)</p>
                <div className="booking-grid three">
                  {Object.entries(SERVICE_RATES).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setServiceType(key)}
                      className={`booking-option ${serviceType === key ? 'selected' : ''}`}
                      type="button"
                    >
                      <div className="booking-option-icon">{cfg.icon}</div>
                      <strong>{cfg.label}</strong>
                      <span>${(cfg.rate * STATE_MULTIPLIERS[stateTier]).toFixed(2)}/sqft</span>
                      {cfg.commercial && <em>Comercial</em>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="booking-section">
                <p className="booking-kicker">Servicios adicionales</p>
                <div className="booking-grid three">
                  {[
                    { key: 'CAR_WASH', label: 'Car Wash', icon: '🚗' },
                    { key: 'LAUNDRY_PICKUP', label: 'Laundry', icon: '👕' },
                    { key: 'DRY_CLEANING', label: 'Dry Cleaning', icon: '👔' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setServiceType(s.key)}
                      className={`booking-option ${serviceType === s.key ? 'selected' : ''}`}
                      type="button"
                    >
                      <div className="booking-option-icon">{s.icon}</div>
                      <strong>{s.label}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {isCleaning && (
                <div className="booking-section">
                  <div className="booking-grid two">
                    <label>
                      <span className="booking-label">Habitaciones</span>
                      <select value={beds} onChange={(e) => setBeds(e.target.value)} className="booking-select">
                        <option value="">--</option>
                        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n === 0 ? 'Studio' : n}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="booking-label">Baños</span>
                      <select value={baths} onChange={(e) => setBaths(e.target.value)} className="booking-select">
                        <option value="">--</option>
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {beds && baths && getRoomSqftMin(parseInt(beds), parseInt(baths)) && (
                    <p className="booking-help">
                      Mínimo estimado para {beds === '0' ? 'Studio' : `${beds}B/${baths}B`}:{' '}
                      {getRoomSqftMin(parseInt(beds), parseInt(baths))} sqft
                    </p>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <label className="booking-label">Sqft exacto (opcional)</label>
                    <input
                      type="number"
                      min="100"
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      placeholder="ej: 1200"
                      className="booking-input"
                    />
                  </div>

                  {priceCalc?.corrected && (
                    <div className="booking-error" style={{ marginTop: 12 }}>
                      Sqft ajustado a {priceCalc.sqftUsed} según las habitaciones declaradas.
                    </div>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <label className="booking-label">Frecuencia</label>
                    <div className="booking-grid two">
                      {FREQ_OPTIONS.map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setFrequency(f.key)}
                          className={`booking-option green ${frequency === f.key ? 'selected' : ''}`}
                          type="button"
                          style={{ minHeight: 58 }}
                        >
                          <strong>{f.label}</strong>
                          {f.disc > 0 && <span>-{f.disc * 100}%</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isCarWash && (
                <div className="booking-section">
                  <label className="booking-label">Tipo de vehículo</label>
                  <div className="booking-grid two">
                    {VEHICLE_TYPES.map((v) => (
                      <button
                        key={v.code}
                        onClick={() => setVehicleCode(v.code)}
                        className={`booking-option ${vehicleCode === v.code ? 'selected' : ''}`}
                        type="button"
                      >
                        <strong>{v.label}</strong>
                        <span>{v.examples}</span>
                      </button>
                    ))}
                  </div>

                  {vehicleCode && (
                    <div style={{ marginTop: 14 }}>
                      <label className="booking-label">Paquete</label>
                      <div className="booking-grid three">
                        {Object.entries(CAR_PKG_DETAILS).map(([key, pkg]) => (
                          <button
                            key={key}
                            onClick={() => setCarPkg(key)}
                            className={`booking-option ${carPkg === key ? 'selected' : ''}`}
                            type="button"
                          >
                            <strong>{pkg.label}</strong>
                            <span>{pkg.includes}</span>
                            <em>${CAR_WASH_RATES[vehicleCode]?.[key]}</em>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {vehicleCode && carPkg && (
                    <div style={{ marginTop: 14 }}>
                      <label className="booking-label">Add-ons (opcional)</label>
                      <div className="booking-grid two">
                        {ADDONS.map((a) => (
                          <button
                            key={a.code}
                            onClick={() =>
                              setSelectedAddons((prev) =>
                                prev.includes(a.code)
                                  ? prev.filter((x) => x !== a.code)
                                  : [...prev, a.code]
                              )
                            }
                            className={`booking-option green ${selectedAddons.includes(a.code) ? 'selected' : ''}`}
                            type="button"
                          >
                            <strong>{a.label}</strong>
                            <span>+${a.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLaundry && (
                <div className="booking-section">
                  <label className="booking-label">Libras estimadas (mín. 10 lbs)</label>
                  <input
                    type="number"
                    min="10"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                    className="booking-input"
                  />
                  <p className="booking-help">$3/lb + $30 pickup & delivery</p>
                </div>
              )}

              {isDry && (
                <div className="booking-section">
                  <label className="booking-label">Número de prendas</label>
                  <input
                    type="number"
                    min="1"
                    value={itemCount}
                    onChange={(e) => setItemCount(e.target.value)}
                    className="booking-input"
                  />
                  <p className="booking-help">$12 por prenda</p>
                </div>
              )}

              {priceCalc && (
                <div className="booking-price-card">
                  <p>Tu precio estimado</p>
                  <strong>${priceCalc.price.toFixed(2)}</strong>
                  <div className="booking-price-meta">
                    {priceCalc.hours && <span>{priceCalc.hours}h estimadas</span>}
                    {priceCalc.sqftUsed && <span>{priceCalc.sqftUsed} sqft</span>}
                    {(FREQ_OPTIONS.find((f) => f.key === frequency)?.disc ?? 0) > 0 && (
                      <span>
                        -{(FREQ_OPTIONS.find((f) => f.key === frequency)?.disc ?? 0) * 100}% frecuencia
                      </span>
                    )}
                    {priceCalc.corrected && <span>Sqft validado</span>}
                  </div>
                </div>
              )}

              <button
                onClick={() => canStep1 && setStep(2)}
                disabled={!canStep1}
                className="booking-button"
                type="button"
              >
                Continuar →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="booking-summary">
                <div>
                  <strong>{SERVICE_RATES[serviceType]?.label ?? serviceType}</strong>
                  {priceCalc?.hours && (
                    <span>
                      {priceCalc.sqftUsed} sqft · {priceCalc.hours}h
                    </span>
                  )}
                </div>
                <b>${priceCalc?.price.toFixed(2)}</b>
              </div>

              <div className="booking-grid two">
                <label style={{ gridColumn: '1 / -1' }}>
                  <span className="booking-label">Dirección *</span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, Apt 4B"
                    className="booking-input"
                  />
                </label>

                <label>
                  <span className="booking-label">Ciudad</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Newark"
                    className="booking-input"
                  />
                </label>

                <label>
                  <span className="booking-label">ZIP</span>
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="08901"
                    className="booking-input"
                  />
                </label>

                <label>
                  <span className="booking-label">Fecha *</span>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="booking-input"
                  />
                </label>

                <label>
                  <span className="booking-label">Hora *</span>
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="booking-select"
                  >
                    <option value="">Seleccionar</option>
                    {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  <span className="booking-label">Notas (opcional)</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Código de acceso, mascotas, instrucciones especiales..."
                    className="booking-textarea"
                  />
                </label>
              </div>

              {error && <div className="booking-error">{error}</div>}

              <div className="booking-actions" style={{ marginTop: 16 }}>
                <button onClick={() => setStep(1)} className="booking-button secondary" type="button">
                  ← Atrás
                </button>
                <button onClick={handleSubmit} disabled={loading} className="booking-button" type="button">
                  {loading ? 'Creando...' : 'Confirmar Booking'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
