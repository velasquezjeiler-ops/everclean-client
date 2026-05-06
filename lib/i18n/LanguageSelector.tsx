'use client';
import { useEffect, useRef, useState } from 'react';
import { LANGUAGE_OPTIONS } from './useTranslation';

export default function LanguageSelector({ lang, setLang }: { lang: string; setLang: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LANGUAGE_OPTIONS.find((l) => l.code === lang) || LANGUAGE_OPTIONS[0];

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 10px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600,
        }}
      >
        <span style={{ width: 28, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, letterSpacing: 0.5 }}>
          {current.short}
        </span>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.label}</span>
        <span style={{ opacity: 0.65 }}>{open ? '^' : 'v'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 6px)', zIndex: 200,
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
          boxShadow: '0 12px 30px rgba(13,55,129,0.18)', overflow: 'hidden', maxHeight: 250,
          overflowY: 'auto',
        }}>
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => { setLang(opt.code); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 10px', border: 'none', background: lang === opt.code ? '#ECFDF5' : '#fff',
                color: lang === opt.code ? '#065F46' : '#0D1B2A', cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: lang === opt.code ? 700 : 500,
                textAlign: 'left',
              }}
            >
              <span style={{ width: 28, color: '#64748B', fontSize: 10, letterSpacing: 0.5 }}>{opt.short}</span>
              <span style={{ flex: 1 }}>{opt.label}</span>
              {lang === opt.code && <span style={{ color: '#388E3C', fontSize: 11 }}>Selected</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
