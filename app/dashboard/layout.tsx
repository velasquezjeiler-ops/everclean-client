'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) {
      router.push('/');
      return;
    }
    // Redirect professionals to their portal
    if (role === 'PROFESSIONAL') {
      router.push('/pro/dashboard');
      return;
    }
    // Redirect admins to admin portal
    if (role === 'ADMIN') {
      window.location.href = 'https://everclean-admin.vercel.app';
      return;
    }
    setReady(true);
  }, [router]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/');
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">EC</span>
          </div>
          <span className="font-medium text-gray-900">EverClean</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Mis servicios</Link>
          <Link href="/dashboard/new-booking" className="text-sm bg-emerald-700 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-800">Solicitar limpieza</Link>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">Salir</button>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
