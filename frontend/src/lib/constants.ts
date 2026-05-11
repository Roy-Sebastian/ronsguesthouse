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

// ─── Room Type Maps ──────────────────────────────────────────────────────────

/** Human-readable labels for room types (no underscore) */
export const ROOM_TYPE_LABEL: Record<string, string> = {
  city_view: 'City View',
  standard:  'Standard',
  suite:     'Suite',
  family:    'Family',
};

/**
 * Auto-detect room type based on room number:
 * 1–3  → city_view
 * 4–6  → standard
 * 7–9  → suite
 * 10   → family
 */
export function getRoomTypeByNumber(roomNumber: string): string {
  const n = parseInt(roomNumber, 10);
  if (isNaN(n)) return 'standard';
  if (n >= 1 && n <= 3)  return 'city_view';
  if (n >= 4 && n <= 6)  return 'standard';
  if (n >= 7 && n <= 9)  return 'suite';
  if (n === 10)          return 'family';
  return 'standard';
}

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
