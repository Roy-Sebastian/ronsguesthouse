'use client';

import { useSession } from '@/lib/auth-client';
import { useRoleMatrix } from './useRoleMatrix';
import { defaultRoleMatrix } from './rbac';
import { useMemo } from 'react';

/**
 * Returns true if the current session user has the given permission.
 * Uses the live role matrix from the backend (same source as sidebar).
 * Superadmin always returns true for any permission.
 */
export function useHasPermission(permission: string): boolean {
  const { data: session } = useSession();
  const roleMatrix = useRoleMatrix();

  return useMemo(() => {
    const user = session?.user as any;
    if (!user) return false;
    const role = (user.role as string) || 'guest';
    if (role === 'superadmin') return true;

    const matrix = roleMatrix ?? defaultRoleMatrix;
    const rolePerms = matrix[role] || {};
    const base = Object.entries(rolePerms)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const custom = Array.isArray(user.permissions) ? (user.permissions as string[]) : [];
    const all = new Set([...base, ...custom]);

    return all.has(permission);
  }, [session?.user, roleMatrix, permission]);
}
