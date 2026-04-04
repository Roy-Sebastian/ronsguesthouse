'use client';

import { Menu, X, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'HOME' },
  { href: '/about', label: 'ABOUT US' },
  { href: '/rooms', label: 'ROOMS' },
  { href: '/gallery', label: 'GALLERY' },
  { href: '/check-booking', label: 'CHECK BOOKING' },
  { href: '/contact', label: 'CONTACT US' },
];

export default function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSolidPage = pathname?.startsWith('/search') || pathname?.startsWith('/book') || pathname?.startsWith('/check-booking');
  const isNavSolid = scrolled || isSolidPage;

  return (
    <nav className={"fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-gray-200 " + (isNavSolid ? 'shadow-md py-2' : 'py-4')}>
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
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={"text-xs tracking-[0.2em] uppercase transition-colors duration-300 " + (active ? 'text-red-800 font-bold border-b border-red-800 pb-1' : 'text-gray-600 hover:text-gray-900')}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          <li className="ml-4">
            <Link
              href="/login"
              className="px-6 py-2 rounded-[3px] text-xs font-bold uppercase tracking-widest transition-colors duration-300 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
            >
              Login
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger & User Icons */}
        <div className="md:hidden flex items-center space-x-4">
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
          >
            Login
          </Link>
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
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={"text-sm tracking-[0.2em] py-2 uppercase transition-colors " + (active ? 'text-red-800 font-bold' : 'text-gray-600 hover:text-gray-900')}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="mt-6 flex items-center justify-center space-x-2 px-6 py-3 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors rounded-full text-center text-sm tracking-[0.2em] uppercase"
          >
            <User size={18} />
            <span>Login</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
