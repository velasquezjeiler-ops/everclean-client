'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

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

type Stats = {
  hits: number;
  misses: number;
  total_lookups: number;
  hit_rate: number;
  memory_cache_size: number;
  memory_cache_max: number;
  persistent_cache_size: number | null;
  persistent_cache_active_size: number | null;
  cost_per_call_usd: number;
  estimated_savings_usd: number;
  ttl_days: number;
  stats_started_at: string;
};

function formatUsd(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 16,
        flex: '1 1 180px',
      }}
    >
      <div style={{ color: C.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900, color: accent || C.text }}>
        {value}
      </div>
      {hint ? (
        <div style={{ marginTop: 4, color: C.muted, fontSize: 12 }}>{hint}</div>
      ) : null}
    </div>
  );
}

export default function AddressCacheDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API}/admin/address-cache/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as Stats;
      setStats(data);
      setLastLoaded(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => {
      void load();
    }, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const hitRatePct = stats ? (stats.hit_rate * 100).toFixed(1) + '%' : '—';

  return (
    <main>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/"
          style={{ color: C.blue, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}
        >
          ← Back to admin
        </Link>
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900 }}>Address cache</h1>
      <p style={{ margin: '0 0 20px', color: C.muted }}>
        How much Google Address Validation spend the cache is saving. Counters reset
        when the API server restarts; the persistent cache survives restarts.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          style={{
            background: C.navy,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        {lastLoaded ? (
          <span style={{ color: C.muted, fontSize: 12 }}>
            Updated {lastLoaded.toLocaleTimeString()} · auto-refresh every 30s
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          style={{
            background: '#FEF2F2',
            border: `1px solid ${C.danger}`,
            color: C.danger,
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          Couldn’t load stats: {error}
          {error.toLowerCase().includes('token') || error.toLowerCase().includes('forbidden') ? (
            <div style={{ marginTop: 6, color: C.muted }}>
              You need to be signed in as an admin. Make sure an admin token is in
              <code> localStorage.token</code>.
            </div>
          ) : null}
        </div>
      ) : null}

      {stats ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <StatCard
              label="Estimated savings"
              value={formatUsd(stats.estimated_savings_usd)}
              hint={`${stats.hits.toLocaleString()} hits × ${formatUsd(stats.cost_per_call_usd)} per call`}
              accent={C.green}
            />
            <StatCard
              label="Hit rate"
              value={hitRatePct}
              hint={`${stats.total_lookups.toLocaleString()} total lookups`}
              accent={stats.hit_rate >= 0.5 ? C.green : C.warning}
            />
            <StatCard
              label="Hits"
              value={stats.hits.toLocaleString()}
              hint="Served from cache"
            />
            <StatCard
              label="Misses"
              value={stats.misses.toLocaleString()}
              hint="Billed Google calls"
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <StatCard
              label="In-memory entries"
              value={`${stats.memory_cache_size.toLocaleString()} / ${stats.memory_cache_max.toLocaleString()}`}
              hint="LRU cache in the API process"
            />
            <StatCard
              label="Persistent entries"
              value={
                stats.persistent_cache_size === null
                  ? '—'
                  : stats.persistent_cache_size.toLocaleString()
              }
              hint={
                stats.persistent_cache_active_size === null
                  ? 'Postgres cache unavailable'
                  : `${stats.persistent_cache_active_size.toLocaleString()} unexpired in Postgres`
              }
            />
            <StatCard
              label="TTL"
              value={`${stats.ttl_days} days`}
              hint="Time before an entry expires"
            />
            <StatCard
              label="Counters since"
              value={new Date(stats.stats_started_at).toLocaleString()}
              hint="Hit/miss counters reset on API restart"
            />
          </div>
        </>
      ) : !error ? (
        <div style={{ color: C.muted }}>Loading stats…</div>
      ) : null}
    </main>
  );
}
