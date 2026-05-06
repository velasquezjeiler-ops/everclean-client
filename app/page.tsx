'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const C = {
  navy: '#0D3781',
  navyDark: '#081f4a',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  bg: '#F5F7FA',
  text: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'request'|'confirm'>('request');
  const [resetMethod, setResetMethod] = useState<'email'|'sms'>('email');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  async function requestPasswordReset() {
    if (!email || resetLoading) return;
    setResetLoading(true);
    setResetMessage('');
    setError('');
    try {
      const res = await fetch(API + '/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method: resetMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send reset code');
      setResetStep('confirm');
      setResetMessage(`Code sent by ${resetMethod === 'sms' ? 'SMS' : 'email'}.`);
    } catch (e: any) {
      setResetMessage(e.message || 'Unable to send reset code');
    } finally {
      setResetLoading(false);
    }
  }

  async function confirmPasswordReset() {
    if (!email || !resetCode || !resetPassword || resetLoading) return;
    setResetLoading(true);
    setResetMessage('');
    setError('');
    try {
      const res = await fetch(API + '/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to reset password');
      setPassword(resetPassword);
      setResetOpen(false);
      setResetStep('request');
      setResetCode('');
      setResetPassword('');
      setResetMessage('Password updated. You can sign in now.');
    } catch (e: any) {
      setResetMessage(e.message || 'Unable to reset password');
    } finally {
      setResetLoading(false);
    }
  }
  async function handleLogin() {
    if (loading || !email || !password) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role', data.role);

      if (data.role === 'ADMIN') {
        window.location.href = 'https://everclean-admin.vercel.app';
      } else if (data.role === 'PROFESSIONAL') {
        router.push('/pro/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  const features = [
    'Instant pricing by sqft and state',
    'Real-time cleaner tracking',
    'Automated scheduling and billing',
  ];

  return (
    <main className="client-login-root">
      <style>{`
        .client-login-root {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(76, 175, 80, 0.13), transparent 30%),
            linear-gradient(135deg, #f8fbff 0%, ${C.bg} 48%, #edf7f1 100%);
          color: ${C.text};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
        }

        .client-login-shell {
          width: 100%;
          max-width: 1180px;
          min-height: min(720px, calc(100vh - 56px));
          display: grid;
          grid-template-columns: minmax(0, 1fr) 440px;
          gap: 20px;
          align-items: stretch;
        }

        .client-hero {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          background: linear-gradient(135deg, ${C.navyDark} 0%, #123a62 48%, #0d4a2e 100%);
          color: #fff;
          padding: 42px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 20px 60px rgba(13, 55, 129, 0.2);
        }

        .client-hero::before {
          content: "";
          position: absolute;
          inset: auto -110px -130px auto;
          width: 320px;
          height: 320px;
          border-radius: 999px;
          background: rgba(76, 175, 80, 0.16);
        }

        .client-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          position: relative;
          z-index: 1;
        }

        .client-brand-logo {
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
        }

        .client-hero-copy {
          position: relative;
          z-index: 1;
          max-width: 560px;
          padding: 48px 0;
        }

        .client-hero-copy h1 {
          font-size: clamp(38px, 5vw, 64px);
          line-height: 0.96;
          font-weight: 900;
          letter-spacing: 0;
          margin: 0 0 18px;
        }

        .client-hero-copy p {
          max-width: 500px;
          font-size: 17px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.72);
          margin: 0;
        }

        .client-feature-list {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .client-feature {
          min-width: 0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
        }

        .client-check {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: ${C.green};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .client-login-panel {
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(13, 55, 129, 0.12);
          padding: 34px;
          display: flex;
          align-items: center;
        }

        .client-login-inner {
          width: 100%;
        }

        .client-mobile-brand {
          display: none;
        }

        .client-title {
          font-size: 30px;
          line-height: 1.08;
          font-weight: 900;
          color: ${C.text};
          margin: 0 0 6px;
        }

        .client-subtitle {
          font-size: 14px;
          color: ${C.muted};
          margin: 0 0 28px;
        }

        .client-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .client-field label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 7px;
        }

        .client-field input {
          width: 100%;
          border: 1px solid #d7dee8;
          border-radius: 14px;
          padding: 13px 14px;
          font-size: 14px;
          color: ${C.text};
          background: #fff;
          outline: none;
          transition: border 0.15s, box-shadow 0.15s;
        }

        .client-field input:focus {
          border-color: ${C.blue};
          box-shadow: 0 0 0 4px rgba(21, 101, 192, 0.12);
        }

        .client-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: ${C.danger};
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 600;
        }

        .client-submit {
          width: 100%;
          min-height: 46px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, ${C.navy}, ${C.blue});
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
        }

        .client-submit:hover {
          transform: translateY(-1px);
        }

        .client-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .client-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }

        @media (max-width: 980px) {
          .client-login-root {
            padding: 18px;
          }

          .client-login-shell {
            grid-template-columns: 1fr;
            max-width: 560px;
            min-height: auto;
          }

          .client-hero {
            display: none;
          }

          .client-login-panel {
            min-height: calc(100vh - 36px);
            padding: 26px;
          }

          .client-mobile-brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 11px;
            margin-bottom: 30px;
          }
        }

        @media (max-width: 420px) {
          .client-login-root {
            padding: 0;
            background: #fff;
          }

          .client-login-panel {
            min-height: 100vh;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            padding: 22px;
          }

          .client-title {
            font-size: 27px;
          }
        }
      `}</style>

      <div className="client-login-shell">
        <section className="client-hero" aria-label="EverClean client portal">
          <div className="client-brand">
            <Image src="/logo.jpg" alt="EverClean" width={54} height={54} className="client-brand-logo" />
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
                Ever<span style={{ color: C.green }}>Clean</span>
              </div>
              <div style={{ color: `${C.green}dd`, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 5 }}>
                Professional Cleaning
              </div>
            </div>
          </div>

          <div className="client-hero-copy">
            <h1>The smarter way to manage clean.</h1>
            <p>
              Book services, track your cleaner in real time, and manage every visit from one focused dashboard.
            </p>
          </div>

          <div className="client-feature-list">
            {features.map((feature) => (
              <div key={feature} className="client-feature">
                <span className="client-check">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.35, color: 'rgba(255,255,255,0.82)', fontWeight: 600 }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="client-login-panel" aria-label="Sign in">
          <div className="client-login-inner">
            <div className="client-mobile-brand">
              <Image src="/logo.jpg" alt="EverClean" width={44} height={44} style={{ borderRadius: 12 }} />
              <div style={{ fontSize: 21, fontWeight: 900, color: C.text }}>
                Ever<span style={{ color: C.green }}>Clean</span>
              </div>
            </div>

            <h2 className="client-title">Welcome back</h2>
            <p className="client-subtitle">Sign in to your account</p>

            <div className="client-form">
              <div className="client-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="client-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  autoComplete="current-password"
                />
              </div>

              <button type="button" onClick={() => { setResetOpen(!resetOpen); setResetStep('request'); setResetMessage(''); }} style={{ alignSelf:'flex-end', background:'none', border:0, color:C.blue, fontWeight:800, fontSize:12, cursor:'pointer', padding:0 }}>Forgot password?</button>

              {error && <div className="client-error">{error}</div>}

              {resetOpen && (
                <div style={{ border:`1px solid ${C.border}`, background:C.bg, borderRadius:14, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.text }}>Reset password</div>
                  {resetStep === 'request' ? (
                    <>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <button type="button" onClick={() => setResetMethod('email')} style={{ border:`1px solid ${resetMethod==='email'?C.blue:C.border}`, background:resetMethod==='email'?'#fff':'transparent', borderRadius:10, padding:'9px 10px', color:C.text, fontWeight:800, cursor:'pointer' }}>Email</button>
                        <button type="button" onClick={() => setResetMethod('sms')} style={{ border:`1px solid ${resetMethod==='sms'?C.blue:C.border}`, background:resetMethod==='sms'?'#fff':'transparent', borderRadius:10, padding:'9px 10px', color:C.text, fontWeight:800, cursor:'pointer' }}>SMS</button>
                      </div>
                      <button type="button" onClick={requestPasswordReset} disabled={!email || resetLoading} className="client-submit" style={{ minHeight:40 }}>{resetLoading ? 'Sending...' : 'Send security code'}</button>
                    </>
                  ) : (
                    <>
                      <div className="client-field"><label>Security code</label><input value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="6-digit code" /></div>
                      <div className="client-field"><label>New password</label><input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" /></div>
                      <button type="button" onClick={confirmPasswordReset} disabled={!resetCode || !resetPassword || resetLoading} className="client-submit" style={{ minHeight:40 }}>{resetLoading ? 'Updating...' : 'Update password'}</button>
                    </>
                  )}
                  {resetMessage && <div style={{ fontSize:12, fontWeight:700, color:resetMessage.includes('Unable') || resetMessage.includes('configured') || resetMessage.includes('Invalid') ? C.danger : C.greenDk }}>{resetMessage}</div>}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="client-submit"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <p style={{ margin: '16px 0 0', textAlign: 'center', color: C.muted, fontSize: 12 }}>
              New to EverClean?{' '}
              <Link href="/register" style={{ color: C.blue, fontWeight: 800, textDecoration: 'none' }}>
                Create an account
              </Link>
            </p>

            <p className="client-footer">
              Â© 2026 EverClean Â· Professional Cleaning Platform
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

