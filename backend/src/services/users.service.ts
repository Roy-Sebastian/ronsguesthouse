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
  const safe = sanitizePayload(ctx, body || {});
  return userRepository.create({ data: safe as any });
}

export async function updateUser(id: string, body: any, ctx: RequesterContext) {
  const safe = sanitizePayload(ctx, body || {});
  delete safe.password;
  return userRepository.update(id, { data: safe });
}

export async function deleteUser(id: string) {
  await userRepository.delete(id);
}
