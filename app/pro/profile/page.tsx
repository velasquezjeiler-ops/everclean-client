'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const C = {
  navy: '#0D3781',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  bg: '#F5F7FA',
  text: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
};

const SERVICES_LIST = [
  'House Cleaning',
  'Deep Cleaning',
  'Move In/Out',
  'Office Cleaning',
  'Post Construction',
  'Carpet Cleaning',
  'Medical Facility',
  'Industrial',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'Portuguese',
  'French',
  'Mandarin',
  'Hindi',
  'Korean',
  'Arabic',
];

const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
  '';

let googleMapsPromise: Promise<any> | null = null;

function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));

  const win = window as any;
  if (win.google?.maps) return Promise.resolve(win.google.maps);
  if (!GOOGLE_MAPS_KEY) return Promise.reject(new Error('Google Maps key missing'));
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-everclean-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).google.maps), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}`;
    script.async = true;
    script.defer = true;
    script.dataset.evercleanGoogleMaps = 'true';
    script.onload = () => resolve((window as any).google.maps);
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export default function ProProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState(25);
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const coverageMapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const coverageMarkerRef = useRef<any>(null);
  const coverageCircleRef = useRef<any>(null);
  const coverageGeocoderRef = useRef<any>(null);
  const [mapError, setMapError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    bio: '',
    address: '',
    city: '',
    state: 'NJ',
    zipCode: '',
    serviceRadiusMiles: 25,
    hourlyRate: 25,
    payoutSchedule: 'WEEKLY',
    language: ['English'] as string[],
    servicesOffered: [] as string[],
  });

  useEffect(() => {
    const saved = localStorage.getItem('pro_photo');
    if (saved) setPhoto(saved);
  }, []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Max 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      localStorage.setItem('pro_photo', result);
      setPhoto(result);
    };
    reader.readAsDataURL(file);
  }

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/professionals/me', {
        headers: { Authorization: 'Bearer ' + token },
      });

      if (res.ok) {
        const d = await res.json();
        setProfile(d);
        setForm({
          fullName: d.full_name || '',
          phone: d.phone || '',
          email: d.email || '',
          bio: d.bio || '',
          address: d.address || '',
          city: d.city || '',
          state: d.state || 'NJ',
          zipCode: d.zip_code || '',
          serviceRadiusMiles: Number(d.service_radius_miles || 25),
          hourlyRate: Number(d.hourly_rate || 25),
          payoutSchedule: d.payout_schedule || 'WEEKLY',
          language: d.language
            ? typeof d.language === 'string'
              ? JSON.parse(d.language)
              : d.language
            : ['English'],
          servicesOffered: d.services_offered
            ? typeof d.services_offered === 'string'
              ? JSON.parse(d.services_offered)
              : d.services_offered
            : [],
        });
        setNewRate(Number(d.hourly_rate || 25));
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const clampedRadius = Math.min(50, Math.max(0, form.serviceRadiusMiles || 0));
  const baseAddress = [form.address, form.city, form.state, form.zipCode].filter(Boolean).join(', ');
  const mapQuery = encodeURIComponent(baseAddress || 'New Brunswick, NJ');
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const embedMapUrl = `https://maps.google.com/maps?q=${mapQuery}&output=embed&z=11`;
  const hasGoogleMapsKey = Boolean(GOOGLE_MAPS_KEY);
  const profileLat = Number(profile?.lat);
  const profileLng = Number(profile?.lng);
  const hasProfileCoords = Number.isFinite(profileLat) && Number.isFinite(profileLng);
  const fallbackCenter = { lat: 40.4862, lng: -74.4518 };
  const coverageBand =
    clampedRadius <= 10
      ? { label: 'Excellent coverage', tone: 'Fastest response', color: '#15803D', bg: '#DCFCE7' }
      : clampedRadius <= 20
        ? { label: 'Good coverage', tone: 'Strong response window', color: '#65A30D', bg: '#ECFCCB' }
        : clampedRadius <= 30
          ? { label: 'Medium coverage', tone: 'Balanced travel time', color: '#CA8A04', bg: '#FEF9C3' }
          : clampedRadius <= 40
            ? { label: 'Low coverage', tone: 'Longer drive times', color: '#EA580C', bg: '#FFEDD5' }
            : { label: 'Minimum priority', tone: 'Longest travel times', color: '#DC2626', bg: '#FEE2E2' };

  const syncCoverageMap = useCallback(() => {
    const map = googleMapRef.current;
    const circle = coverageCircleRef.current;
    if (!map || !circle) return;

    circle.setRadius(clampedRadius * 1609.344);
    circle.setOptions({
      strokeColor: coverageBand.color,
      fillColor: coverageBand.color,
    });

    const bounds = circle.getBounds?.();
    if (bounds) map.fitBounds(bounds, 34);
  }, [clampedRadius, coverageBand.color]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !coverageMapRef.current) return;

        const map =
          googleMapRef.current ||
          new maps.Map(coverageMapRef.current, {
            center: hasProfileCoords ? { lat: profileLat, lng: profileLng } : fallbackCenter,
            zoom: 10,
            clickableIcons: true,
            fullscreenControl: true,
            mapTypeControl: true,
            mapTypeId: 'roadmap',
            streetViewControl: false,
          });

        googleMapRef.current = map;
        coverageGeocoderRef.current = coverageGeocoderRef.current || new maps.Geocoder();
        coverageMarkerRef.current =
          coverageMarkerRef.current ||
          new maps.Marker({
            map,
            title: 'Base address',
          });
        coverageCircleRef.current =
          coverageCircleRef.current ||
          new maps.Circle({
            map,
            clickable: false,
            fillOpacity: 0.2,
            strokeOpacity: 0.95,
            strokeWeight: 4,
          });

        const applyCenter = (center: { lat: number; lng: number }) => {
          coverageMarkerRef.current.setPosition(center);
          coverageCircleRef.current.setCenter(center);
          map.setCenter(center);
          setMapError('');
          syncCoverageMap();
        };

        if (hasProfileCoords) {
          applyCenter({ lat: profileLat, lng: profileLng });
          return;
        }

        if (!baseAddress) {
          applyCenter(fallbackCenter);
          setMapError('Add your professional address to center coverage precisely.');
          return;
        }

        coverageGeocoderRef.current.geocode({ address: baseAddress }, (results: any, status: string) => {
          if (cancelled) return;
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            applyCenter({ lat: loc.lat(), lng: loc.lng() });
          } else {
            applyCenter(fallbackCenter);
            setMapError('Unable to locate this address on Google Maps.');
          }
        });
      })
      .catch(() => {
        if (!cancelled) setMapError('Google Maps key is required for exact radius coverage.');
      });

    return () => {
      cancelled = true;
    };
  }, [baseAddress, hasProfileCoords, profileLat, profileLng]);

  useEffect(() => {
    syncCoverageMap();
  }, [syncCoverageMap]);

  async function saveProfile() {
    setSaving(true);
    setMessage('');
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(API + '/professionals/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          fullName: form.fullName,
          full_name: form.fullName,
          phone: form.phone,
          email: form.email,
          bio: form.bio,
          address: form.address,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          zip_code: form.zipCode,
          serviceRadiusMiles: form.serviceRadiusMiles,
          service_radius_miles: form.serviceRadiusMiles,
          hourlyRate: form.hourlyRate,
          hourly_rate: form.hourlyRate,
          payoutSchedule: form.payoutSchedule,
          payout_schedule: form.payoutSchedule,
          language: Array.isArray(form.language) ? form.language : [],
          languages: Array.isArray(form.language) ? form.language : [],
          servicesOffered: Array.isArray(form.servicesOffered) ? form.servicesOffered : [],
          services_offered: Array.isArray(form.servicesOffered) ? form.servicesOffered : [],
        }),
      });

      if (res.ok) {
        setMessage('Profile saved successfully!');
        loadProfile();
      } else {
        const e = await res.json();
        setMessage('Error: ' + e.error);
      }
    } catch (e) {
      setMessage('Error: Unable to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function saveRate() {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API + '/professionals/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ hourlyRate: newRate }),
    });

    if (res.ok) {
      setEditingRate(false);
      setForm((p) => ({ ...p, hourlyRate: newRate }));
      loadProfile();
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: `3px solid ${C.border}`,
            borderTopColor: C.green,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const rating = Number(profile?.avg_rating || 0);
  const services = Number(profile?.total_services || 0);
  const earnings = Number(profile?.total_earnings || 0);
  const completion = Number(profile?.completion_rate || 100);
  const initials = (form.fullName || 'P')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    color: C.text,
    outline: 'none',
    fontFamily: 'Poppins, sans-serif',
    background: '#fff',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: C.muted,
    display: 'block',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: '20px 22px',
    boxShadow: '0 2px 12px rgba(13,55,129,0.06)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus,textarea:focus{
          border-color:${C.blue} !important;
          box-shadow:0 0 0 3px rgba(21,101,192,0.08);
        }
        .pro-profile-layout{
          display:grid;
          grid-template-columns:minmax(0, 1fr) 300px;
          gap:20px;
          align-items:start;
        }
        .pro-profile-grid{
          display:grid;
          grid-template-columns:repeat(2, minmax(0, 1fr));
          gap:14px;
        }
        .pro-profile-grid > div,
        .pro-profile-main,
        .pro-profile-side{
          min-width:0;
        }
        .pro-radius-panel{
          display:flex;
          flex-direction:column;
          gap:14px;
          padding:14px;
          border:1px solid ${C.border};
          border-radius:12px;
          background:linear-gradient(180deg, #fff 0%, ${C.bg} 100%);
          overflow:hidden;
        }
        .coverage-control{
          display:grid;
          grid-template-columns:minmax(0, 1fr) 76px;
          gap:12px;
          align-items:center;
        }
        .coverage-range{
          appearance:none;
          width:100%;
          height:8px;
          border-radius:999px;
          outline:none;
          background:
            linear-gradient(90deg, #16A34A 0 20%, #84CC16 20% 40%, #FACC15 40% 60%, #FB923C 60% 80%, #EF4444 80% 100%);
        }
        .coverage-range::-webkit-slider-thumb{
          appearance:none;
          width:22px;
          height:22px;
          border-radius:50%;
          background:#fff;
          border:5px solid var(--coverage-color);
          box-shadow:0 4px 12px rgba(13,55,129,0.25);
          cursor:pointer;
        }
        .coverage-range::-moz-range-thumb{
          width:16px;
          height:16px;
          border-radius:50%;
          background:#fff;
          border:5px solid var(--coverage-color);
          box-shadow:0 4px 12px rgba(13,55,129,0.25);
          cursor:pointer;
        }
        .coverage-map{
          position:relative;
          min-height:280px;
          border-radius:14px;
          border:1px solid ${C.border};
          overflow:hidden;
          background:#E5E7EB;
        }
        .coverage-map-canvas{
          position:absolute;
          inset:0;
          width:100%;
          height:100%;
        }
        .coverage-map-frame{
          position:absolute;
          inset:0;
          width:100%;
          height:100%;
          border:0;
        }
        .coverage-map-link{
          position:absolute;
          top:10px;
          left:10px;
          z-index:9;
          padding:7px 10px;
          border-radius:8px;
          background:rgba(255,255,255,0.94);
          color:${C.blue};
          font-size:11px;
          font-weight:800;
          text-decoration:none;
          box-shadow:0 3px 12px rgba(13,55,129,0.14);
        }
        .coverage-map-note{
          position:absolute;
          left:10px;
          bottom:10px;
          z-index:9;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(255,255,255,0.92);
          color:${C.muted};
          font-size:10px;
          font-weight:700;
          box-shadow:0 3px 12px rgba(13,55,129,0.12);
          pointer-events:none;
        }
        .coverage-legend{
          display:grid;
          grid-template-columns:repeat(5, minmax(0, 1fr));
          gap:8px;
        }
        .coverage-legend-item{
          border-radius:10px;
          padding:8px 9px;
          font-size:10px;
          color:${C.text};
          background:#fff;
          border:1px solid ${C.border};
          min-width:0;
        }
        @media (max-width:980px){
          .pro-profile-layout{
            grid-template-columns:minmax(0, 1fr);
          }
        }
        @media (max-width:640px){
          .pro-profile-grid,
          .coverage-control,
          .coverage-legend{
            grid-template-columns:minmax(0, 1fr);
          }
          .coverage-map{
            min-height:230px;
          }
          .pro-profile-card{
            padding:16px !important;
            border-radius:14px !important;
          }
          .pro-profile-chip{
            flex:1 1 calc(50% - 8px);
            min-width:0;
            justify-content:center;
            white-space:normal;
          }
        }
      `}</style>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhoto}
      />

      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            background: message.startsWith('Error') ? '#FEE2E2' : '#D1FAE5',
            color: message.startsWith('Error') ? '#991B1B' : C.greenDk,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {message}
          <button
            onClick={() => setMessage('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              opacity: 0.6,
            }}
          >
            âœ•
          </button>
        </div>
      )}

      <div className="pro-profile-layout">
        <div className="pro-profile-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="pro-profile-card" style={cardStyle}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                marginBottom: 16,
              }}
            >
              Personal Information
            </div>
            <div className="pro-profile-grid">
              <div>
                <label style={labelStyle}>Full name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell clients about yourself and your experience..."
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>
            </div>
          </div>

          <div className="pro-profile-card" style={cardStyle}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                marginBottom: 16,
              }}
            >
              Address
            </div>
            <div className="pro-profile-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Street address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>ZIP code</label>
                <input
                  value={form.zipCode}
                  onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Service radius ({form.serviceRadiusMiles} mi)</label>
                <div className="pro-radius-panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: coverageBand.bg,
                        color: coverageBand.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      âŒ‚
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                        Base address
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {baseAddress || 'Add your professional address to center coverage'}
                      </div>
                    </div>
                  </div>

                  <div className="coverage-control">
                    <div style={{ minWidth: 0 }}>
                      <input
                        className="coverage-range"
                        type="range"
                        min={0}
                        max={50}
                        step={1}
                        value={clampedRadius}
                        onChange={(e) =>
                          setForm({ ...form, serviceRadiusMiles: Number(e.target.value) })
                        }
                        style={{ '--coverage-color': coverageBand.color } as React.CSSProperties}
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: 6,
                          fontSize: 10,
                          color: C.muted,
                        }}
                      >
                        <span>0 mi</span>
                        <span>10</span>
                        <span>20</span>
                        <span>30</span>
                        <span>40</span>
                        <span>50 mi</span>
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                        max={50}
                        step={1}
                        value={clampedRadius}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          serviceRadiusMiles: Math.min(50, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                      style={{ ...inputStyle, padding: '9px 8px', textAlign: 'center', fontWeight: 700, color: coverageBand.color }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: coverageBand.bg,
                      color: coverageBand.color,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{coverageBand.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>{coverageBand.tone}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{clampedRadius} mi</div>
                  </div>

                  <div className="coverage-map">
                    {hasGoogleMapsKey ? (
                      <div ref={coverageMapRef} className="coverage-map-canvas" />
                    ) : (
                      <iframe
                        className="coverage-map-frame"
                        title="Professional coverage map"
                        loading="lazy"
                        src={embedMapUrl}
                      />
                    )}
                    <a className="coverage-map-link" href={mapsSearchUrl} target="_blank" rel="noreferrer">
                      Open in Maps
                    </a>
                    <div className="coverage-map-note">
                      {hasGoogleMapsKey
                        ? mapError || `${clampedRadius} mi radius from your base address`
                        : 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing in this Vercel build'}
                    </div>
                  </div>

                  <div className="coverage-legend">
                    {[
                      { label: '0-10 mi', text: 'Excellent', color: '#15803D', bg: '#DCFCE7' },
                      { label: '11-20 mi', text: 'Good', color: '#65A30D', bg: '#ECFCCB' },
                      { label: '21-30 mi', text: 'Medium', color: '#CA8A04', bg: '#FEF9C3' },
                      { label: '31-40 mi', text: 'Low', color: '#EA580C', bg: '#FFEDD5' },
                      { label: '41+ mi', text: 'Slowest', color: '#DC2626', bg: '#FEE2E2' },
                    ].map((zone) => (
                      <div key={zone.label} className="coverage-legend-item" style={{ background: zone.bg, borderColor: `${zone.color}33` }}>
                        <div style={{ fontWeight: 800, color: zone.color }}>{zone.label}</div>
                        <div style={{ color: C.muted, marginTop: 2 }}>{zone.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pro-profile-card" style={cardStyle}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                marginBottom: 14,
              }}
            >
              Services offered
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SERVICES_LIST.map((svc) => {
                const selected = form.servicesOffered.includes(svc);
                return (
                  <button
                    key={svc}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        servicesOffered: selected
                          ? p.servicesOffered.filter((s) => s !== svc)
                          : [...p.servicesOffered, svc],
                      }))
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1.5px solid ${selected ? C.green : C.border}`,
                      background: selected ? 'rgba(76,175,80,0.12)' : '#fff',
                      color: selected ? C.greenDk : C.muted,
                    }}
                    className="pro-profile-chip"
                  >
                    {selected ? 'âœ“ ' : ''}
                    {svc}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pro-profile-card" style={cardStyle}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                marginBottom: 14,
              }}
            >
              Languages
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LANGUAGES.map((lang) => {
                const selected = form.language.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        language: selected
                          ? p.language.filter((l) => l !== lang)
                          : [...p.language, lang],
                      }))
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1.5px solid ${selected ? C.blue : C.border}`,
                      background: selected ? 'rgba(21,101,192,0.10)' : '#fff',
                      color: selected ? C.blue : C.muted,
                    }}
                    className="pro-profile-chip"
                  >
                    {selected ? 'âœ“ ' : ''}
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(13,55,129,0.3)',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>

        <div className="pro-profile-side" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="pro-profile-card" style={{ ...cardStyle, textAlign: 'center' }}>
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                marginBottom: 12,
                cursor: 'pointer',
              }}
              onClick={() => inputRef.current?.click()}
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Profile"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${C.green}`,
                    boxShadow: '0 4px 16px rgba(76,175,80,0.3)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${C.green}, ${C.blue})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#fff',
                    margin: '0 auto',
                    boxShadow: '0 4px 16px rgba(13,55,129,0.2)',
                  }}
                >
                  {initials}
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  background: C.blue,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 6px rgba(13,55,129,0.3)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
              Click to upload photo
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
              {form.fullName || 'Professional'}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
              {form.city || 'NJ'}, {form.state}
            </div>

            {rating > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  marginTop: 8,
                }}
              >
                <span style={{ color: C.warning, fontSize: 13 }}>
                  {'â˜…'.repeat(Math.round(rating))}
                </span>
                <span style={{ fontSize: 12, color: C.muted }}>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Hourly rate</div>
              <button
                onClick={() => setEditingRate(!editingRate)}
                style={{
                  fontSize: 11,
                  color: C.blue,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {editingRate ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingRate ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: C.muted }}>$</span>
                  <input
                    type="number"
                    min={18}
                    max={30}
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    style={{
                      ...inputStyle,
                      width: 80,
                      textAlign: 'center',
                      padding: '8px',
                    }}
                  />
                  <span style={{ fontSize: 13, color: C.muted }}>/hr</span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#92400E',
                    background: '#FEF3C7',
                    borderRadius: 8,
                    padding: '8px 10px',
                    marginBottom: 10,
                  }}
                >
                  Lower rate = higher auction priority
                </div>
                <button
                  onClick={saveRate}
                  style={{
                    width: '100%',
                    padding: '9px 0',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${C.green}, ${C.greenDk})`,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Save rate
                </button>
              </div>
            ) : (
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                ${form.hourlyRate}
                <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/hr</span>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
              Performance
            </div>
            {[
              { label: 'Total earnings', val: `$${earnings.toFixed(2)}` },
              { label: 'Services completed', val: services },
              { label: 'Completion rate', val: `${completion}%` },
              { label: 'Service radius', val: `${form.serviceRadiusMiles} mi` },
              { label: 'Payout schedule', val: form.payoutSchedule },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: 12, color: C.muted }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.val}</span>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
              Verifications
            </div>
            {[
              { label: 'Background check', done: profile?.background_checked },
              { label: 'ID verified', done: profile?.id_verified },
              { label: 'Payout setup', done: !!profile?.stripe_account_id },
            ].map((v) => (
              <div
                key={v.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: 13, color: v.done ? C.green : C.warning }}>
                  {v.done ? 'âœ“' : 'â³'}
                </span>
                <span style={{ fontSize: 12, color: v.done ? C.text : C.muted }}>
                  {v.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ ...cardStyle, textAlign: 'center', background: C.bg }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Need help?</div>
            <button
              style={{
                fontSize: 12,
                color: C.blue,
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Contact support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

