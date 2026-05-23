'use client';

import { signOut, useSession } from '@/lib/auth-client';
import { useRoleMatrix } from '@/lib/useRoleMatrix';
import { defaultRoleMatrix } from '@/lib/rbac';
import { confirmAction } from '@/lib/dialog';
import { NotificationProvider, useNotifications } from '@/providers/NotificationProvider';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Building2,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileBarChart2,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Star,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import NotificationBell from '@/components/features/NotificationBell';
import ReservationToastPopup from '@/components/features/ReservationToastPopup';
import ToastContainer from '@/components/ui/ToastContainer';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

// Universal nav definition — all staff roles share the same nav tree.
// Items are filtered at render time based on the user's actual permissions from session.
// This ensures admin automatically has all receptionist nav items plus more.
const STAFF_NAV_SECTIONS = (role: string): { section: string; items: NavItem[] }[] => [
  {
    section: 'Utama',
    items: [{ label: 'Dashboard', href: `/${role}`, icon: LayoutDashboard }],
  },
  {
    section: 'Front Office',
    items: [
      { label: 'Manajemen Tamu', href: `/${role}/guests`, icon: User, permission: 'guest.view' },
      { label: 'Reservasi', href: `/${role}/reservations`, icon: CalendarCheck, permission: 'reservation.view' },
      { label: 'Check-In/Out & Add-On', href: `/${role}/stays`, icon: LogIn, permission: 'stay.view' },
      { label: 'Transaksi Pembayaran', href: `/${role}/transactions`, icon: CreditCard, permission: 'transaction.view' },
      { label: 'Denda', href: `/${role}/penalties`, icon: AlertTriangle, permission: 'penalty.view' },
      { label: 'Riwayat Tamu', href: `/${role}/history`, icon: History, permission: 'reservation.view' },
    ],
  },
  {
    section: 'Keuangan',
    items: [
      { label: 'Pendapatan', href: `/${role}/income`, icon: TrendingUp, permission: 'income.view' },
      { label: 'Pengeluaran', href: `/${role}/expenses`, icon: TrendingDown, permission: 'expense.view' },
      { label: 'Laporan', href: `/${role}/reports`, icon: FileBarChart2, permission: 'report.view' },
    ],
  },
  {
    section: 'Master Data',
    items: [
      { label: 'Kamar', href: `/${role}/rooms`, icon: BedDouble, permission: 'room.view' },
      { label: 'Harga Kamar', href: `/${role}/pricing`, icon: DollarSign, permission: 'room.edit' },
      { label: 'Fasilitas', href: `/${role}/facilities`, icon: Building2, permission: 'facility.manage' },
      { label: 'Amenitas', href: `/${role}/amenities`, icon: Wrench, permission: 'amenity.manage' },
      { label: 'Layanan / Add-On', href: `/${role}/addons`, icon: ShoppingBag, permission: 'addon.manage' },
    ],
  },
  {
    section: 'Konten',
    items: [
      { label: 'Gallery', href: `/${role}/gallery`, icon: ImageIcon, permission: 'gallery.manage' },
      { label: 'Ulasan', href: `/${role}/reviews`, icon: Star, permission: 'review.manage' },
      { label: 'Pesan', href: `/${role}/messages`, icon: Mail, permission: 'message.view' },
    ],
  },
  {
    section: 'Manajemen',
    items: [
      { label: 'Pengguna', href: `/${role}/users`, icon: Users, permission: 'user.view' },
      { label: 'Role & Hak Akses', href: `/${role}/roles`, icon: ShieldCheck, permission: 'role.manage' },
      { label: 'Audit Log', href: `/${role}/audit-logs`, icon: Activity, permission: 'audit.view' },
    ],
  },
];

const navByRole: Record<string, { section: string; items: NavItem[] }[]> = {
  superadmin: STAFF_NAV_SECTIONS('superadmin'),
  admin: STAFF_NAV_SECTIONS('admin'),
  receptionist: STAFF_NAV_SECTIONS('receptionist'),
};

const roleBadge: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  receptionist: 'Resepsionis',
};


