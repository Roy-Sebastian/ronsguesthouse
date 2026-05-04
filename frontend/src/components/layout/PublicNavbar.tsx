'use client';

import { signOut, useSession } from '@/lib/auth-client';
import { LogOut, Menu, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavLink = { href: string; label: string };

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'HOME' },
  { href: '/about', label: 'ABOUT US' },
  { href: '/rooms', label: 'ROOMS' },
  { href: '/gallery', label: 'GALLERY' },
  { href: '/check-booking', label: 'CHECK BOOKING' },
  { href: '/contact', label: 'CONTACT US' },
];

export default function PublicNavbar() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSolidPage =
    pathname?.startsWith('/search') ||
    pathname?.startsWith('/book') ||
    pathname?.startsWith('/check-booking');
  const isNavSolid = scrolled || isSolidPage;

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const isStaff = !!user && !!user.role && user.role !== 'guest';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <nav
      className={
        'fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-gray-200 ' +
        (isNavSolid ? 'shadow-md py-2' : 'py-4')
      }
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="font-serif text-2xl tracking-widest text-gray-900 uppercase"
        >
          Ron's <span className="text-red-800">Guest House</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center space-x-8 list-none">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    'text-xs tracking-[0.2em] uppercase transition-colors duration-300 ' +
                    (active
                      ? 'text-red-800 font-bold border-b border-red-800 pb-1'
                      : 'text-gray-600 hover:text-gray-900')
                  }
                >
                  {label}
                </Link>
              </li>
            );
          })}

          {/* Auth area — staff only */}
          {isPending ? (
            <li className="ml-4">
              <div className="w-20 h-8 bg-gray-100 animate-pulse rounded" />
            </li>
          ) : isStaff ? (
            <li className="ml-4 relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 hover:border-gray-900 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-red-800 flex items-center justify-center text-white text-[10px] font-bold">
                  {initials}
                </div>
                <span className="text-xs font-semibold tracking-wider uppercase text-gray-700 max-w-[100px] truncate">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                    </div>
                    <Link
                      href={`/${user?.role}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={14} /> Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      <LogOut size={14} /> Keluar
                    </button>
                  </div>
                </>
              )}
            </li>
          ) : (
            <li className="ml-4">
              <Link
                href="/login"
                className="px-6 py-2 rounded-[3px] text-xs font-bold uppercase tracking-widest transition-colors duration-300 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
              >
                Login
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile hamburger & User Icons */}
        <div className="md:hidden flex items-center space-x-3">
          {!isPending && !isStaff && (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
            >
              Login
            </Link>
          )}
          {!isPending && isStaff && (
            <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </div>
          )}
          <button
            className="p-2 text-gray-900 hover:text-red-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-xl px-6 py-6 flex flex-col space-y-4">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={
                  'text-sm tracking-[0.2em] py-2 uppercase transition-colors ' +
                  (active ? 'text-red-800 font-bold' : 'text-gray-600 hover:text-gray-900')
                }
              >
                {label}
              </Link>
            );
          })}

          {isStaff ? (
            <>
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
              <Link
                href={`/${user?.role}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors rounded-full text-sm tracking-[0.2em] uppercase"
              >
                <User size={18} />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleSignOut();
                }}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-800 text-white hover:bg-red-900 transition-colors rounded-full text-sm tracking-[0.2em] uppercase"
              >
                <LogOut size={18} />
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex items-center justify-center space-x-2 px-6 py-3 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors rounded-full text-center text-sm tracking-[0.2em] uppercase"
            >
              <User size={18} />
              <span>Login</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
