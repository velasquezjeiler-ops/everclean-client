'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type CustomerResult = {
  user_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const C = {
  navy: '#0D3781',
  blue: '#1565C0',
  green: '#4CAF50',
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
  { code: 'AZ', name: 'Arizona', tier: 'B' },
  { code: 'GA', name: 'Georgia', tier: 'C' },
  { code: 'NC', name: 'North Carolina', tier: 'C' },
  { code: 'TN', name: 'Tennessee', tier: 'C' },
  { code: 'OH', name: 'Ohio', tier: 'C' },
  { code: 'PA', name: 'Pennsylvania', tier: 'C' },
  { code: 'MI', name: 'Michigan', tier: 'C' },
  { code: 'AL', name: 'Alabama', tier: 'D' },
  { code: 'MO', name: 'Missouri', tier: 'D' },
];

const STATE_MULTIPLIERS: Record<string, number> = {
  A: 1.2,
  B: 1,
  C: 0.9,
  D: 0.85,
};

const SERVICE_RATES: Record<
  string,
  { label: string; rate: number; min: number; commercial: boolean }
> = {
  HOUSE_CLEANING: { label: 'House Cleaning', rate: 0.15, min: 120, commercial: false },
  DEEP_CLEANING: { label: 'Deep Cleaning', rate: 0.2, min: 150, commercial: false },
  MOVE_IN_OUT: { label: 'Move In / Out', rate: 0.28, min: 200, commercial: false },
  SAME_DAY_CLEANING: { label: 'Same Day', rate: 0.18, min: 130, commercial: false },
  OFFICE_CLEANING: { label: 'Office Cleaning', rate: 0.14, min: 150, commercial: true },
  POST_CONSTRUCTION: { label: 'Post Construction', rate: 0.22, min: 180, commercial: true },
  MEDICAL_CLEANING: { label: 'Medical / Clinical', rate: 0.32, min: 250, commercial: true },
  CARPET_CLEANING: { label: 'Carpet Cleaning', rate: 0.18, min: 130, commercial: false },
  WINDOW_CLEANING: { label: 'Window Cleaning', rate: 0.16, min: 120, commercial: false },
  ORGANIZING: { label: 'Organizing', rate: 0.15, min: 120, commercial: false },
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
  frequency: string,
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

type AddressSuggestion = {
  address_validated: boolean;
  formatted_address: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  zip_plus4: string | null;
  postal_code_full: string;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  dpv_confirmation: string | null;
  address_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  provider?: string;
  has_unconfirmed_components?: boolean;
  has_inferred_components?: boolean;
  missing_components?: boolean;
};

type TypedAddress = {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  formatted: string;
};

export default function AdminNewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customer, setCustomer] = useState<CustomerResult | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const customerBoxRef = useRef<HTMLDivElement | null>(null);

  const [serviceType, setServiceType] = useState('HOUSE_CLEANING');
  const [state, setState] = useState('NJ');
  const stateTier = STATE_OPTIONS.find((s) => s.code === state)?.tier ?? 'B';

  const [sqft, setSqft] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [frequency, setFrequency] = useState('ONE_TIME');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');

  const [addressSuggestion, setAddressSuggestion] = useState<AddressSuggestion | null>(null);
  const [typedAddress, setTypedAddress] = useState<TypedAddress | null>(null);
  const [addressWarning, setAddressWarning] = useState('');

  const priceCalc = (() => {
    const s = parseInt(sqft) || 0;
    if (s === 0 && !beds) return null;
    return calcPrice(
      serviceType,
      s,
      beds ? parseInt(beds) : null,
      baths ? parseInt(baths) : null,
      stateTier,
      frequency,
    );
  })();

  useEffect(() => {
    if (customer) return;
    const q = customerQuery.trim();
    let active = true;
    setCustomerSearchLoading(true);
    const handle = setTimeout(async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const url = `${API}/admin/customers/search?q=${encodeURIComponent(q)}&limit=10`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('search failed');
        const json = (await res.json()) as { data: CustomerResult[] };
        if (active) setCustomerResults(json.data ?? []);
      } catch {
        if (active) setCustomerResults([]);
      } finally {
        if (active) setCustomerSearchLoading(false);
      }
    }, 200);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [customerQuery, customer]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!customerBoxRef.current) return;
      if (!customerBoxRef.current.contains(e.target as Node)) {
        setCustomerSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function selectCustomer(c: CustomerResult) {
    setCustomer(c);
    setCustomerQuery('');
    setCustomerSearchOpen(false);
    if (c.address && !address) setAddress(c.address);
    if (c.city && !city) setCity(c.city);
    if (c.state) setState(c.state);
    if (c.zip && !zipCode) setZipCode(c.zip);
  }

  function clearCustomer() {
    setCustomer(null);
    setCustomerQuery('');
    setCustomerSearchOpen(true);
  }

  async function validateAddress() {
    if (!address || !scheduledDate || !scheduledTime) {
      setError('Address, date, and time are required.');
      return;
    }
    if (!customer) {
      setError('Please select a customer.');
      return;
    }

    setLoading(true);
    setError('');
    setAddressWarning('');
    setTypedAddress({
      address,
      city,
      state,
      zip_code: zipCode,
      formatted: `${address}, ${city}, ${state} ${zipCode}`.replace(/\s+,/g, ',').trim(),
    });

    try {
      const res = await fetch(`${API}/address-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, city, state, zip_code: zipCode }),
      });
      if (!res.ok) throw new Error('validation failed');
      const suggestion = (await res.json()) as AddressSuggestion;
      setAddressSuggestion(suggestion);
    } catch {
      setAddressWarning(
        'Could not validate the address. You may continue with what was entered.',
      );
      setAddressSuggestion({
        address_validated: false,
        formatted_address: `${address}, ${city}, ${state} ${zipCode}`,
        address_line1: address,
        city,
        state,
        zip_code: zipCode.split('-')[0] || zipCode,
        zip_plus4: zipCode.includes('-') ? zipCode.split('-')[1] : null,
        postal_code_full: zipCode,
        latitude: null,
        longitude: null,
        google_place_id: null,
        dpv_confirmation: null,
        address_confidence: 'LOW',
        provider: 'validation_unavailable',
      });
    } finally {
      setLoading(false);
    }
  }

  async function confirmAddressAndBook() {
    if (!addressSuggestion) return;
    if (!customer) {
      setError('Please select a customer before creating the booking.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setAddress(addressSuggestion.address_line1);
      setCity(addressSuggestion.city);
      setState(addressSuggestion.state);
      setZipCode(addressSuggestion.postal_code_full);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const body: Record<string, unknown> = {
        created_by: 'admin',
        customer_user_id: customer?.user_id,
        customer_email: customer?.email,
        service_type: serviceType,
        address: addressSuggestion.address_line1,
        city: addressSuggestion.city,
        state: addressSuggestion.state,
        zip_code: addressSuggestion.zip_code,
        zip_plus4: addressSuggestion.zip_plus4,
        postal_code_full: addressSuggestion.postal_code_full,
        address_validated: addressSuggestion.address_validated,
        formatted_address: addressSuggestion.formatted_address,
        latitude: addressSuggestion.latitude,
        longitude: addressSuggestion.longitude,
        google_place_id: addressSuggestion.google_place_id,
        dpv_confirmation: addressSuggestion.dpv_confirmation,
        address_confidence: addressSuggestion.address_confidence,
        scheduledAt: `${scheduledDate}T${scheduledTime}:00`,
        notes,
        frequency,
        sqft: parseInt(sqft) || 0,
        bedrooms: beds ? parseInt(beds) : null,
        bathrooms: baths ? parseInt(baths) : null,
      };

      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Error creating booking');
      }

      router.push('/?booked=1');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function editAddress() {
    setAddressSuggestion(null);
    setTypedAddress(null);
    setAddressWarning('');
    setError('');
  }

  function keepTypedAddress() {
    if (!typedAddress) return;
    setAddressSuggestion({
      address_validated: false,
      formatted_address: typedAddress.formatted,
      address_line1: typedAddress.address,
      city: typedAddress.city,
      state: typedAddress.state,
      zip_code: typedAddress.zip_code.split('-')[0] || typedAddress.zip_code,
      zip_plus4: typedAddress.zip_code.includes('-') ? typedAddress.zip_code.split('-')[1] : null,
      postal_code_full: typedAddress.zip_code,
      latitude: null,
      longitude: null,
      google_place_id: null,
      dpv_confirmation: null,
      address_confidence: 'LOW',
      provider: 'user_override',
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    background: '#fff',
    color: C.text,
    minHeight: 42,
    padding: '0 12px',
    outline: 'none',
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: C.text,
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 8,
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 46,
    border: 0,
    borderRadius: 14,
    color: '#fff',
    background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
    fontSize: 15,
    fontWeight: 900,
    cursor: 'pointer',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#fff',
    color: C.text,
    border: `1px solid ${C.border}`,
  };

  return (
    <main>
      <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900 }}>
        Create booking (admin)
      </h1>
      <p style={{ margin: '0 0 20px', color: C.muted, fontSize: 14 }}>
        Book a service on behalf of a customer. Address validation runs through the same intelligence
        endpoint used by the customer flow.
      </p>

      <section
        style={{
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 18,
          display: 'grid',
          gap: 14,
        }}
      >
        <div ref={customerBoxRef} style={{ position: 'relative' }}>
          <span style={labelStyle}>Customer *</span>
          {customer ? (
            <div
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 12,
                background: '#F8FBFF',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', color: C.text, fontSize: 14, fontWeight: 800 }}>
                  {customer.name || customer.contact_name || customer.email}
                </strong>
                <span style={{ display: 'block', color: C.muted, fontSize: 12, marginTop: 2 }}>
                  {customer.email}
                  {customer.phone ? ` · ${customer.phone}` : ''}
                </span>
                {(customer.address || customer.city) && (
                  <span style={{ display: 'block', color: C.muted, fontSize: 12, marginTop: 2 }}>
                    {[customer.address, customer.city, customer.state, customer.zip]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearCustomer}
                style={{
                  border: `1px solid ${C.border}`,
                  background: '#fff',
                  color: C.text,
                  borderRadius: 10,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setCustomerSearchOpen(true);
              }}
              onFocus={() => setCustomerSearchOpen(true)}
              placeholder="Search by name, email, or phone..."
              style={inputStyle}
            />
          )}

          {!customer && customerSearchOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                background: '#fff',
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
                maxHeight: 280,
                overflowY: 'auto',
                zIndex: 20,
              }}
            >
              {customerSearchLoading && customerResults.length === 0 ? (
                <div style={{ padding: 12, color: C.muted, fontSize: 13 }}>Searching...</div>
              ) : customerResults.length === 0 ? (
                <div style={{ padding: 12, color: C.muted, fontSize: 13 }}>
                  No customers match.
                </div>
              ) : (
                customerResults.map((c) => (
                  <button
                    key={c.user_id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 0,
                      borderBottom: `1px solid ${C.border}`,
                      padding: '10px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        color: C.text,
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {c.name || c.contact_name || c.email}
                    </strong>
                    <span style={{ display: 'block', color: C.muted, fontSize: 12 }}>
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ''}
                    </span>
                    {(c.address || c.city) && (
                      <span style={{ display: 'block', color: C.muted, fontSize: 12 }}>
                        {[c.address, c.city, c.state, c.zip].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <label>
            <span style={labelStyle}>Service</span>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              style={inputStyle}
            >
              {Object.entries(SERVICE_RATES).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={labelStyle}>State</span>
            <select value={state} onChange={(e) => setState(e.target.value)} style={inputStyle}>
              {STATE_OPTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={labelStyle}>Bedrooms</span>
            <select value={beds} onChange={(e) => setBeds(e.target.value)} style={inputStyle}>
              <option value="">--</option>
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'Studio' : n}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={labelStyle}>Bathrooms</span>
            <select value={baths} onChange={(e) => setBaths(e.target.value)} style={inputStyle}>
              <option value="">--</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            <span style={labelStyle}>Sqft (optional)</span>
            <input
              type="number"
              min="100"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              placeholder="e.g. 1200"
              style={inputStyle}
            />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            <span style={labelStyle}>Frequency</span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={inputStyle}
            >
              {FREQ_OPTIONS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                  {f.disc > 0 ? ` (-${f.disc * 100}%)` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {priceCalc && (
          <div
            style={{
              borderRadius: 14,
              padding: 14,
              color: '#fff',
              background: `linear-gradient(135deg, ${C.navy}, ${C.blue} 55%, ${C.green})`,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, opacity: 0.85, fontWeight: 700 }}>
              Estimated price
            </p>
            <strong style={{ display: 'block', fontSize: 28, fontWeight: 900 }}>
              ${priceCalc.price.toFixed(2)}
            </strong>
            <span style={{ fontSize: 12, opacity: 0.85 }}>
              {priceCalc.hours}h · {priceCalc.sqftUsed} sqft
              {priceCalc.corrected ? ' (sqft adjusted)' : ''}
            </span>
          </div>
        )}

        <hr style={{ border: 0, borderTop: `1px solid ${C.border}`, margin: '4px 0' }} />

        <label>
          <span style={labelStyle}>Address *</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Apt 4B"
            style={inputStyle}
          />
        </label>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '2fr 1fr' }}>
          <label>
            <span style={labelStyle}>City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Newark"
              style={inputStyle}
            />
          </label>
          <label>
            <span style={labelStyle}>ZIP</span>
            <input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="08901"
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <label>
            <span style={labelStyle}>Date *</span>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={inputStyle}
            />
          </label>
          <label>
            <span style={labelStyle}>Time *</span>
            <select
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select</option>
              {[
                '08:00',
                '09:00',
                '10:00',
                '11:00',
                '12:00',
                '13:00',
                '14:00',
                '15:00',
                '16:00',
                '17:00',
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span style={labelStyle}>Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Access code, pets, special instructions..."
            style={{ ...inputStyle, minHeight: 82, padding: 12, resize: 'none' }}
          />
        </label>

        {addressWarning && (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              color: '#92400E',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {addressWarning}
          </div>
        )}

        {addressSuggestion &&
          (() => {
            const typedFormatted = typedAddress?.formatted ?? '';
            const suggestedFormatted = addressSuggestion.formatted_address;
            const addressDiffers =
              typedFormatted.replace(/\s+/g, ' ').trim().toLowerCase() !==
              suggestedFormatted.replace(/\s+/g, ' ').trim().toLowerCase();
            const hasUnconfirmed = !!addressSuggestion.has_unconfirmed_components;
            const hasInferred = !!addressSuggestion.has_inferred_components;
            const isLow = addressSuggestion.address_confidence === 'LOW';
            const isProviderResponse =
              addressSuggestion.provider === 'google' ||
              addressSuggestion.provider === 'fallback';
            const mustFix = isProviderResponse && (isLow || hasUnconfirmed);
            const showCompare = addressDiffers || hasInferred;

            return (
              <div
                style={{
                  border: `1px solid ${mustFix ? '#FECACA' : C.border}`,
                  borderRadius: 14,
                  padding: 14,
                  background: mustFix ? '#FEF2F2' : '#F8FBFF',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: C.muted,
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 1.4,
                  }}
                >
                  {mustFix
                    ? 'Could not confirm address'
                    : showCompare
                      ? 'Which address is correct?'
                      : 'Confirm address'}
                </p>

                {mustFix && (
                  <p
                    style={{
                      margin: '8px 0 0',
                      color: C.danger,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {hasUnconfirmed
                      ? 'Missing details (e.g. apt or unit). Edit before continuing.'
                      : 'Low confidence on this address. Review and correct it before continuing.'}
                  </p>
                )}

                {showCompare && typedAddress ? (
                  <div
                    style={{
                      display: 'grid',
                      gap: 10,
                      gridTemplateColumns: '1fr 1fr',
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        border: `1px solid ${C.border}`,
                        background: '#fff',
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: C.muted,
                          fontSize: 11,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: 1.4,
                        }}
                      >
                        You typed
                      </p>
                      <strong
                        style={{
                          display: 'block',
                          color: C.text,
                          fontSize: 14,
                          fontWeight: 800,
                          marginTop: 6,
                        }}
                      >
                        {typedFormatted}
                      </strong>
                      {!mustFix && (
                        <button
                          onClick={keepTypedAddress}
                          style={{ ...secondaryButtonStyle, marginTop: 12 }}
                          type="button"
                          disabled={loading}
                        >
                          Use what I typed
                        </button>
                      )}
                    </div>
                    <div
                      style={{
                        border: `1px solid ${C.blue}`,
                        background: '#EFF6FF',
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: C.blue,
                          fontSize: 11,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: 1.4,
                        }}
                      >
                        We found
                      </p>
                      <strong
                        style={{
                          display: 'block',
                          color: C.text,
                          fontSize: 14,
                          fontWeight: 800,
                          marginTop: 6,
                        }}
                      >
                        {suggestedFormatted}
                      </strong>
                      {!mustFix && (
                        <button
                          onClick={confirmAddressAndBook}
                          style={{ ...buttonStyle, marginTop: 12 }}
                          type="button"
                          disabled={loading || !customer}
                        >
                          {loading ? 'Creating...' : 'Use this address'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <strong
                    style={{
                      display: 'block',
                      color: C.text,
                      fontSize: 16,
                      fontWeight: 900,
                      marginTop: 8,
                    }}
                  >
                    {suggestedFormatted}
                  </strong>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 10,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: C.muted, fontSize: 13, fontWeight: 700 }}>
                    ZIP+4: {addressSuggestion.postal_code_full}
                  </span>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 900,
                      color: '#fff',
                      background:
                        addressSuggestion.address_confidence === 'HIGH'
                          ? C.green
                          : addressSuggestion.address_confidence === 'MEDIUM'
                            ? C.warning
                            : C.danger,
                    }}
                  >
                    Confidence: {addressSuggestion.address_confidence}
                  </span>
                  {hasUnconfirmed && (
                    <span style={{ color: C.danger, fontSize: 12, fontWeight: 800 }}>
                      Unconfirmed components
                    </span>
                  )}
                  {hasInferred && !mustFix && (
                    <span style={{ color: C.warning, fontSize: 12, fontWeight: 800 }}>
                      Inferred components
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    onClick={editAddress}
                    style={secondaryButtonStyle}
                    type="button"
                    disabled={loading}
                  >
                    Edit address
                  </button>
                  {!showCompare && !mustFix && (
                    <button
                      onClick={confirmAddressAndBook}
                      style={buttonStyle}
                      type="button"
                      disabled={loading || !customer}
                    >
                      {loading ? 'Creating...' : 'Use this address'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: C.danger,
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        )}

        {!addressSuggestion && (
          <button
            onClick={validateAddress}
            disabled={loading || !priceCalc || !customer}
            style={buttonStyle}
            type="button"
          >
            {loading ? 'Validating address...' : 'Validate address'}
          </button>
        )}
      </section>
    </main>
  );
}
