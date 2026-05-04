'use client';

import { authClient, signIn } from '@/lib/auth-client';
import { ROLE_REDIRECTS } from '@/lib/constants';
import { ChevronLeft, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Handlers & Helpers ─────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signIn.email({
        email: email.trim(),
        password: password.trim()
      });

      if (res.error) {
        setError(res.error.message || 'Incorrect email or password.');
        return;
      }

      const { data: session } = await authClient.getSession();
      const role = (session?.user as any)?.role || 'guest';
      router.push(ROLE_REDIRECTS[role] || '/');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex selection:bg-red-900 selection:text-white">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hotel.jpeg"
            alt="Pemandangan Berastagi"
            className="w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/80 to-transparent" />
        </div>

        <div className="relative z-10">
          <span className="font-serif text-2xl tracking-widest uppercase text-white font-bold">
            Ron's <span className="text-red-600 font-bold">Guest House</span>
          </span>

        </div>

        <div className="relative z-10 max-w-lg mb-20">
          <h1 className="font-serif text-5xl text-white leading-tight mb-6">
            Selamat <br /> Datang <br /> Kembali
          </h1>
          <div className="w-16 h-0.5 bg-red-700 mb-6" />
          <p className="text-white/70 font-light text-lg tracking-wide leading-relaxed">
            Masuk untuk mengakses dashboard manajemen Ron's Guest House.
          </p>
        </div>
      </div>

      {/* Right form - Login */}
      <div className="w-full lg:w-125 bg-white border-l border-gray-100 flex flex-col justify-center px-8 lg:px-16 py-12 relative z-10 shadow-2xl">
        <Link
          href="/"
          className="text-xs tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors mb-8 inline-flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Kembali ke Beranda
        </Link>

        <h2 className="font-serif text-3xl text-gray-900 mb-2 tracking-wide">Masuk</h2>
        <p className="text-gray-500 font-light mb-6 text-sm">
          Masukkan kredensial Anda untuk melanjutkan.
        </p>

        {error && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-500 text-sm px-4 py-3 mb-6 flex items-center">
            <span className="border border-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mr-2">!</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-11 py-3 focus:outline-none focus:border-red-800 focus:bg-white transition-all font-light placeholder-gray-400"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col mb-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-11 py-3 pr-11 focus:outline-none focus:border-red-800 focus:bg-white transition-all font-light placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-900 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-800 hover:bg-black text-white font-bold tracking-widest uppercase text-sm py-4 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin " /> : 'Masuk'}
          </button>
        </form>

        <div className="mt-auto pt-10 text-center">
          <p className="text-xs text-gray-600 font-light">
            &copy; {new Date().getFullYear()} Ron&apos;s Guesthouse. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
