import fs from 'fs';
import path from 'path';

export const PERMISSION_GROUPS = [
  {
    group: 'Dashboard',
    permissions: [{ key: 'dashboard.view', label: 'Lihat Dashboard' }],
  },
  {
    group: 'Manajemen Pengguna',
    permissions: [
      { key: 'user.view', label: 'Lihat Pengguna' },
      { key: 'user.create', label: 'Tambah Pengguna' },
      { key: 'user.edit', label: 'Edit Pengguna' },
      { key: 'user.delete', label: 'Hapus Pengguna' },
    ],
  },
  {
    group: 'Tamu',
    permissions: [
      { key: 'guest.view', label: 'Lihat Tamu' },
      { key: 'guest.create', label: 'Tambah Tamu' },
      { key: 'guest.edit', label: 'Edit Tamu' },
      { key: 'guest.delete', label: 'Hapus Tamu' },
    ],
  },
  {
    group: 'Reservasi',
    permissions: [
      { key: 'reservation.view', label: 'Lihat Reservasi' },
      { key: 'reservation.create', label: 'Buat Reservasi' },
      { key: 'reservation.edit', label: 'Edit Reservasi' },
      { key: 'reservation.cancel', label: 'Batalkan Reservasi' },
      { key: 'reservation.delete', label: 'Hapus Reservasi' },
    ],
  },
  {
    group: 'Menginap',
    permissions: [
      { key: 'stay.view', label: 'Lihat Data Menginap' },
      { key: 'stay.create', label: 'Check-In / Buat Stay' },
      { key: 'stay.edit', label: 'Update Stay / Check-Out' },
      { key: 'stay.delete', label: 'Hapus Stay' },
    ],
  },
  {
    group: 'Transaksi',
    permissions: [
      { key: 'transaction.view', label: 'Lihat Transaksi' },
      { key: 'transaction.create', label: 'Buat Transaksi' },
      { key: 'transaction.edit', label: 'Edit Transaksi' },
      { key: 'transaction.delete', label: 'Hapus Transaksi' },
    ],
  },
  {
    group: 'Denda',
    permissions: [
      { key: 'penalty.view', label: 'Lihat Denda' },
      { key: 'penalty.create', label: 'Tambah Denda' },
      { key: 'penalty.edit', label: 'Edit Denda' },
      { key: 'penalty.delete', label: 'Hapus Denda' },
    ],
  },
  {
    group: 'Kamar',
    permissions: [
      { key: 'room.view', label: 'Lihat Kamar' },
      { key: 'room.create', label: 'Tambah Kamar' },
      { key: 'room.edit', label: 'Edit Kamar' },
      { key: 'room.delete', label: 'Hapus Kamar' },
    ],
  },
  {
    group: 'Keuangan',
    permissions: [
      { key: 'income.view', label: 'Lihat Pendapatan' },
      { key: 'income.create', label: 'Tambah Pendapatan' },
      { key: 'income.edit', label: 'Edit Pendapatan' },
      { key: 'income.delete', label: 'Hapus Pendapatan' },
      { key: 'expense.view', label: 'Lihat Pengeluaran' },
      { key: 'expense.create', label: 'Tambah Pengeluaran' },
      { key: 'expense.edit', label: 'Edit Pengeluaran' },
      { key: 'expense.delete', label: 'Hapus Pengeluaran' },
      { key: 'report.view', label: 'Lihat Laporan' },
    ],
  },
  {
    group: 'Konten',
    permissions: [
      { key: 'gallery.manage', label: 'Kelola Galeri' },
      { key: 'amenity.manage', label: 'Kelola Amenitas' },
      { key: 'facility.manage', label: 'Kelola Fasilitas' },
      { key: 'review.manage', label: 'Kelola Ulasan' },
      { key: 'message.view', label: 'Lihat Pesan' },
      { key: 'message.create', label: 'Tambah Pesan' },
      { key: 'message.edit', label: 'Edit Pesan' },
      { key: 'message.delete', label: 'Hapus Pesan' },
      { key: 'addon.view', label: 'Lihat Add-On' },
      { key: 'addon.manage', label: 'Kelola Add-On' },
    ],
  },
  {
    group: 'Sistem',
    permissions: [
      { key: 'audit.view', label: 'Lihat Audit Log' },
      { key: 'role.manage', label: 'Kelola Role & Hak Akses' },
      { key: 'settings.manage', label: 'Pengaturan Sistem' },
    ],
  },
] as const;

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key),
);

export type RoleKey = 'superadmin' | 'admin' | 'receptionist' | 'guest';

export type RoleMatrix = Record<RoleKey, Record<string, boolean>>;

