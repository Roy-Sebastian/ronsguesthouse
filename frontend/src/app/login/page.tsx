'use client';

import { authClient, signIn } from '@/lib/auth-client';
import { ChevronLeft, Lock, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ROLE_REDIRECTS: Record<string, string> = {
    superadmin: '/superadmin',
    admin: '/admin',
    receptionist: '/receptionist',
    guest: '/guest',
  };

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
      router.push(ROLE_REDIRECTS[role as keyof typeof ROLE_REDIRECTS] || '/');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans flex selection:bg-red-900 selection:text-white">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-c53cd4b85ca4?auto=format&fit=crop&q=80&w=2000"
            alt="Luxury Hotel"
            className="w-full h-full object-cover opacity-40 blur-[2px]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/80 to-transparent" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-block text-white hover:text-red-500 transition-colors">
            <span className="font-serif text-2xl tracking-widest uppercase">
              Ron's <span className="text-red-700">Guest House</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mb-20">
          <h1 className="font-serif text-5xl text-white leading-tight mb-6">
            Exclusive <br /> Management <br /> Portal
          </h1>
          <div className="w-16 h-0.5 bg-red-700 mb-6" />
          <p className="text-white/70 font-light text-lg tracking-wide leading-relaxed">
            Welcome back. Access the internal suite to manage guests, reservations, and luxury accommodations.
          </p>
        </div>
      </div>

      {/* Right form - Login */}
      <div className="w-full lg:w-125 bg-[#050505] border-l border-white/5 flex flex-col justify-center px-8 lg:px-16 py-12 relative z-10 shadow-2xl">
        <Link
          href="/"
          className="text-xs tracking-widest uppercase text-gray-500 hover:text-white transition-colors mb-12 inline-flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Return to Home
        </Link>

        <h2 className="font-serif text-3xl text-white mb-2 tracking-wide">Sign In</h2>
        <p className="text-gray-500 font-light mb-8 text-sm">
          Please enter your specialized credentials.
        </p>

        {/* Demo Credentials Section */}
        {/* <div className="bg-white/5 border border-white/10 p-4 mb-8 text-xs font-light text-gray-400">
          <div className="font-bold text-white tracking-widest uppercase mb-3 text-[10px]">Demo Credentials (Password: Admin@12345)</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center cursor-pointer hover:text-white transition-colors" onClick={() => { setEmail('superadmin@ronsguesthouse.com'); setPassword('Admin@12345'); }}>
              <span className="text-red-700 font-bold">Superadmin</span>
              <span>superadmin@ronsguesthouse.com</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer hover:text-white transition-colors" onClick={() => { setEmail('admin@ronsguesthouse.com'); setPassword('Admin@12345'); }}>
              <span className="text-red-700 font-bold">Admin</span>
              <span>admin@ronsguesthouse.com</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer hover:text-white transition-colors" onClick={() => { setEmail('receptionist@ronsguesthouse.com'); setPassword('Admin@12345'); }}>
              <span className="text-red-700 font-bold">Receptionist</span>
              <span>receptionist@ronsguesthouse.com</span>
            </div>
          </div>
        </div> */}

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
                className="w-full bg-white/5 border border-white/10 text-white px-11 py-3 focus:outline-none focus:border-red-700 focus:bg-white/10 transition-all font-light"
                placeholder="admin@ronsguesthouse.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col mb-4">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                className="w-full bg-white/5 border border-white/10 text-white px-11 py-3 focus:outline-none focus:border-red-700 focus:bg-white/10 transition-all font-light"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-600 text-white font-bold tracking-widest uppercase text-sm py-4 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
          </button>
        </form>

        <div className="mt-auto pt-16 text-center">
          <p className="text-xs text-gray-600 font-light">
            © {new Date().getFullYear()} Ron's Guesthouse. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
