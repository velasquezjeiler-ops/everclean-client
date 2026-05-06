'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup.replit.app/api';

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

const STATE_MULTIPLIERS: Record<string, number> = { A: 1.2, B: 1, C: 0.9, D: 0.85 };

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function stateRate(rate: number, tier: string) {
  return money(rate * (STATE_MULTIPLIERS[tier] ?? 1));
}

const CLEANING_SERVICES: Record<string, { label: string; icon: string; rate: number; min: number; commercial: boolean; desc: string }> = {
  HOUSE_CLEANING: { label: 'House Cleaning', icon: 'Home', rate: 0.15, min: 120, commercial: false, desc: 'Regular residential cleaning' },
  DEEP_CLEANING: { label: 'Deep Cleaning', icon: 'Deep', rate: 0.2, min: 150, commercial: false, desc: 'Detailed top-to-bottom cleaning' },
  MOVE_IN_OUT: { label: 'Move In / Out', icon: 'Move', rate: 0.28, min: 200, commercial: false, desc: 'Full property reset' },
  SAME_DAY_CLEANING: { label: 'Same Day', icon: 'Fast', rate: 0.18, min: 130, commercial: false, desc: 'Priority same-day visit' },
  OFFICE_CLEANING: { label: 'Office Cleaning', icon: 'Office', rate: 0.14, min: 150, commercial: true, desc: 'Workplace cleaning' },
  POST_CONSTRUCTION: { label: 'Post Construction', icon: 'Build', rate: 0.22, min: 180, commercial: true, desc: 'After remodel or construction' },
  MEDICAL_CLEANING: { label: 'Medical / Clinical', icon: 'Care', rate: 0.32, min: 250, commercial: true, desc: 'Clinical-grade cleaning' },
};

const FREQ_OPTIONS = [
  { key: 'ONE_TIME', label: 'One Time', disc: 0 },
  { key: 'MONTHLY', label: 'Monthly', disc: 0.05 },
  { key: 'BI_WEEKLY', label: 'Bi-Weekly', disc: 0.1 },
  { key: 'WEEKLY', label: 'Weekly', disc: 0.15 },
];

const RUG_PRICES: Record<string, { label: string; price: number }> = {
  SMALL: { label: 'Small rug', price: 25 },
  MEDIUM: { label: 'Medium rug', price: 45 },
  LARGE: { label: 'Large rug', price: 70 },
  XL: { label: 'Oversized rug', price: 95 },
};

const VEHICLE_TYPES = [
  { code: 'COMPACT', label: 'Compact / Hatchback', examples: 'Corolla, Civic, Elantra, Golf, Mazda3' },
  { code: 'SEDAN', label: 'Sedan', examples: 'Camry, Accord, Altima, BMW 3, Audi A4' },
  { code: 'SUV_MID', label: 'Mid-size SUV', examples: 'RAV4, CR-V, Rogue, Equinox, Tucson' },
  { code: 'SUV_LG', label: 'Large SUV', examples: 'Highlander, Explorer, Telluride, Palisade' },
  { code: 'SUV_XL', label: 'Full-size SUV', examples: 'Expedition, Suburban, Yukon XL, Sequoia' },
  { code: 'TRUCK_S', label: 'Single-cab Pickup', examples: 'F-150 Regular, Silverado Regular, Ram Regular' },
  { code: 'TRUCK_DC', label: 'Crew-cab Pickup', examples: 'F-150 Crew, Ram Crew, Tacoma DC, Frontier DC' },
  { code: 'TRUCK_HD', label: 'Heavy-duty Pickup', examples: 'F-250, F-350, Ram 2500/3500' },
  { code: 'VAN', label: 'Van / Minivan', examples: 'Odyssey, Pacifica, Sienna, Carnival' },
];

