'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup.replit.app/api';

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

export default function ProPayments() {
  const [profile, setProfile] = useState<any>(null);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [completedJobs, setCompletedJobs] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';

    Promise.all([
      fetch(API + '/professionals/me', {
        headers: { Authorization: 'Bearer ' + token },
      }).then((r) => r.json()),
      fetch(API + '/stripe/connect/status', {
        headers: { Authorization: 'Bearer ' + token },
      })
        .then((r) => r.json())
        .catch(() => ({})),
      fetch(API + '/professionals/me/bookings', {
        headers: { Authorization: 'Bearer ' + token },
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ])
      .then(([pd, sd, bd]) => {
        setProfile(pd);
        setStripeStatus(sd);
        const jobs = Array.isArray(bd?.data) ? bd.data : [];
        setCompletedJobs(jobs.filter((j: any) => j.status === 'COMPLETED').length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function startOnboarding() {
    setOnboarding(true);
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(API + '/stripe/connect/onboard', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else setOnboarding(false);
    } catch (e) {
      setOnboarding(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
      </div>
    );
  }

  const isConnected = Boolean(stripeStatus?.connected);
  const canRequestCard = completedJobs >= 3;
  const hourlyRate = Number(profile?.hourly_rate || 18);
  const progress = Math.min((completedJobs / 3) * 100, 100);
  const tier =
    hourlyRate <= 18
      ? { label: 'Priority', bg: '#D1FAE5', color: C.greenDk }
      : hourlyRate <= 20
        ? { label: 'Tier 2', bg: '#FEF3C7', color: '#92400E' }
        : { label: 'Open', bg: '#FEF3C7', color: '#92400E' };

  const card = {
    background: '#fff',
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: '20px 22px',
    boxShadow: '0 2px 12px rgba(13,55,129,0.06)',
  };

  return (
    <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .payments-page{
          width:100%;
          max-width:1320px;
        }
        .payments-grid{
          display:grid;
          grid-template-columns:minmax(0, 1.25fr) minmax(320px, 0.75fr);
          gap:16px;
          align-items:start;
        }
        .payments-column{
          display:flex;
          flex-direction:column;
          gap:16px;
          min-width:0;
        }
        .payments-card-preview{
          border-radius:16px;
          padding:26px 24px;
          position:relative;
          overflow:hidden;
          background:linear-gradient(135deg, ${C.navy}, ${C.blue} 58%, #0d4a2e);
          min-height:190px;
          box-shadow:0 14px 32px rgba(13,55,129,0.24);
        }
        .payments-card-preview::after{
          content:'';
          position:absolute;
          right:-30px;
          top:-28px;
          width:150px;
          height:150px;
          border-radius:50%;
          background:rgba(255,255,255,0.08);
        }
        .payments-schedule-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
        }
        @media (max-width:1120px){
          .payments-grid{ grid-template-columns:1fr; }
        }
        @media (max-width:640px){
          .payments-page h1{ font-size:20px !important; }
          .payments-schedule-grid{ grid-template-columns:1fr; }
          .payments-rate-grid{ grid-template-columns:1fr !important; }
          .payments-card-preview{ min-height:165px; padding:22px 20px; }
        }
      `}</style>

      <div className="payments-page">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 20px' }}>
          Payment Setup
        </h1>

        <div className="payments-grid">
          <div className="payments-column">
            <section style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Direct Deposit</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                    Connect your bank account to receive weekly payouts.
                  </div>
                </div>
                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    background: isConnected ? '#D1FAE5' : '#FEF3C7',
                    color: isConnected ? C.greenDk : '#92400E',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {isConnected ? (
                <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>Bank account connected</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                    Payouts process weekly every Friday.
                  </div>
                </div>
              ) : (
                <button
                  onClick={startOnboarding}
                  disabled={onboarding}
                  style={{
                    width: '100%',
                    padding: '13px 0',
                    borderRadius: 12,
                    border: 'none',
                    cursor: onboarding ? 'default' : 'pointer',
                    background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 800,
                    opacity: onboarding ? 0.7 : 1,
                  }}
                >
                  {onboarding ? 'Redirecting to Stripe...' : 'Connect Bank Account'}
                </button>
              )}
            </section>

            <section style={card}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>
                EverClean Pro Card
              </div>

              <div className="payments-card-preview">
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 18, marginBottom: 30 }}>
                    Ever<span style={{ color: C.green }}>Clean</span>{' '}
                    <span style={{ fontSize: 10, opacity: 0.65, fontWeight: 700, letterSpacing: 1 }}>
                      PRO CARD
                    </span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: 14, letterSpacing: 2.5, marginBottom: 18 }}>
                    **** **** **** {canRequestCard ? '????' : '----'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18 }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, textTransform: 'uppercase' }}>
                        Card Holder
                      </div>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                        {profile?.full_name || 'EverClean Pro'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, textTransform: 'uppercase' }}>
                        Status
                      </div>
                      <div style={{ color: canRequestCard ? C.green : C.warning, fontSize: 12, fontWeight: 800 }}>
                        {canRequestCard ? 'Eligible' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                {canRequestCard ? (
                  <button
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      borderRadius: 12,
                      border: 'none',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${C.green}, ${C.greenDk})`,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    Request Physical Card (Free)
                  </button>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#92400E', fontWeight: 800 }}>
                        {completedJobs}/3 services completed
                      </span>
                      <span style={{ fontSize: 12, color: C.muted }}>
                        {Math.max(3 - completedJobs, 0)} remaining
                      </span>
                    </div>
                    <div style={{ height: 8, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: `linear-gradient(135deg, ${C.green}, ${C.blue})`,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: C.muted, textAlign: 'center' }}>
                  Free card. No fees, no minimum balance.
                </div>
              </div>
            </section>
          </div>

          <div className="payments-column">
            <section style={card}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>
                Your Rate & Auction Tier
              </div>
              <div className="payments-rate-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '18px 16px', background: C.bg, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: C.navy }}>${hourlyRate}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>per hour</div>
                </div>
                <div style={{ padding: '18px 16px', background: tier.bg, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: tier.color }}>{tier.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>auction tier</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
                Lower rate means higher priority. Update in{' '}
                <Link href="/pro/profile" style={{ color: C.blue, fontWeight: 700 }}>
                  Profile
                </Link>
                .
              </div>
            </section>

            <section style={card}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>
                Payout Schedule
              </div>
              <div className="payments-schedule-grid">
                {['WEEKLY', 'BI_WEEKLY'].map((s) => {
                  const active = profile?.payout_schedule === s || (!profile?.payout_schedule && s === 'WEEKLY');
                  return (
                    <div
                      key={s}
                      style={{
                        padding: '14px',
                        borderRadius: 12,
                        border: `2px solid ${active ? C.blue : C.border}`,
                        background: active ? `${C.blue}08` : '#fff',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: active ? C.blue : C.text }}>
                        {s === 'WEEKLY' ? 'Weekly' : 'Bi-Weekly'}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {s === 'WEEKLY' ? 'Every Friday' : 'Every 2 weeks'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
                Change schedule in{' '}
                <Link href="/pro/profile" style={{ color: C.blue, fontWeight: 700 }}>
                  Profile
                </Link>
                .
              </div>
            </section>

            <section style={{ ...card, background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, color: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.72, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Payment readiness
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{isConnected ? 'On' : 'Off'}</div>
                  <div style={{ fontSize: 11, opacity: 0.72 }}>Direct deposit</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{completedJobs}</div>
                  <div style={{ fontSize: 11, opacity: 0.72 }}>Completed jobs</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