export const DEFAULT_ROLE_MATRIX: RoleMatrix = {
  superadmin: Object.fromEntries(ALL_PERMISSION_KEYS.map((key) => [key, true])),
  guest: Object.fromEntries(ALL_PERMISSION_KEYS.map((key) => [key, false])),
  admin: {
    'dashboard.view': true,
    'user.view': true,
    'user.create': true,
    'user.edit': true,
    'user.delete': false,
    'guest.view': true,
    'guest.create': true,
    'guest.edit': true,
    'guest.delete': false,
    'reservation.view': true,
    'reservation.create': true,
    'reservation.edit': true,
    'reservation.cancel': true,
    'reservation.delete': true,
    'stay.view': true,
    'stay.create': true,
    'stay.edit': true,
    'stay.delete': true,
    'transaction.view': true,
    'transaction.create': true,
    'transaction.edit': true,
    'transaction.delete': false,
    'penalty.view': true,
    'penalty.create': true,
    'penalty.edit': true,
    'penalty.delete': true,
    'room.view': true,
    'room.create': true,
    'room.edit': true,
    'room.delete': true,
    'income.view': true,
    'income.create': true,
    'income.edit': true,
    'income.delete': true,
    'expense.view': true,
    'expense.create': true,
    'expense.edit': true,
    'expense.delete': true,
    'report.view': true,
    'gallery.manage': true,
    'amenity.manage': true,
    'facility.manage': true,
    'review.manage': true,
    'message.view': true,
    'message.create': true,
    'message.edit': true,
    'message.delete': true,
    'addon.view': true,
    'addon.manage': true,
    'audit.view': true,
    'role.manage': false,
    'settings.manage': false,
  },
  receptionist: {
    'dashboard.view': true,
    'user.view': false,
    'user.create': false,
    'user.edit': false,
    'user.delete': false,
    'guest.view': true,
    'guest.create': true,
    'guest.edit': true,
    'guest.delete': false,
    'reservation.view': true,
    'reservation.create': true,
    'reservation.edit': true,
    'reservation.cancel': true,
    'reservation.delete': true,
    'stay.view': true,
    'stay.create': true,
    'stay.edit': true,
    'stay.delete': false,
    'transaction.view': true,
    'transaction.create': true,
    'transaction.edit': true,
    'transaction.delete': false,
    'penalty.view': true,
    'penalty.create': true,
    'penalty.edit': false,
    'penalty.delete': false,
    'room.view': false,
    'room.create': false,
    'room.edit': false,
    'room.delete': false,
    'income.view': true,
    'income.create': true,
    'income.edit': false,
    'income.delete': false,
    'expense.view': false,
    'expense.create': false,
    'expense.edit': false,
    'expense.delete': false,
    'report.view': false,
    'gallery.manage': false,
    'amenity.manage': false,
    'facility.manage': false,
    'review.manage': false,
    'message.view': true,
    'message.create': true,
    'message.edit': true,
    'message.delete': false,
    'addon.view': true,
    'addon.manage': false,
    'audit.view': false,
    'role.manage': false,
    'settings.manage': false,
  },
};

const ROLES_FILE = path.join(process.cwd(), 'data', 'roles.json');

const ensureRoleRecord = (
  roleValue: unknown,
  fallback: Record<string, boolean>,
  forceAllTrue = false,
) => {
  const roleRecord = (roleValue && typeof roleValue === 'object' ? roleValue : {}) as Record<string, boolean>;
  return Object.fromEntries(
    ALL_PERMISSION_KEYS.map((key) => {
      if (forceAllTrue) {
        return [key, true];
      }
      const nextValue = roleRecord[key];
      if (typeof nextValue === 'boolean') {
        return [key, nextValue];
      }
      return [key, fallback[key] ?? false];
    }),
  );
};

export const normalizeRoleMatrix = (input: unknown): RoleMatrix => {
  const matrixInput = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  return {
    superadmin: ensureRoleRecord(
      matrixInput.superadmin,
      DEFAULT_ROLE_MATRIX.superadmin,
      true,
    ),
    guest: ensureRoleRecord(matrixInput.guest, DEFAULT_ROLE_MATRIX.guest),
    admin: ensureRoleRecord(matrixInput.admin, DEFAULT_ROLE_MATRIX.admin),
    receptionist: ensureRoleRecord(
      matrixInput.receptionist,
      DEFAULT_ROLE_MATRIX.receptionist,
    ),
  };
};

let _matrixCache: RoleMatrix | null = null;

export const loadRoleMatrix = (): RoleMatrix => {
  if (_matrixCache) return _matrixCache;
  try {
    if (!fs.existsSync(ROLES_FILE)) {
      _matrixCache = DEFAULT_ROLE_MATRIX;
      return _matrixCache;
    }

    const raw = fs.readFileSync(ROLES_FILE, 'utf-8');
    _matrixCache = normalizeRoleMatrix(JSON.parse(raw));
    return _matrixCache;
  } catch {
    return DEFAULT_ROLE_MATRIX;
  }
};

export const saveRoleMatrix = (matrix: RoleMatrix) => {
  const dir = path.dirname(ROLES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(ROLES_FILE, JSON.stringify(matrix, null, 2));
  _matrixCache = matrix;
};

export const getRolePermissions = (role?: string): string[] => {
  const matrix = loadRoleMatrix();
  if (role && role in matrix) {
    return Object.keys(matrix[role as RoleKey]).filter((key) => matrix[role as RoleKey][key]);
  }
  return [];
};
