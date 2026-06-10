import { auth } from '../config/auth';
import { prisma } from '../config/prisma';
import { getRolePermissions } from '../config/rbac';
import { userRepository } from '../repositories/user.repository';

export interface RequesterContext {
  role?: string;
  permissions?: string[];
}

function canManageRole(ctx: RequesterContext): boolean {
  if (ctx.role === 'superadmin') return true;
  const rolePermissions = getRolePermissions(ctx.role);
  const userPermissions = Array.isArray(ctx.permissions) ? ctx.permissions : [];
  const effective = new Set([...rolePermissions, ...userPermissions]);
  return effective.has('role.manage');
}

function sanitizePayload(ctx: RequesterContext, payload: Record<string, any>) {
  const next = { ...payload };
  if (!canManageRole(ctx)) {
    delete next.role;
    delete next.permissions;
    delete next.isActive;
  }
  if (ctx.role !== 'superadmin' && next.role === 'superadmin') {
    delete next.role;
  }
  return next;
}

export async function getAllUsers(search?: string) {
  return userRepository.findAll({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
  });
}

export async function getUserById(id: string) {
  return userRepository.findById(id);
}

export async function createUser(body: any, ctx: RequesterContext) {
  const { password, email, name, phone, role, permissions } = body || {};

  if (!email || !password || !name) throw new Error('Nama, email, dan password wajib diisi');
  if (password.length < 8) throw new Error('Password minimal 8 karakter');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email sudah terdaftar');

  const safe = sanitizePayload(ctx, { role, permissions, phone });

  // Use Better Auth's own password hasher (scrypt by default) to ensure
  // login verification works correctly via Better Auth's sign-in flow.
  const authCtx = await auth.$context;
  const hashed = await authCtx.password.hash(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailVerified: true,
      role: safe.role || 'receptionist',
      permissions: safe.permissions || [],
      phone: safe.phone || null,
      isActive: true,
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: email, // Better Auth uses email as the credential identifier
      providerId: 'credential',
      password: hashed,
    },
  });

  return user;
}

export async function updateUser(id: string, body: any, ctx: RequesterContext) {
  const { password, ...rest } = body || {};
  const safe = sanitizePayload(ctx, rest);
  const user = await userRepository.update(id, { data: safe });

  if (password && typeof password === 'string' && password.length >= 8) {
    const authCtx = await auth.$context;
    const hashed = await authCtx.password.hash(password);
    await prisma.account.updateMany({
      where: { userId: id, providerId: 'credential' },
      data: { password: hashed },
    });
  }

  return user;
}

export async function deleteUser(id: string, ctx: RequesterContext) {
  const target = await userRepository.findById(id);
  if (!target) throw new Error('Pengguna tidak ditemukan');
  if (target.role === 'superadmin') throw new Error('Akun superadmin tidak dapat dihapus');
  if (target.id === (ctx as any).requesterId) throw new Error('Tidak dapat menghapus akun sendiri');

  const reservationCount = await prisma.reservation.count({
    where: { userId: id }
  });
  if (reservationCount > 0) {
    throw new Error('Tidak dapat menghapus pengguna karena terdapat data reservasi yang dicatat oleh pengguna ini');
  }

  const expenseCount = await prisma.expense.count({
    where: { userId: id }
  });
  if (expenseCount > 0) {
    throw new Error('Tidak dapat menghapus pengguna karena terdapat data pengeluaran yang dicatat oleh pengguna ini');
  }

  await prisma.$transaction(async (tx) => {
    // Delete related audit logs first
    await tx.auditLog.deleteMany({
      where: { userId: id }
    });

    // Nullify userId on related incomes
    await tx.income.updateMany({
      where: { userId: id },
      data: { userId: null }
    });

    // Nullify createdByUserId on related penalties
    await tx.penalty.updateMany({
      where: { createdByUserId: id },
      data: { createdByUserId: null }
    });

    // Delete the user
    await tx.user.delete({
      where: { id }
    });
  });
}
