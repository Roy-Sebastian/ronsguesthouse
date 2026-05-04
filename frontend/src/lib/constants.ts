// ─── Reservation Status Maps ────────────────────────────────────────────────

/** CSS classes for reservation status badges */
export const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
  checked_in: 'bg-green-50 text-green-700 border-green-100',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  expired: 'bg-orange-50 text-orange-700 border-orange-100',
  no_show: 'bg-red-50 text-red-700 border-red-100',
};

/** Human-readable labels for reservation statuses */
export const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Dikonfirmasi',
  checked_in: 'Check In',
  checked_out: 'Check Out',
  cancelled: 'Dibatalkan',
  pending: 'Pending',
  expired: 'Kadaluarsa',
  no_show: 'No Show',
};

// ─── Gallery Category Map ────────────────────────────────────────────────────

/** Maps Indonesian category names to English display names */
export const GALLERY_CATEGORY_MAP: Record<string, string> = {
  umum: 'General',
  kamar: 'Room',
  fasilitas: 'Facilities',
  eksterior: 'Exterior',
  interior: 'Interior',
  lainnya: 'Others',
};

// ─── Role Redirects ──────────────────────────────────────────────────────────

/** Maps user roles to their dashboard paths */
export const ROLE_REDIRECTS: Record<string, string> = {
  superadmin: '/superadmin',
  admin: '/admin',
  receptionist: '/receptionist',
};

// ─── Fallback Images ─────────────────────────────────────────────────────────

export const FALLBACK_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=800';

export const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1542314831-c53cd4b85ca4?auto=format&fit=crop&q=80&w=2000';

// ─── Environment ─────────────────────────────────────────────────────────────

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
