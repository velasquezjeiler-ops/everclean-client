'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
};

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'CLIENT' | 'PROFESSIONAL'>('CLIENT');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    state: 'NJ',
    zipCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(API + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: form.fullName,
          role,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Unable to create account');

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role', data.role);

      router.push(data.role === 'PROFESSIONAL' ? '/pro/profile' : '/dashboard/profile');
    } catch (e: any) {
      setError(e.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = form.fullName && form.email && form.password;

  return (
    <main className="register-root">
      <style>{`
        .register-root{
          min-height:100vh;
          background:radial-gradient(circle at 8% 5%, rgba(76,175,80,0.13), transparent 28%), ${C.bg};
          display:flex;
          align-items:center;
          justify-content:center;
          padding:28px;
          font-family:Poppins, sans-serif;
        }
        .register-shell{
          width:100%;
          max-width:980px;
          display:grid;
          grid-template-columns:0.9fr 1.1fr;
          background:#fff;
          border:1px solid ${C.border};
          border-radius:22px;
          overflow:hidden;
          box-shadow:0 20px 60px rgba(13,55,129,0.12);
        }
        .register-aside{
          background:linear-gradient(135deg, ${C.navy}, ${C.blue} 58%, #0d4a2e);
          color:#fff;
          padding:34px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          min-height:620px;
        }
        .register-brand{
          display:flex;
          align-items:center;
          gap:12px;
          font-weight:900;
          font-size:20px;
        }
        .register-copy h1{
          font-size:38px;
          line-height:1.08;
          margin:0 0 14px;
          letter-spacing:0;
        }
        .register-copy p{
          margin:0;
          color:rgba(255,255,255,0.74);
          line-height:1.6;
          font-size:14px;
        }
        .register-panel{
          padding:34px;
        }
        .register-title{
          margin:0;
          color:${C.text};
          font-size:24px;
          font-weight:900;
          letter-spacing:0;
        }
        .register-subtitle{
          margin:6px 0 20px;
          color:${C.muted};
          font-size:13px;
        }
        .role-switch{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
          padding:5px;
          border-radius:14px;
          background:${C.bg};
          border:1px solid ${C.border};
          margin-bottom:18px;
        }
        .role-switch button{
          border:0;
          border-radius:10px;
          background:transparent;
          color:${C.muted};
          font-weight:800;
          font-size:13px;
          min-height:40px;
          cursor:pointer;
        }
        .role-switch button.active{
          background:#fff;
          color:${C.navy};
          box-shadow:0 2px 10px rgba(13,55,129,0.08);
        }
        .register-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
        }
        .register-field.full{
          grid-column:1/-1;
        }
        .register-field label{
          display:block;
          color:${C.text};
          font-size:11px;
          font-weight:800;
          margin-bottom:6px;
          text-transform:uppercase;
          letter-spacing:0.5px;
        }
        .register-field input{
          width:100%;
          min-height:44px;
          border:1px solid ${C.border};
          border-radius:12px;
          padding:0 12px;
          color:${C.text};
          font-size:14px;
          outline:none;
        }
        .register-field input:focus{
          border-color:${C.blue};
          box-shadow:0 0 0 3px rgba(21,101,192,0.08);
        }
        .register-error{
          margin-top:14px;
          padding:11px 13px;
          border-radius:12px;
          background:#FEE2E2;
          color:#991B1B;
          font-size:13px;
          font-weight:700;
        }
        .register-submit{
          width:100%;
          min-height:46px;
          margin-top:16px;
          border:0;
          border-radius:14px;
          color:#fff;
          background:linear-gradient(135deg, ${C.navy}, ${C.blue});
          font-size:15px;
          font-weight:900;
          cursor:pointer;
        }
        .register-submit:disabled{
          opacity:0.55;
          cursor:default;
        }
        .register-login{
          margin:18px 0 0;
          text-align:center;
          color:${C.muted};
          font-size:12px;
        }
        .register-login a{
          color:${C.blue};
          font-weight:800;
          text-decoration:none;
        }
        @media (max-width:820px){
          .register-root{ padding:18px; align-items:flex-start; }
          .register-shell{ grid-template-columns:1fr; }
          .register-aside{ min-height:auto; gap:42px; padding:24px; }
          .register-copy h1{ font-size:30px; }
          .register-panel{ padding:24px; }
        }
        @media (max-width:560px){
          .register-grid{ grid-template-columns:1fr; }
          .register-field.full{ grid-column:auto; }
        }
      `}</style>

      <div className="register-shell">
        <section className="register-aside">
          <div className="register-brand">
            <Image src="/logo.jpg" alt="EverClean" width={44} height={44} style={{ borderRadius: 12 }} />
            <div>
              Ever<span style={{ color: C.green }}>Clean</span>
              <div style={{ fontSize: 10, letterSpacing: 1.6, color: C.green, textTransform: 'uppercase' }}>
                Professional Cleaning
              </div>
            </div>
          </div>

          <div className="register-copy">
            <h1>{role === 'PROFESSIONAL' ? 'Join the pro network.' : 'Start booking clean.'}</h1>
            <p>
              {role === 'PROFESSIONAL'
                ? 'Create your professional profile, set your service radius, and get ready for available jobs in your area.'
                : 'Create your client account to book services, track visits, and manage your cleaning history.'}
            </p>
          </div>
        </section>

        <section className="register-panel">
          <h2 className="register-title">Create account</h2>
          <p className="register-subtitle">Choose your account type and complete the basics.</p>

          <div className="role-switch">
            <button type="button" className={role === 'CLIENT' ? 'active' : ''} onClick={() => setRole('CLIENT')}>
              Client
            </button>
            <button
              type="button"
              className={role === 'PROFESSIONAL' ? 'active' : ''}
              onClick={() => setRole('PROFESSIONAL')}
            >
              Professional
            </button>
          </div>

          <div className="register-grid">
            <div className="register-field full">
              <label>Full name</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                autoComplete="name"
              />
            </div>
            <div className="register-field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
            <div className="register-field">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
              />
            </div>
            <div className="register-field full">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <div className="register-field full">
              <label>{role === 'PROFESSIONAL' ? 'Base address' : 'Address'}</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                autoComplete="street-address"
              />
            </div>
            <div className="register-field">
              <label>City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="register-field">
              <label>State</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="register-field">
              <label>ZIP code</label>
              <input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
            </div>
          </div>

          {error && <div className="register-error">{error}</div>}

          <button className="register-submit" type="button" disabled={loading || !canSubmit} onClick={submit}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="register-login">
            Already have an account? <Link href="/">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
