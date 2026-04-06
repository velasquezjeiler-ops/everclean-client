'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = mode === 'login'
        ? await api.auth.login(email, password)
        : await api.auth.register(email, password);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', data.role);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-10 bg-white rounded-full opacity-90"></div>
          </div>
          <h1 className="text-2xl font-medium text-gray-900">EverClean</h1>
          <p className="text-gray-500 text-sm mt-1">Professional cleaning services</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode('login')} className={"flex-1 py-2 rounded-lg text-sm font-medium " + (mode === 'login' ? 'bg-emerald-700 text-white' : 'text-gray-500 hover:bg-gray-50')}>Entrar</button>
            <button onClick={() => setMode('register')} className={"flex-1 py-2 rounded-lg text-sm font-medium " + (mode === 'register' ? 'bg-emerald-700 text-white' : 'text-gray-500 hover:bg-gray-50')}>Registrarse</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Contrasena</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}