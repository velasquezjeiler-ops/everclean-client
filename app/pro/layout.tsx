'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [proName, setProName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) { router.push('/'); return; }
    if (role === 'CLIENT') { router.push('/dashboard'); return; }
    if (role === 'ADMIN') { window.location.href = 'https://everclean-admin.vercel.app'; return; }
    setReady(true);

    // Get pro name
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';
    fetch(API + '/professionals/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => setProName(d.fullName || d.full_name || ''))
      .catch(() => {});
  }, [router]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  }

  const navItems = [
    { href: '/pro/dashboard',   label: 'Mis Trabajos',  icon: '🧹' },
    { href: '/pro/marketplace', label: 'Disponibles',   icon: '🔍' },
    { href: '/pro/history',     label: 'Historial',     icon: '🔥' },
    { href: '/pro/profile',     label: 'Mi Perfil',     icon: '👤' },
  ];

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-44 bg-white border-r border-gray-200 flex flex-col min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">EC</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">EverClean</p>
              <p className="text-xs text-emerald-600 font-medium">PROFESIONAL</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/pro/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          {proName && <p className="text-xs text-gray-500 px-3 mb-2 truncate">{proName}</p>}
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <span className="text-base">🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
