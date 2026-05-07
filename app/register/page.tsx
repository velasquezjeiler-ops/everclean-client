'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '../../lib/i18n/useTranslation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup.replit.app/api';

const REGISTER_TEXT: Record<string, Record<string, string>> = {
  en: {
    brandSubtitle: 'Professional Cleaning',
    proTitle: 'Join the pro network.',
    clientTitle: 'Start booking clean.',
    proCopy: 'Create your professional profile, set your service radius, and get ready for available jobs in your area.',
    clientCopy: 'Create your client account to book services, track visits, and manage your cleaning history.',
    createAccount: 'Create account',
    subtitle: 'Choose your account type and complete the basics.',
    client: 'Client',
    professional: 'Professional',
    baseAddress: 'Base address',
    address: 'Address',
    zipCode: 'ZIP code',
    creating: 'Creating account...',
    already: 'Already have an account?',
    signIn: 'Sign in',
    unable: 'Unable to create account',
  },
  es: {
    brandSubtitle: 'Limpieza profesional',
    proTitle: 'Unete a la red profesional.',
    clientTitle: 'Comienza a reservar limpieza.',
    proCopy: 'Crea tu perfil profesional, define tu radio de servicio y preparate para recibir trabajos disponibles en tu zona.',
    clientCopy: 'Crea tu cuenta de cliente para reservar servicios, seguir visitas y administrar tu historial de limpieza.',
    createAccount: 'Crear cuenta',
    subtitle: 'Elige tu tipo de cuenta y completa los datos basicos.',
    client: 'Cliente',
    professional: 'Profesional',
    baseAddress: 'Direccion base',
    address: 'Direccion',
    zipCode: 'Codigo ZIP',
    creating: 'Creando cuenta...',
    already: 'Ya tienes una cuenta?',
    signIn: 'Iniciar sesion',
    unable: 'No se pudo crear la cuenta',
  },
};

function rt(lang: string, key: string) {
  return REGISTER_TEXT[lang]?.[key] || REGISTER_TEXT.en[key] || key;
}

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
  const { t, lang } = useTranslation();
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

      if (!res.ok) throw new Error(data.error || rt(lang, 'unable'));

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role', data.role);

      router.push(data.role === 'PROFESSIONAL' ? '/pro/profile' : '/dashboard/profile');
    } catch (e: any) {
      setError(e.message || rt(lang, 'unable'));
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
                {rt(lang, 'brandSubtitle')}
              </div>
            </div>
          </div>

          <div className="register-copy">
            <h1>{role === 'PROFESSIONAL' ? rt(lang, 'proTitle') : rt(lang, 'clientTitle')}</h1>
            <p>
              {role === 'PROFESSIONAL'
                ? rt(lang, 'proCopy')
                : rt(lang, 'clientCopy')}
            </p>
          </div>
        </section>

        <section className="register-panel">
          <h2 className="register-title">{rt(lang, 'createAccount')}</h2>
          <p className="register-subtitle">{rt(lang, 'subtitle')}</p>

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
              <label>{t('profile.fullName')}</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                autoComplete="name"
              />
            </div>
            <div className="register-field">
              <label>{t('profile.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
            <div className="register-field">
              <label>{t('profile.phone')}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
              />
            </div>
            <div className="register-field full">
              <label>{t('common.password')}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <div className="register-field full">
              <label>{role === 'PROFESSIONAL' ? rt(lang, 'baseAddress') : rt(lang, 'address')}</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                autoComplete="street-address"
              />
            </div>
            <div className="register-field">
              <label>{t('profile.city')}</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="register-field">
              <label>{t('profile.state')}</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="register-field">
              <label>{rt(lang, 'zipCode')}</label>
              <input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
            </div>
          </div>

          {error && <div className="register-error">{error}</div>}

          <button className="register-submit" type="button" disabled={loading || !canSubmit} onClick={submit}>
            {loading ? rt(lang, 'creating') : rt(lang, 'createAccount')}
          </button>

          <p className="register-login">
            {rt(lang, 'already')} <Link href="/">{rt(lang, 'signIn')}</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
