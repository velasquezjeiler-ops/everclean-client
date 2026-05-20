import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'EverClean Admin',
  description: 'Admin console for EverClean operations',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#F1F5F9',
          color: '#0D1B2A',
          minHeight: '100vh',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>{children}</div>
      </body>
    </html>
  );
}