const CAR_PKG_DETAILS = {
  BASIC: { label: 'Basic Wash', includes: 'Exterior hand wash and dry' },
  STANDARD: { label: 'Standard', includes: 'Basic + interior vacuum and wipe down' },
  INTERIOR: { label: 'Interior Only', includes: 'Vacuum, surfaces and interior glass' },
  FULL: { label: 'Full Detail', includes: 'Complete exterior and interior detail' },
  PREMIUM: { label: 'Premium', includes: 'Full + wax, wheels and finish care' },
  VIP: { label: 'VIP', includes: 'Premium + protectant, leather and engine bay' },
};

const CAR_WASH_RATES: Record<string, Record<string, number>> = {
  COMPACT: { BASIC: 40, STANDARD: 60, INTERIOR: 55, FULL: 90, PREMIUM: 125, VIP: 170 },
  SEDAN: { BASIC: 45, STANDARD: 65, INTERIOR: 60, FULL: 100, PREMIUM: 135, VIP: 185 },
  SUV_MID: { BASIC: 55, STANDARD: 80, INTERIOR: 70, FULL: 120, PREMIUM: 160, VIP: 215 },
  SUV_LG: { BASIC: 65, STANDARD: 90, INTERIOR: 80, FULL: 135, PREMIUM: 180, VIP: 240 },
  SUV_XL: { BASIC: 75, STANDARD: 105, INTERIOR: 90, FULL: 155, PREMIUM: 205, VIP: 270 },
  TRUCK_S: { BASIC: 60, STANDARD: 85, INTERIOR: 75, FULL: 125, PREMIUM: 165, VIP: 225 },
  TRUCK_DC: { BASIC: 70, STANDARD: 95, INTERIOR: 85, FULL: 145, PREMIUM: 190, VIP: 255 },
  TRUCK_HD: { BASIC: 85, STANDARD: 115, INTERIOR: 100, FULL: 170, PREMIUM: 220, VIP: 290 },
  VAN: { BASIC: 75, STANDARD: 100, INTERIOR: 90, FULL: 150, PREMIUM: 195, VIP: 260 },
};

const CAR_ADDONS = [
  { code: 'OZONE', label: 'Odor removal', price: 35 },
  { code: 'PAINT_LIGHT', label: 'Light paint correction', price: 60 },
  { code: 'CERAMIC', label: 'Ceramic coating', price: 120 },
  { code: 'ENGINE', label: 'Engine bay cleaning', price: 45 },
];

function estimatedSqftFromRooms(beds: number, baths: number, kitchens: number) {
  const baseLiving = beds === 0 ? 360 : 420;
  const bedroomSqft = beds * 240;
  const bathSqft = baths * 90;
  const kitchenSqft = Math.max(kitchens, 1) * 180;
  return Math.ceil((baseLiving + bedroomSqft + bathSqft + kitchenSqft) / 50) * 50;
}

function estimatedHours(sqft: number, addonTotal: number) {
  const baseHours = sqft <= 1000 ? 2 : sqft <= 2000 ? 3 : sqft <= 3500 ? 4 : 5;
  return Math.round((baseHours + addonTotal / 90) * 10) / 10;
}

function cleaningAddonPrice(addons: {
  drawers: number;
  carpetSqft: number;
  rugSize: string;
  rugCount: number;
  windowsInside: number;
  windowsOutside: number;
}) {
  const carpet = addons.carpetSqft > 0 ? Math.max(addons.carpetSqft * 0.28, 45) : 0;
  const rug = addons.rugSize && addons.rugCount > 0 ? (RUG_PRICES[addons.rugSize]?.price || 0) * addons.rugCount : 0;
  const drawers = addons.drawers * 8;
  const windows = addons.windowsInside * 8 + addons.windowsOutside * 12;
  return Math.round((carpet + rug + drawers + windows) * 100) / 100;
}