export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: string;
}) {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    reservationBadge,
    clearReservationBadge,
    reviewBadge,
    clearReviewBadge,
    unpaidTransactionsCount,
    readyToCheckInCount,
  } = useNotifications();

  // Live role matrix — fetched once from backend via shared hook (cached at module level)
  const liveRoleMatrix = useRoleMatrix();

  // Auto-clear review badge when user visits reviews page
  useEffect(() => {
    if (pathname.includes('/reviews')) {
      clearReviewBadge();
    }
  }, [pathname, clearReviewBadge]);

  // Prevent back-forward cache (BFCache) / Soft-Navigation from showing stale sensitive pages
  useEffect(() => {
    if (!isPending && !session) {
      window.location.replace('/login');
    }
  }, [session, isPending]);

  // Permissions = live role matrix from backend (fallback to hardcoded defaults).
  // Merged with any per-user custom overrides stored in session.
  // Superadmin gets wildcard '*' so all nav items always pass hasPermission().
  const effectivePermissions = useMemo(() => {
    // Use the role from session (source of truth), not from the URL prop
    const sessionRole = (session?.user as any)?.role as string | undefined;
    if (sessionRole === 'superadmin') return new Set(['*']);
    const activeMatrix = liveRoleMatrix ?? defaultRoleMatrix;
    const roleDefaults = activeMatrix[sessionRole ?? role] || {};
    const rolekeys = Object.entries(roleDefaults)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const custom = Array.isArray((session?.user as any)?.permissions)
      ? ((session?.user as any).permissions as string[])
      : [];
    return new Set([...rolekeys, ...custom]);
  }, [role, session?.user, liveRoleMatrix]);

  // ── Variables & Derived State ──────────────────────────────────────────────
  const navSections = navByRole[role] || [];
  const user = session?.user;

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (effectivePermissions.has('*')) return true;
    return effectivePermissions.has(permission);
  };

  const currentItem = navSections
    .flatMap((section) => section.items)
    .find(
      (item) =>
        pathname === item.href ||
        (item.href !== `/${role}` && pathname.startsWith(item.href)),
    );

  const isRoleScopedPath =
    pathname === `/${role}` || pathname.startsWith(`/${role}/`);

  if (isRoleScopedPath && !currentItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
          <h1 className="text-xl font-serif font-bold text-dark mb-2">Halaman Tidak Tersedia</h1>
          <p className="text-sm text-gray-600 mb-5">
            Fitur ini tidak tersedia untuk role Anda atau belum diaktifkan pada menu.
          </p>
          <button
            onClick={() => router.push(`/${role}`)}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (currentItem?.permission && !hasPermission(currentItem.permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
          <h1 className="text-xl font-serif font-bold text-dark mb-2">Akses Ditolak</h1>
          <p className="text-sm text-gray-600 mb-5">
            Anda tidak memiliki izin untuk membuka halaman ini.
          </p>
          <button
            onClick={() => router.push(`/${role}`)}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const initials =
    user?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  const currentLabel = currentItem?.label || 'Dashboard';

  const handleSignOutConfirm = async () => {
    const ok = await confirmAction('Apakah Anda yakin ingin keluar dari akun ini?', 'Konfirmasi Keluar');
    if (!ok) return;
    await signOut();
    window.location.href = '/login'; // Hard navigation to purge client-side cache completely
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-99 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full w-64 bg-sidebar flex flex-col z-100
        transition-transform duration-300 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="text-primary font-serif text-xl font-semibold leading-tight">
            Ron's Guest House
          </div>
          <div className="text-white/40 text-xs mt-1">
            Sistem Manajemen Penginapan
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {navSections.filter((section) => section.items.some((item) => hasPermission(item.permission))).map((section) => (
            <div key={section.section}>
              <div className="px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                {section.section}
              </div>
              {section.items.filter((item) => hasPermission(item.permission)).map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/${role}` && pathname.startsWith(item.href));
                const Icon = item.icon;
                // Show badges based on route
                const isReservation = item.href === `/${role}/reservations`;
                const isReview = item.href === `/${role}/reviews`;
                const isStay = item.href === `/${role}/stays`;
                const isTransaction = item.href === `/${role}/transactions`;

                const showResBadge = isReservation && reservationBadge > 0;
                const showRevBadge = isReview && reviewBadge > 0;
                const showStayBadge = isStay && readyToCheckInCount > 0;
                const showTxBadge = isTransaction && unpaidTransactionsCount > 0;

                const showBadge = showResBadge || showRevBadge || showStayBadge || showTxBadge;
                const badgeCount = showResBadge
                  ? reservationBadge
                  : showRevBadge
                    ? reviewBadge
                    : showStayBadge
                      ? readyToCheckInCount
                      : showTxBadge
                        ? unpaidTransactionsCount
                        : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-5 py-2.5 text-sm border-l-[3px] transition-all duration-150 my-px
                      ${
                        isActive
                          ? 'text-primary bg-primary/10 border-l-primary font-medium'
                          : 'text-white/60 border-l-transparent hover:text-white hover:bg-white/6 hover:border-l-primary/40'
                      }
                    `}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="min-w-[1.1rem] h-[1.1rem] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                    {isActive && !showBadge && (
                      <ChevronRight size={14} className="ml-auto opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer user */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-white font-medium truncate">
                {user?.name || 'User'}
              </div>
              <div className="text-[0.72rem] text-white/40">
                {roleBadge[role] || role}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOutConfirm}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full overflow-x-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#e5e0d8] px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="font-semibold text-dark text-lg">
              {currentLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-800">
                {user?.name}
              </div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-dark flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      <ReservationToastPopup />
      <ToastContainer />
    </div>
  );
}
