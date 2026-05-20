import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <main>
      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900 }}>EverClean Admin</h1>
      <p style={{ margin: '0 0 24px', color: '#64748B' }}>
        Tools for staff to manage bookings on behalf of customers.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
        <li
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 16,
          }}
        >
          <Link
            href="/new-booking"
            style={{ color: '#1565C0', fontWeight: 800, textDecoration: 'none' }}
          >
            Create a booking →
          </Link>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: 13 }}>
            Pricing, address validation, and scheduling for a customer.
          </p>
        </li>
        <li
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 16,
          }}
        >
          <Link
            href="/address-cache"
            style={{ color: '#1565C0', fontWeight: 800, textDecoration: 'none' }}
          >
            Address cache savings →
          </Link>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: 13 }}>
            How much Google Address Validation spend the cache is saving.
          </p>
        </li>
      </ul>
    </main>
  );
}
