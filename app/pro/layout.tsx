'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'PROFESSIONAL') router.push('/');
    else setReady(true);
  }, [router]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/');
  }

  if (!ready) return null;

  const links = [{ href: '/pro/dashboard', label: 'Mis Trabajos', icon: '🧹' }];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold">EC</div>
            <div>
              <span className="font-medium text-gray-900 block">EverClean</span>
              <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Profesional</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {links.map(link => (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${pathname === link.href ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <span className="text-lg">{link.icon}</span>{link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors">
            <span className="text-lg">🚪</span>Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto"><div className="max-w-5xl mx-auto">{children}</div></main>
    </div>
  );
}