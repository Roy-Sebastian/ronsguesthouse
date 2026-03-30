import { NextFunction, Request, Response } from 'express';

import { auth } from '../config/auth';
import { ALL_PERMISSION_KEYS, getRolePermissions } from '../config/rbac';

const normalizeHeaders = (headers: Request['headers']): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      normalized[key] = value;
    } else if (Array.isArray(value)) {
      normalized[key] = value.join(', ');
    }
  }
  return normalized;
};


export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: normalizeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.user.isActive === false) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error(error); return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

const getEffectivePermissionSet = (req: Request) => {
  const rolePermissions = getRolePermissions(req.user?.role);
  const userPermissions = Array.isArray(req.user?.permissions)
    ? req.user.permissions
    : [];

  // Superadmin keeps full access regardless of custom overrides.
  if (req.user?.role === 'superadmin') {
    return new Set(ALL_PERMISSION_KEYS);
  }

  return new Set([...rolePermissions, ...userPermissions]);
};

const hasAnyPermission = (req: Request, permissions: string[]) => {
  const permissionSet = getEffectivePermissionSet(req);
  return permissions.some((permission) => permissionSet.has(permission));
};

export const requirePermission = (permission: string | string[]) => {
  const permissions = Array.isArray(permission) ? permission : [permission];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasAnyPermission(req, permissions)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};