function calcCleaningPrice(
  serviceType: string,
  sqft: number,
  beds: number | null,
  baths: number | null,
  kitchens: number,
  tier: string,
  frequency: string,
  addons: { drawers: number; carpetSqft: number; rugSize: string; rugCount: number; windowsInside: number; windowsOutside: number }
) {
  const cfg = CLEANING_SERVICES[serviceType];
  if (!cfg) return null;

  const multi = STATE_MULTIPLIERS[tier] ?? 1;
  const disc = FREQ_OPTIONS.find((f) => f.key === frequency)?.disc ?? 0;
  const roomSqft = beds != null && baths != null ? estimatedSqftFromRooms(beds, baths, kitchens) : 0;
  let sqftUsed = sqft || roomSqft;
  let corrected = false;

  if (roomSqft && sqftUsed < roomSqft) {
    sqftUsed = roomSqft;
    corrected = true;
  }

  if (sqftUsed <= 0) return null;

  const addonTotal = cleaningAddonPrice(addons);
  const effectiveRate = stateRate(cfg.rate, tier);
  const minPrice = money(cfg.min * multi);
  const base = Math.max(sqftUsed * effectiveRate, minPrice);
  const price = money(base * (1 - disc) + addonTotal);

  return { price, hours: estimatedHours(sqftUsed, addonTotal), sqftUsed, corrected, addonTotal, roomSqft, effectiveRate };
}

function laundryPrice(weight: string) {
  const lbs = Math.max(parseFloat(weight) || 10, 10);
  const price = Math.max(lbs * 2.5 + 20, 45);
  return { price: Math.round(price * 100) / 100, lbs };
}

