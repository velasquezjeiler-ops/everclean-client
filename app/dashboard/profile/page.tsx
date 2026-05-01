'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

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
  danger: '#DC2626',
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="client-profile-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function ClientProfile() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('NJ');
  const [billingZip, setBillingZip] = useState('');
  const [taxId, setTaxId] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';

    try {
      const [uRes, cRes] = await Promise.all([
        fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/companies/me', { headers: { Authorization: 'Bearer ' + token } }),
      ]);

      if (uRes.ok) {
        const d = await uRes.json();
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setFullName(d.name || d.fullName || '');
      }

      if (cRes.ok) {
        const c = await cRes.json();
        setCompanyName(c.name || '');
        setBillingAddress(c.address || c.billingAddress || '');
        setBillingCity(c.city || c.billingCity || '');
        setBillingState(c.state || c.billingState || 'NJ');
        setBillingZip(c.zip || c.billingZip || '');
        setTaxId(c.tax_id || c.taxId || '');
      }
    } catch {
      setMsg('Error: Unable to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile() {
    setSaving(true);
    setMsg('');

    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(API + '/companies/me', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          billingAddress,
          billingCity,
          billingState,
          billingZip,
          taxId,
        }),
      });

      if (res.ok) {
        setMsg(t('common.success'));
        load();
      } else {
        const e = await res.json();
        setMsg('Error: ' + (e.error || 'Unable to save changes'));
      }
    } catch (e: any) {
      setMsg('Error: ' + (e.message || 'Unable to save changes'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-9 h-9 rounded-full animate-spin"
          style={{
            border: `3px solid ${C.border}`,
            borderTopColor: C.blue,
          }}
        />
      </div>
    );
  }

  const initial = (fullName || email || 'C')[0].toUpperCase();

  return (
    <div className="client-profile-page">
      <style>{`
        .client-profile-page {
          width: 100%;
        }

        .client-profile-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .client-profile-title {
          font-size: 28px;
          font-weight: 900;
          line-height: 1.05;
          color: ${C.text};
          margin: 0 0 5px;
        }

        .client-profile-subtitle {
          margin: 0;
          color: ${C.muted};
          font-size: 14px;
        }

        .client-profile-save {
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, ${C.navy}, ${C.blue});
          color: #fff;
          min-height: 40px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        .client-profile-save:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .client-profile-message {
          border-radius: 14px;
          padding: 11px 14px;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .client-profile-message.success {
          background: #ECFDF5;
          color: ${C.greenDk};
          border: 1px solid #BBF7D0;
        }

        .client-profile-message.error {
          background: #FEF2F2;
          color: ${C.danger};
          border: 1px solid #FECACA;
        }

        .client-profile-card {
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 18px;
          box-shadow: 0 2px 14px rgba(13, 55, 129, 0.05);
          margin-bottom: 14px;
          overflow: hidden;
        }

        .client-profile-hero {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #F8FBFF, #FFFFFF);
        }

        .client-profile-avatar {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          background: linear-gradient(135deg, ${C.green}, ${C.blue});
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(21, 101, 192, 0.18);
        }

        .client-profile-hero strong {
          display: block;
          color: ${C.text};
          font-size: 15px;
          font-weight: 900;
          margin-bottom: 3px;
        }

        .client-profile-hero p {
          margin: 0;
          color: ${C.muted};
          font-size: 12px;
        }

        .client-profile-section {
          padding: 16px;
        }

        .client-profile-section h2 {
          font-size: 15px;
          font-weight: 900;
          color: ${C.text};
          margin: 0 0 13px;
        }

        .client-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .client-profile-grid.three {
          grid-template-columns: 1.2fr 0.8fr 0.8fr;
        }

        .client-profile-field {
          display: block;
          min-width: 0;
        }

        .client-profile-field.span-2 {
          grid-column: span 2;
        }

        .client-profile-field span {
          display: block;
          color: ${C.muted};
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .client-profile-field input,
        .client-profile-field select {
          width: 100%;
          min-height: 40px;
          border: 1px solid ${C.border};
          border-radius: 12px;
          background: #fff;
          color: ${C.text};
          font-size: 14px;
          outline: none;
          padding: 0 12px;
          transition: border 0.15s, box-shadow 0.15s;
        }

        .client-profile-field input:focus,
        .client-profile-field select:focus {
          border-color: ${C.blue};
          box-shadow: 0 0 0 4px rgba(21, 101, 192, 0.1);
        }

        .client-profile-field input[readonly] {
          background: #F8FAFC;
          color: ${C.muted};
        }

        .client-payment-empty {
          text-align: center;
          padding: 30px 16px 32px;
          background: #F8FBFF;
          border-radius: 16px;
          border: 1px dashed ${C.border};
        }

        .client-payment-empty div {
          font-size: 34px;
          margin-bottom: 8px;
        }

        .client-payment-empty strong {
          display: block;
          font-size: 14px;
          font-weight: 900;
          color: ${C.text};
          margin-bottom: 5px;
        }

        .client-payment-empty p {
          color: ${C.muted};
          font-size: 12px;
          margin: 0 0 14px;
        }

        .client-payment-empty button {
          border: 0;
          border-radius: 12px;
          background: ${C.greenDk};
          color: #fff;
          min-height: 38px;
          padding: 0 16px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        @media (max-width: 760px) {
          .client-profile-header {
            flex-direction: column;
          }

          .client-profile-save {
            width: 100%;
          }

          .client-profile-grid,
          .client-profile-grid.three {
            grid-template-columns: 1fr;
          }

          .client-profile-field.span-2 {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="client-profile-header">
        <div>
          <h1 className="client-profile-title">{t('client.profile.title')}</h1>
          <p className="client-profile-subtitle">
            Manage contact details, billing information and payment setup.
          </p>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="client-profile-save"
          type="button"
        >
          {saving ? t('common.loading') : t('client.profile.saveChanges')}
        </button>
      </div>

      {msg && (
        <div
          className={`client-profile-message ${
            msg.startsWith('Error') ? 'error' : 'success'
          }`}
        >
          {msg}
        </div>
      )}

      <div className="client-profile-card">
        <div className="client-profile-hero">
          <div className="client-profile-avatar">{initial}</div>
          <div style={{ minWidth: 0 }}>
            <strong>{fullName || 'Client'}</strong>
            <p>{email || 'Email unavailable'}</p>
          </div>
        </div>
      </div>

      <div className="client-profile-card">
        <div className="client-profile-section">
          <h2>{t('client.profile.personalInfo')}</h2>

          <div className="client-profile-grid">
            <Field label={t('client.profile.fullName')}>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>

            <Field label={t('common.email')}>
              <input value={email} readOnly />
            </Field>

            <Field label={t('common.phone')}>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div className="client-profile-card">
        <div className="client-profile-section">
          <h2>{t('client.profile.billingInfo')}</h2>

          <div className="client-profile-grid">
            <Field label={t('client.profile.companyName')}>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>

            <label className="client-profile-field span-2">
              <span>{t('client.profile.billingAddress')}</span>
              <input
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
              />
            </label>
          </div>

          <div className="client-profile-grid three" style={{ marginTop: 12 }}>
            <Field label={t('common.city')}>
              <input value={billingCity} onChange={(e) => setBillingCity(e.target.value)} />
            </Field>

            <Field label={t('common.state')}>
              <select value={billingState} onChange={(e) => setBillingState(e.target.value)}>
                {['NJ', 'NY', 'CT', 'PA', 'FL', 'TX', 'CA'].map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </Field>

            <Field label={t('common.zip')}>
              <input
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value)}
                maxLength={5}
              />
            </Field>
          </div>

          <div style={{ marginTop: 12 }}>
            <Field label={t('client.profile.taxId')}>
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="XX-XXXXXXX"
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="client-profile-card">
        <div className="client-profile-section">
          <h2>{t('client.profile.paymentMethods')}</h2>

          <div className="client-payment-empty">
            <div>💳</div>
            <strong>{t('client.profile.stripeIntegration')}</strong>
            <p>{t('client.profile.stripeDesc')}</p>
            <button type="button">{t('client.profile.setupPayment')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