function serviceLabel(serviceType: string) {
  if (CLEANING_SERVICES[serviceType]) return CLEANING_SERVICES[serviceType].label;
  if (serviceType === 'CAR_WASH') return 'Car Wash';
  if (serviceType === 'LAUNDRY_PICKUP') return 'Laundry';
  return serviceType;
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
  const [kitchens, setKitchens] = useState('1');
  const [frequency, setFrequency] = useState('ONE_TIME');

  const [drawerCount, setDrawerCount] = useState('0');
  const [carpetSqft, setCarpetSqft] = useState('0');
  const [rugSize, setRugSize] = useState('');
  const [rugCount, setRugCount] = useState('0');
  const [windowInside, setWindowInside] = useState('0');
  const [windowOutside, setWindowOutside] = useState('0');

  const [vehicleCode, setVehicleCode] = useState('');
  const [carPkg, setCarPkg] = useState('');
  const [selectedCarAddons, setSelectedCarAddons] = useState<string[]>([]);
  const [weightLbs, setWeightLbs] = useState('10');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');

  const isCleaning = serviceType in CLEANING_SERVICES;
  const isCarWash = serviceType === 'CAR_WASH';
  const isLaundry = serviceType === 'LAUNDRY_PICKUP';

  const cleaningAddons = {
    drawers: Math.max(parseInt(drawerCount) || 0, 0),
    carpetSqft: Math.max(parseFloat(carpetSqft) || 0, 0),
    rugSize,
    rugCount: Math.max(parseInt(rugCount) || 0, 0),
    windowsInside: Math.max(parseInt(windowInside) || 0, 0),
    windowsOutside: Math.max(parseInt(windowOutside) || 0, 0),
  };

  const priceCalc = (() => {
    if (!serviceType) return null;
    if (isCleaning) {
      const s = parseInt(sqft) || 0;
      if (s === 0 && !beds) return null;
      return calcCleaningPrice(
        serviceType,
        s,
        beds ? parseInt(beds) : null,
        baths ? parseInt(baths) : null,
        Math.max(parseInt(kitchens) || 1, 1),
        stateTier,
        frequency,
        cleaningAddons
      );
    }

    if (isCarWash && vehicleCode && carPkg) {
      const base = CAR_WASH_RATES[vehicleCode]?.[carPkg] ?? 0;
      const addonsTotal = selectedCarAddons.reduce((sum, addon) => sum + (CAR_ADDONS.find((x) => x.code === addon)?.price ?? 0), 0);
      return { price: base + addonsTotal, hours: null, sqftUsed: null, corrected: false, addonTotal: addonsTotal, effectiveRate: null };
    }

    if (isLaundry) {
      const calc = laundryPrice(weightLbs);
      return { price: calc.price, hours: null, sqftUsed: null, corrected: false, addonTotal: 0, effectiveRate: null };
    }

    return null;
  })();

  const canStep1 = Boolean(serviceType && priceCalc && priceCalc.price > 0);

  async function handleSubmit() {
    if (!address || !scheduledDate || !scheduledTime) {
      setError('Complete the required address, date and time fields.');
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
        body.kitchens = Math.max(parseInt(kitchens) || 1, 1);
        body.drawer_count = cleaningAddons.drawers;
        body.carpet_sqft = cleaningAddons.carpetSqft;
        body.rug_size = cleaningAddons.rugSize;
        body.rug_count = cleaningAddons.rugCount;
        body.window_inside_count = cleaningAddons.windowsInside;
        body.window_outside_count = cleaningAddons.windowsOutside;
      }

      if (!isCleaning) {
        body.sqft = 0;
      }

      if (isCarWash) {
        body.vehicle_code = vehicleCode;
        body.package = carPkg;
        body.car_wash_addons = selectedCarAddons;
      }

      if (isLaundry) body.weight_lbs = laundryPrice(weightLbs).lbs;

      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Error creating booking');
      }

      const data = await res.json();
      const bookingId = data.id || data.booking?.id;
      if (bookingId) localStorage.setItem('last_booking_id', String(bookingId));
      router.push('/dashboard?booked=1');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
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
        .booking-grid.four { grid-template-columns:repeat(4, minmax(0, 1fr)); }
        .booking-option { border:1px solid ${C.border}; background:#fff; border-radius:14px; padding:13px; min-height:86px; cursor:pointer; text-align:left; transition:border .15s, box-shadow .15s, background .15s; }
        .booking-option:hover { border-color:${C.blue}; }
        .booking-option.selected { border-color:${C.blue}; background:#EFF6FF; box-shadow:0 0 0 3px rgba(21,101,192,0.08); }
        .booking-option.green.selected { border-color:${C.green}; background:#ECFDF5; box-shadow:0 0 0 3px rgba(76,175,80,0.1); }
        .booking-option-icon { font-size:12px; font-weight:900; color:${C.blue}; margin-bottom:7px; text-transform:uppercase; letter-spacing:.4px; }
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
        @media (max-width:960px) { .booking-grid.four { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
        @media (max-width:760px) { .booking-header { flex-direction:column; } .booking-grid.three, .booking-grid.two, .booking-grid.four { grid-template-columns:1fr; } .booking-actions { flex-direction:column; } .booking-title { font-size:26px; } }
      `}</style>

      <div className="booking-header">
        <div>
          <h1 className="booking-title">Book a Service</h1>
          <p className="booking-subtitle">Choose a service, add extras, then schedule your visit.</p>
        </div>
      </div>

      <div className="booking-shell">
        <div className="booking-steps">
          {[1, 2].map((s) => <div key={s} className={`booking-step ${step >= s ? 'active' : ''}`}>{s}</div>)}
          <span className="booking-step-label">{step === 1 ? 'Service and price' : 'Where and when'}</span>
        </div>

        <div className="booking-body">
          {step === 1 && (
            <>
              <div className="booking-section">
                <label className="booking-label">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className="booking-select">
                  {STATE_OPTIONS.filter((s, i, a) => a.findIndex((x) => x.code === s.code) === i).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>

              <div className="booking-section">
                <p className="booking-kicker">Base cleaning services</p>
                <div className="booking-grid three">
                  {Object.entries(CLEANING_SERVICES).map(([key, cfg]) => (
                    <button key={key} onClick={() => setServiceType(key)} className={`booking-option ${serviceType === key ? 'selected' : ''}`} type="button">
                      <div className="booking-option-icon">{cfg.icon}</div>
                      <strong>{cfg.label}</strong>
                      <span>${stateRate(cfg.rate, stateTier).toFixed(2)}/sqft</span>
                      <span>{cfg.desc}</span>
                      {cfg.commercial && <em>Commercial</em>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="booking-section">
                <p className="booking-kicker">Standalone services</p>
                <div className="booking-grid two">
                  {[{ key: 'CAR_WASH', label: 'Car Wash', icon: 'Auto' }, { key: 'LAUNDRY_PICKUP', label: 'Laundry', icon: 'Laundry' }].map((s) => (
                    <button key={s.key} onClick={() => setServiceType(s.key)} className={`booking-option ${serviceType === s.key ? 'selected' : ''}`} type="button">
                      <div className="booking-option-icon">{s.icon}</div>
                      <strong>{s.label}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {isCleaning && (
                <div className="booking-section">
                  <p className="booking-kicker">Home size</p>
                  <div className="booking-grid three">
                    <label><span className="booking-label">Bedrooms</span><select value={beds} onChange={(e) => setBeds(e.target.value)} className="booking-select"><option value="">--</option>{[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 0 ? 'Studio' : n}</option>)}</select></label>
                    <label><span className="booking-label">Bathrooms</span><select value={baths} onChange={(e) => setBaths(e.target.value)} className="booking-select"><option value="">--</option>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                    <label><span className="booking-label">Kitchens</span><select value={kitchens} onChange={(e) => setKitchens(e.target.value)} className="booking-select">{[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                  </div>

                  {beds && baths && <p className="booking-help">Estimated minimum: {estimatedSqftFromRooms(parseInt(beds), parseInt(baths), parseInt(kitchens) || 1)} sqft based on bedrooms, bathrooms and kitchen.</p>}

                  <div style={{ marginTop: 12 }}>
                    <label className="booking-label">Exact sqft (optional)</label>
                    <input type="number" min="100" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="example: 1200" className="booking-input" />
                  </div>

                  {priceCalc?.corrected && <div className="booking-error" style={{ marginTop: 12 }}>Sqft adjusted to {priceCalc.sqftUsed} based on the declared rooms.</div>}

                  <div style={{ marginTop: 18 }}>
                    <p className="booking-kicker">Cleaning add-ons</p>
                    <div className="booking-grid four">
                      <label><span className="booking-label">Drawers to clean/organize</span><input type="number" min="0" value={drawerCount} onChange={(e) => setDrawerCount(e.target.value)} className="booking-input" /></label>
                      <label><span className="booking-label">Carpet sqft</span><input type="number" min="0" value={carpetSqft} onChange={(e) => setCarpetSqft(e.target.value)} className="booking-input" /></label>
                      <label><span className="booking-label">Interior windows</span><input type="number" min="0" value={windowInside} onChange={(e) => setWindowInside(e.target.value)} className="booking-input" /></label>
                      <label><span className="booking-label">Exterior windows</span><input type="number" min="0" value={windowOutside} onChange={(e) => setWindowOutside(e.target.value)} className="booking-input" /></label>
                    </div>
                    <div className="booking-grid two" style={{ marginTop: 10 }}>
                      <label><span className="booking-label">Rug size</span><select value={rugSize} onChange={(e) => setRugSize(e.target.value)} className="booking-select"><option value="">No rug</option>{Object.entries(RUG_PRICES).map(([key, rug]) => <option key={key} value={key}>{rug.label} (+${rug.price})</option>)}</select></label>
                      <label><span className="booking-label">Rug count</span><input type="number" min="0" value={rugCount} onChange={(e) => setRugCount(e.target.value)} className="booking-input" /></label>
                    </div>
                    {priceCalc?.addonTotal ? <p className="booking-help">Add-ons total: ${priceCalc.addonTotal.toFixed(2)}</p> : null}
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <label className="booking-label">Frequency</label>
                    <div className="booking-grid two">
                      {FREQ_OPTIONS.map((f) => (
                        <button key={f.key} onClick={() => setFrequency(f.key)} className={`booking-option green ${frequency === f.key ? 'selected' : ''}`} type="button" style={{ minHeight: 58 }}>
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
                  <label className="booking-label">Vehicle type</label>
                  <div className="booking-grid two">
                    {VEHICLE_TYPES.map((v) => <button key={v.code} onClick={() => setVehicleCode(v.code)} className={`booking-option ${vehicleCode === v.code ? 'selected' : ''}`} type="button"><strong>{v.label}</strong><span>{v.examples}</span></button>)}
                  </div>

                  {vehicleCode && <div style={{ marginTop: 14 }}><label className="booking-label">Package</label><div className="booking-grid three">{Object.entries(CAR_PKG_DETAILS).map(([key, pkg]) => <button key={key} onClick={() => setCarPkg(key)} className={`booking-option ${carPkg === key ? 'selected' : ''}`} type="button"><strong>{pkg.label}</strong><span>{pkg.includes}</span><em>${CAR_WASH_RATES[vehicleCode]?.[key]}</em></button>)}</div></div>}

                  {vehicleCode && carPkg && <div style={{ marginTop: 14 }}><label className="booking-label">Add-ons (optional)</label><div className="booking-grid two">{CAR_ADDONS.map((a) => <button key={a.code} onClick={() => setSelectedCarAddons((prev) => prev.includes(a.code) ? prev.filter((x) => x !== a.code) : [...prev, a.code])} className={`booking-option green ${selectedCarAddons.includes(a.code) ? 'selected' : ''}`} type="button"><strong>{a.label}</strong><span>+${a.price}</span></button>)}</div></div>}
                </div>
              )}

              {isLaundry && (
                <div className="booking-section">
                  <label className="booking-label">Estimated pounds (minimum 10 lbs)</label>
                  <input type="number" min="10" value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} className="booking-input" />
                  <p className="booking-help">$2.50/lb + $20 pickup and delivery. Minimum $45.</p>
                </div>
              )}

              {priceCalc && (
                <div className="booking-price-card">
                  <p>Estimated price</p>
                  <strong>${priceCalc.price.toFixed(2)}</strong>
                  <div className="booking-price-meta">
                    {priceCalc.hours && <span>{priceCalc.hours} estimated hours</span>}
                    {priceCalc.sqftUsed && <span>{priceCalc.sqftUsed} sqft</span>}
                    {priceCalc.sqftUsed && priceCalc.effectiveRate && <span>{priceCalc.sqftUsed} sqft x ${priceCalc.effectiveRate.toFixed(2)}/sqft</span>}
                    {priceCalc.addonTotal ? <span>${priceCalc.addonTotal.toFixed(2)} add-ons</span> : null}
                    {(FREQ_OPTIONS.find((f) => f.key === frequency)?.disc ?? 0) > 0 && <span>-{(FREQ_OPTIONS.find((f) => f.key === frequency)?.disc ?? 0) * 100}% frequency</span>}
                    {priceCalc.corrected && <span>Sqft validated</span>}
                  </div>
                </div>
              )}

              <button onClick={() => canStep1 && setStep(2)} disabled={!canStep1} className="booking-button" type="button">Continue</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="booking-summary">
                <div>
                  <strong>{serviceLabel(serviceType)}</strong>
                  {priceCalc?.hours && <span>{priceCalc.sqftUsed} sqft - {priceCalc.hours}h</span>}
                </div>
                <b>${priceCalc?.price.toFixed(2)}</b>
              </div>

              <div className="booking-grid two">
                <label style={{ gridColumn: '1 / -1' }}><span className="booking-label">Address *</span><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Apt 4B" className="booking-input" /></label>
                <label><span className="booking-label">City</span><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Newark" className="booking-input" /></label>
                <label><span className="booking-label">ZIP</span><input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="08901" className="booking-input" /></label>
                <label><span className="booking-label">Date *</span><input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="booking-input" /></label>
                <label><span className="booking-label">Time *</span><select value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="booking-select"><option value="">Select</option>{['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
                <label style={{ gridColumn: '1 / -1' }}><span className="booking-label">Notes (optional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access code, pets, special instructions..." className="booking-textarea" /></label>
              </div>

              {error && <div className="booking-error">{error}</div>}

              <div className="booking-actions" style={{ marginTop: 16 }}>
                <button onClick={() => setStep(1)} className="booking-button secondary" type="button">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="booking-button" type="button">{loading ? 'Creating...' : 'Confirm Booking'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


